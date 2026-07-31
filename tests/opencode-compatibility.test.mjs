import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skillRoot = path.join(root, "skills");
const expectedSkills = [
  "scd-architecture",
  "scd-discovery",
  "scd-evolve",
  "scd-execute",
  "scd-knowledge",
  "scd-maintenance",
  "scd-next",
  "scd-project",
  "scd-quickdev",
  "scd-reengineering",
  "scd-uiux",
];
const allowedFields = new Set([
  "name",
  "description",
  "license",
  "compatibility",
  "metadata",
]);

function parseFrontmatter(filePath) {
  const markdown = fs.readFileSync(filePath, "utf8");
  const match = markdown.match(/^---\s*\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  assert.ok(match, `${filePath} must start with YAML frontmatter`);

  const values = {};
  const fields = [];
  for (const line of match[1].split(/\r?\n/)) {
    const entry = line.match(/^([A-Za-z0-9_-]+):\s*(.*?)\s*$/);
    if (!entry) {
      continue;
    }
    fields.push(entry[1]);
    values[entry[1]] = entry[2].replace(/^['"]|['"]$/g, "");
  }
  return { fields, values };
}

test("all shared skills satisfy OpenCode's portable Agent Skill contract", () => {
  const skillNames = fs
    .readdirSync(skillRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  assert.deepEqual(skillNames, expectedSkills);
  for (const skillName of skillNames) {
    const skillPath = path.join(skillRoot, skillName, "SKILL.md");
    const { fields, values } = parseFrontmatter(skillPath);

    assert.equal(values.name, skillName);
    assert.match(values.name, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(values.name.length <= 64);
    assert.ok(values.description.length >= 1);
    assert.ok(values.description.length <= 1024);
    assert.ok(fields.every((field) => allowedFields.has(field)));
  }
});

test("documentation installs and verifies OpenCode through its native interfaces", () => {
  const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
  const installation = fs.readFileSync(
    path.join(root, "docs", "installation.md"),
    "utf8",
  );
  const verification = fs.readFileSync(
    path.join(root, "docs", "verification.md"),
    "utf8",
  );

  assert.match(readme, /\.\/docs\/installation\.md/);
  assert.match(readme, /\.\/docs\/verification\.md/);
  assert.match(installation, /\.config[\\/]opencode[\\/]skills/);
  assert.match(verification, /opencode debug skill/);
  assert.match(verification, /不声明连续性阻断能力/);
});
