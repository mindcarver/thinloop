---
name: scd-execute
description: "消费 scd-project 的实时 Delivery-Issue DAG、选择当前安全 READY 波次，并把每个 Issue 委派给一条隔离的 scd-quickdev 通道，从而执行已确认的 Thinloop Initiative。适用于用户要求开始、继续、恢复或完成已确认的多交付项目，运行其当前 READY Issues，或执行其 DAG。除非用户要求更窄或串行波次，默认在可用并发范围内选择所有可安全独立执行的 READY 节点。安全时并行开发，逐个合并符合条件的拉取请求，并在每次交付状态变化后重新计算依赖图。不适用于单个 Issue、项目拆解、未确认或陈旧依赖图，也不能作为持久调度器。"
---

# SCD 项目执行

把已确认的 Initiative 依赖图转化为有边界的交付波次，同时不让 Project 变成调度器，也不让 QuickDev 跨越多个 Issues。

维护以下边界：

- `scd-project` 负责 Initiative、Delivery Issues、硬依赖 DAG、图版本，以及确定性的 `READY`、`BLOCKED`、`PLANNED` 和 `DONE` 状态；
- Execute 负责实时波次选择、临时协调约束、隔离通道启动、串行合并协调和依赖图重算；
- 每条 `scd-quickdev` 通道只负责一个 READY Delivery Issue、一个分支、一个拉取请求、工程证据和独立验收；
- 独立子节点不能证明整体时，由 Initiative 的集成或发布 Issue 负责组装后项目验收；
- 生产、破坏性操作、身份验证、支付、密钥、隐私、合规和其他不可逆操作继续受现有人工门约束。

Execute 是可观察的一次编排过程，不是守护进程或第二个项目数据库。

## 选择操作

用户要求开始、继续、恢复或完成已确认 Initiative，执行其 DAG，或交付当前 READY Issues 时使用 Execute。

以下情况不要使用 Execute：

- 已选中一个 Delivery Issue：使用 `scd-quickdev`；
- Initiative、子契约或依赖图仍需创建或修订：返回 `scd-project`；
- 产品或共享技术决策仍未确定：返回拥有该决策的 Thinloop 技能；
- 只要求报告进度、就绪度、未完成工作或推荐的继续行动：使用 `scd-next`；
- 再工程项目尚未通过来源、方向、兼容性和依赖图确认门：继续留在 `scd-reengineering`。

用户普通地要求继续已确认 Initiative，会授权当前安全 READY 波次，以及同一已确认图版本上的后续波次；它不授权实质范围变化、新图版本或高风险操作。

## 从实时项目事实出发

1. 阅读适用的 `AGENTS.md`、`CLAUDE.md`、仓库说明、实时 Initiative、子 Delivery Issues、拉取请求、默认分支、其他分支、工作树、共享契约和必需检查。
2. 确认精确的 Initiative 图版本已经确认且仍为规范版本。
3. 从实时跟踪器证据重建依赖图快照，并运行 `scd-project` 的 `scripts/validate-project-graph.mjs`。
4. 只接受已实例化、已确认的 `READY` Delivery Issues。拒绝陈旧版本、无效依赖图、`PLANNED` 占位节点、`BLOCKED` 节点、缺失 Issue 证据的节点，以及已在其他通道执行的节点。
5. 每个新波次和每次合并前重新读取状态。

不得根据提交、分支、已勾选任务、已合并拉取请求或实施者摘要推断 `DONE`。必须使用 Project 和 QuickDev 的完成契约。

启动通道、创建工作树、协调合并、恢复执行或报告项目完成前，阅读 `references/execution-contract.md`。

## 选择当前安全 READY 波次

从经过验证的实时依赖图确定性报告的所有 `READY` 节点开始。除非用户要求更窄或串行波次，否则在可用 Agent 槽和仓库策略允许范围内，选择所有可安全独立执行的 READY 节点。

应用用户明确覆盖：

- “只执行 Issue #N”：若该节点 READY，则选择它；
- “串行”：每次只选择一个 READY 节点；
- “最多并行 N 个”：波次上限为 N；
- 明确 Issue 列表：只选择其中 READY 的节点。

然后应用临时协调约束，例如文件或模块所有权重叠、共享生成产物、单一可变测试数据或环境、仓库策略或合并冲突风险。这些约束可以串行化 READY 节点，但不是因果依赖，不得作为伪造边写入 Project DAG。

启动前报告选中波次、延期的 READY 节点、协调理由和当前阻塞。默认安全波次无歧义时，不要要求用户手工选择节点。

## 启动隔离的 QuickDev 通道

对每个选中节点：

1. 同步目标基准分支；
2. 创建唯一的 Issue 关联分支和隔离工作树，记录精确资源；创建者父 Execute 是这些通道资源的清理所有者；
3. 只分配一个 Delivery Issue，并明确文件或模块所有权；
4. 告知执行通道可能有其他 Agent 同时工作，必须保留并适配他人变更，不得回退；
5. 调用 `scd-quickdev`，传入 Initiative、当前图版本、选中的 Delivery Issue、工作树，以及适用的产品、UX、架构和机器契约；
6. 要求普通任务局部检查、拉取请求和独立的新上下文行为验收；
7. 禁止实施兄弟 Issue、跨通道暂存、弱化验收、直接推送默认分支、修改生产环境或未经确认扩大范围。

活跃通道数量受可观察 Agent 容量约束。不得启动父进程无法监控、协调或停止的脱离后台工作。

无法建立隔离工作树或安全所有权时，串行化受影响节点。`scd-quickdev` 不可用时，把通道标为 `BLOCKED`；Execute 不得自行实施 Issue。

## 串行合并并解锁

开发可以并行，但符合条件的拉取请求必须逐个合并：

1. 确认通道仍对应选中的 Issue 和已确认图版本；
2. 要求 QuickDev 验收 `PASS`、仓库检查通过，并满足所有人工门；
3. 合并一个符合条件的拉取请求；
4. 同步基准分支；
5. 按 QuickDev 清理契约删除已合并通道的精确任务工作树、本地任务分支和远端任务分支，并记录清理证据；
6. 安全更新或变基剩余工作树；
7. 针对新基准重新运行证据可能改变的检查；
8. 清理完成后才按 QuickDev 契约关闭 Delivery Issue；
9. 重建并验证实时 Project 依赖图。

一次合并使兄弟通道的假设或证据失效时，暂停该通道，重新检查和验证。针对不同基准版本的绿色检查不能证明组装后项目。

通道工作树存在未提交状态时不得强制删除；该通道返回 `BLOCKED`，Delivery Issue 保持开放。父 Execute 不得把清理责任推回已经结束的 QuickDev 子通道。

只要图版本继续有效、没有实质决策或高风险门变化，就继续下一个安全 READY 波次。Initiative 完成、没有 READY 节点、某通道失败或阻塞全部有效进展，或必须重新确认时停止。

## 每次执行都以可行动交接结束

最终重算实时依赖图后，回复前先分类。不得只报告“没有 READY 节点”；必须说明本次执行是否结束、Initiative 是否结束，或需要哪个责任方行动。

| 状态 | 证据 | 必需交接 |
|---|---|---|
| `COMPLETE` | 依赖图有效；所有必需节点均为 `DONE`；必需集成验收通过。 | 报告 Initiative 完成，以及剩余人工门。 |
| `ROLLING_REPLAN_REQUIRED` | Initiative 有效且未结束；无 `READY` 节点；剩余可执行工作只有 `PLANNED` 占位节点。 | 列出每个占位节点及其阻塞。说明这不是执行失败，也不要求重做 Discovery。引导用户使用 `scd-project` 评审并确认下一批精确 Delivery Issue 契约和图版本；Execute 不得将其实例化。 |
| `EXTERNAL_OR_HUMAN_BLOCK` | 因具名权威、环境、依赖或人工门阻塞剩余工作，导致无 `READY` 节点。 | 写明阻塞证据、所需权限和负责人。不要为了隐藏阻塞而把用户送回 Project。 |
| `INVALID_OR_STALE_GRAPH` | Initiative 版本无效、陈旧、缺少已实例化 Issue 证据或不再规范。 | 写明失败的依赖图证据，并在任何执行恢复前返回 `scd-project` 修复或修订。 |

对于 `ROLLING_REPLAN_REQUIRED`，提供一段可直接复制的继续提示词，包含 Initiative 标识、已完成上游节点、具名计划节点及其阻塞。说明作为依据的 PRD 和当前产品范围继续有效，除非实时证据显示相反；不要暗示需要重启 `scd-discovery` 或 `scd-quickdev`。提示词可以要求 `scd-project` 展示下一个图版本供确认，但不得承诺确认前创建 Issue 或实施。

每个终止回复必须写明已完成波次、当前 Initiative 状态、上述分类、使用的证据，以及唯一下一行动；没有下一行动时明确说明。这是面向用户的交接，不是通知服务或持久调度器。

## 处理失败与重新规划

对每条通道分类：

- `PASS`：QuickDev 独立验收通过，Issue 可以完成；
- `FAIL`：验收已运行，观察结果违反 Issue 契约；
- `BLOCKED`：必需权限、依赖、环境、隔离或证据不可用。

出现 `FAIL` 或 `BLOCKED` 时，把直接证据记录到中文 Delivery Issue，阻塞其下游节点；只继续契约和证据仍有效的无关 READY 工作。改变的产品行为返回 Discovery，共享技术边界返回 Architecture，节点或边变化返回 Project。

不得无限重试、扩大范围、弱化验收或通过编辑 DAG 隐藏协调问题。

## 证明项目完成

Initiative 定义集成或发布门时，独立验收通过的子 Issues 不能证明组装后行为。其依赖进入 READY 后，把该门作为独立 Delivery Issue 通过 QuickDev 执行。

只有满足以下全部条件才能报告项目完成：

- 每个必需 Delivery Issue 都是 `DONE`；
- 当前已确认依赖图验证通过；
- 需要时，集成或发布 Issue 已通过；
- 没有必需验收项或高风险人工门仍开放。

## 不依赖调度器数据库恢复

从 Initiative 与图版本、实时子 Issues、拉取请求、独立验收证据、分支、工作树和已同步默认分支重建执行状态。本地任务记录只作为临时恢复提示。

不要添加租约、资源锁、执行数据库、自动重试、合并守护进程、部署自动化或另一个长期调度器。

## 资源

- `references/execution-contract.md`：执行权限、波次选择、通道隔离、合并协调、失败、集成和恢复。
