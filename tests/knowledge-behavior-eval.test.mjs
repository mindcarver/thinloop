import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  loadCases,
  validateCases,
} from "../evals/knowledge/runner/cases.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("knowledge behavior cases cover benefit and protection", () => {
  const cases = loadCases();
  const validation = validateCases(cases);

  assert.deepEqual(validation.errors, []);
  assert.equal(validation.ok, true);
  assert.equal(cases.filter(({ category }) => category === "applicable").length, 3);
  assert.equal(cases.filter(({ category }) => category === "protective").length, 2);
  assert.deepEqual(
    new Set(cases.map(({ barrier }) => barrier)),
    new Set(["semantic", "location", "behavioral"]),
  );
});

test("knowledge behavior fixtures begin with passing public tests", async () => {
  for (const testCase of loadCases()) {
    const packageFile = path.join(
      root,
      "evals",
      "knowledge",
      "fixtures",
      testCase.fixture,
      "package.json",
    );
    assert.doesNotThrow(() => JSON.parse(fs.readFileSync(packageFile, "utf8")));
  }
});
