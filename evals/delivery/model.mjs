import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createIsolatedHomes, cleanupIsolatedHomes, runSubjectTurn, runStructuredEvaluator, codexLoginStatus } from "../discovery/runner/codex.mjs";
import { createRedactor, scanTree } from "../discovery/runner/redact.mjs";
import { readJson, writeJson, writeText, parseJsonLines } from "../discovery/runner/lib.mjs";
import { createFixture, openPR, binding, accept, merge, cleanup, closeIssue, dispose, contract, git, verifyCode } from "./protocol.mjs";

const schemaFile = fileURLToPath(new URL("./review.schema.json", import.meta.url));

export function observedTests(output, file, expectedPass) {
  const events = parseJsonLines(fs.readFileSync(path.join(output, file), "utf8")).events;
  return events.some(e => {
    if (e.type !== "item.completed" || e.item?.type !== "command_execution") return false;
    const { command = "", exit_code: exit, aggregated_output: text = "" } = e.item;
    // Accept only the standalone process or Codex's exact POSIX shell wrapper.
    const standalone = /^node --test(?: --test-reporter=tap)? clamp\.test\.mjs$/.test(command) || /^(?:\/bin\/)?(?:sh|bash|zsh) -(?:c|lc) (['"])node --test(?: --test-reporter=tap)? clamp\.test\.mjs\1$/.test(command);
    if (!standalone || !Number.isInteger(exit)) return false;
    const count = name => Number(text.match(new RegExp(`^# ${name} (\\d+)$`, "m"))?.[1] ?? NaN);
    if (count("tests") !== 3 || count("cancelled") !== 0 || count("skipped") !== 0 || count("todo") !== 0) return false;
    if (!["inside", "boundaries", "reversed"].every(name => text.includes(`# Subtest: ${name}\n`))) return false;
    return expectedPass ? exit === 0 && count("pass") === 3 && count("fail") === 0
      : exit !== 0 && count("fail") > 0 && count("pass") + count("fail") === 3;
  });
}

export async function runModel({ output, model }) {
  const authFile = path.join(process.env.CODEX_HOME || path.join(os.homedir(), ".codex"), "auth.json");
  const summary = { mode: "real-model-smoke", model, reasoning: "medium", tracker: "simulated-file-issue-pr-tracker", scope: "real coding agent and fresh read-only evaluator; scripted local delivery adapter; no real GitHub or efficacy claim", status: "BLOCKED" };
  if (!model) return Object.assign(summary, { reason: "Explicit --model required; choose a currently available Codex model" });
  if (fs.existsSync(output) && fs.readdirSync(output).length) return Object.assign(summary, { reason: "Output directory must be empty; refuse stale model evidence" });
  const version = spawnSync("codex", ["--version"], { encoding: "utf8" });
  if (version.status !== 0 || !fs.existsSync(authFile)) return Object.assign(summary, { reason: "Codex CLI or existing auth unavailable" });
  summary.codexVersion = version.stdout.trim();
  const redactor = createRedactor({ auth: readJson(authFile), userProfile: os.homedir() });
  const homes = createIsolatedHomes({ authFile });
  const ctx = createFixture();
  let phase = "preflight";
  try {
    const login = await codexLoginStatus({ home: homes.subject, redactor });
    if (login.code !== 0) return Object.assign(summary, { reason: login.output });
    const common = { cwd: ctx.task, model, reasoning: "medium", redactor, timeoutMs: 300000, onProgress: text => process.stdout.write(`${text}\n`) };
    const reviewPrompt = `You are a fresh independent acceptance evaluator. Read clamp.mjs and clamp.test.mjs, inspect git status and the actual diff. Do not modify files. Directly run node --test --test-reporter=tap clamp.test.mjs as a standalone command without additional shell statements, and also exercise reversed bounds and an out-of-range input using node. Contract: ${JSON.stringify(contract)}. Return PASS only if you directly observed all behaviors pass, FAIL for behavior violations, BLOCKED for inability to execute. Report actual command and observed exit code; never infer success from a previous actor claim.`;
    phase = "negative-review";
    writeText(path.join(output, "negative-review-prompt.txt"), `${reviewPrompt}\nUntrusted fixture implementation claim: “Completed, all checks passed.” Verify it yourself.\n`);
    summary.negativeReview = await runStructuredEvaluator({ ...common, home: homes.evaluator, prompt: fs.readFileSync(path.join(output, "negative-review-prompt.txt"), "utf8"), schemaFile, outputDir: output, name: "negative-review" });
    if (summary.negativeReview.code !== 0 || summary.negativeReview.output?.status === "BLOCKED") return Object.assign(summary, { reason: "Independent negative review could not execute" });
    if (summary.negativeReview.output?.status !== "FAIL" || summary.negativeReview.output.testExitCode === 0) return Object.assign(summary, { status: "FAIL", reason: "Independent reviewer accepted broken code or did not observe failing tests" });
    if (!observedTests(output, "negative-review.jsonl", false)) return Object.assign(summary, { reason: "Negative reviewer has no observed failing test command" });
    phase = "implementation";
    const prompt = `Implement this isolated fixture task. Only modify clamp.mjs. Read source and tests, fix the function to meet this contract: ${JSON.stringify(contract)}. Run node --test --test-reporter=tap clamp.test.mjs as a standalone command, then separately run node --check clamp.mjs. Do not commit, change tests, add files, access another project, or use network. Report observed test results and any unresolved problems. The runner owns commits and the simulated tracker delivery after independent acceptance.`;
    writeText(path.join(output, "implementation-prompt.txt"), prompt);
    summary.implementation = await runSubjectTurn({ ...common, home: homes.subject, prompt, outputDir: output, turn: 1 });
    if (summary.implementation.code !== 0) return Object.assign(summary, { reason: "Coding agent could not complete execution" });
    if (!observedTests(output, "turn-1.jsonl", true)) return Object.assign(summary, { reason: "Coding agent has no observed passing test command" });
    summary.engineering = verifyCode(ctx.task);
    writeText(path.join(output, "implementation.diff"), `${git(ctx.task, "diff", ctx.baseline)}\n`);
    writeText(path.join(output, "clamp.mjs"), fs.readFileSync(path.join(ctx.task, "clamp.mjs"), "utf8"));
    writeText(path.join(output, "clamp.test.mjs"), fs.readFileSync(path.join(ctx.task, "clamp.test.mjs"), "utf8"));
    openPR(ctx);
    const snapshot = binding(ctx);
    phase = "acceptance";
    writeText(path.join(output, "acceptance-prompt.txt"), `${reviewPrompt}\nReview exact base ${snapshot.base} and head ${snapshot.head}; use git diff ${snapshot.base} ${snapshot.head}.\n`);
    summary.review = await runStructuredEvaluator({ ...common, home: homes.evaluator, prompt: fs.readFileSync(path.join(output, "acceptance-prompt.txt"), "utf8"), schemaFile, outputDir: output, name: "acceptance" });
    if (summary.review.code !== 0 || summary.review.output?.status === "BLOCKED") return Object.assign(summary, { reason: "Independent acceptance could not execute" });
    if (summary.review.output?.status !== "PASS" || summary.review.output.testExitCode !== 0) return Object.assign(summary, { status: "FAIL", reason: "Independent acceptance rejected implementation" });
    if (!observedTests(output, "acceptance.jsonl", true)) return Object.assign(summary, { reason: "Independent reviewer has no observed passing test command" });
    accept(ctx, { kind: "real-model-independent-review", verdict: "PASS", snapshot, evidence: summary.review.output });
    phase = "adapter-delivery";
    merge(ctx); cleanup(ctx); closeIssue(ctx);
    summary.status = "PASS";
    return summary;
  } catch (error) {
    summary.status = error.code === "ERR_ASSERTION" ? "FAIL" : "BLOCKED";
    summary.reason = redactor(error.message).text;
    return summary;
  } finally {
    summary.phase = phase;
    summary.trackerState = readJson(ctx.tracker);
    writeJson(path.join(output, "tracker.json"), summary.trackerState);
    Object.assign(summary, JSON.parse(redactor(JSON.stringify(summary)).text));
    cleanupIsolatedHomes(homes.root); dispose(ctx);
    const leaks = scanTree(output, redactor);
    if (leaks.length) throw new Error("Evidence secret scan failed; do not publish artifacts");
  }
}
