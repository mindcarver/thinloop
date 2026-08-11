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

  assert.match(skill, /\*\*直接实施：\*\*/);
  assert.match(skill, /\*\*单点澄清：\*\*/);
  assert.match(skill, /\*\*项目规划：\*\*/);
  assert.match(skill, /\*\*需求发现：\*\*/);
  assert.match(skill, /结果、边界和可观察验收清晰/);
  assert.match(skill, /使用 `scd-discovery`/);
  assert.match(skill, /使用 `scd-project`/);
});

test("quickdev separates product PRD authority from delivery Issue authority", () => {
  const skill = read("skills/scd-quickdev/SKILL.md");
  const issueContract = read(
    "skills/scd-quickdev/references/issue-delivery-contract.md",
  );

  assert.match(skill, /中文 GitHub Issue 是选中交付边界与验收的事实来源/);
  assert.match(
    issueContract,
    /选中交付边界、验收和验证衔接点的唯一事实来源/,
  );
  assert.match(issueContract, /已确认 `.scd\/product\/prd\.md`/);
  assert.match(issueContract, /## 产品追溯/);
  assert.match(issueContract, /需求：`FR-001`/);
  assert.match(issueContract, /默认分支访问/);
  assert.match(skill, /实施期间不得生成或重新定义 PRD/);
  assert.match(skill, /清晰的孤立变更和缺陷继续只使用 Issue/);
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
    /用中文简短询问[\s\S]*本次交付是否需要你先确认完整的 Issue 草案、实施方案和任务清单？/,
  );
  assert.match(
    skill,
    /用户回答不需要[\s\S]*`已放弃`[\s\S]*普通自主交付流程/,
  );
  assert.match(
    skill,
    /用户回答需要[\s\S]*只读仓库检查[\s\S]*等待明确确认/,
  );
  assert.match(
    skill,
    /确认前不得创建或更新 Issue、修改仓库或开始实施/,
  );
  assert.match(skill, /实质改变[\s\S]*再次取得确认/);
  assert.match(issueContract, /## 方案确认/);
  assert.match(issueContract, /## 实施方案/);
  assert.match(issueContract, /## 实施任务/);
  assert.match(issueContract, /需要确认：是，或否/);
  assert.match(issueContract, /状态：已确认，或已放弃/);
  assert.match(combined, /不是第二次产品确认/);
  assert.match(combined, /不[会是]创建本地 `plan\.md`|不是创建 `plan\.md` 的理由/);
});

test("quickdev writes Issue output in Chinese without translating machine identifiers", () => {
  const skill = read("skills/scd-quickdev/SKILL.md");
  const issueContract = read(
    "skills/scd-quickdev/references/issue-delivery-contract.md",
  );
  const combined = `${skill}\n${issueContract}`;

  assert.match(combined, /Issue 标题和正文都必须使用中文/);
  assert.match(
    issueContract,
    /QuickDev 创建或更新的全部 Issue 输出必须使用中文/,
  );
  assert.match(
    combined,
    /代码标识、命令、路径、文件名、协议字段和机器状态令牌/,
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

  assert.match(skill, /复现/);
  assert.match(
    skill,
    /框架或依赖[\s\S]*应用代码[\s\S]*官方 Issue 跟踪器/,
  );
  assert.match(skill, /因果根因/);
  assert.match(skill, /回归测试/);
  assert.match(issueContract, /已观察症状/);
  assert.match(issueContract, /预期行为/);
  assert.match(issueContract, /根因：`Unconfirmed`/);
  assert.match(issueContract, /回归证据/);
});

test("quickdev always isolates meaningful work on a branch and uses worktrees conditionally", () => {
  const contract = read(
    "skills/scd-quickdev/references/issue-delivery-contract.md",
  );

  assert.match(contract, /每项有意义的仓库任务都使用唯一分支/);
  assert.match(contract, /fix\/<issue>-<slug>/);
  assert.match(contract, /feat\/<issue>-<slug>/);
  assert.match(contract, /只有以下情况使用工作树/);
  assert.match(contract, /并行/);
  assert.match(contract, /无关变更/);
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

  assert.match(skill, /创建拉取请求/);
  assert.match(skill, /合并到 `main`/);
  assert.match(contract, /`Refs #<issue>`/);
  assert.match(contract, /不得使用 `Closes #<issue>`/);
  assert.match(skill, /独立的新上下文子 Agent/);
  assert.match(
    skill,
    /不得只依赖实施 Agent 摘要/,
  );
  assert.match(contract, /子 Agent 作为验收者/);
  assert.match(
    contract,
    /不要提供实施 Agent 的结论/,
  );
  assert.match(contract, /基准与目标引用[\s\S]*工作区状态/);
  assert.match(contract, /浏览器、真实模型或生成产物验证/);
  assert.match(contract, /`PASS`、`FAIL` 或 `BLOCKED`/);
  assert.match(contract, /`PASS` 授权符合条件的合并/);
  assert.match(contract, /不修改产品代码/);
  assert.match(evidence, /独立验收者产生一个汇总结果/);
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

  assert.match(contract, /身份验证或授权/);
  assert.match(contract, /支付或计费/);
  assert.match(contract, /破坏性数据或模式变更/);
  assert.match(contract, /生产基础设施/);
  assert.match(contract, /明确人工确认/);
  assert.match(contract, /合并权限不等于部署权限/);
});

test("quickdev respects a composing skill's narrower delivery authority", () => {
  const skill = read("skills/scd-quickdev/SKILL.md");

  assert.match(skill, /以其更窄交付边界为准/);
  assert.match(
    skill,
    /`scd-evolve` 试验不授权提交、推送、拉取请求或合并/,
  );
});
