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

不要把 PRD 复制到 Initiative，不要把完整子验收复制到 Initiative，计划负责方案及批准版本，Initiative负责执行拓扑与验收追踪。Initiative 链接已确认产品契约和子 Issues；每个子 Issue 对 QuickDev 保持自包含。

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

## 跨产物交叉就绪核对

在将多交付切片提交确认、验证依赖图或标为 `READY` 前，按条件执行跨产物交叉就绪核对（内嵌于 `scd-project`，不新增独立 Skill）。

### 条件触发与产物对范围

三类上游权威产物包括：已确认 PRD（或已确认的仓库原生产品契约，含 `FR-*` 需求）、已就绪 UX 契约（`status: ready`）、已就绪 Architecture / 共享机器可读接口契约（`status: ready`）。

- 仅当项目同时存在**两类及以上**上游权威产物时触发跨产物交叉就绪核对。
- 只有单一上游产物（例如仅存在已确认 PRD 且未启用 UX 与 Architecture）时不触发跨产物核对，不得伪造空检查。
- 缺少其中一类产物（例如纯后端项目无 UX，只有已确认 PRD 与已就绪 Architecture / 共享接口契约）时，只核对**已存在的产物对**，跳过未启用维度，不得伪造空检查。
- 若相关 UX 契约、Architecture 文档或共享接口契约已存在但仍处于 `status: draft`（未就绪），不得按已对齐放行，应将其视为跨产物缺口并阻断受影响节点。

### 三向一致性核对清单

对已存在的产物对逐项核对：

1. **PRD (`FR-*`) ↔ UX**：
   - 每条面向用户的 `FR-*` 都在 UX 契约中落到具体界面族、旅程或稳定视觉 ID（`UI-*`），或明确标记为有意非 UI；
   - 无 `FR-*` 漏项、无脱离产品依据的孤立界面，UX 未私自增删或改写已确认产品范围与验收条件；
   - 涉及视觉或布局变更的跨路由全局组件已按上节分配到具体交付节点。
2. **UX ↔ Architecture / 共享接口契约**：
   - UX 界面所需的展示字段、筛选/排序参数、分页与用户操作，在共享机器可读接口契约中均有对应的操作与请求/响应字段；
   - UX 声明的权限态（如无权限、角色/租户受限）与失败、空态、部分成功、校验失败、依赖失败等错误语义，在共享接口契约中均有可区分的状态、字段与稳定错误码；
   - 操作标识、字段名、状态值、错误码和业务术语在 UX 契约与共享接口契约之间完全一致，无命名或语义漂移。
3. **PRD (`FR-*`) ↔ Architecture / 共享接口契约**：
   - 每条后端、数据、权限或集成类 `FR-*` 均有对应的系统边界、组件职责、数据所有权、权限执行点与共享接口契约支撑；
   - 无无主业务规则、冲突的数据权威或未落地的外部集成边界。

### 缺口阻断 `READY` 与责任回流

发现任何跨产物未对齐缺口（例如某条 `FR-*` 无 UX 或接口承接，UX 声明的展示字段、筛选/排序参数、用户操作、权限态或失败/空态/部分成功错误语义在共享接口契约中缺失，三方术语或范围冲突，或引用的上游设计契约仍为 `draft`）时：

- 受影响的 Delivery Issue **不得标为 `READY`**，必须保持 `BLOCKED`（将精确缺口写入依赖图节点既有的 `blockers` 数组）或 `PLANNED`（切片契约未完成确认时）；
- 不改变 `scripts/validate-project-graph.mjs` 的 JSON Schema 字段集合，不新增顶层或节点字段，复用 `blockers` 与 `contract` 表达跨产物阻塞；
- 必须记录精确缺口（受影响节点 ID、缺失或冲突的 `FR-*` / 界面族或视觉 ID `UI-*` / 接口操作、字段或错误码、证据路径与责任归属）；
- 按最小责任边界回流对应上游技能：

| 缺口类别 | 责任回流技能 |
|---|---|
| 产品范围、业务规则、权限边界、验收矛盾或 `FR-*` 缺失/变更 | `scd-discovery` |
| 体验覆盖、界面族/旅程/视觉 ID（`UI-*`）、交互状态或 UX 契约未就绪 | `scd-uiux` |
| 系统边界、数据所有权、领域职责或共享机器可读接口契约（操作、字段、筛选/排序参数、权限态与错误码）缺口 | `scd-architecture` |

- **严禁越权修补**：严禁在 `scd-project` 中凭猜测悄悄修补产品契约、UX 契约或共享接口契约。上游责任技能补齐并重新确认/就绪后，再回到 Project 复核并重新计算依赖图。

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
- `blockers`：没有用依赖边表示的明确未解决阻塞（含跨产物交叉就绪核对发现的未对齐缺口）。

快照不得包含实施任务、分支状态、隐藏推理、凭据或密钥。未知的顶层或节点字段会导致验证失败。

## 确定性状态

验证器按以下顺序派生状态：

1. `DONE`：交付为 `done` 且契约已确认；
2. `PLANNED`：契约尚未确认；
3. `BLOCKED`：人工门等待、存在明确阻塞，或任一依赖不是 DONE；
4. `READY`：已确认 Issue 没有剩余阻塞，且全部依赖 DONE。

已确认节点必须有 Issue 编号。PLANNED 占位节点不能进入 QuickDev。仅拉取请求合并不能使节点 DONE；必须遵守 QuickDev 的独立验收和 Issue 关闭契约。硬依赖不是 DONE 的 DONE 节点属于无效快照，不是有效完成状态。触发跨产物交叉就绪核对且存在未对齐缺口时，受影响节点必须通过 `blockers` 保持 `BLOCKED`（或保持 `PLANNED`），不得标为 `READY`。

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
3. 上游 PRD、UX 契约或 Architecture / 共享接口契约发生变化时，按条件重跑跨产物交叉就绪核对；
4. 重建并验证依赖图快照；
5. 更新 Initiative 图版本和受影响子节点的协调字段；
6. 新图版本、依赖边或共享技术方案等实质变化也须确认，即使产品行为不变；已批准图内操作不重复询问；
7. 报告 READY 节点和精确 BLOCKED 原因。

不要维护第二套长期执行状态。未来外部执行器必须从相同 Initiative、Delivery Issues、拉取请求和验收证据重建视图。

## 明确非目标

本契约不定义：

- 执行循环或调度器；
- Project 自动执行 Agent、分支、工作树、拉取请求、合并或部署操作；
- 并发槽、租约、重试或分布式锁；
- 文件、函数或清单任务级依赖图；
- 一个 Delivery Issue 使用多条 QuickDev 实施通道。

外部技能只能在自己的已确认执行契约下消费该依赖图。`scd-execute` 是已确认 Initiative 的通用消费者。`scd-reengineering` 只有满足额外来源、兼容性、收据、等价和切换门后才组合 Execute。Project 本身始终不执行。

## 计划批准核对

按共享计划契约核对持久计划的精确Git版本、文件清单、实际用户批准依据和开工范围。ready不是用户批准；未答保持待定，未覆盖的技术选择或实质变化重新确认。只读审计/状态查询不创建计划，不替用户批准。
