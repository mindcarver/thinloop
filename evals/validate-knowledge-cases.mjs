import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const evalDir = path.dirname(fileURLToPath(import.meta.url));
const cases = JSON.parse(
  fs.readFileSync(path.join(evalDir, "knowledge-cases.json"), "utf8"),
);

assert.equal(cases.length, 12, "expected exactly 12 knowledge cases");
assert.equal(new Set(cases.map(({ id }) => id)).size, 12, "case IDs must be unique");

const expectedGroups = {
  routing: 2,
  capture: 4,
  retrieve: 2,
  lifecycle: 2,
  safety: 1,
  failure: 1,
};

for (const [group, expectedCount] of Object.entries(expectedGroups)) {
  assert.equal(
    cases.filter((testCase) => testCase.group === group).length,
    expectedCount,
    `${group} must contain ${expectedCount} cases`,
  );
}

const allowedActions = new Set([
  "do-not-invoke",
  "propose-project",
  "propose-cross-project",
  "reject-unsupported",
  "retrieve",
  "retrieve-with-archive",
  "skip-duplicate",
  "request-conflict-decision",
  "block-secret",
  "block-write",
]);

for (const testCase of cases) {
  assert.ok(testCase.prompt.trim(), `${testCase.id} must have a prompt`);
  assert.ok(
    allowedActions.has(testCase.expectedAction),
    `${testCase.id} has an invalid expected action`,
  );
}

process.stdout.write("PASS knowledge evaluation case schema\n");
