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
  assert.match(issueContract, /## 产品追踪/);
  assert.match(issueContract, /需求：`FR-001`/);
  assert.match(issueContract, /reachable from the default branch/i);
  assert.match(skill, /Do not generate or redefine a PRD during implementation/i);
  assert.match(skill, /clear isolated changes and bugs\s+remain Issue-only/i);
  assert.match(issueContract, /## 结果/);
  assert.match(issueContract, /## 范围内/);
  assert.match(issueContract, /## 范围外/);
  assert.match(issueContract, /## 验收条件/);
  assert.match(issueContract, /## 实施任务/);
  assert.match(issueContract, /## 验证/);
  assert.doesNotMatch(skill, /\.scd\/specs/);
});

test("quickdev lets the user choose whether to confirm the Issue plan and tasks", () => {
  const skill = read("skills/scd-quickdev/SKILL.md");
  const issueContract = read(
    "skills/scd-quickdev/references/issue-delivery-contract.md",
  );
  const combined = `${skill}\n${issueContract}`;

  assert.match(
    skill,
    /ask one concise question[\s\S]*本次交付是否需要你先确认完整的[\s\S]*Issue 草案、实施方案和任务清单？/i,
  );
  assert.match(
    skill,
    /user says no[\s\S]*`已放弃`[\s\S]*normal autonomous delivery flow/i,
  );
  assert.match(
    skill,
    /user says yes[\s\S]*read-only repository inspection[\s\S]*wait for\s+explicit confirmation/i,
  );
  assert.match(
    skill,
    /Until confirmation, do not create or update the Issue,[\s\S]*modify the repository,[\s\S]*start implementation/i,
  );
  assert.match(skill, /materially changes[\s\S]*obtain confirmation again/i);
  assert.match(issueContract, /## 方案确认/);
  assert.match(issueContract, /## 实施方案/);
  assert.match(issueContract, /## 实施任务/);
  assert.match(issueContract, /需要确认：是，或否/);
  assert.match(issueContract, /状态：已确认，或已放弃/);
  assert.match(combined, /not a second product approval/i);
  assert.match(combined, /not\s+(?:a reason to create|create a local) `plan\.md`/i);
});

test("quickdev writes Issue output in Chinese without translating machine identifiers", () => {
  const skill = read("skills/scd-quickdev/SKILL.md");
  const issueContract = read(
    "skills/scd-quickdev/references/issue-delivery-contract.md",
  );
  const combined = `${skill}\n${issueContract}`;

  assert.match(combined, /Issue title and body in Chinese/i);
  assert.match(
    issueContract,
    /all QuickDev-created or updated Issue output in Chinese/i,
  );
  assert.match(
    combined,
    /code identifiers, commands, paths, filenames, protocol fields,[\s\S]*machine status tokens/i,
  );
  assert.match(issueContract, /## 实施方案/);
  assert.match(issueContract, /## 实施任务/);
  assert.match(issueContract, /根因：`Unconfirmed`/);
});

test("quickdev diagnoses bugs and requires regression evidence", () => {
  const skill = read("skills/scd-quickdev/SKILL.md");
  const issueContract = read(
    "skills/scd-quickdev/references/issue-delivery-contract.md",
  );

  assert.match(skill, /reproduce the symptom/i);
  assert.match(
    skill,
    /framework or dependency[\s\S]*official issue tracker[\s\S]*application code/i,
  );
  assert.match(skill, /causal root cause/i);
  assert.match(skill, /regression test/i);
  assert.match(issueContract, /已观察症状/);
  assert.match(issueContract, /预期行为/);
  assert.match(issueContract, /根因：`Unconfirmed`/);
  assert.match(issueContract, /回归证据/);
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

test("quickdev delegates acceptance to one independent verifier", () => {
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
    /must not rely only\s+on the\s+implementing\s+agent's\s+summary/i,
  );
  assert.match(contract, /subagent as the acceptance verifier/i);
  assert.match(
    contract,
    /Do not give it\s+the implementing\s+agent's conclusions/i,
  );
  assert.match(contract, /base and target\s+refs.*or the workspace state/is);
  assert.match(contract, /browser,\s+real-model, or produced-artifact validation/i);
  assert.match(contract, /`PASS`, `FAIL`, or `BLOCKED`/);
  assert.match(contract, /`PASS` authorizes eligible merge/i);
  assert.match(contract, /avoid modifying product code/i);
  assert.match(evidence, /independent acceptance verifier produces one\s+aggregate result/i);
  assert.match(guidance, /独立验收 Agent/);
  const combined = `${skill}\n${contract}\n${evidence}\n${guidance}`;
  assert.doesNotMatch(
    combined,
    /Open Code Review|open-code-review-delegate|ocr delegate|OCR_UNAVAILABLE|REVIEW_PASS|REVIEW_FAIL/i,
  );
  assert.doesNotMatch(combined, /awaiting-uat/);
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
