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

  assert.match(skill, /greenfield products.*Discovery by default/i);
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

test("discovery artifacts use SCD paths and approved specifications", () => {
  const artifacts = read("skills/scd-discovery/references/artifacts.md");

  assert.match(artifacts, /\.scd\/tasks\/current\.md/);
  assert.match(artifacts, /managed_by: scd-discovery/);
  assert.match(artifacts, /\.scd\/specs\/<slug>\.md/);
  assert.match(artifacts, /status: review/);
  assert.match(artifacts, /status: approved/);
  assert.match(artifacts, /\.scd\/architecture\.md/);
  assert.match(artifacts, /Do not create a permanent `implementation-plan\.md`/);
});

test("dev loop consumes approved specifications and maps evidence", () => {
  const skill = read("skills/scd-dev-loop/SKILL.md");
  const evidence = read(
    "skills/scd-dev-loop/references/evidence-contract.md",
  );

  assert.match(skill, /require `status: approved`/);
  assert.match(skill, /Map every item to observed evidence, `UNVERIFIED`/);
  assert.match(evidence, /A1 PASS/);
  assert.match(evidence, /return that decision to discovery/i);
});

test("the discovery feature keeps its approved delivery contract", () => {
  const specification = read(".scd/specs/scd-discovery.md");

  assert.match(specification, /status: approved/);
  for (let index = 1; index <= 8; index += 1) {
    assert.match(specification, new RegExp(`^- A${index}:`, "m"));
  }
});
