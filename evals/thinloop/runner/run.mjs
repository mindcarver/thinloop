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
  runProcess,
  sha256,
  writeJson,
  writeText,
} from "../../discovery/runner/lib.mjs";
import { createRedactor, scanTree } from "../../discovery/runner/redact.mjs";
import { conditionPrompt, installCondition } from "./conditions.mjs";
import { prepareFixture } from "./fixture.mjs";
import {
  loadManifest,
  manifestFile,
  pluginRoot,
  selectCases,
  validateManifest,
} from "./manifest.mjs";
import { observeRepository } from "./observe.mjs";
import { reportMarkdown } from "./report.mjs";
import { aggregateResults, scoreObservation } from "./scoring.mjs";

const DEFAULT_MODEL = "gpt-5.4";
const DEFAULT_REASONING = "medium";
const DEFAULT_WORKSPACE = path.resolve(pluginRoot, "..", "test", "thinloop-current-eval");

function progress(message) {
  process.stdout.write(`[${new Date().toISOString()}] ${message}\n`);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

async function sourceRevision() {
  const [revision, status] = await Promise.all([
    runProcess(commandName("git"), ["rev-parse", "HEAD"], { cwd: pluginRoot, timeoutMs: 30_000 }),
    runProcess(commandName("git"), ["status", "--short"], { cwd: pluginRoot, timeoutMs: 30_000 }),
  ]);
  if (revision.code !== 0 || status.code !== 0) throw new Error("cannot identify Thinloop source revision");
  return { commit: revision.stdout.trim(), workingTreeDirty: Boolean(status.stdout.trim()) };
}

function pricingFrom(args) {
  const inputPerMillionUsd = args["input-price"] === undefined ? undefined : Number(args["input-price"]);
  const outputPerMillionUsd = args["output-price"] === undefined ? undefined : Number(args["output-price"]);
  if ((inputPerMillionUsd === undefined) !== (outputPerMillionUsd === undefined)) {
    throw new Error("both --input-price and --output-price are required to calculate cost");
  }
  if ([inputPerMillionUsd, outputPerMillionUsd].some((value) => value !== undefined && (!Number.isFinite(value) || value < 0))) {
    throw new Error("pricing values must be non-negative numbers");
  }
  return { inputPerMillionUsd, outputPerMillionUsd };
}

async function dryRun(manifest) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "thinloop-current-dry-"));
  try {
    for (const testCase of manifest.cases) {
      await prepareFixture({ workspaceRoot: root, runKey: testCase.id, testCase });
    }
    const scoringRoot = path.join(pluginRoot, "evals", "thinloop", "scoring-fixtures");
    const testCase = manifest.cases.find(({ id }) => id === "false-completion-audit");
    const good = scoreObservation(readJson(path.join(scoringRoot, "known-good.json")), testCase);
    const bad = scoreObservation(readJson(path.join(scoringRoot, "known-bad.json")), testCase);
    if (good.verdict !== "PASS") throw new Error("known-good scorer fixture did not pass");
    if (bad.verdict !== "FAIL" || !bad.metrics.unsupportedCompletionClaim || bad.metrics.scopeLeakage === 0 || bad.metrics.prohibitedNetNewCommits !== 1) {
      throw new Error("known-bad scorer fixture did not expose the expected failures");
    }
    const aggregate = aggregateResults({ results: [good, bad], leaks: [] });
    if (aggregate.status !== "OBSERVED") throw new Error("dry aggregate self-test failed");
    const leaks = scanTree(scoringRoot, createRedactor({ auth: {}, userProfile: os.homedir() }));
    if (leaks.length > 0) throw new Error(`scoring fixtures failed secret scan: ${JSON.stringify(leaks)}`);
    process.stdout.write(`PASS Thinloop current dry run: ${manifest.cases.length} cases, ${manifest.conditions.length} conditions; no model or auth used\n`);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

async function runSingle({ testCase, condition, runRoot, authFile, model, reasoning, redactor, pricing, runId }) {
  const runKey = `${testCase.id}--${condition.id}`;
  const fixture = await prepareFixture({ workspaceRoot: runRoot, runKey, testCase });
  const homes = createIsolatedHomes({ authFile, prefix: "thinloop-eval-current-" });
  let context;
  let login;
  let subject;
  let final;
  let infrastructure;
  try {
    context = installCondition({ condition, codexHome: homes.subject.codexHome });
    login = await codexLoginStatus({ home: homes.subject, redactor });
    if (login.code !== 0 || login.timedOut) {
      infrastructure = { blocked: true, reason: "isolated Codex login is unavailable", evidence: login.output };
    } else {
      progress(`${runKey}: real subject started`);
      subject = await runSubjectTurn({
        home: homes.subject,
        cwd: fixture.repo,
        prompt: conditionPrompt(condition, testCase.prompt),
        model,
        reasoning,
        outputDir: ensureDir(path.join(runRoot, "raw", runKey)),
        turn: 1,
        redactor,
        timeoutMs: 900_000,
        onProgress: progress,
      });
      const completed = Boolean(subject.lastMessage) && Boolean(subject.sessionId) && subject.metrics.usage.totalTokens > 0 && subject.invalidJsonLines.length === 0;
      if (!completed) {
        infrastructure = {
          blocked: true,
          reason: subject.timedOut ? "subject timed out before a completed turn" : "subject failed or produced no completed turn",
          evidence: `exit=${subject.code}; invalidJson=${subject.invalidJsonLines.length}`,
        };
      }
    }
    await captureRepositoryEvidence({ repo: fixture.repo, outputDir: ensureDir(path.join(runRoot, "diffs", runKey)), turn: 1, redactor });
    final = await observeRepository({
      testCase,
      condition: condition.id,
      repo: fixture.repo,
      baseline: fixture.baseline,
      lastMessage: subject?.lastMessage ?? "",
    });
  } catch (error) {
    infrastructure = { blocked: true, reason: "subject infrastructure error", evidence: redactor(error.stack ?? error.message).text };
    final ??= { ...fixture.baseline, changedFiles: [] };
  } finally {
    cleanupIsolatedHomes(homes.root);
  }
  const observation = {
    schemaVersion: 3,
    runId,
    runKey,
    caseId: testCase.id,
    category: testCase.category,
    condition: condition.id,
    context,
    infrastructure: infrastructure ?? { blocked: false },
    baseline: fixture.baseline,
    final,
    subject: subject
      ? {
          code: subject.code,
          timedOut: subject.timedOut,
          durationMs: subject.durationMs,
          lastMessage: subject.lastMessage,
          metrics: subject.metrics,
          invalidJsonLines: subject.invalidJsonLines,
        }
      : { lastMessage: "", metrics: {} },
    pricing,
  };
  writeJson(path.join(runRoot, "observations", `${runKey}.json`), observation);
  const secretRedactions = (login?.secretRedactions ?? 0) + (subject?.secretRedactions ?? 0);
  return { observation, result: scoreObservation(observation, testCase), secretRedactions };
}

async function realRun({ args, manifest, mode }) {
  const cases = selectCases({ manifest, mode, requestedId: args.case });
  const conditions = args.conditions
    ? args.conditions.split(",").map((id) => manifest.conditions.find((condition) => condition.id === id))
    : manifest.conditions;
  if (conditions.some((condition) => !condition)) throw new Error("unknown condition in --conditions");
  const workspace = path.resolve(args.workspace ?? DEFAULT_WORKSPACE);
  const runId = args["run-id"] ?? isoRunId(mode);
  const runRoot = path.join(ensureDir(path.join(workspace, "runs")), runId);
  if (fs.existsSync(runRoot)) throw new Error(`run already exists: ${runRoot}`);
  ensureDir(runRoot);
  const codexRoot = process.env.CODEX_HOME ? path.resolve(process.env.CODEX_HOME) : path.join(os.homedir(), ".codex");
  const authFile = path.join(codexRoot, "auth.json");
  if (!fs.existsSync(authFile)) {
    writeJson(path.join(runRoot, "blocked.json"), { status: "BLOCKED", reason: `Codex auth file not found: ${authFile}` });
    process.stdout.write(`BLOCKED Thinloop current evaluation: ${runRoot}\n`);
    process.exitCode = 2;
    return;
  }
  const auth = readJson(authFile);
  const redactor = createRedactor({ auth, userProfile: os.homedir() });
  const pricing = pricingFrom(args);
  const runManifest = {
    schemaVersion: 1,
    runId,
    mode,
    model: args.model ?? DEFAULT_MODEL,
    reasoning: args.reasoning ?? DEFAULT_REASONING,
    serviceTier: "priority",
    cases: cases.map(({ id }) => id),
    conditions: conditions.map(({ id }) => id),
    definitionSha256: sha256(fs.readFileSync(manifestFile)),
    definition: manifest,
    source: await sourceRevision(),
    pricing,
  };
  writeJson(path.join(runRoot, "manifest.json"), runManifest);
  const results = [];
  let secretRedactions = 0;
  for (const testCase of cases) {
    for (const condition of conditions) {
      const outcome = await runSingle({
        testCase,
        condition,
        runRoot,
        authFile,
        model: runManifest.model,
        reasoning: runManifest.reasoning,
        redactor,
        pricing,
        runId,
      });
      results.push(outcome.result);
      secretRedactions += outcome.secretRedactions;
      progress(`${outcome.observation.runKey}: ${outcome.result.verdict}`);
    }
  }
  let leaks = scanTree(runRoot, redactor);
  if (secretRedactions > 0) leaks = [...leaks, { file: "raw subject output before redaction", replacements: secretRedactions }];
  let summary = aggregateResults({ results, leaks });
  writeJson(path.join(runRoot, "summary.json"), { run: runManifest, summary, results });
  writeText(path.join(runRoot, "report.md"), reportMarkdown({ runManifest, summary, results }));
  const finalLeaks = scanTree(runRoot, redactor);
  if (finalLeaks.length > leaks.filter(({ file }) => file !== "raw subject output before redaction").length) {
    leaks = [...leaks, ...finalLeaks];
    summary = aggregateResults({ results, leaks });
    writeJson(path.join(runRoot, "summary.json"), { run: runManifest, summary, results });
    writeText(path.join(runRoot, "report.md"), reportMarkdown({ runManifest, summary, results }));
  }
  process.stdout.write(`${summary.status} Thinloop current evaluation: ${runRoot}\n`);
  if (summary.status === "FAIL") process.exitCode = 1;
  if (summary.status === "BLOCKED") process.exitCode = 2;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args["browser-evidence"]) throw new Error("collect browser evidence after implementation; import with rescore.mjs --run <directory> --browser-evidence <file>");
  const mode = args.mode ?? "dry";
  if (!new Set(["dry", "smoke", "full"]).has(mode)) throw new Error(`invalid mode: ${mode}`);
  const manifest = loadManifest();
  const validation = validateManifest(manifest);
  if (!validation.ok) throw new Error(validation.errors.join("\n"));
  if (mode === "dry") return dryRun(manifest);
  return realRun({ args, manifest, mode });
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});
