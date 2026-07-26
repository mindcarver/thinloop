import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  cleanupIsolatedHomes,
  createIsolatedHomes,
} from "../evals/discovery/runner/codex.mjs";
import {
  loadCases,
  pluginRoot,
  schemasRoot,
  selectSmokeCases,
  validateCases,
} from "../evals/discovery/runner/cases.mjs";
import {
  aggregateRelease,
  applySecretScanGate,
  classifyRepositoryState,
  evaluationExitCode,
  maxSubjectTurns,
} from "../evals/discovery/runner/grading.mjs";
import {
  ensureDir,
  findThreadId,
  parseJsonLines,
  summarizeCodexEvents,
} from "../evals/discovery/runner/lib.mjs";
import { createRedactor } from "../evals/discovery/runner/redact.mjs";
import {
  installConditionSnapshot,
} from "../evals/discovery/runner/snapshots.mjs";
import {
  classifySimulatorGate,
  deterministicUserReply,
  validateSimulatorOutput,
} from "../evals/discovery/runner/simulator.mjs";

test("discovery evaluation cases form a valid 3x3 matrix", () => {
  const validation = validateCases();
  assert.deepEqual(validation.errors, []);
  assert.equal(validation.cases, 9);
  assert.deepEqual(
    selectSmokeCases().map(({ group }) => group),
    ["clear", "underdefined", "complete"],
  );
});

test("structured-output schemas stay within the Codex-supported subset", () => {
  for (const name of [
    "simulator-output.schema.json",
    "judge-output.schema.json",
  ]) {
    const text = fs.readFileSync(path.join(schemasRoot, name), "utf8");
    const schema = JSON.parse(text);
    assert.equal(schema.additionalProperties, false);
    assert.doesNotMatch(
      text,
      /"uniqueItems"|"minItems"|"maxItems"|"oneOf"|"anyOf"|"allOf"|"patternProperties"/,
    );
  }
});

test("Codex JSONL metrics count usage and completed tools", () => {
  const metrics = summarizeCodexEvents([
    {
      type: "item.completed",
      item: { type: "command_execution" },
    },
    {
      type: "item.completed",
      item: { type: "agent_message" },
    },
    {
      type: "turn.completed",
      usage: {
        input_tokens: 100,
        cached_input_tokens: 60,
        cache_write_input_tokens: 0,
        output_tokens: 20,
        reasoning_output_tokens: 5,
      },
    },
  ]);
  assert.deepEqual(metrics.usage, {
    inputTokens: 100,
    cachedInputTokens: 60,
    cacheWriteInputTokens: 0,
    outputTokens: 20,
    reasoningOutputTokens: 5,
    totalTokens: 120,
  });
  assert.equal(metrics.toolCalls, 1);
  assert.deepEqual(metrics.itemCounts, {
    command_execution: 1,
    agent_message: 1,
  });
});

test("baseline and candidate install only their declared skill snapshots", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "thinloop-snapshot-test-"));
  try {
    const baseline = await installConditionSnapshot({
      pluginRoot,
      codexHome: ensureDir(path.join(root, "baseline")),
      condition: "baseline",
    });
    const candidate = await installConditionSnapshot({
      pluginRoot,
      codexHome: ensureDir(path.join(root, "candidate")),
      condition: "candidate",
    });
    assert.deepEqual(baseline.skills, ["scd-dev-loop"]);
    assert.deepEqual(candidate.skills, ["scd-dev-loop", "scd-discovery"]);
    assert.equal(
      fs.existsSync(
        path.join(root, "baseline", "skills", "scd-discovery", "SKILL.md"),
      ),
      false,
    );
    assert.equal(
      fs.existsSync(
        path.join(root, "candidate", "skills", "scd-discovery", "SKILL.md"),
      ),
      true,
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("redactor removes exact auth values and common key shapes", () => {
  const redact = createRedactor({
    auth: {
      tokens: {
        access_token: "access-secret-value-123",
      },
    },
    userProfile: "C:\\Users\\Example",
  });
  const result = redact(
    'Bearer abcdefghijklmnop "access_token":"access-secret-value-123" C:\\Users\\Example\\repo sk-proj-abcdefghijklmnop',
  );
  assert.doesNotMatch(result.text, /access-secret|abcdefghijklmnop|Users\\Example/);
  assert.ok(result.secretReplacements >= 3);
  assert.ok(result.pathReplacements >= 1);
});

test("isolated Codex homes clean up through Windows path aliases", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "thinloop-auth-fixture-"));
  const authFile = path.join(root, "auth.json");
  fs.writeFileSync(authFile, '{"auth_mode":"fixture"}\n', "utf8");
  const homes = createIsolatedHomes({ authFile });
  const visiblePath = fs.realpathSync.native(homes.root);
  cleanupIsolatedHomes(visiblePath);
  assert.equal(fs.existsSync(visiblePath), false);
  fs.rmSync(root, { recursive: true, force: true });
});

test("JSONL parser extracts a real-shaped Codex thread id", () => {
  const id = "019f9c03-4c8c-7713-8e52-c26eab31cb16";
  const parsed = parseJsonLines(
    `${JSON.stringify({ type: "thread.started", thread_id: id })}\n`,
  );
  assert.deepEqual(parsed.invalid, []);
  assert.equal(findThreadId(parsed.events), id);
});

test("simulator cannot approve an unresolved factsheet", () => {
  const testCase = loadCases().find(
    ({ group }) => group === "underdefined",
  );
  const validation = validateSimulatorOutput({
    output: {
      assistantAction: "approval_request",
      action: "approve",
      independentQuestionCount: 1,
      repeatsResolvedDecision: false,
      decisionIds: [],
      message: "同意",
      reason: "requested",
    },
    testCase,
    resolvedDecisionIds: [],
  });
  assert.equal(validation.ok, false);

  const reply = deterministicUserReply({
    simulatorOutput: {
      assistantAction: "approval_request",
      action: "stop",
      independentQuestionCount: 1,
      repeatsResolvedDecision: false,
      decisionIds: [],
      message: "还不能批准",
      reason: "missing",
    },
    testCase,
    resolvedDecisionIds: [],
  });
  assert.equal(reply.hardFailure, "approval_requested_before_required_decisions");
});

test("simulator invalid action cannot hide a known factsheet answer", () => {
  const [testCase] = loadCases().filter(
    ({ id }) => id === "cli-underdefined-team-sharing",
  );
  const validation = validateSimulatorOutput({
    output: {
      assistantAction: "question",
      action: "invalid",
      independentQuestionCount: 1,
      repeatsResolvedDecision: false,
      decisionIds: ["mode_selection"],
      message: "没有信息",
      reason: "错误地拒绝已知偏好",
    },
    testCase,
    resolvedDecisionIds: [],
  });
  assert.equal(validation.ok, false);
  assert.match(validation.errors.join("\n"), /invalid action requires/);
});

test("multiple decisions outrank a missing simulator fact", () => {
  const gate = classifySimulatorGate({
    action: "invalid",
    independentQuestionCount: 2,
  });
  assert.deepEqual(gate, {
    critical: "multiple_independent_decisions_in_one_turn",
  });
});

test("factsheet answers are deterministic after semantic mapping", () => {
  const testCase = loadCases().find(
    ({ id }) => id === "cli-underdefined-team-sharing",
  );
  const reply = deterministicUserReply({
    simulatorOutput: {
      assistantAction: "question",
      action: "answer",
      independentQuestionCount: 1,
      repeatsResolvedDecision: false,
      decisionIds: ["mode_selection"],
      message: "模型自行改写的答案不应被采用",
      reason: "mapped",
    },
    testCase,
    resolvedDecisionIds: [],
  });
  assert.equal(
    reply.message,
    testCase.facts.find(({ id }) => id === "mode_selection").answer,
  );
  assert.doesNotMatch(reply.message, /自行改写/);
});

test("repository grading allows only transient current state before terminal", () => {
  assert.deepEqual(
    classifyRepositoryState({
      state: {
        changes: [{ status: "??", file: ".scd/tasks/current.md" }],
        commitCount: 1,
        currentTaskExists: true,
      },
      terminal: false,
    }).critical,
    [],
  );
  assert.deepEqual(
    classifyRepositoryState({
      state: {
        changes: [{ status: " M", file: "src/app.mjs" }],
        commitCount: 1,
        currentTaskExists: false,
      },
      terminal: false,
    }).critical,
    ["implementation_or_persistent_artifact_changed"],
  );
  assert.equal(maxSubjectTurns("clear"), 1);
  assert.equal(maxSubjectTurns("complete"), 2);
  assert.equal(maxSubjectTurns("underdefined"), 12);
});

test("release aggregation enforces absolute and comparative gates", () => {
  const subjectRuns = [];
  for (const [group, count] of [
    ["clear", 6],
    ["complete", 6],
    ["underdefined", 6],
  ]) {
    for (let index = 0; index < count; index += 1) {
      subjectRuns.push({
        runKey: `${group}-${index}`,
        condition: "candidate",
        group,
        deterministic: {
          verdict: "pass",
          criticalFailures: [],
        },
        semanticVerdict: "pass",
      });
    }
  }
  const pairJudgments = Array.from({ length: 6 }, (_, index) => ({
    group: "underdefined",
    mappedPreference: index < 4 ? "candidate" : "tie",
  }));
  const result = aggregateRelease({ subjectRuns, pairJudgments });
  assert.equal(result.verdict, "pass");
  assert.ok(Object.values(result.gates).every(Boolean));
});

test("release failure and secret leakage produce a failing process result", () => {
  const passingRelease = {
    verdict: "pass",
    gates: { clearSixOfSix: true },
  };
  assert.equal(
    evaluationExitCode({
      mode: "full",
      release: passingRelease,
      leaks: [],
    }),
    0,
  );
  assert.equal(
    evaluationExitCode({
      mode: "full",
      release: { ...passingRelease, verdict: "fail" },
      leaks: [],
    }),
    1,
  );
  assert.equal(
    evaluationExitCode({
      mode: "smoke",
      release: undefined,
      leaks: ["auth token"],
    }),
    1,
  );

  const secured = applySecretScanGate({
    release: passingRelease,
    leaks: ["auth token"],
  });
  assert.equal(secured.verdict, "fail");
  assert.equal(secured.gates.secretScan, false);
  assert.equal(passingRelease.verdict, "pass");
});
