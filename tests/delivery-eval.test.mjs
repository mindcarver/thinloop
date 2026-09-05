import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { runModel, observedTests } from "../evals/delivery/model.mjs";
import { runProtocol } from "../evals/delivery/run.mjs";
import { createFixture, dispose, implement, openPR, accept, binding, merge, update, git, fixtureTests } from "../evals/delivery/protocol.mjs";

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
    assert.match(c.tracker.acceptance.evidence.stdout, /^# tests 3$/m);
    assert.match(c.tracker.acceptance.evidence.stdout, /^# pass 3$/m);
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
    assert.throws(() => accept(ctx), /dirty acceptance workspace|fail|ERR_ASSERTION|Expected/);
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
    assert.equal(observedTests(output, "review.jsonl", false), false);
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


test("delivery rejects staged and committed out-of-scope changes before publishing", () => {
  for (const mutation of ["staged-extra", "staged-extra-deleted", "committed-extra", "staged-tests", "staged-tests-restored"]) {
    const ctx = createFixture();
    try {
      implement(ctx);
      const file = mutation.includes("tests") ? "clamp.test.mjs" : "out-of-scope.txt";
      fs.writeFileSync(path.join(ctx.task, file), "// unauthorized\n");
      git(ctx.task, "add", file);
      if (mutation === "staged-extra-deleted") fs.unlinkSync(path.join(ctx.task, file));
      if (mutation === "staged-tests-restored") fs.writeFileSync(path.join(ctx.task, file), fixtureTests);
      if (mutation === "committed-extra") git(ctx.task, "commit", "-m", "unauthorized actor commit");
      assert.throws(() => openPR(ctx), /only change fixture scope/);
      assert.equal(JSON.parse(fs.readFileSync(ctx.tracker)).issue.state, "OPEN");
      assert.equal(git(ctx.main, "ls-remote", "origin", `refs/heads/${ctx.branch}`), "");
    } finally { dispose(ctx); }
  }
});

test("acceptance rechecks final diff and runs immutable direct behavior checks", () => {
  for (const mutation of ["committed-tests", "false-pass-evidence"]) {
    const ctx = createFixture();
    try {
      implement(ctx);
      if (mutation === "false-pass-evidence") fs.writeFileSync(path.join(ctx.task, "clamp.mjs"), "export const clamp = () => -999;\n");
      openPR(ctx);
      if (mutation === "committed-tests") {
        fs.writeFileSync(path.join(ctx.task, "clamp.test.mjs"), "// removed tests\n");
        git(ctx.task, "add", "."); git(ctx.task, "commit", "-m", "tamper after PR"); git(ctx.task, "push", "origin", ctx.branch);
      }
      assert.throws(() => accept(ctx, { evidence: { claimed: "all tests passed" } }), /fixture scope|independent fixture behavior check/);
      assert.equal(JSON.parse(fs.readFileSync(ctx.tracker)).acceptance, undefined);
    } finally { dispose(ctx); }
  }
});

test("actual command output rejects mentions and masked failures, and accepts standalone tests", () => {
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  const ctx = createFixture();
  try {
    const trace = (command, result) => {
      fs.writeFileSync(path.join(ctx.root, "trace.jsonl"), JSON.stringify({ type: "item.completed", item: { type: "command_execution", command, exit_code: result.status, aggregated_output: result.stdout + result.stderr } }));
      return observedTests(ctx.root, "trace.jsonl", true);
    };
    for (const command of ["printf '%s\\n' 'node --test clamp.test.mjs'", "node --test clamp.test.mjs; true", "# node --test clamp.test.mjs\ntrue"]) {
      const result = spawnSync("/bin/sh", ["-c", command], { cwd: ctx.task, encoding: "utf8", env });
      assert.equal(result.status, 0);
      assert.equal(trace(command, result), false);
    }
    const bad = spawnSync("node", ["--test", "--test-reporter=tap", "clamp.test.mjs"], { cwd: ctx.task, encoding: "utf8", env });
    assert.equal(trace("node --test --test-reporter=tap clamp.test.mjs", bad), false);
    assert.equal(observedTests(ctx.root, "trace.jsonl", false), true, bad.stdout + bad.stderr);
    implement(ctx);
    const good = spawnSync("node", ["--test", "--test-reporter=tap", "clamp.test.mjs"], { cwd: ctx.task, encoding: "utf8", env });
    assert.equal(trace("/bin/zsh -lc 'node --test --test-reporter=tap clamp.test.mjs'", good), true);
    assert.equal(trace("node --test --test-reporter=tap clamp.test.mjs", { ...good, stdout: good.stdout.replace("# tests 3", "# tests 1") }), false);
  } finally { dispose(ctx); }
});


test("independent behavior oracle rejects replaced assertions and premature successful exit", () => {
  for (const source of [
    "import assert from 'node:assert/strict'; assert.equal = () => {}; assert.throws = () => {}; export const clamp = () => -999;\n",
    "process.exit(0); export const clamp = () => -999;\n",
  ]) {
    const ctx = createFixture();
    try {
      fs.writeFileSync(path.join(ctx.task, "clamp.mjs"), source);
      openPR(ctx);
      assert.throws(() => accept(ctx), /independent fixture behavior check failed or exited before completion/);
      const state = JSON.parse(fs.readFileSync(ctx.tracker));
      assert.equal(state.acceptance, undefined);
      assert.equal(state.issue.state, "OPEN");
      assert.equal(state.pr.state, "OPEN");
      assert.equal(git(ctx.main, "ls-remote", "origin", "refs/heads/main").split(/\s/)[0], ctx.baseline);
    } finally { dispose(ctx); }
  }
});
