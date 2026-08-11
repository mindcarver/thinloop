---
name: scd-next
description: "检查当前仓库的实时项目状态并建议唯一下一行动。适用于用户询问哪些工作已完成、进行中、未完成、READY、PLANNED 或受阻；询问 Issue、拉取请求、Initiative 或里程碑状态；或不知道如何继续或恢复。根据可用性读取 GitHub Issues、拉取请求、Initiative DAG、验收证据、分支、工作树和本地 Thinloop 状态。既适用于多 Issue Initiatives，也适用于普通 Issue 管理的仓库。默认保持只读：不创建或编辑 Issues、不修改依赖图、不开始实施、不合并，也不编造优先级、完成百分比或验收。"
---

# SCD 下一步

把模糊的“现在应该做什么？”转化为一个有证据支持的继续行动，不让用户自己重建项目状态或选择 Thinloop 技能。

Next 被调用时执行一次主动、只读检查。它不是后台通知器、守护进程、调度器、项目数据库或实施循环。

维护以下边界：

- `scd-next` 观察实时项目状态并建议一个下一行动；
- `scd-project` 创建或修订 Initiative、Delivery Issue 和依赖图契约；
- `scd-execute` 从已确认 Initiative 选择并执行安全 READY 波次；
- `scd-quickdev` 只交付一个选中 Issue；
- 权威跟踪器和验收契约决定完成状态。

## 选择范围

优先使用用户具名的 Initiative、Issue、拉取请求或里程碑。没有具名范围时，按以下证据顺序解析：

1. 与当前分支关联的 Issue 或拉取请求；
2. 活跃 Thinloop 任务及其作为依据的 Issue 或 Initiative；
3. 仓库中唯一开放的 Initiative；
4. 仓库普通的开放 Issues 和拉取请求。

多个 Initiatives 或里程碑同样合理时，展示紧凑候选列表并只询问一个范围问题。不得根据最近时间、Issue 编号或标题措辞悄悄选择。

用户已经选择 Issue 并明确要求实施时，不要先运行只读状态检查，直接路由到负责交付的技能。

## 检查实时项目事实

解释状态前读取适用仓库说明。然后检查仓库权威跟踪器和足够的支持证据：

- 默认分支、当前分支或工作树；
- 范围内开放与关闭 Issues、标签、依赖、里程碑和明确优先级；
- 与这些 Issues 关联的开放、已合并和已关闭拉取请求；
- 存在 Initiative 时，其正文、已确认图版本、Delivery Issues 和集成门；
- 必需检查、评审、独立验收和人工门；
- 本地分支、工作树、提交和 `.scd/tasks/current.md` 只能作为支持证据。

分类或建议前阅读 `references/status-contract.md`。对于 Initiative，在依赖图载荷可用时使用 `scd-project` 验证器验证实时依赖图。不得从无效或陈旧图报告派生的 READY 或 DONE 状态。

无法读取权威跟踪器时，报告 `UNVERIFIED`，写明缺失来源，并把回答限制在真实观察事实。不得把本地提示提升为远程完成证据。

## 分类当前工作

把每个范围内事项放入且只放入一个面向用户的类别：

- `DONE`：权威关闭状态和必需验收证据满足作为依据的完成契约；
- `IN_FLIGHT`：开放拉取请求或活跃 Issue 关联通道直接证明正在交付，但尚未 DONE；
- `READY`：已确认且已实例化的 Issue，其全部硬依赖 DONE，且没有剩余门；
- `PLANNED`：预期工作已经具名，但可执行 Issue 契约或确认尚未实例化；
- `BLOCKED`：具名依赖、决策、权限、环境、失败检查或人工门阻止进展；
- `UNVERIFIED`：必需权威证据不可用或互相矛盾。

不得从提交、分支、已合并拉取请求、已勾选任务或 Agent 摘要单独推断 DONE。不得仅从陈旧分支推断 IN_FLIGHT。具名集成或发布门应与独立完成的子 Issues 分开。

只有完整实时范围和分类已知时，才能报告 `2/6 Delivery Issues DONE` 等精确数量。不得编造工作量、时间或完成百分比。

## 只建议一个下一行动

根据明确依赖、优先级和就绪证据选择：

| 观察状态 | 建议 |
|---|---|
| 一个或多个安全 Initiative 节点为 `READY` | 使用 `scd-execute` 执行当前安全 READY 波次。 |
| 用户选择了一个 `READY` Delivery Issue | 使用 `scd-quickdev` 交付该 Issue。 |
| Initiative 剩余工作只有 `PLANNED` | 使用 `scd-project` 评审并确认下一批精确 Issue 契约和图版本。 |
| 一个普通 Issue 明确为最高优先级且无阻塞 | 使用 `scd-quickdev` 交付该 Issue。 |
| 产品行为或验收仍未确定 | 使用 `scd-discovery`。 |
| 共享技术边界仍未确定 | 使用 `scd-architecture`。 |
| 人工或外部门阻塞工作 | 写明负责人和精确所需输入或确认。 |
| 所有必需事项和集成门均为 `DONE` | 报告完成；不建议实施行动。 |

多个 READY 普通 Issues 没有明确排序证据时，报告 `priority not established`，列出并列候选并让用户选择。不得通过猜测优先级制造唯一建议。

区分 Agent 下一步能做什么，以及用户必须做什么。不需要用户干预时明确说明。

## 报告导航快照

保持回复紧凑，只包含适用章节：

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

省略空状态章节，但绝不能省略“建议下一步”“原因”或“用户行动”。跟踪器提供标识和链接时一并列出。可复制提示词必须包含相关仓库、Initiative 或 Issue 标识，适用时包含图版本，并具名负责的 Thinloop 技能。

检查期间不得创建或更新 Issues、评论、标签、里程碑、项目图、分支、工作树、提交、拉取请求或本地状态。用户要求 Next 执行建议时，在目标技能权限下交接；本次只读调用本身不授权修改。

## 资源

- `references/status-contract.md`：证据权威、状态分类、建议顺序和输出要求。
