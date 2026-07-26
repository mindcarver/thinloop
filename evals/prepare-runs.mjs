import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const evalDir = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(evalDir, "..");
const workspaceRoot = pluginRoot;
const runRoot = path.join(workspaceRoot, "work", "scd-dev-loop-evals", "runs");
const fixtureDir = path.join(evalDir, "fixture");
const cases = JSON.parse(
  fs.readFileSync(path.join(evalDir, "cases.json"), "utf8"),
);

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed in ${cwd}\n${result.stdout}\n${result.stderr}`,
    );
  }
}

function replace(file, from, to) {
  const content = fs.readFileSync(file, "utf8");
  if (!content.includes(from)) {
    throw new Error(`Expected text not found in ${file}: ${from}`);
  }
  fs.writeFileSync(file, content.replace(from, to), "utf8");
}

function committedSetup(caseId, repo) {
  if (caseId === "07-broken-check") {
    replace(
      path.join(repo, "package.json"),
      '"test": "node --test"',
      '"test": "deskboard-check"',
    );
  }

  if (caseId === "08-baseline-failure") {
    fs.writeFileSync(
      path.join(repo, "test", "legacy-baseline.test.mjs"),
      [
        'import assert from "node:assert/strict";',
        'import test from "node:test";',
        'import { legacyDisplayName } from "../src/legacy.mjs";',
        "",
        'test("legacy title casing", () => {',
        '  assert.equal(legacyDisplayName("mixed"), "Mixed");',
        "});",
        "",
      ].join("\n"),
      "utf8",
    );
  }
}

function dirtySetup(caseId, repo) {
  if (caseId === "06-dirty-tags") {
    fs.appendFileSync(
      path.join(repo, "README.md"),
      "\n> USER NOTE: Keep the import pipeline compatible with uppercase source tags.\n",
      "utf8",
    );
  }

  if (caseId === "10-resume-csv-export") {
    const stateDir = path.join(repo, ".scd", "tasks");
    fs.mkdirSync(stateDir, { recursive: true });
    fs.writeFileSync(
      path.join(stateDir, "current.md"),
      [
        "---",
        "managed_by: scd-dev-loop",
        "status: active",
        "updated_at: 2026-07-26T10:00:00+08:00",
        "---",
        "",
        "# Current task",
        "",
        "## Outcome",
        "",
        "serializeIssuesCsv returns RFC4180-style CSV for issue records.",
        "",
        "## Boundaries",
        "",
        "- In: serialize id, title, and priority with quote escaping",
        "- Out: file I/O and service integration",
        "",
        "## Acceptance",
        "",
        "- [ ] Multiple issues serialize one row each",
        "- [ ] Commas and quotes in titles are escaped",
        "",
        "## Decisions",
        "",
        "- Keep the existing three-column header",
        "",
        "## Evidence",
        "",
        "- Header implementation exists; row behavior is not tested yet.",
        "",
        "## Next action",
        "",
        "Implement row serialization and add focused tests.",
        "",
      ].join("\n"),
      "utf8",
    );
  }
}

fs.rmSync(runRoot, { recursive: true, force: true });
fs.mkdirSync(runRoot, { recursive: true });

for (const testCase of cases) {
  for (const condition of ["baseline", "with-skill"]) {
    const repo = path.join(runRoot, testCase.id, condition);
    fs.cpSync(fixtureDir, repo, { recursive: true });
    committedSetup(testCase.id, repo);

    run("git", ["init", "-q"], repo);
    run("git", ["config", "user.name", "SCD Dev Loop Eval"], repo);
    run("git", ["config", "user.email", "scd-dev-loop-eval@example.invalid"], repo);
    run("git", ["add", "."], repo);
    run("git", ["commit", "-q", "-m", "fixture baseline"], repo);

    dirtySetup(testCase.id, repo);
  }
}

process.stdout.write(
  `${JSON.stringify({ runRoot, cases: cases.length, runs: cases.length * 2 }, null, 2)}\n`,
);
