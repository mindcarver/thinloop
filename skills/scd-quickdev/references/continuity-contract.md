# QuickDev 连续性契约

只有工作必须跨越当前上下文时使用本参考。

## 载体优先级

使用第一个适合的来源：

1. 作为依据的 GitHub Issue，保存需求、验收、任务和持久交付证据；
2. 现有架构、ADR、UX 或机器契约，保存其范围内的持久技术决策；
3. `.scd/tasks/current.md` 只作为本地恢复后备。

不得把整个 Issue、对话、源文件或命令日志复制到后备记录。只保存恢复所需增量。

## 后备结构

把 `assets/current-task.md` 复制到 `.scd/tasks/current.md` 并替换全部占位符。

frontmatter 必须包含：

```yaml
managed_by: scd-quickdev
issue: https://github.com/example/project/issues/123
status: active
updated_at: 2026-07-27T12:34:56+08:00
```

允许的状态：

- `active`：工作可以继续；
- `blocked`：需要具名输入或外部条件。

文档必须包含非空章节：

- `## 结果`
- `## 边界`
- `## 验收条件`
- `## 决策`
- `## 证据`
- `## 下一步行动`

引用 Issue 验收标识，不复制全文。只写一个具体下一行动。没有非显然决策时写“暂无”。证据可以说明尚未验证，但必须写明计划或受阻的检查。

## 生命周期

- 重要实施决策、有意义证据或下一行动变化后更新记录。
- 未完成回合结束前，让新 Agent 能够仅依赖 Issue、仓库和记录继续，无需对话转录。
- 受阻时写明缺失权限、输入或环境条件。
- 合并后把持久证据提升到 Issue 或拉取请求，再删除后备记录。
- 不得自动暂存、自动提交记录，也不得为其增加忽略规则。

## Hook 边界

内置 `PreCompact` 和 `Stop` hook 只检查标记为 `managed_by: scd-quickdev` 或 `managed_by: scd-discovery` 的 `.scd/tasks/current.md`。QuickDev 状态必须引用作为依据的 GitHub Issue。

旧的 `managed_by: scd-dev-loop` 状态会被阻止并显示迁移信息，避免改名后悄悄忽略未完成工作。

hook 验证结构和可恢复性。它不判断 Issue 是否正确、证据语义是否充分，也不判断普通任务是否应该创建本地状态。

hook 报告记录不完整时，更新记录并让生命周期事件重新运行。hook 无法检查状态时，发出警告并开放通过。
