import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const knowledgeEvalRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
export const pluginRoot = path.resolve(knowledgeEvalRoot, "..", "..");
export const fixturesRoot = path.join(knowledgeEvalRoot, "fixtures");
export const casesFile = path.join(knowledgeEvalRoot, "cases", "cases.json");

export function loadCases() {
  return JSON.parse(fs.readFileSync(casesFile, "utf8"));
}

export function validateCases(cases = loadCases()) {
  const errors = [];
  const ids = new Set();
  const allowedCategories = new Set(["applicable", "protective"]);
  const allowedBarriers = new Set(["semantic", "location", "behavioral"]);
  const requiredKnowledgeFields = [
    "slug",
    "title",
    "trigger",
    "guidance",
    "boundary",
    "evidence",
    "source",
  ];

  if (cases.length !== 5) errors.push("expected exactly 5 behavior cases");
  for (const testCase of cases) {
    if (!testCase.id || ids.has(testCase.id)) {
      errors.push(`duplicate or missing case id: ${testCase.id}`);
    }
    ids.add(testCase.id);
    if (!allowedCategories.has(testCase.category)) {
      errors.push(`${testCase.id}: invalid category`);
    }
    if (!allowedBarriers.has(testCase.barrier)) {
      errors.push(`${testCase.id}: invalid barrier`);
    }
    if (!testCase.prompt?.includes("$scd-knowledge")) {
      errors.push(`${testCase.id}: prompt must explicitly invoke $scd-knowledge`);
    }
    if (!fs.existsSync(path.join(fixturesRoot, testCase.fixture))) {
      errors.push(`${testCase.id}: missing fixture ${testCase.fixture}`);
    }
    for (const field of requiredKnowledgeFields) {
      if (!testCase.knowledge?.[field]?.trim()) {
        errors.push(`${testCase.id}: missing knowledge.${field}`);
      }
    }
  }

  for (const barrier of allowedBarriers) {
    if (!cases.some((testCase) => testCase.barrier === barrier)) {
      errors.push(`missing ${barrier} barrier case`);
    }
  }
  if (!cases.some((testCase) => testCase.category === "applicable")) {
    errors.push("missing applicable case");
  }
  if (!cases.some((testCase) => testCase.category === "protective")) {
    errors.push("missing protective case");
  }
  return { ok: errors.length === 0, errors, cases: cases.length };
}

export function selectCases({ mode, requestedId }) {
  const cases = loadCases();
  if (requestedId) {
    const selected = cases.find((testCase) => testCase.id === requestedId);
    if (!selected) throw new Error(`Unknown case: ${requestedId}`);
    return [selected];
  }
  if (mode === "smoke") {
    return cases.filter((testCase) =>
      ["semantic-amber-path", "misleading-missing-method"].includes(
        testCase.id,
      ),
    );
  }
  return cases;
}
