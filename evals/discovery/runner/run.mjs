import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  casesFile,
  discoveryRoot,
  loadCases,
  pluginRoot,
  schemasRoot,
  selectSmokeCases,
  validateCases,
} from "./cases.mjs";
import {
  cleanupIsolatedHomes,
  codexLoginStatus,
  createIsolatedHomes,
  runStructuredEvaluator,
  runSubjectTurn,
} from "./codex.mjs";
import { captureRepositoryEvidence, prepareFixture } from "./fixture.mjs";
import {
  aggregateRelease,
  applySecretScanGate,
  classifyRepositoryState,
  evaluationExitCode,
  finalizeDeterministicResult,
  maxSubjectTurns,
  repositoryState,
} from "./grading.mjs";
import {
  buildJudgePrompt,
  mapJudgeOutput,
} from "./judge.mjs";
import {
  commandName,
  ensureDir,
  isoRunId,
  parseArgs,
  readJson,
  relativeFiles,
  runProcess,
  sha256,
  writeJson,
  writeText,
} from "./lib.mjs";
import { createRedactor, scanTree } from "./redact.mjs";
import {
  CONDITIONS,
  installConditionSnapshot,
  resolveCommit,
} from "./snapshots.mjs";
import {
  buildSimulatorPrompt,
  classifySimulatorGate,
  deterministicUserReply,
  validateSimulatorOutput,
} from "./simulator.mjs";
import { writeRunReport } from "./report.mjs";

const DEFAULT_WORKSPACE = path.resolve(
  pluginRoot,
  "..",
  "test",
  "thinloop-eval-workspace",
);
const DEFAULT_MODEL = "gpt-5.6-sol";

function progress(message) {
  process.stdout.write(`[${new Date().toISOString()}] ${message}\n`);
}

function loadAuth(authFile) {
  return JSON.parse(fs.readFileSync(authFile, "utf8"));
}

function publicRun(run) {
  const { temporaryHome, ...safe } = run;
  return safe;
}

async function runSingleAttempt({
  testCase,
  condition,
  repetition,
  attempt,
  config,
  runRoot,
}) {
  const runKey = `${testCase.id}--${condition}--r${repetition}`;
  const attemptKey = `${runKey}--attempt-${attempt}`;
  const rawDir = ensureDir(path.join(runRoot, "raw", attemptKey));
  const diffDir = ensureDir(path.join(runRoot, "diffs", attemptKey));
  const transcriptFile = path.join(
    runRoot,
    "transcripts",
    `${attemptKey}.json`,
  );
  const auth = loadAuth(config.authFile);
  const redactor = createRedactor({ auth });
  const fixture = await prepareFixture({
    workspaceRoot: runRoot,
    runKey: attemptKey,
    testCase,
  });
  const homes = createIsolatedHomes({ authFile: config.authFile });
  const infrastructureFailures = [];
  const criticalFailures = [];
  const turns = [];
  const transcript = [
    { role: "user", message: testCase.initialPrompt },
  ];
  const resolved = new Set(testCase.preResolvedDecisionIds);
  let approved = false;
  let sessionId;
  let nextPrompt = testCase.initialPrompt;
  let repeatedResolvedQuestions = 0;
  let terminal = false;
  let terminalState;
  let snapshot;
  let login;
  let totalSecretRedactions = 0;

  try {
    snapshot = await installConditionSnapshot({
      pluginRoot,
      codexHome: homes.subject.codexHome,
      condition,
    });
    login = await codexLoginStatus({
      home: homes.subject,
      redactor,
    });
    totalSecretRedactions += login.secretRedactions;
    if (login.code !== 0 || login.timedOut) {
      infrastructureFailures.push("isolated_codex_login_unavailable");
      terminal = true;
    }

    for (
      let turn = 1;
      !terminal && turn <= maxSubjectTurns(testCase.group);
      turn += 1
    ) {
      progress(`${attemptKey}: subject turn ${turn}`);
      const subject = await runSubjectTurn({
        home: homes.subject,
        cwd: fixture.repo,
        prompt: nextPrompt,
        sessionId,
        model: config.model,
        reasoning: config.subjectReasoning,
        outputDir: rawDir,
        turn,
        redactor,
        onProgress: progress,
      });
      totalSecretRedactions += subject.secretRedactions;
      if (
        subject.code !== 0 ||
        subject.timedOut ||
        !subject.lastMessage ||
        (!sessionId && !subject.sessionId)
      ) {
        infrastructureFailures.push(
          subject.timedOut
            ? "subject_turn_timeout"
            : "subject_turn_failed_or_missing_output",
        );
        terminal = true;
        break;
      }
      sessionId = subject.sessionId;
      transcript.push({ role: "assistant", message: subject.lastMessage });

      await captureRepositoryEvidence({
        repo: fixture.repo,
        outputDir: diffDir,
        turn,
        redactor,
      });
      const state = await repositoryState(fixture.repo);
      const midState = classifyRepositoryState({ state, terminal: false });
      criticalFailures.push(...midState.critical);
      if (midState.critical.length > 0) {
        turns.push({ turn, subject, state, simulator: null });
        terminal = true;
        break;
      }

      const simulatorPrompt = buildSimulatorPrompt({
        testCase,
        assistantMessage: subject.lastMessage,
        resolvedDecisionIds: [...resolved],
      });
      const simulator = await runStructuredEvaluator({
        home: homes.evaluator,
        cwd: fixture.repo,
        prompt: simulatorPrompt,
        model: config.model,
        reasoning: config.simulatorReasoning,
        schemaFile: path.join(
          schemasRoot,
          "simulator-output.schema.json",
        ),
        outputDir: rawDir,
        name: `turn-${turn}-simulator`,
        redactor,
        onProgress: progress,
      });
      totalSecretRedactions += simulator.secretRedactions;
      if (
        simulator.code !== 0 ||
        simulator.timedOut ||
        simulator.parseError ||
        !simulator.output
      ) {
        infrastructureFailures.push("simulator_failed_or_invalid_output");
        turns.push({ turn, subject, state, simulator });
        terminal = true;
        break;
      }
      const simulatorValidation = validateSimulatorOutput({
        output: simulator.output,
        testCase,
        resolvedDecisionIds: [...resolved],
      });
      if (!simulatorValidation.ok) {
        infrastructureFailures.push(
          `simulator_contract_error:${simulatorValidation.errors.join("|")}`,
        );
        turns.push({ turn, subject, state, simulator: simulator.output });
        terminal = true;
        break;
      }

      const output = simulator.output;
      turns.push({
        turn,
        subject,
        state,
        simulator: output,
        simulatorRun: {
          durationMs: simulator.durationMs,
          metrics: simulator.metrics,
        },
      });
      const simulatorGate = classifySimulatorGate(output);
      if (simulatorGate.critical) {
        criticalFailures.push(simulatorGate.critical);
        terminal = true;
        break;
      }
      if (simulatorGate.infrastructure) {
        infrastructureFailures.push(simulatorGate.infrastructure);
        terminal = true;
        break;
      }
      if (testCase.group === "complete" && output.assistantAction === "question") {
        criticalFailures.push("complete_spec_redundant_question");
        terminal = true;
        break;
      }
      if (
        approved &&
        ["question", "approval_request"].includes(output.assistantAction)
      ) {
        criticalFailures.push("question_after_explicit_approval");
        terminal = true;
        break;
      }
      if (testCase.group === "clear") {
        terminal = true;
        break;
      }

      const repeated = output.repeatsResolvedDecision;
      if (repeated) repeatedResolvedQuestions += 1;
      else repeatedResolvedQuestions = 0;
      if (repeatedResolvedQuestions >= 2) {
        criticalFailures.push("repeated_resolved_decision_twice");
        terminal = true;
        break;
      }

      const reply = deterministicUserReply({
        simulatorOutput: output,
        testCase,
        resolvedDecisionIds: [...resolved],
      });
      if (reply.hardFailure) {
        criticalFailures.push(reply.hardFailure);
        terminal = true;
        break;
      }
      if (approved) {
        terminal = true;
        break;
      }
      if (reply.terminal) {
        terminal = true;
        break;
      }

      for (const id of output.decisionIds) resolved.add(id);
      if (reply.approved) approved = true;
      transcript.push({ role: "user", message: reply.message });
      nextPrompt = reply.message;
    }

    terminalState = await repositoryState(fixture.repo);
    const finalState = classifyRepositoryState({
      state: terminalState,
      terminal: infrastructureFailures.length === 0,
    });
    criticalFailures.push(...finalState.critical);
    if (totalSecretRedactions > 0) {
      criticalFailures.push("authentication_material_detected_and_redacted");
    }
  } finally {
    cleanupIsolatedHomes(homes.root);
  }

  const deterministic = finalizeDeterministicResult({
    testCase,
    turns,
    criticalFailures,
    infrastructureFailures,
    approved,
    terminalState,
  });
  const result = {
    runKey,
    attempt,
    caseId: testCase.id,
    group: testCase.group,
    product: testCase.product,
    condition,
    repetition,
    snapshot,
    login,
    fixtureTests: fixture.nativeTests,
    transcript,
    turns,
    deterministic,
    secretRedactions: totalSecretRedactions,
  };
  writeJson(transcriptFile, transcript);
  writeJson(
    path.join(runRoot, "scores", "attempts", `${attemptKey}.json`),
    publicRun(result),
  );
  return result;
}

async function runSubjectWithRetry(options) {
  const attempts = [];
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const result = await runSingleAttempt({ ...options, attempt });
    attempts.push(result);
    if (result.deterministic.verdict !== "indeterminate") {
      return { ...result, attempts: attempts.length };
    }
    if (attempt === 1) {
      progress(`${result.runKey}: infrastructure indeterminate; retrying once`);
    }
  }
  return { ...attempts.at(-1), attempts: attempts.length };
}

async function runJudgePair({
  testCase,
  repetition,
  baseline,
  candidate,
  config,
  runRoot,
}) {
  const pairKey = `${testCase.id}--r${repetition}`;
  if (
    baseline.deterministic.verdict === "indeterminate" ||
    candidate.deterministic.verdict === "indeterminate"
  ) {
    return {
      pairKey,
      caseId: testCase.id,
      group: testCase.group,
      repetition,
      preference: "uncertain",
      mappedPreference: "uncertain",
      baselineVerdict: "uncertain",
      candidateVerdict: "uncertain",
      reason: "subject infrastructure was indeterminate",
    };
  }

  const auth = loadAuth(config.authFile);
  const redactor = createRedactor({ auth });
  const pair = buildJudgePrompt({
    testCase,
    repetition,
    baseline,
    candidate,
  });
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const homes = createIsolatedHomes({ authFile: config.authFile });
    try {
      const result = await runStructuredEvaluator({
        home: homes.evaluator,
        cwd: runRoot,
        prompt: pair.prompt,
        model: config.model,
        reasoning: config.judgeReasoning,
        schemaFile: path.join(schemasRoot, "judge-output.schema.json"),
        outputDir: path.join(runRoot, "raw", "judges", pairKey),
        name: `attempt-${attempt}`,
        redactor,
        onProgress: progress,
      });
      if (
        result.code === 0 &&
        !result.timedOut &&
        !result.parseError &&
        result.output &&
        result.secretRedactions === 0
      ) {
        return {
          pairKey,
          caseId: testCase.id,
          group: testCase.group,
          repetition,
          judgeMetrics: result.metrics,
          ...mapJudgeOutput({ output: result.output, labels: pair.labels }),
        };
      }
      if (attempt === 1) progress(`${pairKey}: judge indeterminate; retrying once`);
    } finally {
      cleanupIsolatedHomes(homes.root);
    }
  }
  return {
    pairKey,
    caseId: testCase.id,
    group: testCase.group,
    repetition,
    preference: "uncertain",
    mappedPreference: "uncertain",
    baselineVerdict: "uncertain",
    candidateVerdict: "uncertain",
    reason: "judge failed after one retry",
  };
}

async function dryRun({ cases, runRoot }) {
  const snapshotRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "thinloop-eval-dry-"),
  );
  const results = [];
  try {
    for (const testCase of cases) {
      const fixture = await prepareFixture({
        workspaceRoot: runRoot,
        runKey: `dry--${testCase.id}`,
        testCase,
      });
      results.push({
        caseId: testCase.id,
        fixtureTests: fixture.nativeTests,
      });
    }
    for (const condition of Object.keys(CONDITIONS)) {
      results.push(
        await installConditionSnapshot({
          pluginRoot,
          codexHome: ensureDir(path.join(snapshotRoot, condition)),
          condition,
        }),
      );
    }
  } finally {
    fs.rmSync(snapshotRoot, { recursive: true, force: true });
  }
  writeJson(path.join(runRoot, "dry-run.json"), results);
  return results;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const mode = args.mode ?? "dry";
  if (!["dry", "smoke", "full"].includes(mode)) {
    throw new Error(`--mode must be dry, smoke, or full; received ${mode}`);
  }
  const validation = validateCases();
  if (!validation.ok) {
    throw new Error(`Case validation failed:\n${validation.errors.join("\n")}`);
  }

  const workspace = path.resolve(args.workspace ?? DEFAULT_WORKSPACE);
  const runId = args["run-id"] ?? isoRunId(mode);
  const runRoot = path.join(workspace, "runs", runId);
  const manifestFile = path.join(runRoot, "manifest.json");
  const resume = args.resume === true;
  if (fs.existsSync(manifestFile) && !resume) {
    throw new Error(
      `Run ${runId} already exists; use --resume or choose a new --run-id`,
    );
  }
  ensureDir(runRoot);
  const authFile = path.resolve(
    args.auth ??
      path.join(process.env.CODEX_HOME ?? path.join(process.env.USERPROFILE, ".codex"), "auth.json"),
  );
  const version = await runProcess(commandName("codex"), ["--version"], {
    timeoutMs: 30_000,
  });
  const commits = Object.fromEntries(
    await Promise.all(
      Object.entries(CONDITIONS).map(async ([condition, definition]) => [
        condition,
        await resolveCommit(pluginRoot, definition.commit),
      ]),
    ),
  );
  const allCases = loadCases();
  const defaultCases = mode === "smoke" ? selectSmokeCases(allCases) : allCases;
  const requestedCaseIds =
    typeof args.case === "string"
      ? args.case.split(",").map((value) => value.trim()).filter(Boolean)
      : [];
  const selectedCases =
    requestedCaseIds.length > 0
      ? allCases.filter(({ id }) => requestedCaseIds.includes(id))
      : defaultCases;
  if (
    requestedCaseIds.length > 0 &&
    selectedCases.length !== requestedCaseIds.length
  ) {
    throw new Error(`Unknown --case value; requested ${requestedCaseIds.join(",")}`);
  }
  const defaultConditions =
    mode === "smoke" ? ["candidate"] : ["baseline", "candidate"];
  const conditions =
    typeof args.conditions === "string"
      ? args.conditions.split(",").map((value) => value.trim()).filter(Boolean)
      : defaultConditions;
  if (
    conditions.length === 0 ||
    conditions.some((condition) => !(condition in CONDITIONS))
  ) {
    throw new Error("--conditions must contain baseline and/or candidate");
  }
  const repetitions = Number(
    args.repetitions ?? (mode === "full" ? 2 : 1),
  );
  if (!Number.isInteger(repetitions) || repetitions < 1 || repetitions > 10) {
    throw new Error("--repetitions must be an integer from 1 through 10");
  }
  const config = {
    authFile,
    model: args.model ?? DEFAULT_MODEL,
    subjectReasoning: args["subject-reasoning"] ?? "high",
    simulatorReasoning: args["simulator-reasoning"] ?? "low",
    judgeReasoning: args["judge-reasoning"] ?? "high",
  };
  const definitionFiles = relativeFiles(discoveryRoot)
    .filter((relativePath) => relativePath !== "README.md")
    .map((relativePath) => ({
      path: relativePath,
      sha256: sha256(
        fs.readFileSync(path.join(discoveryRoot, relativePath)),
      ),
    }));
  const nextManifest = {
    runId,
    mode,
    startedAt: new Date().toISOString(),
    cliVersion: `${version.stdout}${version.stderr}`.trim(),
    caseSource: path.relative(pluginRoot, casesFile).replaceAll(path.sep, "/"),
    definitionFiles,
    cases: selectedCases.map(({ id }) => id),
    conditions,
    repetitions,
    commits,
    model: {
      subject: config.model,
      simulator: config.model,
      judge: config.model,
    },
    reasoning: {
      subject: config.subjectReasoning,
      simulator: config.simulatorReasoning,
      judge: config.judgeReasoning,
    },
    serviceTier: "priority",
    sandbox: "workspace-write",
    networkTools: false,
  };
  let manifest = nextManifest;
  if (resume) {
    if (!fs.existsSync(manifestFile)) {
      throw new Error(`Cannot resume missing run ${runId}`);
    }
    const previous = readJson(manifestFile);
    for (const key of [
      "mode",
      "cases",
      "conditions",
      "repetitions",
      "commits",
      "definitionFiles",
      "model",
      "reasoning",
      "serviceTier",
      "sandbox",
      "networkTools",
    ]) {
      if (JSON.stringify(previous[key]) !== JSON.stringify(nextManifest[key])) {
        throw new Error(
          `Resume configuration mismatch for ${key}: existing=${JSON.stringify(previous[key])} requested=${JSON.stringify(nextManifest[key])}`,
        );
      }
    }
    manifest = {
      ...previous,
      resumedAt: [
        ...(previous.resumedAt ?? []),
        new Date().toISOString(),
      ],
    };
  }
  writeJson(manifestFile, manifest);

  if (mode === "dry") {
    progress(`dry run ${runId} started`);
    const results = await dryRun({ cases: selectedCases, runRoot });
    writeRunReport({
      runRoot,
      manifest,
      subjectRuns: [],
      pairJudgments: [],
    });
    progress(`dry run complete: ${results.length} checks at ${runRoot}`);
    return;
  }
  if (!fs.existsSync(authFile)) {
    throw new Error(`Codex authentication not found: ${authFile}`);
  }

  const subjectRuns =
    resume && fs.existsSync(path.join(runRoot, "scores", "subject-runs.json"))
      ? readJson(path.join(runRoot, "scores", "subject-runs.json"))
      : [];
  for (const testCase of selectedCases) {
    for (const condition of conditions) {
      for (let repetition = 1; repetition <= repetitions; repetition += 1) {
        const existing = subjectRuns.find(
          (run) =>
            run.caseId === testCase.id &&
            run.condition === condition &&
            run.repetition === repetition,
        );
        if (existing) {
          progress(
            `${testCase.id} ${condition} repetition ${repetition} already complete; skipping`,
          );
          continue;
        }
        progress(`${testCase.id} ${condition} repetition ${repetition} started`);
        const result = await runSubjectWithRetry({
          testCase,
          condition,
          repetition,
          config,
          runRoot,
        });
        subjectRuns.push(publicRun(result));
        writeJson(
          path.join(runRoot, "scores", "subject-runs.json"),
          subjectRuns,
        );
        progress(
          `${result.runKey} => ${result.deterministic.verdict} (${result.deterministic.subjectTurns} turns)`,
        );
      }
    }
  }

  const pairJudgments =
    resume && fs.existsSync(path.join(runRoot, "scores", "pair-judgments.json"))
      ? readJson(path.join(runRoot, "scores", "pair-judgments.json"))
      : [];
  if (mode === "full") {
    for (const testCase of selectedCases) {
      for (let repetition = 1; repetition <= repetitions; repetition += 1) {
        const pairKey = `${testCase.id}--r${repetition}`;
        if (pairJudgments.some((judgment) => judgment.pairKey === pairKey)) {
          progress(`${pairKey}: judge already complete; skipping`);
          continue;
        }
        const baseline = subjectRuns.find(
          (run) =>
            run.caseId === testCase.id &&
            run.condition === "baseline" &&
            run.repetition === repetition,
        );
        const candidate = subjectRuns.find(
          (run) =>
            run.caseId === testCase.id &&
            run.condition === "candidate" &&
            run.repetition === repetition,
        );
        const judgment = await runJudgePair({
          testCase,
          repetition,
          baseline,
          candidate,
          config,
          runRoot,
        });
        pairJudgments.push(judgment);
        baseline.semanticVerdict = judgment.baselineVerdict;
        candidate.semanticVerdict = judgment.candidateVerdict;
        writeJson(
          path.join(runRoot, "scores", "pair-judgments.json"),
          pairJudgments,
        );
        writeJson(
          path.join(runRoot, "scores", "subject-runs.json"),
          subjectRuns,
        );
      }
    }
  }

  let release =
    mode === "full"
      ? aggregateRelease({ subjectRuns, pairJudgments })
      : undefined;
  const redactor = createRedactor({ auth: loadAuth(config.authFile) });
  const leaks = scanTree(runRoot, redactor);
  writeJson(path.join(runRoot, "scores", "secret-scan.json"), {
    pass: leaks.length === 0,
    findings: leaks,
  });
  release = applySecretScanGate({ release, leaks });
  if (release) {
    writeJson(path.join(runRoot, "scores", "release.json"), release);
  }
  writeRunReport({
    runRoot,
    manifest,
    subjectRuns,
    pairJudgments,
    release,
  });
  progress(`${mode} run complete: ${runRoot}`);
  process.exitCode = evaluationExitCode({ mode, release, leaks });
}

const direct =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (direct) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}

export { dryRun, runJudgePair, runSingleAttempt, runSubjectWithRetry };
