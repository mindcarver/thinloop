import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import { readJson, writeJson, sha256 } from "../discovery/runner/lib.mjs";
import { createFixture, implement, openPR, accept, merge, cleanup, closeIssue, dispose, git, event, update } from "./protocol.mjs";

const file = fileURLToPath(import.meta.url);
function prepared() { const ctx = createFixture(); implement(ctx); openPR(ctx); accept(ctx); return ctx; }
function done(ctx) { merge(ctx); cleanup(ctx); closeIssue(ctx); }
export async function runProtocol() {
  const results = [];
  for (const name of ["happy-path", "changed-head", "changed-contract", "sibling-base", "merge-error-after-success", "cleanup-before-close", "interruption-new-process"]) {
    const ctx = name === "interruption-new-process" ? createFixture() : prepared();
    try {
      if (name === "happy-path") done(ctx);
      if (name === "changed-head") {
        git(ctx.task, "commit", "--allow-empty", "-m", "change head after acceptance");
        assert.throws(() => merge(ctx), /stale acceptance/); event(ctx, "stale-head-rejected");
        git(ctx.task, "push", "origin", ctx.branch); accept(ctx); done(ctx);
      }
      if (name === "changed-contract") {
        update(ctx, s => { s.issue.contract.acceptance.push("review updated contract"); });
        assert.throws(() => merge(ctx), /stale acceptance/); event(ctx, "stale-contract-rejected");
        accept(ctx); done(ctx);
      }
      if (name === "sibling-base") {
        const sibling = path.join(ctx.root, "sibling");
        git(ctx.main, "worktree", "add", "-b", "codex/sibling", sibling);
        fs.writeFileSync(path.join(sibling, "sibling.txt"), "independent delivery\n");
        git(sibling, "add", "."); git(sibling, "commit", "-m", "sibling delivery");
        git(ctx.main, "merge", "--ff-only", "codex/sibling"); git(ctx.main, "push", "origin", "main");
        assert.throws(() => merge(ctx), /stale acceptance/); event(ctx, "stale-base-rejected");
        git(ctx.task, "rebase", "main"); git(ctx.task, "push", "--force-with-lease", "origin", ctx.branch); accept(ctx); done(ctx);
        assert.ok(fs.existsSync(sibling), "task cleanup must preserve sibling resources");
      }
      if (name === "merge-error-after-success") { merge(ctx, { reportedError: true }); cleanup(ctx); closeIssue(ctx); }
      if (name === "cleanup-before-close") {
        merge(ctx); assert.throws(() => closeIssue(ctx), /worktree remains/); event(ctx, "premature-close-rejected");
        fs.writeFileSync(path.join(ctx.task, "user-wip.txt"), "preserve\n");
        assert.throws(() => cleanup(ctx), /dirty task/); event(ctx, "dirty-cleanup-rejected");
        assert.equal(readJson(ctx.tracker).issue.state, "OPEN");
        fs.unlinkSync(path.join(ctx.task, "user-wip.txt")); cleanup(ctx); closeIssue(ctx);
      }
      if (name === "interruption-new-process") {
        const first = spawn(process.execPath, [file, "--checkpoint-worker", ctx.root], { stdio: ["ignore", "pipe", "pipe"] });
        let output = "";
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => { first.kill("SIGKILL"); reject(new Error("checkpoint timeout")); }, 15000);
          first.stdout.on("data", chunk => { output += chunk; if (output.includes("CHECKPOINT")) { clearTimeout(timeout); resolve(); } });
          first.on("error", reject); first.on("exit", code => { if (!output.includes("CHECKPOINT")) { clearTimeout(timeout); reject(new Error(`checkpoint worker exited ${code}`)); } });
        });
        const killed = once(first, "exit"); first.kill("SIGKILL"); const [code, signal] = await killed;
        assert.equal(code, null); assert.equal(signal, "SIGKILL");
        event(ctx, "process-killed", { workerPid: first.pid, signal });
        const second = spawn(process.execPath, [file, "--resume-worker", ctx.root], { stdio: ["ignore", "pipe", "pipe"] });
        let errors = ""; second.stderr.on("data", value => { errors += value; });
        const [exit] = await once(second, "exit"); assert.equal(exit, 0, errors); assert.notEqual(first.pid, second.pid);
      }
      const state = readJson(ctx.tracker);
      assert.equal(state.issue.state, "CLOSED");
      assert.ok(state.events.findIndex(e => e.type === "resources-cleaned") < state.events.findIndex(e => e.type === "issue-closed"));
      results.push({ name, status: "PASS", tracker: state });
    } finally { dispose(ctx); }
  }
  return { mode: "deterministic-protocol", tracker: "simulated-file-issue-pr-tracker", status: "PASS", cases: results };
}

async function main() {
  const args = process.argv.slice(2);
  if (args[0] === "--checkpoint-worker") {
    const ctx = readJson(path.join(args[1], "fixture.json"));
    implement(ctx); openPR(ctx); accept(ctx);
    writeJson(ctx.continuity, { next: "merge", head: git(ctx.task, "rev-parse", "HEAD") });
    event(ctx, "checkpoint-created"); process.stdout.write("CHECKPOINT\n");
    setInterval(() => {}, 1000); return;
  }
  if (args[0] === "--resume-worker") {
    const ctx = readJson(path.join(args[1], "fixture.json"));
    assert.equal(readJson(ctx.continuity).next, "merge");
    event(ctx, "new-process-resumed"); done(ctx); return;
  }
  const mode = args[args.indexOf("--mode") + 1] || "protocol";
  const output = path.resolve(args.includes("--output") ? args[args.indexOf("--output") + 1] : "work/evals/delivery");
  if (mode !== "protocol" && mode !== "model") throw new Error(`Unknown mode ${mode}`);
  if (mode === "model" && fs.existsSync(output) && fs.readdirSync(output).length) {
    process.stderr.write("BLOCKED model: output directory must be empty; previous evidence preserved\n");
    process.exitCode = 2; return;
  }
  const result = mode === "protocol" ? await runProtocol() : await (await import("./model.mjs")).runModel({ output, model: args.includes("--model") ? args[args.indexOf("--model") + 1] : undefined });
  writeJson(path.join(output, "summary.json"), result);
  const artifacts = fs.readdirSync(output).filter(name => name !== "evidence.sha256" && fs.statSync(path.join(output, name)).isFile()).sort();
  fs.writeFileSync(path.join(output, "evidence.sha256"), artifacts.map(name => `${sha256(fs.readFileSync(path.join(output, name)))}  ${name}\n`).join(""));
  process.stdout.write(`${result.status} ${mode}; evidence: ${output}\n`);
  if (result.status !== "PASS") process.exitCode = result.status === "BLOCKED" ? 2 : 1;
}
if (process.argv[1] && path.resolve(process.argv[1]) === file) main().catch(error => { console.error(error); process.exitCode = 1; });
