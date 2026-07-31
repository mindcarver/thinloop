import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const evalDir = path.dirname(fileURLToPath(import.meta.url));
const cases = JSON.parse(
  fs.readFileSync(path.join(evalDir, "knowledge-cases.json"), "utf8"),
);

assert.equal(cases.length, 22, "expected exactly 22 knowledge cases");
assert.equal(
  new Set(cases.map(({ id }) => id)).size,
  cases.length,
  "case IDs must be unique",
);

const expectedGroups = {
  routing: 2,
  capture: 4,
  retrieve: 2,
  lifecycle: 4,
  safety: 1,
  failure: 1,
  eligibility: 4,
  factual: 2,
  post_delivery: 2,
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
  "reject-ineligible",
  "reject-false-claim",
  "report-stale",
  "keep-separate",
  "no-forced-update",
  "propose-candidates",
]);

for (const testCase of cases) {
  assert.ok(testCase.prompt.trim(), `${testCase.id} must have a prompt`);
  assert.ok(
    allowedActions.has(testCase.expectedAction),
    `${testCase.id} has an invalid expected action`,
  );
}

process.stdout.write("PASS knowledge evaluation case schema\n");
