---
name: scd-next
description: "检查当前仓库的实时项目状态并建议唯一下一行动。适用于询问哪些工作已完成、进行中、未完成、READY、PLANNED 或受阻，询问 Issue、拉取请求、Initiative 或里程碑状态，或不知道如何继续或恢复（既适用于多 Issue Initiatives，也适用于普通 Issue 管理的仓库）。默认保持只读：不编辑 Issues 或依赖图、不开始实施或合并，也不编造优先级、完成百分比或验收。"
---

# SCD 下一步

开始执行前必须先读取并遵守[步骤沟通](../scd-quickdev/references/step-communication.md)；直接调用本技能也适用。

Next 执行一次主动、只读检查，将模糊的“现在该做什么？”转为有证据支持的唯一下一行动；不是后台通知器、守护进程、调度器或实施循环。`scd-next` 只观察并建议；`scd-project` 管 Initiative/Issue/DAG，`scd-execute` 执行安全 READY 波次，`scd-quickdev` 交付单 Issue。

设计或实施前读[计划确认契约](../scd-quickdev/references/planning-contract.md)（只读查询/审计不建计划，保持更窄治理权限）。

## 选择范围与检查实时项目事实

优先使用用户具名范围；否则按序解析：当前分支关联 Issue/PR → 活跃 Thinloop 任务关联对象 → 仓库唯一开放 Initiative → 普通开放 Issues/PR（多个并列时列候选并只问一个范围问题，不按编号/时间悄悄猜测）。用户已选中 Issue 并明确要求实施时，直接路由交付技能。

分类或建议前阅读 `references/status-contract.md`。检查仓库说明、分支/工作树、范围内 Issues/PR/标签/里程碑/优先级、Initiative 正文/图版本/集成门、检查与独立验收（本地记录仅作辅证）。Initiative 有依赖图载荷时用 `scd-project` 验证器校验；权威跟踪器不可用时报告 `UNVERIFIED` 并写明缺失来源。

## 分类当前工作与只建议一个下一行动

将每项放入唯一类别（不得凭提交、PR 合并或复选框单独推断 DONE，不得凭陈旧分支推断 IN_FLIGHT；仅完整范围知悉时可报精确数量，不得编造工作量、时间或完成百分比）：

- `DONE`：权威关闭与必需验收证据满足完成契约。
- `IN_FLIGHT`：开放 PR 或活跃通道直接证明交付中。
- `READY`：已确认已实例化 Issue，硬依赖全 DONE 且无门禁。
- `PLANNED`：已具名预期工作，但可执行契约或确认未实例化。
- `BLOCKED`：具名依赖、决策、权限、环境、检查或人工门阻断。
- `UNVERIFIED`：必需权威证据不可用或互相矛盾。

只建议一个下一行动（多个普通 READY Issue 无明确排序依据时报告 `priority not established` 并列候选供用户选择）：有安全 READY Initiative 节点 → `scd-execute`；用户选中 READY Delivery Issue → `scd-quickdev`；Initiative 仅剩 PLANNED → `scd-project`；单一最高优无阻普通 Issue → `scd-quickdev`；产品/验收未定 → `scd-discovery`；共享技术边界未定 → `scd-architecture`；人工/外部门阻塞 → 写明负责人与所需输入；全 DONE → 报告完成。

## 报告导航快照

按以下紧凑格式回复（省略空状态行，绝不省略“建议下一步”“原因”与“用户行动”；提示词须含仓库/对象标识、适用图版本与负责技能）：

```text
项目：<仓库 / Initiative / 图版本>
已检查：<权威来源与观察时间>
DONE：<事项与证据>
IN_FLIGHT：<事项与证据>
READY：<事项与依赖证据>
PLANNED：<事项与缺失的实例化或确认>
BLOCKED：<事项、原因与负责人>
UNVERIFIED：<缺失或矛盾证据>
建议下一步：<唯一行动，或无需实施行动>
原因：<直接证据>
用户行动：<无，或精确决策 / 确认 / 输入>
可复制的继续提示词：<一条具体 Thinloop 提示词>
```

检查期间不得创建或更新 Issues、评论、标签、里程碑、项目图、分支、工作树、提交、拉取请求或本地状态；Next 不授予修改权限。

## 资源

- `references/status-contract.md`：证据权威、状态分类、建议顺序与输出要求。
