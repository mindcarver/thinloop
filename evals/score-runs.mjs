import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const evalDir = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(evalDir, "..");
const workspaceRoot = pluginRoot;
const runRoot = path.join(workspaceRoot, "work", "scd-dev-loop-evals", "runs");
const hookPath = path.join(pluginRoot, "hooks", "check-state.mjs");
const cases = JSON.parse(
  fs.readFileSync(path.join(evalDir, "cases.json"), "utf8"),
);

function spawn(command, args, cwd, input) {
  return spawnSync(command, args, {
    cwd,
    input,
    encoding: "utf8",
    timeout: 30_000,
  });
}

const results = [];
for (const testCase of cases) {
  for (const condition of ["baseline", "with-skill"]) {
    const repo = path.join(runRoot, testCase.id, condition);
    const hidden = spawn(
      process.execPath,
      [path.join(evalDir, "hidden-check.mjs"), testCase.id, repo],
      repo,
    );
    const tests =
      process.platform === "win32"
        ? spawn(
            process.env.ComSpec ?? "cmd.exe",
            ["/d", "/s", "/c", "npm test -- --test-reporter=spec"],
            repo,
          )
        : spawn("npm", ["test", "--", "--test-reporter=spec"], repo);
    const hook = spawn(
      process.execPath,
      [hookPath],
      repo,
      JSON.stringify({ cwd: repo, hook_event_name: "Stop" }),
    );
    const diff = spawn("git", ["status", "--short"], repo);
    const commits = spawn("git", ["rev-list", "--count", "HEAD"], repo);

    let hookDecision = "allow";
    if (hook.stdout.trim()) {
      try {
        hookDecision = JSON.parse(hook.stdout).continue === false ? "block" : "warn";
      } catch {
        hookDecision = "invalid-output";
      }
    }

    results.push({
      id: testCase.id,
      group: testCase.group,
      condition,
      hiddenPass: hidden.status === 0,
      repositoryTestsPass: tests.status === 0,
      hookDecision,
      stateExists: fs.existsSync(path.join(repo, ".ai", "tasks", "current.md")),
      commitCount: Number.parseInt(commits.stdout.trim(), 10),
      changed: diff.stdout.trim().split(/\r?\n/).filter(Boolean),
      hiddenOutput: `${hidden.stdout}${hidden.stderr}`.trim(),
      testOutput: `${tests.stdout}${tests.stderr}`.trim().slice(-1200),
    });
  }
}

const outputPath = path.join(workspaceRoot, "work", "scd-dev-loop-evals", "objective-results.json");
fs.writeFileSync(outputPath, `${JSON.stringify(results, null, 2)}\n`, "utf8");
process.stdout.write(`${outputPath}\n`);
