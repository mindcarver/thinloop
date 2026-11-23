import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

// Rules may live in their stage-specific references. Verify the composed
// guidance without requiring every gate to be duplicated in the entry point.
function composeGuidance(relativePath) {
  const files = [relativePath];
  if (relativePath.endsWith("SKILL.md")) files.push(
    "skills/scd-quickdev/references/scope-contract.md",
    "skills/scd-quickdev/references/issue-delivery-contract.md",
    "skills/scd-quickdev/references/release-contract.md",
    "skills/scd-quickdev/references/page-acceptance.md",
  );
  if (relativePath.endsWith("issue-delivery-contract.md")) files.push(
    "skills/scd-quickdev/references/extended-issue.md",
    "skills/scd-quickdev/references/release-contract.md",
  );
  if (relativePath.endsWith("evidence-contract.md")) files.push(
    "skills/scd-quickdev/references/page-acceptance.md",
    "skills/scd-quickdev/references/release-contract.md",
  );
  return files.map(read).join("\n");
}

test("quickdev selects direct, clarify, project, or discovery without forcing ceremony", () => {
  const skill = composeGuidance("skills/scd-quickdev/SKILL.md");

  assert.match(skill, /\*\*清晰交付：\*\*/);
  assert.match(skill, /\*\*单点澄清：\*\*/);
  assert.match(skill, /\*\*项目规划：\*\*/);
  assert.match(skill, /\*\*需求发现：\*\*/);
  assert.match(skill, /结果、边界和可观察验收清晰/);
  assert.match(skill, /使用 `scd-discovery`/);
  assert.match(skill, /使用 `scd-project`/);
});

test("quickdev separates product PRD authority from delivery Issue authority", () => {
  const skill = composeGuidance("skills/scd-quickdev/SKILL.md");
  const issueContract = composeGuidance(
    "skills/scd-quickdev/references/issue-delivery-contract.md",
  );

  assert.match(skill, /中文 GitHub Issue 是选中交付边界与验收的事实来源/);
  assert.match(
    issueContract,
    /选中交付边界、执行、验收和验证衔接点/,
  );
  assert.match(issueContract, /已确认 `.scd\/product\/prd\.md`/);
  assert.match(issueContract, /## 产品追溯/);
  assert.match(issueContract, /需求：`FR-001`/);
  assert.match(issueContract, /默认分支访问/);
  assert.match(skill, /实施期间不得生成或重新定义 PRD/);
  assert.match(skill, /清晰的孤立变更和缺陷使用任务计划及Issue/);
  assert.match(issueContract, /## 结果/);
  assert.match(issueContract, /## 范围内/);
  assert.match(issueContract, /## 范围外/);
  assert.match(issueContract, /## 验收条件/);
  assert.match(issueContract, /## 实施任务/);
  assert.match(issueContract, /## 验证/);
  assert.doesNotMatch(skill, /\.scd\/specs/);
});

test("quickdev requires approved Git plan and implementation authorization", () => {
  const skill = read("skills/scd-quickdev/SKILL.md");
  const contract = read("skills/scd-quickdev/references/planning-contract.md");
  assert.match(skill, /精确Git版本批准与明确开工授权/);
  assert.match(contract, /漏答保持待定/);
  assert.match(contract, /不能自引用/);
  assert.match(contract, /暂停受影响工作/);
  assert.match(contract, /方案批准与开工授权分别记录/);
  assert.doesNotMatch(skill, /状态：默认免确认/);
});

test("quickdev writes Issue output in Chinese without translating machine identifiers", () => {
  const skill = composeGuidance("skills/scd-quickdev/SKILL.md");
  const issueContract = composeGuidance(
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
  const skill = composeGuidance("skills/scd-quickdev/SKILL.md");
  const issueContract = composeGuidance(
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
  const contract = composeGuidance(
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
  const skill = composeGuidance("skills/scd-quickdev/SKILL.md");
  const contract = composeGuidance(
    "skills/scd-quickdev/references/issue-delivery-contract.md",
  );
  const evidence = composeGuidance(
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
  const contract = composeGuidance(
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
  const skill = composeGuidance("skills/scd-quickdev/SKILL.md");

  assert.match(skill, /以其更窄交付边界为准/);
  assert.match(
    skill,
    /`scd-evolve` 试验不授权提交、推送、拉取请求或合并/,
  );
});

test("quickdev verifies frontend implementation against UX, visual, and interface contracts", () => {
  const skill = composeGuidance("skills/scd-quickdev/SKILL.md");
  const evidence = composeGuidance(
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
  const skill = composeGuidance("skills/scd-quickdev/SKILL.md");
  const evidence = composeGuidance(
    "skills/scd-quickdev/references/evidence-contract.md",
  );
  const issueContract = composeGuidance(
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
  const skill = composeGuidance("skills/scd-quickdev/SKILL.md");
  const evidence = composeGuidance(
    "skills/scd-quickdev/references/evidence-contract.md",
  );
  const issueContract = composeGuidance(
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

test("quickdev requires an actual visible independent subagent invocation for page acceptance", () => {
  const skill = read("skills/scd-quickdev/SKILL.md");
  const page = read("skills/scd-quickdev/references/page-acceptance.md");
  const release = read("skills/scd-quickdev/references/release-contract.md");

  assert.match(skill, /必须实际调用独立的新上下文子 Agent/);
  assert.match(skill, /调用前明确告知用户/);
  assert.match(skill, /页面任务必须由该子智能体直接复核交互与视觉需求/);
  assert.match(page, /必须实际调用独立的新上下文子智能体/);
  assert.match(page, /实际调用标识、验收目标版本/);
  assert.match(page, /交互与视觉证据/);
  assert.match(page, /无法调用子智能体、未收到返回结果或必需证据不足[\s\S]*`BLOCKED`，不得合并/);
  assert.match(release, /必须实际调用可用的子智能体工具/);
  assert.match(release, /不继承实施对话的新上下文模式/);
  assert.match(release, /不得以父 Agent 或实施者自检代替独立验收/);
  assert.match(skill, /必须明确说明独立验收子智能体是否实际调用、返回结论及证据引用/);
});

test("quickdev confirms the accepted merge on main before closing the Issue", () => {
  const skill = composeGuidance("skills/scd-quickdev/SKILL.md");
  const issueContract = composeGuidance(
    "skills/scd-quickdev/references/issue-delivery-contract.md",
  );
  const combined = `${skill}\n${issueContract}`;

  assert.match(skill, /读取远端默认分支和合并提交/);
  assert.match(skill, /`main` 包含的任务差异就是独立验证过的版本/);
  assert.match(skill, /重新读取 Issue[\s\S]*完成审计三本账仍闭合/);
  assert.match(issueContract, /确认远端 `main` 包含独立验收版本/);
});

test("quickdev makes task-owned branch and worktree cleanup a closing gate", () => {
  const skill = composeGuidance("skills/scd-quickdev/SKILL.md");
  const issueContract = composeGuidance(
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


test("quickdev loads short phase references conditionally and offers a compact low-risk template", () => {
  const entry = read("skills/scd-quickdev/SKILL.md");
  const issue = read("skills/scd-quickdev/references/issue-delivery-contract.md");
  const release = read("skills/scd-quickdev/references/release-contract.md");
  assert.match(entry, /只读取当前条件命中的参考/);
  assert.match(entry, /创建或更新 Issue、分支\/工作树隔离.*issue-delivery-contract/);
  assert.match(entry, /工程完成，准备 PR\/独立验收\/合并\/清理关闭.*release-contract/);
  assert.match(entry, /真实页面差异或 UX 视觉交付.*page-acceptance/);
  assert.match(entry, /PRD、重要页面\/跨层设计、迁移\/兼容性复杂度.*extended-issue/);
  assert.match(issue, /清晰、低风险、单交付/);
  const compact = issue.match(/```markdown\n([\s\S]*?)```/)[1];
  assert.equal((compact.match(/^## /gm) || []).length, 5);
  for (const marker of ["A1", "T1", "验收闭合", "实施账目", "交付状态", "范围内", "范围外", "状态：<待确认/已确认>"]) assert.ok(compact.includes(marker), marker);
  assert.doesNotMatch(compact, /N\/A|不适用|产品追溯|页面验收/);
  assert.match(release, /创建 Issue 阶段不需要读取/);
  assert.ok(Buffer.byteLength(entry) < 8000, "entry remains a concise router plus essential gates");
  for (const file of ["scope-contract.md", "extended-issue.md", "evidence-contract.md", "page-acceptance.md", "release-contract.md", "continuity-contract.md"]) {
    assert.ok(entry.includes(`references/${file}`), `${file} must remain reachable with its trigger`);
  }
});

test("quickdev resolves scd-test in the plan and independent acceptance phases", () => {
  const entryPath = "skills/scd-quickdev/SKILL.md";
  const releasePath = "skills/scd-quickdev/references/release-contract.md";
  const [planning, delivery] = read(entryPath).split("## 实施与验收");
  const independent = read(releasePath).split("## 独立验收").at(-1);

  for (const [source, text] of [[entryPath, planning], [releasePath, independent]]) {
    const target = text.match(/\[scd-test\]\(([^)]+)\)/)?.[1];
    assert.ok(target, `${source} must link the skill from the applicable phase`);
    assert.equal(path.resolve(root, path.dirname(source), target), path.join(root, "skills/scd-test/SKILL.md"));
    assert.ok(fs.existsSync(path.resolve(root, path.dirname(source), target)));
  }
  assert.match(planning, /原始要求及批准版本[\s\S]*精确 Git 计划与开工范围/);
  assert.match(delivery, /由该验收者实际执行[\s\S]*验收模式/);
  assert.match(independent, /按原始预期直接复验行为/);
  assert.match(independent, /候选 HEAD 与获批验收依据/);
});

test("quickdev scales planning across L0, L1, and L2 without dropping explicit confirmation", () => {
  const skill = read("skills/scd-quickdev/SKILL.md");
  const issue = read("skills/scd-quickdev/references/issue-delivery-contract.md");
  const release = read("skills/scd-quickdev/references/release-contract.md");

  assert.match(skill, /L0\/L1\/L2 分级/);
  assert.match(skill, /L0（清晰局部小修\/纯文档\/小配置，无跨模块架构\/接口\/高风险门）/);
  assert.match(skill, /免建 6 模板 `\.scd\/plans\/` 与双次本地计划提交/);
  assert.match(skill, /由对话与紧凑中文 Issue 承载具体方案确认与开工授权，绝不得跳过确认/);
  assert.match(skill, /L1（常规单功能\/关键行为或UI）/);
  assert.match(skill, /L2（多交付\/架构边界\/高风险）/);

  assert.match(issue, /L0\/L1\/L2 规模自适应分级/);
  assert.match(issue, /免建 6 模板 `\.scd\/plans\/` 目录与双次本地计划提交/);
  assert.match(issue, /绝不得跳过用户对具体方案与开工范围的明确确认/);
  assert.match(issue, /不得扩大到含高风险门或跨模块架构决策的任务/);
  assert.match(issue, /分级：<L0\/L1>/);

  assert.match(release, /L0\/L1\/L2 分级核对方案批准与开工授权/);
  assert.match(release, /确认未越界触及跨模块架构或高风险人工门/);

  const combined = `${skill}\n${issue}\n${release}`;
  assert.doesNotMatch(
    combined,
    /L0[^\n。；]*(?:免确认|免用户确认|跳过用户确认|自动批准)/,
  );
});

test("quickdev cleanup distinguishes ordinary merge from Squash-Merge-only repos and blocks on missing records", () => {
  const release = read("skills/scd-quickdev/references/release-contract.md");

  assert.match(release, /普通 Merge 仓库[\s\S]*获批 SHA 是默认分支祖先[\s\S]*独立新克隆用 `git show`/);
  assert.match(
    release,
    /仅允许 Squash Merge 的消费者仓库[\s\S]*合并后默认分支上的持久计划文件与批准事件记录[\s\S]*已合并 PR 合并提交[\s\S]*放行并执行分支清理，不再一律 `BLOCKED`/,
  );
  assert.match(
    release,
    /若合并后默认分支缺失该持久计划文件或批准事件记录[\s\S]*未通过时BLOCKED，不删除最后引用/,
  );
  assert.match(release, /缺失则 `BLOCKED` 不删除/);
  assert.doesNotMatch(release, /若只能用丢失该历史的squash\/rebase，停止/);
  assert.match(release, /不得擅自创建 tag 或改保护/);
});

test("quickdev release enforces Blind-First acceptance, test-review anti-patterns, and L0 docs-only exemption boundary", () => {
  const release = read("skills/scd-quickdev/references/release-contract.md");
  const independent = release.split("## 独立验收").at(-1);

  assert.match(independent, /Blind-First（先盲验、后对账）两步顺序/);
  assert.match(independent, /第一步（盲验）[\s\S]*不读取实施者的自检 `PASS` 结论/);
  assert.match(independent, /第二步（对账）[\s\S]*候选完成审计三本账[\s\S]*实施者声称 `PASS` 但盲验未观察到/);
  assert.match(independent, /`test-review` 5 条测试反模式门禁/);
  assert.match(independent, /过度 Mock 穿透/);
  assert.match(independent, /弱断言\/浅断言[\s\S]*`toBeDefined`[\s\S]*`toBeTruthy`/);
  assert.match(independent, /测试实现细节/);
  assert.match(independent, /硬编码等待[\s\S]*`sleep`[\s\S]*`setTimeout`/);
  assert.match(independent, /无清理副作用/);

  assert.match(independent, /L0 纯文档、注释或纯文案无行为改动/);
  assert.match(independent, /可免除强制调用独立新上下文子 Agent/);
  assert.match(
    independent,
    /所有涉及代码行为、测试断言、配置\/脚本逻辑或页面\/样式的改动仍 100% 强制调用独立新上下文子 Agent/,
  );
  assert.match(independent, /严禁借 L0 跳过独立验收/);
});

test("quickdev evidence and release permit controlled WAIVED only for non-P0 non-high-risk approved gaps", () => {
  const evidence = read("skills/scd-quickdev/references/evidence-contract.md");
  const release = read("skills/scd-quickdev/references/release-contract.md");

  for (const [name, text] of [
    ["evidence-contract.md", evidence],
    ["release-contract.md", release],
  ]) {
    assert.match(text, /`PASS`、`FAIL` 或 `BLOCKED`/, name);
    assert.match(text, /`WAIVED`/, name);
    assert.match(text, /仅(?:适用于|限)非 `P0`、非高风险门/, name);
    assert.match(text, /缺失原因、残留风险、补测\/跟踪条件及用户显式批准依据/, name);
    assert.match(text, /严禁对 `P0` 关键行为、高风险人工门[\s\S]*未获用户明示批准的缺口使用 `WAIVED`/, name);
    assert.match(text, /严禁(?:把|将)已观察到的(?:违背（`FAIL`）|`FAIL`)伪装成 `WAIVED`/, name);
    assert.match(text, /不得把 `UNVERIFIED` 或部分验证行为提升为 `PASS`/, name);
  }
});
