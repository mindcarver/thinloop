import assert from "node:assert/strict";
import test from "node:test";
import { cases, definition, eventEvidence, payloadIdentity, prompt, schedule, snapshot } from "../evals/compact/run.mjs";

test("compact comparison freezes three paired tasks, two repeats and interleaved order", () => {
  const pairs = schedule();
  assert.equal(pairs.length, 6);
  assert.equal(pairs.flatMap(pair => pair.order).length, 12);
  for (const testCase of cases) assert.equal(pairs.filter(pair => pair.caseId === testCase.id).length, 2);
  pairs.forEach((pair, index) => assert.deepEqual(pair.order, index % 2 ? ["candidate", "baseline"] : ["baseline", "candidate"]));
  assert.equal(definition.concurrency, 2);
  assert.equal(definition.model, "gpt-6-astra");
  assert.equal(definition.cliVersion, "codex-cli 0.153.0");
  for (const testCase of cases) {
    assert.match(prompt(testCase), /显式使用 \$scd-quickdev/);
    assert.match(prompt(testCase), /不创建分支或工作树，不提交或合并/);
    assert.doesNotMatch(prompt(testCase), /baseline|candidate|评分|hiddenCheck/);
  }
});

test("payload identity covers all frozen files and changes with bytes or names", () => {
  const baseline = snapshot(definition.baselineQuickdevRef, "skills/scd-quickdev/");
  assert.ok(baseline["skills/scd-quickdev/SKILL.md"]);
  assert.ok(baseline["skills/scd-quickdev/references/issue-delivery-contract.md"]);
  const before = payloadIdentity(baseline);
  assert.notEqual(payloadIdentity({ ...baseline, "skills/scd-quickdev/SKILL.md": "changed" }).sha256, before.sha256);
  assert.notEqual(payloadIdentity({ ...baseline, "skills/scd-quickdev/new.md": "new" }).sha256, before.sha256);
  assert.throws(() => snapshot("HEAD"), /full commit SHA/);
});

test("loading proof requires a successful full read and usage keeps absent counters unknown", () => {
  const files = { "skills/scd-quickdev/SKILL.md": "# entry\ncomplete content\n" };
  const command = { type: "item.completed", item: { type: "command_execution", id: "read", command: "cat $CODEX_HOME/skills/scd-quickdev/SKILL.md", exit_code: 0, aggregated_output: files[Object.keys(files)[0]] } };
  const evidence = eventEvidence([command, { type: "turn.completed", usage: { input_tokens: 10, output_tokens: 2 } }], files);
  assert.equal(evidence.entryFullyObserved, true);
  assert.equal(evidence.knownCompletedCommands, 1);
  assert.deepEqual(evidence.usage, { inputTokens: 10, outputTokens: 2, cachedInputTokens: null, cacheWriteInputTokens: null, reasoningOutputTokens: null });
  assert.equal(eventEvidence([{ ...command, item: { ...command.item, aggregated_output: "# entry\n[truncated]" } }], files).entryFullyObserved, false);
  assert.equal(eventEvidence([{ ...command, item: { ...command.item, exit_code: 1 } }], files).entryFullyObserved, false);
  const unknown = eventEvidence([{ type: "item.completed", item: { type: "new_tool_type" } }], files);
  assert.equal(unknown.toolCountCoverage, "partial");
  assert.equal(unknown.usage.inputTokens, null);
});

test("paired summary preserves unknown usage rather than summing incomplete samples", async () => {
  const { summarize } = await import("../evals/compact/report.mjs");
  const identity = { bytes: 20, chars: 10, inventory: [{ file: "skills/scd-quickdev/SKILL.md", bytes: 20, chars: 10 }] };
  const row = (condition, inputTokens) => ({ condition, durationMs: 5,
    evidence: { usage: { inputTokens, outputTokens: 2 }, knownCompletedCommands: 1, knownCompletedToolItems: 1,
      toolCountCoverage: "partial", entryFullyObserved: true,
      reads: [{ file: "skills/scd-quickdev/SKILL.md", fullContentObserved: true }] },
    scored: { verdict: "PASS", metrics: { userInterruptRequests: null }, facts: { completionDeclaration: { state: "unknown" } } },
  });
  const summary = summarize([row("baseline", 100), row("baseline", 150), row("candidate", 50), row("candidate", null)], { baseline: identity, candidate: identity });
  assert.deepEqual(summary.baseline.tokens.inputTokens, { total: 250, known: 2 });
  assert.deepEqual(summary.candidate.tokens.inputTokens, { total: null, known: 1 });
  assert.equal(summary.candidate.tokens.cachedInputTokens.total, null);
  assert.equal(summary.candidate.costUsd, null);
  assert.equal(summary.candidate.userInputUnknownSamples, 2);
  assert.equal(summary.candidate.completionDeclarationUnknownSamples, 2);
  assert.equal(summary.candidate.toolCoveragePartialSamples, 2);
  assert.equal(summary.candidate.entryFullReadSamples, 2);
});
