import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("quickdev selects direct, clarify, or discovery without forcing ceremony", () => {
  const skill = read("skills/scd-quickdev/SKILL.md");

  assert.match(skill, /\*\*Direct:\*\*/);
  assert.match(skill, /\*\*Clarify:\*\*/);
  assert.match(skill, /\*\*Discovery:\*\*/);
  assert.match(skill, /outcome, boundary, and observable acceptance/i);
  assert.match(skill, /use `scd-discovery`/i);
});

test("quickdev makes one GitHub Issue the delivery source of truth", () => {
  const skill = read("skills/scd-quickdev/SKILL.md");
  const issueContract = read(
    "skills/scd-quickdev/references/issue-delivery-contract.md",
  );

  assert.match(skill, /GitHub Issue.*source of truth/i);
  assert.match(
    issueContract,
    /sole requirement and\s+acceptance source of truth/i,
  );
  assert.match(issueContract, /## Outcome/);
  assert.match(issueContract, /## In scope/);
  assert.match(issueContract, /## Out of scope/);
  assert.match(issueContract, /## Acceptance/);
  assert.match(issueContract, /## Implementation tasks/);
  assert.match(issueContract, /## Verification/);
  assert.doesNotMatch(skill, /\.scd\/specs/);
});

test("quickdev diagnoses bugs and requires regression evidence", () => {
  const skill = read("skills/scd-quickdev/SKILL.md");
  const issueContract = read(
    "skills/scd-quickdev/references/issue-delivery-contract.md",
  );

  assert.match(skill, /reproduce the symptom/i);
  assert.match(skill, /causal root cause/i);
  assert.match(skill, /regression test/i);
  assert.match(issueContract, /Observed symptom/);
  assert.match(issueContract, /Expected behavior/);
  assert.match(issueContract, /Root cause: `Unconfirmed`/);
  assert.match(issueContract, /Regression evidence/);
});

test("quickdev always isolates meaningful work on a branch and uses worktrees conditionally", () => {
  const contract = read(
    "skills/scd-quickdev/references/issue-delivery-contract.md",
  );

  assert.match(contract, /Every meaningful repository task gets a unique branch/i);
  assert.match(contract, /fix\/<issue>-<slug>/);
  assert.match(contract, /feat\/<issue>-<slug>/);
  assert.match(contract, /Use a worktree only when/i);
  assert.match(contract, /parallel/i);
  assert.match(contract, /unrelated changes/i);
});

test("quickdev opens and merges its PR while leaving real-use UAT to the user", () => {
  const skill = read("skills/scd-quickdev/SKILL.md");
  const contract = read(
    "skills/scd-quickdev/references/issue-delivery-contract.md",
  );

  assert.match(skill, /create the pull request/i);
  assert.match(skill, /merge it into `main`/i);
  assert.match(contract, /`Refs #<issue>`/);
  assert.match(contract, /Do not use `Closes #<issue>`/);
  assert.match(contract, /awaiting-uat/);
  assert.match(contract, /real-use acceptance/i);
  assert.match(contract, /close the Issue/i);
});

test("quickdev keeps high-risk merge and production deployment behind human approval", () => {
  const contract = read(
    "skills/scd-quickdev/references/issue-delivery-contract.md",
  );

  assert.match(contract, /authentication or authorization/i);
  assert.match(contract, /payments or billing/i);
  assert.match(contract, /destructive data or schema changes/i);
  assert.match(contract, /production infrastructure/i);
  assert.match(contract, /explicit human approval/i);
  assert.match(contract, /merge authorization does not authorize deployment/i);
});

test("quickdev respects a composing skill's narrower delivery authority", () => {
  const skill = read("skills/scd-quickdev/SKILL.md");

  assert.match(skill, /narrower\s+delivery boundary wins/i);
  assert.match(
    skill,
    /`scd-evolve` trial\s+does not authorize commit, push, pull request, or merge/i,
  );
});
