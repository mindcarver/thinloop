import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("quickdev selects direct, clarify, project, or discovery without forcing ceremony", () => {
  const skill = read("skills/scd-quickdev/SKILL.md");

  assert.match(skill, /\*\*Direct:\*\*/);
  assert.match(skill, /\*\*Clarify:\*\*/);
  assert.match(skill, /\*\*Project:\*\*/);
  assert.match(skill, /\*\*Discovery:\*\*/);
  assert.match(skill, /outcome, boundary, and observable acceptance/i);
  assert.match(skill, /use `scd-discovery`/i);
  assert.match(skill, /use `scd-project`/i);
});

test("quickdev separates product PRD authority from delivery Issue authority", () => {
  const skill = read("skills/scd-quickdev/SKILL.md");
  const issueContract = read(
    "skills/scd-quickdev/references/issue-delivery-contract.md",
  );

  assert.match(skill, /GitHub Issue.*source of truth for the selected delivery/i);
  assert.match(
    issueContract,
    /sole source of truth for the\s+selected delivery boundary/i,
  );
  assert.match(issueContract, /approved `.scd\/product\/prd\.md`/i);
  assert.match(issueContract, /## Product traceability/);
  assert.match(issueContract, /Requirements: `FR-001`/);
  assert.match(issueContract, /reachable from the default branch/i);
  assert.match(skill, /Do not generate or redefine a PRD during implementation/i);
  assert.match(skill, /clear isolated changes and bugs\s+remain Issue-only/i);
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

test("quickdev delegates code review and acceptance to one independent verifier", () => {
  const skill = read("skills/scd-quickdev/SKILL.md");
  const contract = read(
    "skills/scd-quickdev/references/issue-delivery-contract.md",
  );
  const evidence = read(
    "skills/scd-quickdev/references/evidence-contract.md",
  );
  const guidance = [
    read("AGENTS.md"),
    read("README.md"),
    read("docs/workflow-and-state.md"),
  ].join("\n");

  assert.match(skill, /create the pull request/i);
  assert.match(skill, /merge it into `main`/i);
  assert.match(contract, /`Refs #<issue>`/);
  assert.match(contract, /Do not use `Closes #<issue>`/);
  assert.match(skill, /one separate fresh-context\s+subagent/i);
  assert.match(
    skill,
    /must not rely only\s+on the\s+implementing\s+agent's summary/i,
  );
  assert.match(contract, /independent code reviewer and acceptance verifier/i);
  assert.match(contract, /Do not give it\s+the implementing agent's conclusions/i);
  assert.match(skill, /`open-code-review-delegate` skill/i);
  assert.match(skill, /`command -v ocr`/i);
  assert.match(contract, /`ocr delegate preview`/i);
  assert.match(contract, /`ocr delegate rule`/i);
  assert.match(contract, /`OCR_UNAVAILABLE`/);
  assert.match(contract, /validate OCR findings against the actual code/i);
  assert.match(contract, /discard false positives/i);
  assert.match(evidence, /`REVIEW_PASS`/);
  assert.match(evidence, /`REVIEW_FAIL`/);
  assert.match(evidence, /never modifies product code/i);
  assert.match(contract, /base and target\s+refs.*or the workspace state/is);
  assert.match(skill, /do not install or configure OCR/i);
  assert.match(skill, /Provider-backed `ocr review` is not required/i);
  assert.ok(
    skill.indexOf("Independent code review.") <
      skill.indexOf("Behavioral acceptance."),
  );
  assert.ok(
    skill.indexOf("`open-code-review-delegate`") <
      skill.indexOf("`command -v ocr`"),
  );
  assert.ok(
    skill.indexOf("`command -v ocr`") <
      skill.indexOf("`OCR_UNAVAILABLE`"),
  );
  assert.match(contract, /browser,\s+real-model, or produced-artifact validation/i);
  assert.match(contract, /`PASS`, `FAIL`, or `BLOCKED`/);
  assert.match(
    contract,
    /`REVIEW_PASS` followed by acceptance `PASS` authorizes eligible merge/i,
  );
  assert.match(contract, /avoid modifying product code/i);
  assert.match(guidance, /Open Code Review/);
  assert.doesNotMatch(`${skill}\n${contract}\n${guidance}`, /awaiting-uat/);
  assert.doesNotMatch(contract, /The user owns\s+real-use acceptance/i);
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
