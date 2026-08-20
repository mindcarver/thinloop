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

test("quickdev defaults to autonomous delivery and only pauses when the user asks to confirm", () => {
  const skill = read("skills/scd-quickdev/SKILL.md");
  const issueContract = read(
    "skills/scd-quickdev/references/issue-delivery-contract.md",
  );
  const combined = `${skill}\n${issueContract}`;

  assert.match(
    skill,
    /默认不询问用户是否要先确认完整的 Issue 草案、实施方案和任务清单/,
  );
  assert.match(
    skill,
    /没有主动要求确认[\s\S]*`需要确认：否`[\s\S]*`状态：默认免确认`[\s\S]*普通自主交付流程/,
  );
  assert.match(
    skill,
    /只有用户主动要求先看或先确认[\s\S]*只读仓库检查[\s\S]*等待明确确认/,
  );
  assert.match(
    skill,
    /确认前不得创建或更新 Issue、修改仓库或开始实施/,
  );
  assert.match(skill, /已经选择确认[\s\S]*实质改变[\s\S]*再次取得确认/);
  assert.match(combined, /沉默、普通实施请求或“开始做”都不/);
  assert.match(issueContract, /## 方案确认/);
  assert.match(issueContract, /## 实施方案/);
  assert.match(issueContract, /## 实施任务/);
  assert.match(issueContract, /需要确认：是，或否/);
  assert.match(issueContract, /状态：已确认，或默认免确认/);
  assert.doesNotMatch(
    combined,
    /本次交付是否需要你先确认完整的 Issue 草案、实施方案和任务清单？/,
  );
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

test("quickdev verifies frontend implementation against UX, visual, and interface contracts", () => {
  const skill = read("skills/scd-quickdev/SKILL.md");
  const evidence = read(
    "skills/scd-quickdev/references/evidence-contract.md",
  );
  const combined = `${skill}\n${evidence}`;

  assert.match(skill, /三类权威/);
  assert.match(skill, /UX 契约负责行为、状态与响应式规则/);
  assert.match(skill, /视觉 ID[\s\S]*布局、层级、密度与外观/);
  assert.match(skill, /共享机器契约负责数据、操作、权限和错误语义/);
  assert.match(skill, /代表性桌面和窄屏视口/);
  assert.match(combined, /截图、录屏、浏览器追踪或等价证据/);
  assert.match(combined, /构建通过[\s\S]*不能替代页面行为证据|只运行组件测试[\s\S]*不能证明交互旅程完成/);
});

test("quickdev audits acceptance, implementation, and delivery before declaring the Issue complete", () => {
  const skill = read("skills/scd-quickdev/SKILL.md");
  const evidence = read(
    "skills/scd-quickdev/references/evidence-contract.md",
  );
  const issueContract = read(
    "skills/scd-quickdev/references/issue-delivery-contract.md",
  );
  const combined = `${skill}\n${evidence}\n${issueContract}`;

  assert.match(skill, /## 审计整个 Issue 是否完成/);
  assert.match(skill, /验收闭合/);
  assert.match(skill, /实施账目闭合/);
  assert.match(skill, /交付状态闭合/);
  assert.match(combined, /`DONE`、`SUPERSEDED` 或 `N\/A`/);
  assert.match(combined, /`SUPERSEDED` 和 `N\/A` 记录原因|后两者缺少原因/);
  assert.match(combined, /任务状态说明实施路径，不替代行为验收|任务复选框只记录计划执行情况/);
  assert.match(combined, /任何 `FAIL`、`BLOCKED`、`UNVERIFIED` 或缺失映射都阻止完成/);
  assert.match(combined, /独立结论和合并版本.*待完成/);
  assert.match(combined, /合并后.*最终.*闭合/);
  assert.match(issueContract, /## 完成审计/);
  assert.match(issueContract, /实施任务使用稳定 `T1`、`T2` 等标识/);
  assert.match(issueContract, /### 验收闭合/);
  assert.match(issueContract, /### 实施账目/);
  assert.match(issueContract, /### 交付状态/);
});

test("quickdev makes browser acceptance mandatory for every real page change", () => {
  const skill = read("skills/scd-quickdev/SKILL.md");
  const evidence = read(
    "skills/scd-quickdev/references/evidence-contract.md",
  );
  const issueContract = read(
    "skills/scd-quickdev/references/issue-delivery-contract.md",
  );
  const combined = `${skill}\n${evidence}\n${issueContract}`;

  assert.match(skill, /页面、路由、组件交互、可见样式或响应式行为/);
  assert.match(skill, /无论是否调用过 UIUX，都必须执行页面验收门/);
  assert.match(combined, /用户可见的导航、按钮、表单|用户可见控件/);
  assert.match(combined, /不得用 API|直接调用 API/);
  assert.match(evidence, /\| 页面\/路由 \| 状态 \| 视口 \| 旅程\/验收 \| 视觉 ID \| 操作与证据 \| 结果 \|/);
  assert.match(combined, /加载、空数据、成功、失败、权限、部分成功.*恢复状态/);
  assert.match(combined, /控制台错误/);
  assert.match(combined, /失败网络请求/);
  assert.match(combined, /键盘.*焦点|键盘顺序、焦点/);
  assert.match(combined, /浏览器.*不可用[\s\S]*`BLOCKED`|缺少浏览器[\s\S]*`BLOCKED`/);
  assert.match(skill, /页面验收门由真实差异触发，不属于可选的“适用时”判断/);
});

test("quickdev confirms the accepted merge on main before closing the Issue", () => {
  const skill = read("skills/scd-quickdev/SKILL.md");
  const issueContract = read(
    "skills/scd-quickdev/references/issue-delivery-contract.md",
  );
  const combined = `${skill}\n${issueContract}`;

  assert.match(skill, /读取远端默认分支和合并提交/);
  assert.match(skill, /`main` 包含的任务差异就是独立验证过的版本/);
  assert.match(skill, /重新读取 Issue[\s\S]*完成审计三本账仍闭合/);
  assert.match(issueContract, /确认远端 `main` 包含独立验收版本/);
});

test("quickdev makes task-owned branch and worktree cleanup a closing gate", () => {
  const skill = read("skills/scd-quickdev/SKILL.md");
  const issueContract = read(
    "skills/scd-quickdev/references/issue-delivery-contract.md",
  );
  const combined = `${skill}\n${issueContract}`;

  for (const requiredCleanupField of [
    "清理所有者",
    "任务工作树",
    "本地任务分支",
    "远端任务分支",
    "连续性状态",
    "main 同步",
  ]) {
    assert.match(issueContract, new RegExp(requiredCleanupField));
  }
  assert.match(combined, /任务自有资源.*阻止.*关闭 Issue|保持 Issue 开放/);
  assert.match(combined, /未提交状态[\s\S]*不得强制删除/);
  assert.match(combined, /合并命令.*非零[\s\S]*重新读取.*拉取请求|重新读取.*拉取请求[\s\S]*合并命令.*非零/);
  assert.match(combined, /squash|rebase/i);
  assert.match(combined, /显式删除远端任务分支/);
  assert.match(combined, /不得仅依赖.*--delete-branch/);
  assert.match(combined, /工作树.*不存在[\s\S]*本地任务分支.*不存在[\s\S]*远端任务分支.*不存在/);
  assert.match(combined, /不得扫描或删除.*历史|不得清理.*无关/);
});
