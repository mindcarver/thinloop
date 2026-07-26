import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readJson } from "./lib.mjs";

export const discoveryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
export const pluginRoot = path.resolve(discoveryRoot, "..", "..");
export const casesFile = path.join(discoveryRoot, "cases", "cases.json");
export const fixturesRoot = path.join(discoveryRoot, "fixtures");
export const schemasRoot = path.join(discoveryRoot, "schemas");

export function loadCases() {
  return readJson(casesFile);
}

export function validateCases(cases = loadCases()) {
  const errors = [];
  const ids = new Set();
  const matrix = new Set();
  const groups = new Map();
  const products = new Map();

  if (cases.length !== 9) errors.push(`expected 9 cases, found ${cases.length}`);

  for (const testCase of cases) {
    if (!testCase.id || ids.has(testCase.id)) {
      errors.push(`missing or duplicate case id: ${testCase.id}`);
    }
    ids.add(testCase.id);

    if (!["clear", "underdefined", "complete"].includes(testCase.group)) {
      errors.push(`${testCase.id}: invalid group ${testCase.group}`);
    }
    if (!["cli", "web", "api"].includes(testCase.product)) {
      errors.push(`${testCase.id}: invalid product ${testCase.product}`);
    }
    groups.set(testCase.group, (groups.get(testCase.group) ?? 0) + 1);
    products.set(testCase.product, (products.get(testCase.product) ?? 0) + 1);

    const matrixKey = `${testCase.group}:${testCase.product}`;
    if (matrix.has(matrixKey)) errors.push(`duplicate matrix cell ${matrixKey}`);
    matrix.add(matrixKey);

    if (!testCase.initialPrompt?.includes("不要修改代码")) {
      errors.push(`${testCase.id}: prompt must preserve discussion-only intent`);
    }
    if (/\b(?:thinloop|scd-|skill)\b/i.test(testCase.initialPrompt)) {
      errors.push(`${testCase.id}: prompt leaks routing or skill information`);
    }

    const factIds = new Set(testCase.facts?.map(({ id }) => id));
    if (factIds.size !== (testCase.facts?.length ?? 0)) {
      errors.push(`${testCase.id}: duplicate fact id`);
    }
    for (const decisionId of testCase.requiredDecisionIds ?? []) {
      if (!factIds.has(decisionId)) {
        errors.push(`${testCase.id}: missing fact for ${decisionId}`);
      }
    }
    for (const decisionId of testCase.preResolvedDecisionIds ?? []) {
      if (!testCase.requiredDecisionIds.includes(decisionId)) {
        errors.push(`${testCase.id}: pre-resolved unknown id ${decisionId}`);
      }
    }

    if (testCase.group === "clear" && testCase.requiredDecisionIds.length) {
      errors.push(`${testCase.id}: clear case must not require decisions`);
    }
    if (
      testCase.group === "underdefined" &&
      (testCase.requiredDecisionIds.length < 6 ||
        testCase.preResolvedDecisionIds.length)
    ) {
      errors.push(`${testCase.id}: underdefined case needs 6+ unresolved decisions`);
    }
    if (
      testCase.group === "complete" &&
      testCase.preResolvedDecisionIds.length !==
        testCase.requiredDecisionIds.length
    ) {
      errors.push(`${testCase.id}: complete case must pre-resolve every decision`);
    }

    const fixture = path.join(fixturesRoot, testCase.fixture);
    for (const required of ["AGENTS.md", "README.md", "package.json"]) {
      if (!fs.existsSync(path.join(fixture, required))) {
        errors.push(`${testCase.id}: fixture missing ${required}`);
      }
    }
  }

  for (const group of ["clear", "underdefined", "complete"]) {
    if (groups.get(group) !== 3) {
      errors.push(`${group}: expected 3 cases, found ${groups.get(group) ?? 0}`);
    }
  }
  for (const product of ["cli", "web", "api"]) {
    if (products.get(product) !== 3) {
      errors.push(`${product}: expected 3 cases, found ${products.get(product) ?? 0}`);
    }
  }

  return { ok: errors.length === 0, errors, cases: cases.length };
}

export function selectSmokeCases(cases = loadCases()) {
  return ["clear", "underdefined", "complete"].map((group) =>
    cases.find((testCase) => testCase.group === group),
  );
}
