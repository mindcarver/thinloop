import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { runModel, observedTests } from "../evals/delivery/model.mjs";
import { runProtocol } from "../evals/delivery/run.mjs";
import { createFixture, dispose, implement, openPR, accept, binding, merge, update } from "../evals/delivery/protocol.mjs";

test("delivery protocol observes real Git and rejects faults before completing", { timeout: 60000 }, async () => {
  const result = await runProtocol();
  assert.equal(result.status, "PASS");
  assert.equal(result.tracker, "simulated-file-issue-pr-tracker");
  assert.equal(result.cases.length, 7);
  const events = name => result.cases.find(c => c.name === name).tracker.events;
  for (const [name, type] of [["changed-head", "stale-head-rejected"], ["changed-contract", "stale-contract-rejected"], ["sibling-base", "stale-base-rejected"], ["cleanup-before-close", "premature-close-rejected"], ["cleanup-before-close", "dirty-cleanup-rejected"]]) {
    assert.ok(events(name).some(e => e.type === type), `${name}: ${type}`);
  }
  const lostResponse = events("merge-error-after-success");
  assert.equal(lostResponse.find(e => e.type === "merge-command-result").exitCode, 1);
  assert.ok(lostResponse.some(e => e.type === "remote-merge-observed"));
  const interrupted = events("interruption-new-process");
  const killed = interrupted.find(e => e.type === "process-killed");
  assert.equal(killed.signal, "SIGKILL");
  assert.equal(interrupted.find(e => e.type === "checkpoint-created").pid, killed.workerPid);
  assert.notEqual(interrupted.find(e => e.type === "new-process-resumed").pid, killed.workerPid);
  for (const c of result.cases) {
    assert.equal(c.tracker.issue.state, "CLOSED");
    assert.equal(c.tracker.pr.head, c.tracker.acceptance.head);
    assert.equal(c.tracker.acceptance.kind, "deterministic-protocol-check");
  }
});

test("delivery rejects unknown/failed acceptance and drift during review", () => {
  const ctx = createFixture();
  try {
    implement(ctx); openPR(ctx);
    assert.throws(() => merge(ctx), /missing passing acceptance/);
    for (const verdict of ["FAIL", "BLOCKED"]) {
      accept(ctx, { verdict }); assert.throws(() => merge(ctx), /missing passing acceptance/);
    }
    const snapshot = binding(ctx);
    update(ctx, s => { s.issue.contract.acceptance.push("new requirement"); });
    assert.throws(() => accept(ctx, { snapshot }), /changed during acceptance/);
    fs.writeFileSync(path.join(ctx.task, "clamp.mjs"), "export const clamp = () => 123;\n");
    assert.throws(() => accept(ctx), /fail|ERR_ASSERTION|Expected/);
  } finally { dispose(ctx); }
});


test("model mode without an explicitly selected model is BLOCKED before auth or invocation", async () => {
  const result = await runModel({ output: "/unused-without-model" });
  assert.equal(result.status, "BLOCKED");
  assert.match(result.reason, /Explicit --model required/);
});


test("model evidence requires an executed test event, not a final success claim", () => {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), "delivery-telemetry-"));
  try {
    const file = path.join(output, "review.jsonl");
    fs.writeFileSync(file, JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: "PASS: tests passed" } }));
    assert.equal(observedTests(output, "review.jsonl", true), false);
    fs.writeFileSync(file, JSON.stringify({ type: "item.completed", item: { type: "command_execution", command: "node --test clamp.test.mjs", exit_code: 1 } }));
    assert.equal(observedTests(output, "review.jsonl", true), false);
    assert.equal(observedTests(output, "review.jsonl", false), true);
  } finally { fs.rmSync(output, { recursive: true }); }
});


test("model mode preserves a previous evidence directory", async () => {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), "delivery-old-evidence-"));
  try {
    fs.writeFileSync(path.join(output, "summary.json"), "previous evidence");
    const result = await runModel({ output, model: "must-not-be-invoked" });
    assert.equal(result.status, "BLOCKED");
    assert.match(result.reason, /stale model evidence/);
    assert.equal(fs.readFileSync(path.join(output, "summary.json"), "utf8"), "previous evidence");
  } finally { fs.rmSync(output, { recursive: true }); }
});
