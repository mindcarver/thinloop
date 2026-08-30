import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const evalRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const pluginRoot = path.resolve(evalRoot, "..", "..");
export const fixturesRoot = path.join(evalRoot, "fixtures");
export const manifestFile = path.join(evalRoot, "manifest.json");

export function loadManifest() {
  return JSON.parse(fs.readFileSync(manifestFile, "utf8"));
}

export function validateManifest(manifest = loadManifest()) {
  const errors = [];
  const expectedConditions = ["native", "prompt", "thinloop"];
  const expectedCategories = [
    "clear-bug",
    "underdefined-feature",
    "multi-issue-project",
    "interruption-recovery",
    "dirty-worktree",
    "browser-acceptance",
    "false-completion",
  ];
  if (manifest.schemaVersion !== 1) errors.push("schemaVersion must be 1");
  if (!manifest.benchmarkVersion?.trim()) errors.push("benchmarkVersion is required");
  const conditionIds = manifest.conditions?.map(({ id }) => id) ?? [];
  if (JSON.stringify(conditionIds) !== JSON.stringify(expectedConditions)) {
    errors.push("conditions must be native, prompt, thinloop in that order");
  }
  if (!manifest.conditions?.find(({ id }) => id === "prompt")?.promptPrefix?.trim()) {
    errors.push("prompt condition requires a fixed promptPrefix");
  }
  const declaredSkills = manifest.conditions?.find(({ id }) => id === "thinloop")?.skills ?? [];
  const actualSkills = fs
    .readdirSync(path.join(pluginRoot, "skills"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("scd-"))
    .map(({ name }) => name)
    .sort();
  if (JSON.stringify([...declaredSkills].sort()) !== JSON.stringify(actualSkills)) {
    errors.push("thinloop condition skills must match the current canonical skills tree");
  }
  const ids = new Set();
  const categories = new Set();
  for (const testCase of manifest.cases ?? []) {
    if (!testCase.id || ids.has(testCase.id)) errors.push(`duplicate or missing case id: ${testCase.id}`);
    ids.add(testCase.id);
    categories.add(testCase.category);
    if (!expectedCategories.includes(testCase.category)) errors.push(`${testCase.id}: invalid category`);
    if (!testCase.prompt?.trim()) errors.push(`${testCase.id}: prompt is required`);
    if (!fs.existsSync(path.join(fixturesRoot, testCase.fixture))) errors.push(`${testCase.id}: missing fixture`);
    if (!new Set(["pass", "fail"]).has(testCase.baselineTests)) errors.push(`${testCase.id}: baselineTests must be pass or fail`);
    for (const field of ["allowedChanges", "requiredChanges"]) {
      if (!Array.isArray(testCase[field])) errors.push(`${testCase.id}: ${field} must be an array`);
    }
    for (const file of testCase.requiredChanges ?? []) {
      if (!(testCase.allowedChanges ?? []).includes(file)) errors.push(`${testCase.id}: required change ${file} is not allowed`);
    }
    if (!testCase.hiddenCheck?.trim()) errors.push(`${testCase.id}: hiddenCheck is required`);
  }
  if (JSON.stringify([...categories].sort()) !== JSON.stringify([...expectedCategories].sort())) {
    errors.push("cases must cover each of the seven task categories exactly once");
  }
  for (const id of manifest.smokeCases ?? []) {
    if (!ids.has(id)) errors.push(`unknown smoke case: ${id}`);
  }
  if ((manifest.smokeCases ?? []).length !== 1) errors.push("smoke must use exactly one affordable representative case");
  return {
    ok: errors.length === 0,
    errors,
    cases: ids.size,
    conditions: conditionIds.length,
  };
}

export function selectCases({ manifest = loadManifest(), mode, requestedId }) {
  if (requestedId) {
    const selected = manifest.cases.find(({ id }) => id === requestedId);
    if (!selected) throw new Error(`Unknown case: ${requestedId}`);
    return [selected];
  }
  if (mode === "smoke") {
    return manifest.cases.filter(({ id }) => manifest.smokeCases.includes(id));
  }
  return manifest.cases;
}
