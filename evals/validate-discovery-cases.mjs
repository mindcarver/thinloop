import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const evalDir = path.dirname(fileURLToPath(import.meta.url));
const cases = JSON.parse(
  fs.readFileSync(path.join(evalDir, "discovery-cases.json"), "utf8"),
);

assert.equal(cases.length, 12, "expected exactly 12 discovery cases");
assert.equal(new Set(cases.map(({ id }) => id)).size, 12, "case IDs must be unique");

const expectedGroups = {
  clear: 3,
  greenfield: 3,
  risk: 3,
  continuity: 3,
};

for (const [group, expectedCount] of Object.entries(expectedGroups)) {
  assert.equal(
    cases.filter((testCase) => testCase.group === group).length,
    expectedCount,
    `${group} must contain ${expectedCount} cases`,
  );
}

const allowedPaths = new Set(["direct", "discovery", "resume", "reapproval"]);
for (const testCase of cases) {
  assert.ok(testCase.prompt.trim(), `${testCase.id} must have a prompt`);
  assert.ok(
    allowedPaths.has(testCase.expectedPath),
    `${testCase.id} has an invalid expected path`,
  );
}

process.stdout.write("PASS discovery evaluation case schema\n");
