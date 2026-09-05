import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workflow = fs.readFileSync(
  path.join(root, ".github", "workflows", "ci.yml"),
  "utf8",
);

test("Thinloop CI keeps one stable pull-request check with bounded permissions", () => {
  assert.match(workflow, /^name: Thinloop CI$/m);
  assert.match(workflow, /^  pull_request:$/m);
  assert.match(workflow, /^  push:\n    branches:\n      - main$/m);
  assert.match(workflow, /^  contents: read$/m);
  assert.doesNotMatch(workflow, /^\s+[\w-]+: write$/m);
  assert.match(workflow, /^  verify:$/m);
  assert.match(workflow, /^    name: Thinloop CI$/m);
  assert.match(workflow, /^    runs-on: ubuntu-latest$/m);
  assert.match(workflow, /^    timeout-minutes: 10$/m);
  assert.match(workflow, /uses: actions\/checkout@v7/);
  assert.match(workflow, /fetch-depth: 0/);
  assert.match(workflow, /uses: actions\/setup-node@v7/);
  assert.match(workflow, /node-version: "22"/);
  assert.match(workflow, /package-manager-cache: false/);
});

test("Thinloop CI runs every deterministic repository gate", () => {
  const commands = [
    "node scripts/check-version.mjs",
    "node --test tests/*.test.mjs",
    "node scripts/sync-routing-kernel.mjs --check",
    "node evals/validate-discovery-cases.mjs",
    "node evals/validate-knowledge-cases.mjs",
    "node evals/knowledge/validate.mjs",
    "node evals/knowledge/runner/run.mjs --mode dry",
    "node scripts/generate-readme-diagrams.mjs --check",
    "node evals/delivery/run.mjs --mode protocol",
    "npm exec --yes --package=@anthropic-ai/claude-code@2.1.197 -- claude plugin validate . --strict",
  ];

  for (const command of commands) {
    assert.ok(workflow.includes(command), command);
  }
});
