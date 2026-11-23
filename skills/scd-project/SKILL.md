---
name: scd-project
description: "在实施前把跨越多个可独立验证交付的已确认项目转化为 GitHub Initiative 和 Issue 级依赖 DAG。适用于需多个 Delivery Issues、硬前置依赖、滚动拆解或明确集成门的情形；产品未定先用 scd-discovery。不适用于一项连贯交付或仅因工作量大；本技能只维护跟踪器与依赖图并报告状态，不实施代码、启动 Agent、创建工作树、合并 PR 或运行执行循环。"
---

# SCD 项目规划

开始执行前必须先读取并遵守[步骤沟通](../scd-quickdev/references/step-communication.md)；直接调用本技能也适用。

把已确认多交付项目转化为跟踪器承载的紧凑交付图，就绪后停止（不授予实施权限）。设计或实施前读[计划确认契约](../scd-quickdev/references/planning-contract.md)（只读查询/审计不建计划，保持更窄治理权限）。

核心边界：已确认的全新产品 PRD 负责产品级愿景、范围与 `FR-*`；Initiative Issue 负责交付拓扑、共享协调决策、图版本与集成验收；每个 Delivery Issue 负责一个可独立验证切片的边界、验收、衔接点与追溯；PR 与独立验收保存交付证据；派生图快照只是协调视图，不是第二需求库或状态库。

## 选择最轻量且充分的路径

只有需要多个可独立验证的交付（通常各对应一个 Issue 和 PR）或硬依赖/集成门时使用 Project。以下情况不要使用 Project：一个 Issue 可以表达一项连贯结果及其验收；一个实质性答案即可使该 Issue 可执行；请求只是实施工作量大；未来想法不影响下一项交付。

一项清晰交付用 `scd-quickdev`；定义不足或产品级边界/规则/权限未定先使用 `scd-discovery`，核心确认后再返回。

## 从实时项目事实出发

1. 阅读 `AGENTS.md`、`CLAUDE.md`、仓库说明、现有 Issues/PR、UX/架构/接口契约与测试；全新产品还要读取默认分支已确认 `.scd/product/prd.md`。
2. 先查现有 Initiative 与 Issues 防重复，区分已确认决策、假设、延期与阻塞，报告 READY/DONE 前重读实时状态。
3. 高风险人工门继续受 `scd-quickdev` 约束；只有完成 QuickDev 独立验收与关闭的节点才算 DONE，不得凭复选框或已合并 PR 推断。全新产品不得从草稿、未提交或被取代 PRD 生成 READY 节点；现有产品使用仓库原生契约时注明权威来源，不人造新 PRD。

## 确定项目核心

从产品契约派生并只确认多交付共享协调决策（结果与用户、项目边界与非目标、共享语言/权限/数据所有权、共享体验/接口契约、项目集成验收）。仅当需要设计时调用 `scd-uiux` 或 `scd-architecture`，且不得悄悄改写 PRD；依赖共享接口的节点可执行前必须先统一接口。采用滚动拆解：只把下一批交付做精确，遥远想法延期或标为 PLANNED。

## 拆解交付切片

每个可执行节点必须是一个经过明确确认的中文 GitHub Delivery Issue，满足：单一可观察结果、明确范围内/范围外边界、稳定验收标识与外部验证衔接点、PRD 产品需列出已确认 PRD 版本和它实施的每个 `FR-*`、可由单个 QuickDev 分支/PR/独立验收通道完成。优先垂直切片而非前后端/文件分层任务。

契约未成熟时可以存在没有 Issue 的 PLANNED 占位节点（不可交 QuickDev）；子节点不足以证明组装行为时，增设依赖叶节点的集成或发布 Delivery Issue。对 PRD 管理的节点，若产品契约引用缺失、已确认版本无法从默认分支访问、某 `FR-*` 在该版本中不存在或切片与 PRD 矛盾，则不能进入 READY，直接将缺口返回 Discovery（不在 Project 修补产品范围）。

## 跨产物交叉就绪核对

拆解切片、确认依赖图或宣布任何 Delivery Issue 进入 `READY` 前，执行条件触发的跨产物交叉就绪核对（细则见 `references/project-contract.md`，不新增独立 Skill）：

- **条件触发**：仅当项目同时存在两类及以上上游权威产物（已确认 PRD、已就绪 UX 契约、已就绪 Architecture / 共享机器可读接口契约）时触发；单一产物时不触发且不得伪造空检查，缺少某类产物（如纯后端无 UX）时只核对已存在的产物对。
- **三向一致性核对**：
  1. **PRD (`FR-*`) ↔ UX**：面向用户的 `FR-*` 都在 UX 契约中落到界面族、旅程或稳定视觉 ID（`UI-*`），或标记有意非 UI，无漏项且未改写范围；
  2. **UX ↔ Architecture / 共享接口契约**：UX 所需展示字段、筛选/排序参数、用户操作、权限态与失败/空态/部分成功等错误语义，在共享接口契约中均有对应操作、字段与错误码且命名一致；
  3. **PRD (`FR-*`) ↔ Architecture / 共享接口契约**：后端、数据、权限或集成类 `FR-*` 均有对应系统边界、数据所有权与共享接口契约支撑。
- **缺口阻断与责任回流**：存在未对齐缺口（或相关设计契约仍为 `draft`）时，受影响 Delivery Issue **不得标为 `READY`**，必须保持 `BLOCKED`（将精确缺口写入既有 `blockers`，不改变 `validate-project-graph.mjs` 的 JSON Schema）或 `PLANNED`；按责任回流上游：产品范围或规则冲突回流 `scd-discovery`，体验与视觉缺口回流 `scd-uiux`，系统边界、数据所有权或共享接口契约缺口回流 `scd-architecture`。严禁在 `scd-project` 中凭猜测悄悄修补三方契约。

## 建模依赖 DAG

仅硬因果前置条件才建立有向边；不要把共享文件冲突、偏好顺序或潜在合并冲突伪装成依赖（记为协调说明）。确认或声称就绪前，按 `references/project-contract.md` 构建快照并运行 `scripts/validate-project-graph.mjs`，拒绝重复 ID、无效引用、自依赖、重复依赖和循环，直接采用验证器输出的 READY/BLOCKED/PLANNED/DONE 分类（Node.js 不可用则标为 `UNVERIFIED`）。

## 评审与确认

写入前先阅读 `references/project-contract.md`。展示紧凑中文确认摘要（含依据产品契约及版本、Initiative 边界与集成验收、各 Delivery Issue 结果/衔接点/`FR-*`、交叉核对与回流、因果边、PLANNED 原因、READY/BLOCKED/门禁），取得针对精确版本与子契约的明确确认（沉默或泛泛同意不构成确认）。

## 持久化 Initiative 与 Delivery Issues

随后创建/更新中文 Initiative Issue 与已确认中文 Delivery Issues，回写规范依赖图与子节点协调字段并重验快照，报告 READY/BLOCKED 集合后停止（保存持久计划引用，不建 Wiki、分支、工作树、PR 或实施清单；跟踪器不可用时报告阻塞，不用 `.scd/specs/` 替代）。

依赖完成、契约变化或切片过宽时重新规划：重读实时事实，节点/边/共享决策变化时递增图版本并更新受影响子节点（保留稳定验收 ID 与不受影响 DONE 证据，清理过时 PLANNED 节点）。新图版本、依赖边或共享技术方案等实质变化，即使产品行为不变也须展示差异并再次确认；已批准图内操作不重复询问。只问状态、就绪度或下一步而不改图时，路由至 `scd-next`。

## 交接，但不运行执行循环

Project 不得自动启动 Agent 或运行实施，不要添加租约、重试、并发槽、合并队列或长期调度器。用户选中单个 READY Delivery Issue 时交给 `scd-quickdev`；要求开始、继续、恢复或完成 Initiative 时把已验证图版本交给 `scd-execute`（`scd-execute` 是已确认 Initiative 的通用外部消费者，`scd-reengineering` 在通过来源、方向、兼容性、收据与等价门后组合该执行器，二者都不会授予 Project 执行权限）。`scd-next` 作为只读消费者可派生解释状态但不能修改图或契约。

## 资源

- `references/project-contract.md`：中文 Initiative/Delivery 模板、交叉核对、图快照 schema、状态派生与重新规划规则。
- `scripts/validate-project-graph.mjs`：无依赖 DAG 校验与确定性状态分类。
