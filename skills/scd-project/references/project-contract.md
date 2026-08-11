# 项目契约

多交付项目拆解使用本契约。它扩展但不替代 Discovery 和 QuickDev 的单 Issue 契约。

## 权威边界

| 产物 | 权威范围 |
|---|---|
| 已确认的全新产品 PRD | 产品愿景、用户、问题、MVP 范围、`FR-*` 需求和成功指标 |
| Initiative Issue | 交付拓扑、共享协调决策、图版本和项目集成验收 |
| Delivery Issue | 一个切片的边界、验收、验证衔接点和产品追溯 |
| UX 与 Architecture 产物 | 已确认产品契约内的体验与技术设计 |
| 拉取请求和验收证据 | 实施、工程检查和交付证明 |
| 已验证依赖图快照 | 从实时跟踪器状态派生的就绪视图 |

不要把 PRD 复制到 Initiative，不要把完整子验收复制到 Initiative，也不要让本地项目计划成为权威来源。Initiative 链接已确认产品契约和子 Issues；每个子 Issue 对 QuickDev 保持自包含。

## Initiative Issue

取得明确确认后，创建或更新一个中文 Initiative：

````markdown
## 结果

## 用户与问题

## 产品契约

- 权威来源：`.scd/product/prd.md`，或 <已确认的仓库原生契约>
- 已确认版本：<正整数或不可变版本>
- 默认分支证据：<提交或 URL>

## 项目边界

### 范围内

### 范围外

## 共享语言与不变量

## 共享决策与契约

## 项目失败与边界场景

## 项目验收

- [ ] P1：<可观察的跨切片结果>

## 交付图

```json
{
  "schemaVersion": 1,
  "revision": 1,
  "nodes": [
    {
      "id": "first-delivery",
      "issue": null,
      "contract": "planned",
      "delivery": "open",
      "humanGate": "clear",
      "dependsOn": [],
      "blockers": ["创建已确认的 Delivery Issue"]
    }
  ]
}
```

## 当前 READY

- 无

## 集成或发布门

- 不需要：<证据>，或
- 节点：<node-id> / Issue #<number>

## 假设

## 延期交付

## 重新规划记录

- 版本 1：<变更内容与原因>
````

省略空的可选章节。JSON 块必须保持机器可读且不含注释。Initiative 是依赖图拓扑的规范所有者。

## Delivery Issue

每个可执行图节点对应一个已确认的中文 Delivery Issue：

```markdown
## 结果

## 用户问题

## 产品追溯

- 权威来源：`.scd/product/prd.md`，或 <已确认的仓库原生契约>
- 已确认版本：<正整数或不可变版本>
- 需求：`FR-001`、……

## 项目协调

- Initiative：#<number>
- 节点：`<stable-kebab-case-id>`
- 图版本：<正整数>
- 依赖：无，或 #<number>、……
- 契约：APPROVED
- 当前图状态：READY、BLOCKED 或 DONE

## 范围内

## 范围外

## 已确认决策

## 失败与边界场景

## 验收条件

- [ ] A1：<可观察行为>

## 验证衔接点

## 实施任务

- [ ] QuickDev 检查仓库后细化

## 验证

- A1：尚未执行

## 未知项

- 无
```

当前图状态是同步的协调值。依赖前必须从实时 Initiative 和 Issue 证据重新计算。QuickDev 必须拒绝把 Initiative、PLANNED 占位节点或 BLOCKED Delivery Issue 当作实施来源。图版本变化时保留稳定验收标识。

对 PRD 管理的全新产品，存在以下任一情况时 Project 和 QuickDev 还必须拒绝 Delivery Issue：

- 引用的 PRD 版本未确认或无法从默认分支访问；
- 引用的任何 `FR-*` 标识在该版本中不存在；
- Issue 的结果、边界或验收与 PRD 矛盾；
- Issue 缺少产品追溯。

将这些缺口返回 Discovery。拆解或实施期间不得重新解释或悄悄修复产品契约。

### 全局壳层与跨路由组件分配

跨路由全局组件——壳层、页头、页脚、主导航和移动导航、主题和共享横幅——出现在所有路由上，但不属于任何单一路由族交付。当 Initiative 改变视觉处理、共享布局或全局框架时，每个受影响的全局组件必须明确列入至少一个交付节点的范围内枚举。“某个节点会顺手修复”不是有效分配，否则会造成无人负责的缺口。全局组件不需要变更时，也应明确记录该决策，不要直接省略。

## 依赖图快照

使用 `scripts/validate-project-graph.mjs` 验证以下 JSON 结构：

```json
{
  "schemaVersion": 1,
  "revision": 3,
  "nodes": [
    {
      "id": "shared-contract",
      "issue": 101,
      "contract": "approved",
      "delivery": "done",
      "humanGate": "clear",
      "dependsOn": [],
      "blockers": []
    },
    {
      "id": "user-journey",
      "issue": 102,
      "contract": "approved",
      "delivery": "open",
      "humanGate": "clear",
      "dependsOn": ["shared-contract"],
      "blockers": []
    },
    {
      "id": "later-admin-tools",
      "issue": null,
      "contract": "planned",
      "delivery": "open",
      "humanGate": "clear",
      "dependsOn": ["user-journey"],
      "blockers": ["产品规则尚未确认"]
    }
  ]
}
```

字段：

- `schemaVersion`：必须为 `1`；
- `revision`：正整数；项目节点、依赖或共享决策变化时递增；
- `id`：唯一且稳定的 kebab-case 节点 ID；
- `issue`：正整数 GitHub Issue 编号；仅 PLANNED 时可以为 `null`；
- `contract`：`planned` 或 `approved`；
- `delivery`：`open` 或 `done`；
- `humanGate`：`clear` 或 `waiting`；
- `dependsOn`：表示硬因果前置条件的唯一节点 ID；
- `blockers`：没有用依赖边表示的明确未解决阻塞。

快照不得包含实施任务、分支状态、隐藏推理、凭据或密钥。未知的顶层或节点字段会导致验证失败。

## 确定性状态

验证器按以下顺序派生状态：

1. `DONE`：交付为 `done` 且契约已确认；
2. `PLANNED`：契约尚未确认；
3. `BLOCKED`：人工门等待、存在明确阻塞，或任一依赖不是 DONE；
4. `READY`：已确认 Issue 没有剩余阻塞，且全部依赖 DONE。

已确认节点必须有 Issue 编号。PLANNED 占位节点不能进入 QuickDev。仅拉取请求合并不能使节点 DONE；必须遵守 QuickDev 的独立验收和 Issue 关闭契约。硬依赖不是 DONE 的 DONE 节点属于无效快照，不是有效完成状态。

使用文件运行验证器：

```bash
node skills/scd-project/scripts/validate-project-graph.mjs \
  --file /path/to/project-graph.json
```

也可以通过标准输入传入临时快照。不得把临时快照持久化为另一个需求来源。

## 确认与实例化

一次明确项目确认可以覆盖确认摘要中展示的精确 Initiative 版本和精确 Delivery Issue 契约，但不确认未具体说明的未来工作。

- 将已确认切片实例化为 Delivery Issue。
- 不成熟的未来切片保持 PLANNED 或延期。
- 只有结果、边界、验收和验证衔接点评审完成后，才把 PLANNED 提升为已确认。
- 人工门节点保持 BLOCKED，直到所需确认存在。
- 不要把项目确认解释为实施所有子节点的权限。

## 集成与发布节点

单个子节点验收无法证明完整项目行为时，增加集成或发布 Delivery Issue。把它视为普通节点，其依赖为适用的叶节点。

它的验收应通过组装后系统的外部衔接点，验证端到端行为、迁移、共享契约兼容性、可观测性或发布就绪度。不得通过汇总子节点复选框推断项目 PASS。

## 重新规划

任何就绪报告前：

1. 重新读取 Initiative 和受影响的 Delivery Issues；
2. 确认 DONE 节点具有实时 QuickDev 验收和关闭证据；
3. 重建并验证依赖图快照；
4. 更新 Initiative 图版本和受影响子节点的协调字段；
5. 只有产品契约变化时才请求确认；
6. 报告 READY 节点和精确 BLOCKED 原因。

不要维护第二套长期执行状态。未来外部执行器必须从相同 Initiative、Delivery Issues、拉取请求和验收证据重建视图。

## 明确非目标

本契约不定义：

- 执行循环或调度器；
- Project 自动执行 Agent、分支、工作树、拉取请求、合并或部署操作；
- 并发槽、租约、重试或分布式锁；
- 文件、函数或清单任务级依赖图；
- 一个 Delivery Issue 使用多条 QuickDev 实施通道。

外部技能只能在自己的已确认执行契约下消费该依赖图。`scd-execute` 是已确认 Initiative 的通用消费者。`scd-reengineering` 只有满足额外来源、兼容性、收据、等价和切换门后才组合 Execute。Project 本身始终不执行。
