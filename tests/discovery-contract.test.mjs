import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("discovery routes greenfield work without burdening clear changes", () => {
  const skill = read("skills/scd-discovery/SKILL.md");

  assert.match(skill, /greenfield products[\s\S]*Discovery by default/i);
  assert.match(skill, /\*\*Direct:\*\*/);
  assert.match(skill, /\*\*Clarify:\*\*/);
  assert.match(skill, /without discovery artifacts or extra questions/i);
  assert.match(skill, /fast path/i);
});

test("discovery requires one-decision interviewing and explicit approval", () => {
  const skill = read("skills/scd-discovery/SKILL.md");
  const interviewing = read(
    "skills/scd-discovery/references/interviewing.md",
  );
  const readiness = read(
    "skills/scd-discovery/references/readiness-review.md",
  );

  assert.match(skill, /Ask one decision at a time/);
  assert.match(skill, /must explicitly approve/i);
  assert.match(interviewing, /Ask upstream questions before their consequences/);
  assert.match(readiness, /Silent adversarial review/);
  assert.match(readiness, /A1:/);
});

test("discovery persists approved greenfield PRD without burdening clear changes", () => {
  const skill = read("skills/scd-discovery/SKILL.md");
  const artifacts = read("skills/scd-discovery/references/artifacts.md");
  const prd = read("skills/scd-discovery/assets/product-prd.md");

  assert.match(artifacts, /\.scd\/tasks\/current\.md/);
  assert.match(artifacts, /managed_by: scd-discovery/);
  assert.match(skill, /approved greenfield product/i);
  assert.match(skill, /\.scd\/product\/prd\.md/);
  assert.match(skill, /clear change to an existing\s+product/i);
  assert.match(artifacts, /Do not create a\s+permanent draft before approval/i);
  assert.match(artifacts, /reachable from the default\s+branch/i);
  assert.match(prd, /status: draft/);
  assert.match(prd, /version: 1/);
  assert.match(prd, /## Product vision/);
  assert.match(prd, /## Primary users/);
  assert.match(prd, /## User problem and current alternative/);
  assert.match(prd, /## MVP goals/);
  assert.match(prd, /## Non-goals/);
  assert.match(prd, /## Core user journeys/);
  assert.match(prd, /FR-001:/);
  assert.match(prd, /## Rules and failure cases/);
  assert.match(prd, /## Data, permissions, and integrations/);
  assert.match(prd, /## Success metrics/);
  assert.match(prd, /## Assumptions and risks/);
  assert.match(prd, /## Open questions/);
  assert.match(prd, /## Approval/);
  assert.match(artifacts, /GitHub Issue/);
  assert.match(
    artifacts,
    /clear\s+change to an existing product keeps one GitHub Issue as the sole requirement/i,
  );
  assert.doesNotMatch(artifacts, /\.scd\/specs\/<slug>\.md/);
  assert.match(artifacts, /## Acceptance/);
  assert.match(artifacts, /A1:/);
  assert.match(artifacts, /\.scd\/architecture\.md/);
  assert.match(artifacts, /Do not create a permanent `implementation-plan\.md`/);
});

test("downstream skills consume PRD authority and delivery evidence", () => {
  const skill = read("skills/scd-quickdev/SKILL.md");
  const uiux = read("skills/scd-uiux/SKILL.md");
  const architecture = read("skills/scd-architecture/SKILL.md");
  const evidence = read(
    "skills/scd-quickdev/references/evidence-contract.md",
  );

  assert.match(skill, /Delivery Issue.*delivery boundary and acceptance source of truth/i);
  assert.match(skill, /approved greenfield PRD remains authoritative/i);
  assert.match(skill, /confirm every named `FR-\*` identifier exists/i);
  assert.match(uiux, /exact approved `.scd\/product\/prd\.md` version/i);
  assert.match(architecture, /exact approved `.scd\/product\/prd\.md` version/i);
  assert.match(skill, /Map every item to observed evidence,\s+`UNVERIFIED`/);
  assert.match(evidence, /A1 PASS/);
  assert.match(evidence, /return that decision to discovery/i);
});
