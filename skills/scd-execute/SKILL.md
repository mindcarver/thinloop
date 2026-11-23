---
name: scd-execute
description: "消费 scd-project 的实时 Delivery-Issue DAG、选择当前安全 READY 波次，并把每个 Issue 委派给一条隔离的 scd-quickdev 通道，从而执行已确认的 Thinloop Initiative。适用于开始、继续、恢复或完成多交付项目；不适用于单个 Issue、项目拆解、未确认或陈旧依赖图或持久调度器。"
---

# SCD 项目执行

开始执行前必须先读取并遵守[步骤沟通](../scd-quickdev/references/step-communication.md)；直接调用本技能也适用。

把已确认的 Initiative 依赖图转化为有边界交付波次（非守护进程或第二个数据库）。设计或实施前读[计划确认契约](../scd-quickdev/references/planning-contract.md)（只读查询/审计不建计划，保持更窄治理权限）。

核心边界：`scd-project` 负责 Initiative、Delivery Issues、硬依赖 DAG、图版本及确定性 `READY`/`BLOCKED`/`PLANNED`/`DONE` 状态；Execute 负责实时波次选择、临时协调约束、隔离通道启动、串行合并协调和图重算；每条 `scd-quickdev` 通道只负责一个 READY Delivery Issue（单分支/PR/独立验收）；组装整体验收由集成/发布 Issue 负责；高风险人工门始终有效。

## 选择操作

要求开始、继续、恢复或完成已确认 Initiative、执行其 DAG 或交付当前 READY Issues 时使用 Execute。不适用情形：已选中一个 Delivery Issue：使用 `scd-quickdev`；图或子契约需创建/修订：返回 `scd-project`；产品或共享技术决策未定：返回对应拥有技能；只要求报告进度、就绪度或下一步：使用 `scd-next`；再工程未通过前置门：留在 `scd-reengineering`。

普通“继续”只延续精确计划已批准且已授权的当前及后续安全 READY 波次，不授权实质范围变化、新图版本或高风险操作。

## 从实时项目事实出发

1. 阅读 `AGENTS.md`、`CLAUDE.md`、仓库说明、实时 Initiative、子 Issues、PR、分支、工作树、共享契约与检查，确认精确图版本已确认且仍规范。
2. 重建依赖图快照并运行 `scd-project` 的 `scripts/validate-project-graph.mjs`；只接受已实例化、已确认的 `READY` Delivery Issues，拒绝陈旧版本、无效依赖图、`PLANNED` 占位节点、`BLOCKED` 节点、缺证据或已在其他通道执行的节点；新波次与每次合并前重读状态。
3. 不得根据提交、分支、复选框、已合并 PR 或实施者摘要推断 `DONE`。启动通道、协调合并或收尾前阅读 `references/execution-contract.md`。

## 选择波次、启动通道与串行合并

- **波次选择：** 默认在可用 Agent 槽和仓库策略范围内选择所有可安全独立执行的 READY 节点（无歧义时不要要求用户手工选择节点）。支持用户明确覆盖（“只执行 Issue #N” / “串行” / “最多并行 N 个” / 明确 Issue 列表）。重叠文件、共享生成产物或单一环境等协调约束只串行化节点，不得作为伪造边写入 Project DAG；启动前报告选中波次、延期项、理由与阻塞。
- **启动隔离的 QuickDev 通道：** 为每个选中节点同步基准、建唯一分支与隔离工作树（创建者父 Execute 是清理所有者），分配单一 Issue 与明确文件/模块所有权并告知有其他 Agent 同时工作；调用 `scd-quickdev` 交付并执行局部检查、PR 与独立新上下文验收。不得启动脱离后台工作，不得实施兄弟 Issue、直接推送默认分支或未确认扩 scope；`scd-quickdev` 不可用时通道标 `BLOCKED`，Execute 不得自行实施。
- **串行合并并解锁：** 开发可以并行，但符合条件的拉取请求必须逐个合并：复核图版本、QuickDev 验收 `PASS`、检查与人工门 → 合并单个 PR → 同步基准分支 → 按 QuickDev 契约删除该通道精确工作树、本地与远端任务分支并记证据 → 安全更新/变基剩余工作树并重跑受影响检查 → 清理完成后关闭 Delivery Issue → 重建并验证实时 Project 依赖图。若合并使兄弟通道假设失效则暂停重验（针对不同基准版本的绿色检查不能证明组装后项目）；工作树有未提交状态时不得强删，返回 `BLOCKED` 且保持 Issue 开放；父 Execute 不得把清理推回已结束子通道。

图版本有效且无实质变化时继续下一波次；完成、无 READY 节点、全阻塞或需重确认时停止。

## 失败、证明项目完成与交接

通道结果分类为 `PASS`、`FAIL`（违背契约）或 `BLOCKED`（缺权限/依赖/环境/证据）。出现 `FAIL`/`BLOCKED` 时将直接证据写入中文 Delivery Issue、阻塞下游，仅继续安全无关 READY 工作；产品/边界/图变化分别回 `scd-discovery` / `scd-architecture` / `scd-project`，不得无限重试或伪造边。证明项目完成需全部必需 Delivery Issue `DONE`、当前图有效、集成 Issue 通过且无开放人工门。不要添加租约、资源锁、执行数据库或长期调度器；从实时 Issue、PR、验收证据、分支、工作树与默认分支重建执行状态。

最终重算依赖图后必须按以下分类交接（不得只报告“没有 READY 节点”），列明已完成波次、Initiative 状态、分类、证据与唯一下一行动：

| 状态 | 证据 | 必需交接 |
|---|---|---|
| `COMPLETE` | 依赖图有效；所有必需节点 `DONE`；必需集成验收通过。 | 报告 Initiative 完成与剩余人工门。 |
| `ROLLING_REPLAN_REQUIRED` | 有效 Initiative 未结束；无 `READY` 节点；剩余可执行工作只有 `PLANNED` 占位节点。 | 列出占位节点与阻塞；说明非执行失败、不要求重做 Discovery，提供含 Initiative/已完成上游/占位节点的**可直接复制的继续提示词**引导用户回 `scd-project` 确认下一批契约和图版本（Execute 不得将其实例化）。 |
| `EXTERNAL_OR_HUMAN_BLOCK` | 具名权威、环境、依赖或人工门阻塞剩余工作。 | 写明阻塞证据、所需权限和负责人。 |
| `INVALID_OR_STALE_GRAPH` | 图版本无效、陈旧或缺少已实例化 Issue 证据。 | 写明失败图证据，恢复前返回 `scd-project` 修复。 |

## 资源

- `references/execution-contract.md`：权限、波次选择、通道契约、串行合并协议、失败处理、集成门与恢复。
