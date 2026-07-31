import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  cleanupIsolatedHomes,
  codexLoginStatus,
  createIsolatedHomes,
  runSubjectTurn,
} from "../../discovery/runner/codex.mjs";
import { captureRepositoryEvidence } from "../../discovery/runner/fixture.mjs";
import {
  commandName,
  ensureDir,
  isoRunId,
  parseArgs,
  relativeFiles,
  runProcess,
  sha256,
  writeJson,
  writeText,
} from "../../discovery/runner/lib.mjs";
import { createRedactor, scanTree } from "../../discovery/runner/redact.mjs";
import {
  loadCases,
  pluginRoot,
  selectCases,
  validateCases,
} from "./cases.mjs";
import { inspectRepository, runHiddenCheck } from "./checks.mjs";
import { prepareFixture } from "./fixture.mjs";

const DEFAULT_MODEL = "gpt-5.4";
const CONDITIONS = ["absent", "knowledge"];
const DEFAULT_WORKSPACE = path.resolve(
  pluginRoot,
  "..",
  "test",
  "thinloop-knowledge-eval",
);

function progress(message) {
  process.stdout.write(`[${new Date().toISOString()}] ${message}\n`);
}

function readAuth(authFile) {
  if (!fs.existsSync(authFile)) {
    throw new Error(`Codex auth file not found: ${authFile}`);
  }
  return JSON.parse(fs.readFileSync(authFile, "utf8"));
}

function installKnowledgeSkill(codexHome) {
  const source = path.join(pluginRoot, "skills", "scd-knowledge");
  const target = path.join(codexHome, "skills", "scd-knowledge");
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, { recursive: true, force: false });
  return relativeFiles(target).map((file) => ({
    file: `scd-knowledge/${file.replaceAll(path.sep, "/")}`,
    sha256: sha256(fs.readFileSync(path.join(target, file))),
  }));
}

async function repositoryRevision() {
  const [revision, status] = await Promise.all([
    runProcess(commandName("git"), ["rev-parse", "HEAD"], {
      cwd: pluginRoot,
      timeoutMs: 30_000,
    }),
    runProcess(commandName("git"), ["status", "--short"], {
      cwd: pluginRoot,
      timeoutMs: 30_000,
    }),
  ]);
  if (revision.code !== 0 || status.code !== 0) {
    throw new Error("Cannot identify the Thinloop source revision");
  }
  return {
    commit: revision.stdout.trim(),
    workingTreeDirty: Boolean(status.stdout.trim()),
  };
}

async function runSingle({
  testCase,
  condition,
  runRoot,
  authFile,
  model,
  redactor,
}) {
  const runKey = `${testCase.id}--${condition}`;
  const rawDir = ensureDir(path.join(runRoot, "raw", runKey));
  const diffDir = ensureDir(path.join(runRoot, "diffs", runKey));
  const fixture = await prepareFixture({
    workspaceRoot: runRoot,
    runKey,
    testCase,
    condition,
  });
  const homes = createIsolatedHomes({
    authFile,
    prefix: "thinloop-eval-knowledge-",
  });
  let skillFiles = [];
  let login;
  let subject;
  let repository;
  let hidden;
  let infrastructureError;
  let processExitWarning;

  try {
    skillFiles = installKnowledgeSkill(homes.subject.codexHome);
    login = await codexLoginStatus({ home: homes.subject, redactor });
    if (login.code !== 0 || login.timedOut) {
      infrastructureError = "isolated Codex login is unavailable";
    } else {
      progress(`${runKey}: subject started`);
      subject = await runSubjectTurn({
        home: homes.subject,
        cwd: fixture.repo,
        prompt: testCase.prompt,
        model,
        reasoning: "high",
        outputDir: rawDir,
        turn: 1,
        redactor,
        timeoutMs: 600_000,
        onProgress: progress,
      });
      const reachedCompletedTurn =
        Boolean(subject.lastMessage) &&
        Boolean(subject.sessionId) &&
        subject.metrics.usage.totalTokens > 0 &&
        subject.invalidJsonLines.length === 0;
      if (!reachedCompletedTurn) {
        infrastructureError = subject.timedOut
          ? "subject timed out before a completed turn"
          : "subject failed or produced no completed turn";
      } else if (subject.code !== 0 || subject.timedOut) {
        processExitWarning = subject.timedOut
          ? "Codex emitted turn.completed but did not exit before the process timeout"
          : `Codex emitted turn.completed before process exit ${subject.code}`;
      }
    }
    await captureRepositoryEvidence({
      repo: fixture.repo,
      outputDir: diffDir,
      turn: 1,
      redactor,
    });
    repository = await inspectRepository({ testCase, repo: fixture.repo });
    hidden = await runHiddenCheck({ testCase, repo: fixture.repo });
  } catch (error) {
    infrastructureError = redactor(error.stack ?? error.message).text;
  } finally {
    cleanupIsolatedHomes(homes.root);
  }

  const secretRedactions =
    (login?.secretRedactions ?? 0) + (subject?.secretRedactions ?? 0);
  const pass =
    !infrastructureError &&
    secretRedactions === 0 &&
    repository?.ok === true &&
    hidden?.ok === true;
  const result = {
    runKey,
    caseId: testCase.id,
    category: testCase.category,
    barrier: testCase.barrier,
    condition,
    verdict: infrastructureError ? "indeterminate" : pass ? "pass" : "fail",
    infrastructureError,
    processExitWarning,
    login,
    subject: subject
      ? {
          code: subject.code,
          timedOut: subject.timedOut,
          durationMs: subject.durationMs,
          lastMessage: subject.lastMessage,
          metrics: subject.metrics,
          invalidJsonLines: subject.invalidJsonLines,
        }
      : undefined,
    repository,
    hidden,
    secretRedactions,
    installedSkillFiles: skillFiles,
  };
  writeJson(path.join(runRoot, "results", `${runKey}.json`), result);
  progress(`${runKey}: ${result.verdict}`);
  return result;
}

function aggregate({ cases, results, leaks, conditions }) {
  const pairs = cases.map((testCase) => {
    const absent = results.find(
      (result) =>
        result.caseId === testCase.id && result.condition === "absent",
    );
    const knowledge = results.find(
      (result) =>
        result.caseId === testCase.id && result.condition === "knowledge",
    );
    return {
      caseId: testCase.id,
      category: testCase.category,
      barrier: testCase.barrier,
      absent: absent?.verdict ?? "not-run",
      knowledge: knowledge?.verdict ?? "not-run",
      observableLift:
        absent?.verdict === "fail" && knowledge?.verdict === "pass",
    };
  });
  const paired = CONDITIONS.every((condition) => conditions.includes(condition));
  const candidate = results.filter(({ condition }) => condition === "knowledge");
  const gates = {
    pairedConditions: paired,
    noInfrastructureFailure: results.every(
      ({ verdict }) => verdict !== "indeterminate",
    ),
    allKnowledgeCasesPass:
      candidate.length === cases.length &&
      candidate.every(({ verdict }) => verdict === "pass"),
    applicableLiftObserved:
      paired &&
      pairs.some(
        ({ category, observableLift }) =>
          category === "applicable" && observableLift,
      ),
    protectiveCasesDoNotRegress:
      paired &&
      pairs
        .filter(({ category }) => category === "protective")
        .every(({ knowledge }) => knowledge === "pass"),
    noSecretLeak: leaks.length === 0,
  };
  return {
    verdict: Object.values(gates).every(Boolean) ? "pass" : "fail",
    gates,
    pairs,
    leaks,
  };
}

function reportMarkdown({ manifest, release, results }) {
  const lines = [
    "# SCD Knowledge behavior evaluation",
    "",
    `- Mode: ${manifest.mode}`,
    `- Model: ${manifest.model}`,
    `- Source commit: ${manifest.source.commit}`,
    `- Source dirty: ${manifest.source.workingTreeDirty}`,
    `- Verdict: ${release.verdict.toUpperCase()}`,
    "",
    "## Gates",
    "",
    ...Object.entries(release.gates).map(
      ([name, passed]) => `- ${passed ? "PASS" : "FAIL"}: ${name}`,
    ),
    "",
    "## Paired outcomes",
    "",
    "| Case | Category | Barrier | No knowledge | Knowledge present | Observable lift |",
    "|---|---|---|---|---|---|",
    ...release.pairs.map(
      (pair) =>
        `| ${pair.caseId} | ${pair.category} | ${pair.barrier} | ${pair.absent} | ${pair.knowledge} | ${pair.observableLift ? "yes" : "no"} |`,
    ),
    "",
    "## Candidate evidence",
    "",
    ...results
      .filter(({ condition }) => condition === "knowledge")
      .map(
        (result) =>
          `- ${result.caseId}: ${result.verdict}; ${result.hidden?.summary ?? result.infrastructureError ?? "no hidden result"}`,
      ),
    "",
    "Retrieval or citation alone is not counted as causal evidence. Observable lift requires the same case to fail without knowledge and pass with knowledge in this controlled run.",
    "",
  ];
  return `${lines.join("\n")}\n`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const mode = args.mode ?? "dry";
  if (!new Set(["dry", "smoke", "full"]).has(mode)) {
    throw new Error(`Invalid mode: ${mode}`);
  }
  const validation = validateCases(loadCases());
  if (!validation.ok) {
    throw new Error(validation.errors.join("\n"));
  }
  if (mode === "dry") {
    process.stdout.write(
      `PASS knowledge behavior dry run: ${validation.cases} cases\n`,
    );
    return;
  }

  const cases = selectCases({ mode, requestedId: args.case });
  const conditions = args.conditions
    ? args.conditions.split(",").filter(Boolean)
    : CONDITIONS;
  if (conditions.some((condition) => !CONDITIONS.includes(condition))) {
    throw new Error(`Invalid conditions: ${conditions.join(",")}`);
  }
  const workspace = path.resolve(args.workspace ?? DEFAULT_WORKSPACE);
  const runId = args["run-id"] ?? isoRunId(mode);
  const runsRoot = ensureDir(path.join(workspace, "runs"));
  const runRoot = path.join(runsRoot, runId);
  if (fs.existsSync(runRoot)) {
    throw new Error(`Run already exists: ${runId}`);
  }
  ensureDir(runRoot);

  const codexRoot = process.env.CODEX_HOME
    ? path.resolve(process.env.CODEX_HOME)
    : path.join(os.homedir(), ".codex");
  const authFile = path.join(codexRoot, "auth.json");
  const auth = readAuth(authFile);
  const redactor = createRedactor({ auth, userProfile: os.homedir() });
  const manifest = {
    schemaVersion: 1,
    runId,
    mode,
    model: args.model ?? DEFAULT_MODEL,
    reasoning: "high",
    serviceTier: "priority",
    cases: cases.map(({ id }) => id),
    conditions,
    source: await repositoryRevision(),
  };
  writeJson(path.join(runRoot, "manifest.json"), manifest);

  const results = [];
  for (const testCase of cases) {
    for (const condition of conditions) {
      results.push(
        await runSingle({
          testCase,
          condition,
          runRoot,
          authFile,
          model: manifest.model,
          redactor,
        }),
      );
    }
  }

  const leaks = scanTree(runRoot, redactor);
  const release = aggregate({ cases, results, leaks, conditions });
  const summary = { manifest, release, results };
  writeJson(path.join(runRoot, "summary.json"), summary);
  writeText(
    path.join(runRoot, "report.md"),
    reportMarkdown({ manifest, release, results }),
  );
  process.stdout.write(
    `${release.verdict.toUpperCase()} knowledge behavior evaluation: ${runRoot}\n`,
  );
  if (release.verdict !== "pass") process.exitCode = 1;
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});
