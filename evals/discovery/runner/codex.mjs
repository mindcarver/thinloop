import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  commandName,
  ensureDir,
  findThreadId,
  parseJsonLines,
  summarizeCodexEvents,
  runProcess,
  writeText,
} from "./lib.mjs";

const DISABLED_FEATURES = [
  "apps",
  "browser_use",
  "computer_use",
  "in_app_browser",
  "memories",
  "multi_agent",
];

function isolatedEnv(codexHome, profileHome) {
  const env = { ...process.env };
  for (const key of [
    "CODEX_HOME",
    "CODEX_ACCESS_TOKEN",
    "CODEX_THREAD_ID",
    "OPENAI_API_KEY",
    "ANTHROPIC_API_KEY",
  ]) {
    delete env[key];
  }
  env.CODEX_HOME = codexHome;
  env.USERPROFILE = profileHome;
  env.HOME = profileHome;
  env.APPDATA = path.join(profileHome, "AppData", "Roaming");
  env.LOCALAPPDATA = path.join(profileHome, "AppData", "Local");
  if (process.platform === "win32") {
    const parsed = path.parse(profileHome);
    env.HOMEDRIVE = parsed.root.replace(/[\\/]$/, "");
    env.HOMEPATH = profileHome.slice(parsed.root.length - 1);
  }
  ensureDir(env.APPDATA);
  ensureDir(env.LOCALAPPDATA);
  return env;
}

export function createIsolatedHomes({
  authFile,
  prefix = "thinloop-eval-",
} = {}) {
  if (!authFile || !fs.existsSync(authFile)) {
    throw new Error(`Codex auth file not found: ${authFile}`);
  }
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  const homes = {};
  for (const role of ["subject", "evaluator"]) {
    const codexHome = ensureDir(path.join(root, role, "codex"));
    const profileHome = ensureDir(path.join(root, role, "profile"));
    fs.copyFileSync(authFile, path.join(codexHome, "auth.json"));
    homes[role] = {
      codexHome,
      profileHome,
      env: isolatedEnv(codexHome, profileHome),
    };
  }
  return { root, ...homes };
}

export function cleanupIsolatedHomes(root) {
  const temp = fs.realpathSync.native(os.tmpdir());
  const target = fs.realpathSync.native(root);
  if (
    target === temp ||
    !target.startsWith(`${temp}${path.sep}`) ||
    !path.basename(target).startsWith("thinloop-eval-")
  ) {
    throw new Error(`Refusing to remove unexpected temporary home: ${target}`);
  }
  fs.rmSync(target, {
    recursive: true,
    force: true,
    maxRetries: 6,
    retryDelay: 250,
  });
}

function configArgs({ reasoning }) {
  return [
    "-c",
    `model_reasoning_effort="${reasoning}"`,
    "-c",
    'service_tier="priority"',
    "-c",
    'approval_policy="never"',
    "-c",
    "sandbox_workspace_write.network_access=false",
  ];
}

function featureArgs() {
  return DISABLED_FEATURES.flatMap((feature) => ["--disable", feature]);
}

export async function codexLoginStatus({ home, redactor }) {
  const result = await runProcess(
    commandName("codex"),
    ["login", "status"],
    {
      env: home.env,
      timeoutMs: 60_000,
    },
  );
  const combined = redactor(`${result.stdout}${result.stderr}`);
  return {
    code: result.code,
    timedOut: result.timedOut,
    output: combined.text.trim(),
    secretRedactions: combined.secretReplacements,
    pathRedactions: combined.pathReplacements,
  };
}

export async function runSubjectTurn({
  home,
  cwd,
  prompt,
  sessionId,
  model,
  reasoning,
  outputDir,
  turn,
  redactor,
  timeoutMs = 900_000,
  onProgress,
}) {
  ensureDir(outputDir);
  const lastMessageFile = path.join(outputDir, `turn-${turn}-last.txt`);
  const command = commandName("codex");
  const args = sessionId
    ? [
        "exec",
        "resume",
        "--json",
        "--ignore-user-config",
        "--ignore-rules",
        "--strict-config",
        "--model",
        model,
        ...configArgs({ reasoning }),
        ...featureArgs(),
        "--output-last-message",
        lastMessageFile,
        sessionId,
        "-",
      ]
    : [
        "exec",
        "--json",
        "--ignore-user-config",
        "--ignore-rules",
        "--strict-config",
        "--color",
        "never",
        "--model",
        model,
        ...configArgs({ reasoning }),
        ...featureArgs(),
        "--sandbox",
        "workspace-write",
        "--cd",
        cwd,
        "--output-last-message",
        lastMessageFile,
        "-",
      ];

  onProgress?.(`subject turn ${turn} started`);
  const result = await runProcess(command, args, {
    cwd,
    env: home.env,
    input: prompt,
    timeoutMs,
  });

  const raw = redactor(result.stdout);
  const error = redactor(result.stderr);
  writeText(path.join(outputDir, `turn-${turn}.jsonl`), raw.text);
  writeText(path.join(outputDir, `turn-${turn}.stderr.txt`), error.text);

  const parsed = parseJsonLines(result.stdout);
  const resolvedSessionId = sessionId ?? findThreadId(parsed.events);
  const lastMessage = fs.existsSync(lastMessageFile)
    ? fs.readFileSync(lastMessageFile, "utf8")
    : "";
  const sanitizedLast = redactor(lastMessage);
  writeText(lastMessageFile, sanitizedLast.text);

  onProgress?.(
    `subject turn ${turn} finished code=${result.code} duration=${result.durationMs}ms`,
  );
  return {
    code: result.code,
    timedOut: result.timedOut,
    durationMs: result.durationMs,
    sessionId: resolvedSessionId,
    lastMessage: sanitizedLast.text.trim(),
    invalidJsonLines: parsed.invalid,
    metrics: summarizeCodexEvents(parsed.events),
    secretRedactions:
      raw.secretReplacements +
      error.secretReplacements +
      sanitizedLast.secretReplacements,
    pathRedactions:
      raw.pathReplacements +
      error.pathReplacements +
      sanitizedLast.pathReplacements,
  };
}

export async function runStructuredEvaluator({
  home,
  cwd,
  prompt,
  model,
  reasoning,
  schemaFile,
  outputDir,
  name,
  redactor,
  timeoutMs = 600_000,
  onProgress,
}) {
  ensureDir(outputDir);
  const lastMessageFile = path.join(outputDir, `${name}-last.json`);
  const args = [
    "exec",
    "--json",
    "--ephemeral",
    "--skip-git-repo-check",
    "--ignore-user-config",
    "--ignore-rules",
    "--strict-config",
    "--color",
    "never",
    "--model",
    model,
    ...configArgs({ reasoning }),
    ...featureArgs(),
    "--sandbox",
    "read-only",
    "--cd",
    cwd,
    "--output-schema",
    schemaFile,
    "--output-last-message",
    lastMessageFile,
    "-",
  ];

  onProgress?.(`${name} started`);
  const result = await runProcess(commandName("codex"), args, {
    cwd,
    env: home.env,
    input: prompt,
    timeoutMs,
  });
  const raw = redactor(result.stdout);
  const error = redactor(result.stderr);
  writeText(path.join(outputDir, `${name}.jsonl`), raw.text);
  writeText(path.join(outputDir, `${name}.stderr.txt`), error.text);
  const parsed = parseJsonLines(result.stdout);

  let output;
  let parseError;
  if (fs.existsSync(lastMessageFile)) {
    const last = fs.readFileSync(lastMessageFile, "utf8");
    const sanitized = redactor(last);
    writeText(lastMessageFile, sanitized.text);
    try {
      output = JSON.parse(last);
    } catch (errorValue) {
      parseError = errorValue.message;
    }
  } else {
    parseError = "missing output-last-message file";
  }

  onProgress?.(
    `${name} finished code=${result.code} duration=${result.durationMs}ms`,
  );
  return {
    code: result.code,
    timedOut: result.timedOut,
    durationMs: result.durationMs,
    metrics: summarizeCodexEvents(parsed.events),
    output,
    parseError,
    secretRedactions: raw.secretReplacements + error.secretReplacements,
    pathRedactions: raw.pathReplacements + error.pathReplacements,
  };
}
