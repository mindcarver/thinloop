---
name: scd-quickdev
description: "编码 Agent 被要求修改仓库时，把清晰的单交付仓库变更从中文 Issue 推进到实现、验证、独立验收、PR 合并与清理。适用于缺陷、功能、配置、迁移或恢复；只执行明确选中的 READY Delivery Issue。需求未定用 scd-discovery，多交付拆分用 scd-project，状态查询用 scd-next。"
---

# SCD 快速开发

开始执行前必须先读取并遵守[步骤沟通](references/step-communication.md)；直接调用本技能也适用。

中文 GitHub Issue 是选中交付边界与验收的事实来源。完成声明不得超过观察证据；独立验收、真实页面门、高风险确认和清理关闭门始终有效。

## 确定边界

先读适用 `AGENTS.md`、`CLAUDE.md`、实时 Issue、Git 状态与有关代码，保留用户无关变更，恢复现有记录，不建流程 Wiki；按需保存持久计划。

- **清晰交付：** 结果、边界和可观察验收清晰，确认具体方案和计划后创建或确认中文 Issue。
- **单点澄清：** 只有一个影响结果的歧义时，检查后问该问题。
- **项目规划：** 多个可独立验收交付使用 `scd-project`（不授权直接实现全部节点）。
- **需求发现：** 新产品或多个依赖产品决策未定时使用 `scd-discovery`；实施期间不得生成或重新定义 PRD，清晰的孤立变更和缺陷使用任务计划及Issue。

只接受一个明确选中、已确认的 `READY` Delivery Issue（用户选择或来自当前图版本的已确认 `scd-execute` 波次），以 GitHub Delivery Issue 作为交付边界和验收事实来源，拒绝 Initiative、PLANNED 占位节点、BLOCKED 节点，不吸收兄弟任务；存在 PRD、Project、UX 或 Architecture 交接时按 `scope-contract.md` 核对就绪与三类权威（UX 契约负责行为、状态与响应式规则；视觉 ID 负责布局、层级、密度与外观；共享机器契约负责数据、操作、权限和错误语义）。

## 开工前设计关键行为测试

有用户可见成功/失败路径、影响验收语义或硬约束、对外接口、持久状态或跨层接线时，先在只读计划阶段执行 [scd-test](../scd-test/SKILL.md) 测试设计模式（测试断言改预期也适用）：由原始要求及批准版本建场景、保留验收 ID 并为关键行为记录反例，写入计划后在改代码前确认同一份精确 Git 计划与开工范围（已有覆盖场景直接复用；纯文档/无行为改动用聚焦检查）。

默认先只读调查，按[计划确认契约](references/planning-contract.md)执行 L0/L1/L2 分级：L0（清晰局部小修/纯文档/小配置，无跨模块架构/接口/高风险门）免建 6 模板 `.scd/plans/` 与双次本地计划提交，由对话与紧凑中文 Issue 承载具体方案确认与开工授权，绝不得跳过确认；L1（常规单功能/关键行为或UI）按需用 `.scd/plans/` 取得精确Git版本批准与明确开工授权；L2（多交付/架构边界/高风险）保留完整计划目录、版本冻结、独立集成验收与人工门。获批范围内连续交付，新选择或实质变化暂停重确认。Issue 标题和正文都必须使用中文，代码标识、命令、路径、文件名和机器状态令牌保持规范形式。

## 实施与验收

1. **隔离与准备：** 创建/更新 Issue 与隔离时读 Issue 契约（低风险用紧凑模板）。用户授权普通局部 Issue、分支、推送、PR、合规合并与清理，不越过高风险门。写代码或设计新功能交互边界前按阶段读取工程最佳实践参考（遵循高内聚低耦合、边界解析、浅嵌套复用与先查最新官方文档）。页面任务修改前读页面参考并按共用视觉标准存基线（至少检查代表性桌面和窄屏视口）。缺陷先复现、查因果根因、补失败回归测试再最小修复（原因进入框架或依赖时，在认定应用代码有错前查其官方 Issue 跟踪器，未证实保持 `Unconfirmed`）。
2. **验证：** 运行直接练习变更的可行最强检查与构建/相关测试，把每个验收项映射到已观察证据、`UNVERIFIED` 或阻塞，区分当前回归与无关基线。实际差异影响页面、路由、组件交互、可见样式或响应式行为时，无论是否调用过 UIUX，都必须执行页面验收门（真实浏览器操作及视觉证据，缺失则 `BLOCKED`；页面验收门由真实差异触发，不属于可选的“适用时”判断）。

## 审计整个 Issue 是否完成

3. **独立验收与合并：** 工程完成后读发布契约，审计验收闭合、实施账目闭合和交付状态闭合。必须实际调用独立的新上下文子 Agent（子智能体），调用前明确告知用户；由该验收者实际执行 [scd-test](../scd-test/SKILL.md) 的验收模式，亲读原要求、批准版本、Issue 与精确差异直接验证，不得只依赖实施 Agent 摘要（页面任务必须由该子智能体直接复核交互与视觉需求）。记录调用标识、目标版本、证据与结论，无法调用或欠证据则 `BLOCKED`。创建拉取请求并等待 CI，仅当前候选独立 `PASS` 且高风险门（身份验证/授权、支付、破坏性数据、密钥/隐私/合规、生产及自动部署合并）获人工批准后才合并到 `main`（不弱化仓库保护；`FAIL` 修后重验，`BLOCKED` 保持开放）。
4. **验证落主干与清理关闭：** 合并后读取远端默认分支和合并提交，确认 `main` 包含的任务差异就是独立验证过的版本，清理己方工作树/分支（父 Execute 资源由父清理），再重新读取 Issue 确认完成审计三本账仍闭合后显式关闭（PR 用 `Refs`，不自动关 Issue）。

其他技能委派以其更窄交付边界为准；`scd-evolve` 试验不授权提交、推送、拉取请求或合并。

## 按阶段加载

只读取当前条件命中的参考，不全量预读：

| 当前行动/条件 | 读取 |
|---|---|
| 创建或更新 Issue、分支/工作树隔离 | [issue-delivery-contract.md](references/issue-delivery-contract.md) |
| 产品/范围歧义，或 PRD、Project、UX、Architecture 交接 | [scope-contract.md](references/scope-contract.md) |
| Issue 有 PRD、重要页面/跨层设计、迁移/兼容性复杂度 | [extended-issue.md](references/extended-issue.md)，仅展开命中章节 |
| 选择验证或表述未验证边界 | [evidence-contract.md](references/evidence-contract.md) |
| 实际开发或新功能引入外部库/SDK/接口 | [engineering-practice.md](references/engineering-practice.md) |
| 真实页面差异或 UX 视觉交付（预计有页面差异时，修改前读取） | [page-acceptance.md](references/page-acceptance.md) |
| 工程完成，准备 PR/独立验收/合并/清理关闭 | [release-contract.md](references/release-contract.md) |
| 任务跨会话、暂停或恢复，需要创建/修改/删除后备状态 | [continuity-contract.md](references/continuity-contract.md) |

确需跨会话恢复才用 [current-task.md](assets/current-task.md) 创建 `.scd/tasks/current.md`（仅存恢复增量与下一步，不提交，合并后删除）。自然交接只报已合并结果/PR、直接验证及未验证边界，且必须明确说明独立验收子智能体是否实际调用、返回结论及证据引用（页面任务同时说明交互与视觉结果）。
