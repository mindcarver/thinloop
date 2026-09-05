import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { sha256, readJson, writeJson } from "../discovery/runner/lib.mjs";

export function git(cwd, ...args) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8", env: { ...process.env, GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: os.devNull } });
  if (result.status !== 0) throw new Error(`git ${args.join(" ")}: ${result.stderr}`);
  return result.stdout.trim();
}
export const contract = { id: "fixture-issue-1", acceptance: ["clamp inside range is unchanged", "clamp outside range uses nearest boundary", "reversed bounds throw RangeError"], scope: ["clamp.mjs"] };
export const fixtureTests = `import assert from 'node:assert/strict';
import test from 'node:test';
import { clamp } from './clamp.mjs';
test('inside', () => assert.equal(clamp(5, 0, 10), 5));
test('boundaries', () => { assert.equal(clamp(-3, 0, 10), 0); assert.equal(clamp(20, 0, 10), 10); assert.equal(clamp(2, 2, 2), 2); });
test('reversed', () => assert.throws(() => clamp(1, 9, 2), RangeError));
`;
export function createFixture() {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), "thinloop-delivery-"));
  const ctx = { root, remote: path.join(root, "remote.git"), main: path.join(root, "main"), task: path.join(root, "task"), tracker: path.join(root, "tracker.json"), continuity: path.join(root, "continuity.json"), branch: "codex/fixture-1" };
  fs.mkdirSync(ctx.main);
  git(root, "init", "--bare", "--initial-branch=main", ctx.remote);
  git(ctx.main, "init", "--initial-branch=main");
  git(ctx.main, "config", "user.name", "Delivery Fixture");
  git(ctx.main, "config", "user.email", "fixture@example.invalid");
  fs.writeFileSync(path.join(ctx.main, "clamp.mjs"), "export function clamp(value, min, max) { return max; }\n");
  fs.writeFileSync(path.join(ctx.main, "clamp.test.mjs"), fixtureTests);
  git(ctx.main, "add", "."); git(ctx.main, "commit", "-m", "fixture baseline");
  git(ctx.main, "remote", "add", "origin", ctx.remote); git(ctx.main, "push", "origin", "main");
  git(ctx.main, "worktree", "add", "-b", ctx.branch, ctx.task);
  writeJson(ctx.tracker, { adapter: "simulated-file-issue-pr-tracker", issue: { state: "OPEN", contract }, pr: { state: "NOT_CREATED" }, events: [] });
  writeJson(path.join(root, "fixture.json"), ctx);
  event(ctx, "issue-created", { contractHash: sha256(JSON.stringify(contract)) });
  return ctx;
}
export function event(ctx, type, data = {}) {
  const state = readJson(ctx.tracker);
  state.events.push({ sequence: state.events.length + 1, pid: process.pid, type, ...data });
  writeJson(ctx.tracker, state);
}
export function update(ctx, change) {
  const state = readJson(ctx.tracker); change(state); writeJson(ctx.tracker, state);
}
export function remoteHead(ctx) { return git(ctx.main, "ls-remote", "origin", "refs/heads/main").split(/\s/)[0]; }
export function binding(ctx) {
  return { base: remoteHead(ctx), head: git(ctx.main, "rev-parse", ctx.branch), contractHash: sha256(JSON.stringify(readJson(ctx.tracker).issue.contract)) };
}
export function implement(ctx) {
  fs.writeFileSync(path.join(ctx.task, "clamp.mjs"), "export function clamp(value, min, max) {\n  if (min > max) throw new RangeError('reversed bounds');\n  return Math.min(max, Math.max(min, value));\n}\n");
}
export function verifyCode(cwd) {
  const result = spawnSync(process.execPath, ["--test", "clamp.test.mjs"], { cwd, encoding: "utf8" });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return { command: "node --test clamp.test.mjs", exitCode: result.status, stdout: result.stdout };
}
export function openPR(ctx) {
  const changed = git(ctx.task, "diff", "--name-only").split("\n");
  assert.deepEqual(changed, ["clamp.mjs"], "implementation must only change fixture scope");
  assert.equal(git(ctx.task, "ls-files", "--others", "--exclude-standard"), "", "unexpected implementation files");
  git(ctx.task, "add", "clamp.mjs"); git(ctx.task, "commit", "-m", "fix clamp boundaries"); git(ctx.task, "push", "origin", ctx.branch);
  update(ctx, (s) => { s.pr = { state: "OPEN", ...binding(ctx) }; });
  event(ctx, "pr-created", binding(ctx));
}
export function accept(ctx, { kind = "deterministic-protocol-check", verdict = "PASS", evidence = verifyCode(ctx.task), snapshot = binding(ctx) } = {}) {
  assert.deepEqual(snapshot, binding(ctx), "code or contract changed during acceptance");
  assert.equal(git(ctx.task, "status", "--porcelain"), "", "dirty acceptance workspace");
  assert.equal(git(ctx.main, "ls-remote", "origin", `refs/heads/${ctx.branch}`).split(/\s/)[0], snapshot.head, "unpublished PR head");
  const record = { ...snapshot, verdict, kind, evidence };
  update(ctx, (s) => { s.acceptance = record; Object.assign(s.pr, snapshot); });
  event(ctx, "acceptance-recorded", record);
}
export function assertAccepted(ctx) {
  const s = readJson(ctx.tracker);
  assert.equal(s.acceptance?.verdict, "PASS", "missing passing acceptance");
  assert.deepEqual({ base: s.acceptance.base, head: s.acceptance.head, contractHash: s.acceptance.contractHash }, binding(ctx), "stale acceptance: base/head/contract changed");
  assert.equal(git(ctx.task, "status", "--porcelain"), "", "dirty merge workspace");
  assert.equal(git(ctx.main, "ls-remote", "origin", `refs/heads/${ctx.branch}`).split(/\s/)[0], s.acceptance.head, "remote PR head changed");
}
export function merge(ctx, { reportedError = false } = {}) {
  assertAccepted(ctx);
  const head = binding(ctx).head;
  git(ctx.main, "fetch", "origin");
  git(ctx.main, "merge", "--ff-only", "origin/main");
  git(ctx.main, "merge", "--ff-only", ctx.branch);
  // The subprocess really pushes, then optionally exits nonzero as a lost response.
  const command = spawnSync(process.execPath, ["-e", "require('node:child_process').execFileSync('git',['push','origin','main']); process.exit(Number(process.argv[1]));", reportedError ? "1" : "0"], { cwd: ctx.main, encoding: "utf8" });
  event(ctx, "merge-command-result", { exitCode: command.status });
  const observed = remoteHead(ctx);
  assert.equal(observed, head, "remote does not contain accepted merge");
  update(ctx, (s) => { s.pr.state = "MERGED"; s.pr.mergeCommit = observed; s.pr.head = head; });
  event(ctx, "remote-merge-observed", { head: observed });
}
export function cleanup(ctx) {
  const s = readJson(ctx.tracker);
  assert.equal(s.pr.state, "MERGED");
  assert.equal(remoteHead(ctx), s.pr.mergeCommit);
  git(ctx.main, "fetch", "origin"); git(ctx.main, "merge", "--ff-only", "origin/main");
  verifyCode(ctx.main);
  if (fs.existsSync(ctx.task)) {
    assert.equal(git(ctx.task, "status", "--porcelain"), "", "dirty task cannot be cleaned");
    git(ctx.main, "worktree", "remove", ctx.task);
  }
  const branches = git(ctx.main, "for-each-ref", "--format=%(refname)", `refs/heads/${ctx.branch}`);
  if (branches) git(ctx.main, "branch", "-d", ctx.branch);
  if (git(ctx.main, "ls-remote", "origin", `refs/heads/${ctx.branch}`)) git(ctx.main, "push", "origin", "--delete", ctx.branch);
  fs.rmSync(ctx.continuity, { force: true });
  event(ctx, "resources-cleaned");
}
export function closeIssue(ctx) {
  const s = readJson(ctx.tracker);
  assert.equal(s.pr.state, "MERGED");
  assert.equal(s.acceptance?.verdict, "PASS");
  assert.equal(s.pr.head, s.acceptance.head);
  assert.equal(s.pr.mergeCommit, s.acceptance.head, "fast-forward merge must equal accepted head");
  assert.equal(s.acceptance.contractHash, sha256(JSON.stringify(s.issue.contract)));
  assert.equal(remoteHead(ctx), s.pr.mergeCommit);
  assert.equal(git(ctx.main, "rev-parse", "main"), remoteHead(ctx));
  assert.equal(git(ctx.main, "status", "--porcelain"), "");
  assert.equal(fs.existsSync(ctx.task), false, "worktree remains");
  assert.equal(git(ctx.main, "for-each-ref", "--format=%(refname)", `refs/heads/${ctx.branch}`), "", "local branch remains");
  assert.equal(git(ctx.main, "ls-remote", "origin", `refs/heads/${ctx.branch}`), "", "remote branch remains");
  assert.equal(fs.existsSync(ctx.continuity), false, "continuity remains");
  update(ctx, (state) => { state.issue.state = "CLOSED"; }); event(ctx, "issue-closed");
}
export function dispose(ctx) {
  assert.equal(path.dirname(ctx.root), fs.realpathSync(os.tmpdir()));
  assert.ok(path.basename(ctx.root).startsWith("thinloop-delivery-"));
  fs.rmSync(ctx.root, { recursive: true, force: true });
}
