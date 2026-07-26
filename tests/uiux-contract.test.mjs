import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("uiux is composable and keeps clear UI changes on the direct path", () => {
  const skill = read("skills/scd-uiux/SKILL.md");

  assert.match(skill, /\*\*Direct:\*\*/);
  assert.match(skill, /\*\*Focused:\*\*/);
  assert.match(skill, /\*\*Product:\*\*/);
  assert.match(skill, /\*\*Validate:\*\*/);
  assert.match(skill, /Hand it to `scd-dev-loop` without UX questions or artifacts/);
  assert.match(skill, /does not inherit the Product path/);
});

test("uiux composes with discovery without adding a product approval", () => {
  const skill = read("skills/scd-uiux/SKILL.md");
  const discovery = read("skills/scd-discovery/SKILL.md");
  const contract = read(
    "skills/scd-uiux/references/experience-contract.md",
  );

  assert.match(skill, /require the product core/i);
  assert.match(skill, /return only that\s+change to `scd-discovery`/);
  assert.match(skill, /one combined approval/);
  assert.match(discovery, /compose\s+with `scd-uiux`/);
  assert.match(discovery, /same combined contract and approval/);
  assert.match(contract, /does\s+not add an approval gate/);
});

test("uiux covers experience behavior and risk-adaptive visual evidence", () => {
  const skill = read("skills/scd-uiux/SKILL.md");
  const visual = read("skills/scd-uiux/references/visual-evidence.md");

  assert.match(skill, /journey-to-surface coverage closes/);
  assert.match(skill, /responsive and accessibility requirements are testable/);
  assert.match(skill, /Do not require Figma/);
  assert.match(visual, /Choose fidelity by decision risk/);
  assert.match(visual, /explicitly non-production location/);
  assert.match(visual, /Do not claim a visual has been reviewed because its file exists/);
});

test("uiux keeps the shared frontend-backend contract jointly owned", () => {
  const skill = read("skills/scd-uiux/SKILL.md");
  const contract = read(
    "skills/scd-uiux/references/experience-contract.md",
  );

  assert.match(skill, /must not unilaterally finalize/);
  assert.match(skill, /one shared\s+interface\s+contract/);
  assert.match(skill, /Do not duplicate the shared interface contract/);
  assert.match(contract, /Label unresolved items as `Interface need`/);
  assert.match(contract, /common source for frontend and backend/);
});

test("uiux durable artifacts stay minimal and distinguish readiness from approval", () => {
  const skill = read("skills/scd-uiux/SKILL.md");
  const contract = read(
    "skills/scd-uiux/references/experience-contract.md",
  );
  const template = read("skills/scd-uiux/assets/ux-contract.md");

  assert.match(skill, /\.scd\/ux\/<slug>\.md/);
  assert.match(skill, /Use `status: draft`/);
  assert.match(skill, /`status: ready`/);
  assert.match(skill, /it is not a\s+second product approval/);
  assert.match(contract, /Prefer one feature UX contract/);
  assert.match(template, /managed_by: scd-uiux/);
  assert.match(template, /## Shared contract references/);
});

test("dev loop consumes a ready UX handoff without confusing it for architecture", () => {
  const devLoop = read("skills/scd-dev-loop/SKILL.md");

  assert.match(devLoop, /\.scd\/ux\/<slug>\.md/);
  assert.match(devLoop, /require\s+`status: ready`/);
  assert.match(devLoop, /not as product approval or\s+frontend architecture/);
  assert.match(devLoop, /unreconciled shared\s+interface decision/);
});

test("the approved uiux specification retains A1 through A9", () => {
  const specification = read(".scd/specs/scd-uiux.md");

  assert.match(specification, /status: approved/);
  for (let index = 1; index <= 9; index += 1) {
    assert.match(specification, new RegExp(`^- A${index}:`, "m"));
  }
});
