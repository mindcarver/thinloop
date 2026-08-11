# 再工程执行契约

本契约在 `scd-execute` 负责的通用 READY 波次机制上增加再工程的来源、兼容性、收据、等价和切换门。二者共同消费已确认 `scd-project` 依赖图，同时不把 Project 变成调度器，也不让一条 QuickDev 通道跨越多个 Delivery Issues。

## 执行权限

只有满足以下条件才能开始执行：

- 用户已确认精确 Initiative 图版本和已实例化 Delivery Issue 契约；
- 实时依赖图验证通过；
- 至少一个节点 READY；
- 这些节点的兼容性边界、目标契约和必需架构已就绪；
- 许可证、安全、隐私、数据和生产人工门不阻塞选中工作。

仅方向确认或创建 Initiative 不授权执行未具体说明的节点。

## 不可替代规则

以下证据类别不能互相替代：

- 会话局部任务、待办或清单不是 GitHub Issues；
- 本地计划、记忆或收据不是 Initiative；
- 实施包列表不是经过验证的依赖 DAG；
- 提交或直接推送默认分支不是 QuickDev 通道或拉取请求；
- 本地工程检查不是新上下文验收；
- 实施者完成摘要不是集成证据。

必需跟踪器或 Thinloop 依赖不可用时，把受影响转换分类为 `BLOCKED`。不得用更弱的本地产物替代。

## 验证执行前收据

首次实施编辑或提交前，重新读取实时跟踪器证据并构建临时快照：

```json
{
  "schemaVersion": 1,
  "phase": "GRAPH_APPROVED",
  "initiative": {
    "issue": 100,
    "url": "https://github.com/owner/repo/issues/100"
  },
  "graphRevision": 3,
  "trackerVerified": true,
  "graphValidated": true,
  "directionApproval": "用户直接确认的证据",
  "graphApproval": {
    "revision": 3,
    "evidence": "对图版本 3 的直接确认"
  },
  "requiredSkills": {
    "scdProject": "available",
    "scdQuickdev": "available"
  },
  "deliveryIssues": [
    {
      "nodeId": "baseline-harness",
      "issue": 101,
      "url": "https://github.com/owner/repo/issues/101",
      "state": "READY"
    }
  ],
  "readyWave": ["baseline-harness"],
  "blockers": []
}
```

运行：

```bash
node skills/scd-reengineering/scripts/validate-execution-receipt.mjs \
  --file <transient-receipt.json>
```

验证器只证明收据结构上可执行。执行者必须从实时 URL、图验证器、可用技能发现和直接确认取得每个字段，不得根据假设填写。不得提交收据或持久化为第二执行数据库。

任何验证错误都故障关闭。报告 `BLOCKED`，保留精确错误并返回负责状态。每个新 READY 波次前重建并重新验证收据，因为依赖图和 Issue 状态可能已经变化。

## 构建 READY 波次

从实时 GitHub 证据重新计算状态。先取得 `scd-project` 的确定性 READY 集合，再应用临时协调约束：

- 文件或模块所有权重叠；
- 共享生成文件或锁文件；
- 单一可变测试数据、数据库、服务、设备或外部环境；
- 会使并发证据不可靠的合并冲突风险；
- 主机并发限制。

协调约束可以串行化原本 READY 的节点，但不是硬因果依赖，不得作为伪造边写入 Project DAG。

选择最小有效波次。无法隔离时允许串行执行。

## 启动隔离通道

对并行波次中的每个节点：

1. 从已同步基准创建专用分支和隔离工作树；
2. 只分配一个 Delivery Issue；
3. 明确文件或模块所有权；
4. 告知执行 Agent 有其他 Agent 同时工作，必须保留并适配他人变更，不得回退；
5. 调用 `scd-quickdev`，传入 Initiative、图版本、Issue、已就绪架构/契约和基线测试数据；
6. 要求任务局部测试、完整差异评审、拉取请求和普通独立新上下文验收者；
7. 禁止实施兄弟 Issue、跨通道暂存、修改生产环境、弱化验收或直接推送默认分支。

波次受可用 Agent 槽和仓库策略约束。不得启动父进程无法观察和协调的后台工作。

## 合并并解锁

拉取请求可以并行开发，但必须逐个合并：

1. 确认通道仍对应当前 Issue 和图版本；
2. 等待必需检查和独立验收；
3. 合并一个符合条件的拉取请求；
4. 同步基准分支；
5. 安全更新或变基剩余工作树；
6. 重新运行受已合并共享状态影响的检查；
7. 只按 QuickDev 验收契约关闭 Delivery Issue；
8. 重建并验证 Project 依赖图，计算下一 READY 波次。

一次合并使兄弟通道假设失效时，暂停该通道，重新变基、检查和验证。不得把针对不同基准提交的并发绿色检查当作组装系统证据。

## 失败与重新规划

对每条通道分类：

- `PASS`：独立验收通过，交付可以完成；
- `FAIL`：验收已经练习并失败；
- `BLOCKED`：必需证据、权限、依赖或环境不可用。

出现 FAIL 或 BLOCKED 时：

- 停止下游节点；
- 只有契约与证据不受影响时才继续无关 READY 通道；
- 把直接证据记录到中文 Delivery Issue；
- 行为变化返回 Discovery，边界变化返回 Architecture，节点或边变化返回 Project；
- 拓扑或产品契约变化时，要求新的已确认图版本。

不得自动增加重试、扩大范围或弱化等价标准。

## 集成与等价门

独立验收的子节点无法证明组装结果时，使用专门集成 Delivery Issue。它通常依赖全部目标叶能力，并负责：

- 组装后的构建和运行时证据；
- 跨能力工作流；
- 差分基线重放；
- 迁移与共存检查；
- 已触发时的回滚演练；
- 最终按能力列出的 PASS/FAIL/UNVERIFIED/BLOCKED 报告。

集成验收者必须使用组装后的当前基准，不能使用子分支产物或实施者摘要。

## 中断后恢复

从以下事实重建执行状态：

- Initiative 和已验证图版本；
- 实时 Delivery Issue 状态和验收证据；
- 开放和已合并拉取请求；
- 当前分支和工作树；
- 权威 Issues 中的兼容性与集成证据。

不得从分支、提交、已勾选实施任务或已合并拉取请求单独推断 DONE。不要创建第二个长期执行数据库。
