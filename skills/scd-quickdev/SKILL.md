---
name: scd-quickdev
description: "编码 Agent 被要求修改仓库时，把清晰的单交付仓库变更从中文 Issue 推进到实现、验证、独立验收、PR 合并与清理。适用于缺陷、功能、配置、迁移或恢复；只执行明确选中的 READY Delivery Issue。需求未定用 scd-discovery，多交付拆分用 scd-project，状态查询用 scd-next。"
---

# SCD 快速开发

一个中文 GitHub Issue 是选中交付边界与验收的事实来源。完成声明不得超过观察证据；独立验收、真实页面门、高风险确认和清理关闭门始终有效。

## 确定边界

先读适用 `AGENTS.md`、`CLAUDE.md`、实时 Issue、Git 分支/远程/工作树和有关代码。保留用户无关变更，恢复现有任务记录，复用附近模式；不得为流程额外创建 Wiki、永久实施计划或角色体系。

- **直接实施：** 结果、边界和可观察验收清晰，创建或确认一个中文 Issue 后继续。
- **单点澄清：** 只有一个影响结果的歧义时，检查后问该问题。
- **项目规划：** 多个可独立验收交付使用 `scd-project`；它不授权直接实现全部节点。
- **需求发现：** 新产品或多个依赖产品决策未定时使用 `scd-discovery`。实施期间不得生成或重新定义 PRD；清晰的孤立变更和缺陷继续只使用 Issue。

只接受一个明确选中、已确认的 `READY` Delivery Issue，可由用户选择或来自当前图版本的已确认 `scd-execute` 波次。以 GitHub Delivery Issue 作为交付边界和验收事实来源，不吸收兄弟任务。存在 PRD、Project、UX 或 Architecture 交接时，按下表核对相应权威和就绪状态后才实施。

默认不询问用户是否要先确认完整的 Issue 草案、实施方案和任务清单。用户没有主动要求确认时，记录 `需要确认：否`、`状态：默认免确认` 并继续普通自主交付流程。只有用户主动要求先看或先确认时，先做只读仓库检查，再展示具体草案，等待明确确认；确认前不得创建或更新 Issue、修改仓库或开始实施。用户已经选择确认后，方案、任务、范围或验收实质改变时再次取得确认。这不是第二次产品确认。

Issue 标题和正文都必须使用中文，代码标识、命令、路径、文件名、协议字段和机器状态令牌保持规范形式。

## 实施与验收

1. 创建/更新 Issue 与隔离任务时读取 Issue 契约；清晰低风险任务用紧凑模板。用户授权普通任务局部 Issue、分支、推送、PR、符合条件的合并和清理，不能创造缺失凭据或越过高风险边界。
2. 缺陷先复现、检查因果根因、添加或找出会失败的回归测试，再作最小修复。原因进入框架或依赖时，在认定应用代码有错前查其官方 Issue 跟踪器；无法证实则保持 `Unconfirmed`。只改任务范围，证据使范围扩大时重新路由。
3. 运行直接练习变更的可行最强检查与仓库要求的构建/相关测试，把每个验收项映射到已观察证据、`UNVERIFIED` 或具名阻塞。失败先区分当前回归与无关基线，不伪造完成，不无界重试。
4. 实际差异影响页面、路由、组件交互、可见样式或响应式行为时，无论是否调用过 UIUX，都必须执行页面验收门：真实浏览器操作及视觉证据，缺失则 `BLOCKED`。触发时读取页面参考，不以测试/API绿色替代。
5. 工程完成后读取发布契约，审计整个 Issue 的验收闭合、实施账目闭合和交付状态闭合。把最终验收交给独立的新上下文子 Agent；它必须亲读 Issue/差异并直接验证，不得只依赖实施 Agent 摘要。创建拉取请求并等待必需 CI；只有 `PASS` 才能合并到 `main`；`FAIL` 修复后重验，`BLOCKED` 保持开放。
6. 合并前保留高风险人工门：身份验证/授权、支付、破坏性数据、密钥/隐私/合规、生产或不可逆动作；自动部署生产的合并也属生产操作。不得弱化仓库保护。合并后读取远端默认分支和合并提交，确认 `main` 包含的任务差异就是独立验证过的版本，完成精确资源清理，再重新读取 Issue，确认完成审计三本账仍闭合后显式关闭；PR 只用 `Refs`，不自动关闭 Issue。

其他技能委派实施时，以其更窄交付边界为准；`scd-evolve` 试验不授权提交、推送、拉取请求或合并。直接 QuickDev 清理自己创建的资源；父 Execute 创建的通道资源由父清理，通道返回精确资源清单，清理未闭合不得关闭 Issue。

## 按阶段加载

只读取当前条件命中的参考；不因未来可能需要而一次读取全部。

| 当前行动/条件 | 读取 |
|---|---|
| 创建或更新 Issue、分支/工作树隔离 | [issue-delivery-contract.md](references/issue-delivery-contract.md) |
| 产品/范围歧义，或 PRD、Project、UX、Architecture 交接 | [scope-contract.md](references/scope-contract.md) |
| Issue 有 PRD、重要页面/跨层设计、迁移/兼容性复杂度 | [extended-issue.md](references/extended-issue.md)，仅展开命中章节 |
| 选择验证或表述未验证边界 | [evidence-contract.md](references/evidence-contract.md) |
| 真实页面差异或 UX 视觉交付 | [page-acceptance.md](references/page-acceptance.md) |
| 工程完成，准备 PR/独立验收/合并/清理关闭 | [release-contract.md](references/release-contract.md) |
| 任务跨会话、暂停或恢复，需要创建/修改/删除后备状态 | [continuity-contract.md](references/continuity-contract.md) |

GitHub Issue 始终是持久事实来源；确需恢复才使用 [current-task.md](assets/current-task.md) 创建 `.scd/tasks/current.md`，只保存恢复增量和一个下一行动，停止/压缩前更新，不暂存提交；合并后按清理所有权删除。

自然交接只报告已合并结果/PR、直接验证、独立结论/Issue 状态及剩余未验证边界，不宣读流程。
