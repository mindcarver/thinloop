import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("architecture is composable and keeps clear changes on the direct path", () => {
  const skill = read("skills/scd-architecture/SKILL.md");

  assert.match(skill, /\*\*Direct:\*\*/);
  assert.match(skill, /\*\*Focused:\*\*/);
  assert.match(skill, /\*\*Product:\*\*/);
  assert.match(skill, /\*\*Evolution:\*\*/);
  assert.match(skill, /\*\*Validate:\*\*/);
  assert.match(skill, /without architecture questions or artifacts/);
  assert.match(skill, /one new endpoint does not justify/);
});

test("architecture translates approved business behavior without inventing it", () => {
  const skill = read("skills/scd-architecture/SKILL.md");
  const contract = read(
    "skills/scd-architecture/references/architecture-contract.md",
  );

  assert.match(skill, /Issue product contracts own business decisions/);
  assert.match(skill, /must not invent missing product behavior/);
  assert.match(contract, /subordinate to approved product behavior/);
  assert.match(contract, /not permission to invent a missing rule/);
});

test("architecture and uiux reconcile one shared machine contract", () => {
  const skill = read("skills/scd-architecture/SKILL.md");
  const discovery = read("skills/scd-discovery/SKILL.md");
  const uiux = read("skills/scd-uiux/SKILL.md");
  const quickdev = read("skills/scd-quickdev/SKILL.md");
  const contract = read(
    "skills/scd-architecture/references/interface-contract.md",
  );

  assert.match(skill, /proceed in parallel with\s+`scd-uiux`/);
  assert.match(skill, /shared\s+interface contract before independent/);
  assert.match(skill, /must not unilaterally finalize/);
  assert.match(contract, /common source of truth for every producer\s+and consumer/);
  assert.match(contract, /Do not keep two field or\s+error definitions/);
  assert.match(discovery, /UIUX and Architecture may\s+then proceed in parallel/);
  assert.match(discovery, /one shared machine-readable contract/);
  assert.match(uiux, /`scd-architecture` facilitates reconciliation/);
  assert.match(quickdev, /parse the canonical machine-readable contracts/);
});

test("machine contracts require real format-aware evidence", () => {
  const skill = read("skills/scd-architecture/SKILL.md");
  const contract = read(
    "skills/scd-architecture/references/interface-contract.md",
  );
  const readiness = read(
    "skills/scd-architecture/references/readiness-review.md",
  );

  assert.match(skill, /cannot become `ready` until its canonical\s+contract is machine-readable/);
  assert.match(contract, /format-aware tool actually parses, lints, or compiles/);
  assert.match(contract, /no material item remains only in Markdown/);
  assert.match(
    readiness,
    /File existence, valid YAML syntax,[\s\S]*alone\s+does\s+not prove/,
  );
});

test("architecture artifacts split only when durable complexity activates them", () => {
  const skill = read("skills/scd-architecture/SKILL.md");
  const contract = read(
    "skills/scd-architecture/references/architecture-contract.md",
  );

  assert.match(skill, /Keep the ordinary domain model in `.scd\/architecture\.md`/);
  assert.match(skill, /Split\s+`.scd\/domain\.md` only when/);
  assert.match(skill, /\.scd\/designs\/<feature>\.md/);
  assert.match(contract, /do not rewrite the repository architecture/);
});

test("new shared contracts prefer repository convention then root contracts", () => {
  const skill = read("skills/scd-architecture/SKILL.md");
  const contract = read(
    "skills/scd-architecture/references/interface-contract.md",
  );

  assert.match(skill, /repository's existing contract location and format/);
  assert.match(skill, /visible root `contracts\/` directory/);
  assert.match(contract, /Prefer the repository's existing contract format and location/);
});

test("architecture readiness is not approval and production mutation stays out", () => {
  const skill = read("skills/scd-architecture/SKILL.md");
  const contract = read(
    "skills/scd-architecture/references/architecture-contract.md",
  );

  assert.match(skill, /`ready` is mechanical and semantic\s+readiness, not a second product approval/);
  assert.match(skill, /must not write\s+production business code/);
  assert.match(skill, /execute a real data migration/);
  assert.match(skill, /or deploy/);
  assert.match(contract, /not a human approval gate/);
});

test("architecture templates preserve separate responsibilities", () => {
  const architecture = read(
    "skills/scd-architecture/assets/architecture-contract.md",
  );
  const feature = read("skills/scd-architecture/assets/feature-design.md");
  const domain = read("skills/scd-architecture/assets/domain-contract.md");

  assert.match(architecture, /managed_by: scd-architecture/);
  assert.match(architecture, /## Shared interface contracts/);
  assert.match(feature, /## Shared contract changes/);
  assert.match(feature, /## Alternatives and decisions/);
  assert.match(domain, /## Lifecycles and state transitions/);
  assert.match(domain, /## Cross-entity consistency/);
});

test("the approved architecture specification retains A1 through A10", () => {
  const specification = read(".scd/specs/scd-architecture.md");

  assert.match(specification, /status: approved/);
  for (let index = 1; index <= 10; index += 1) {
    assert.match(specification, new RegExp(`^- A${index}:`, "m"));
  }
});
