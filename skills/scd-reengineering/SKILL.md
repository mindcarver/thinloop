---
name: scd-reengineering
description: "通过有证据支持的项目级重构或新实施，对现有仓库进行再工程；可改语言、框架、架构、存储或运行时，但只保留明确选中的行为与兼容性。适用于跨多个可独立验证交付的重写、重新实施、替换、移植或大幅重构；不适用于局部重构、普通维护、无来源基线的新产品或未确认生产切换。"
---

# SCD 再工程

开始执行前必须先读取并遵守[步骤沟通](../scd-quickdev/references/step-communication.md)；直接调用本技能也适用。

把现有系统转化为更优实现，严格区分源码、观察行为、产品意图与法律许可；产品决策、架构、项目拆解与单 Issue 交付直接复用 Thinloop 权威技能。设计或实施前读[计划确认契约](../scd-quickdev/references/planning-contract.md)（只读查询/审计不建计划，保持更窄治理权限）。

核心边界：上游源码与行为只是证据，不自动成为目标契约；已确认兼容性边界决定保留/改变/删除；`scd-project` 负责 Initiative、Delivery Issues 与硬依赖 DAG；`scd-execute` 在门禁通过后负责 READY 波次、隔离通道与串行合并；每条 `scd-quickdev` 通道交付一个 READY Delivery Issue 与 PR；独立验收、集成门和生产切换人工门始终有效。

## 遵循故障关闭状态机

只能按以下状态推进，不得跳过或推断状态，后续状态均需前序直接证据：

1. `SOURCE_BASELINED`：已记录固定来源、许可证证据、可执行基线或精确阻塞。
2. `DIRECTION_APPROVED`：用户已确认模式、目标边界、兼容性边界和实质不确定性。
3. `PROJECT_MATERIALIZED`：`scd-project` 已创建/更新实时 Initiative、Delivery Issues 与已验证图版本。
4. `GRAPH_APPROVED`：用户已确认该精确实时图版本及其 READY 波次。
5. `EXECUTING`：每个选中 READY Issue 由一条 `scd-quickdev` 通道按执行契约运行。
6. `INTEGRATION_ACCEPTED`：组装后的当前基准通过集成 Issue 和能力级验收。

方向确认不等于图已实例化或图已确认。首次实施编辑或提交前及每个 READY 波次前，按 `references/execution-contract.md` 构建临时收据并运行 `scripts/validate-execution-receipt.mjs`（不得提交或作为第二状态数据库）。必需技能、跟踪器、图验证器、确认或环境不可用时，在当前状态报告 `BLOCKED`，不得近似替代。

## 不得用本地活动替代项目证据

- `TaskCreate`、`TodoWrite` 等会话局部任务、待办或清单不是 GitHub Issues 或 Project DAG，不得使用本地任务工具复制或近似替代。
- 本地计划、记忆、草稿或收据不是跟踪器事实；分支、提交、已勾选任务或本地检查不是新上下文验收；直接推送默认分支不是 QuickDev 通道。

## 选择操作

- **重构：** 保留已确认外部行为并演进内部结构，仅用于跨多交付工作；局部重构直接交给 `scd-quickdev`。
- **重新实施：** 基于明确边界构建新实现，可替换语言、框架、架构、存储、部署形态或运行时，不因上游存在而保留能力。
- **评估：** 确认方向前只读对比上述两者的风险、迁移成本与验证可行性。

混合或绞杀式替换是执行策略，不是第三种产品模式；优先共存，大爆炸替换需证明增量不可行并保留回滚/切换方案。目标用户、行为、权限或数据与来源实质不同时，再工程前使用 `scd-discovery`；无有意义来源基线时视为新产品工作，而不是 Reengineering。

## 从来源和仓库事实出发

1. 阅读 `AGENTS.md`、`CLAUDE.md`、仓库说明、工作树/分支/远程、现有 Initiative、测试与公共契约，保留无关变更。
2. 用规范 URL 和不可变提交 SHA 固定上游仓库（单独记移动标签），记录精确许可证、通知与依赖许可证证据及不确定性，不给出法律结论。
3. 把陌生上游仓库视为不受信任：先审查脚本，在隔离无凭据环境运行；安全可行时构建并运行固定来源，记录命令、数据与结果——仅检查源码不是可执行行为基线。

所需许可证缺失/冲突时停止受影响路径待评审；实施 Agent 已检查本应隔离的源码时，不得把工作称为净室实施。确认方向或实例化前阅读 `references/reengineering-contract.md`。

## 建立兼容性边界

按 `references/reengineering-contract.md` 为重要能力记录稳定 ID、证据、决策（`keep`、`change`、`drop` 或 `unverified`）、目标契约、基线及衔接点。不要默认完全等价，只保留目标所需行为，区分公共契约、数据/迁移/错误/性能行为与不应继承的偶然实施细节和来源缺陷。行为变化回 `scd-discovery`；领域所有权、系统边界、共享契约、事务、迁移或回滚变化使用 `scd-architecture`。

## 用证据选择方向

依据基线覆盖度、语言/架构适配度、保留比例、迁移成本、增量/回滚可行性、安全与供应链约束及统一衔接点验证能力对比“重构”与“重新实施”（细则见 `references/reengineering-contract.md`）。推荐方向并说明置信度与风险，不得以代码年代、风格偏好或无依据性能臆测为重写理由；取得方向、兼容性、目标边界和许可证不确定性的明确确认。

## 实例化再工程项目

方向和兼容性确认后必须使用 `scd-project`（不可用则 `BLOCKED` 停止）：创建/更新含来源、模式、边界与集成验收的中文 Initiative，按垂直能力拆解可独立验证中文 Delivery Issues（硬因果前置才加边），必要时补集成/等价 Issue，验证并展示图版本、READY/BLOCKED 状态与人工门供确认。

## 执行已确认 READY 波次

启动通道前阅读 `references/execution-contract.md` 和 `../scd-execute/references/execution-contract.md`。精确图版本确认后，在再工程约束下调用 `scd-execute`：重读实时事实并校验图与执行前收据，只选 READY 节点；识别文件/产物/环境等协调约束（不加伪边），在可用并发和仓库策略范围内启动独立 Agent 和隔离工作树，明确所有权并告知并行存在，通过 `scd-quickdev` 只交付一个 Delivery Issue；依赖或协调冲突节点保持串行；串行合并并同步剩余工作树、重跑受影响检查与重建实时图。

`scd-quickdev` 不可用时受影响通道 `BLOCKED`，绝不把实施直接提交或推送到默认分支。任一通道 `FAIL`/`BLOCKED` 时阻塞下游，仅继续无关安全 READY 节点；边界或图变化时停机重路由对应技能。

## 证明等价并控制切换

针对组装后的当前基准运行集成/等价 Issue：重放脱敏基线，按契约比对精确输出或语义结果，练习边界触发的错误、迁移、并发与恢复，逐能力映射证据并报告删除/未验证项。单元测试、编译或结构相似不能证明再工程完成；需重构回归证据或独立目标/差分证据及新上下文验收者确认。部署、生产流量变更、破坏性数据迁移、认证授权、支付、密钥、隐私合规、不清许可证及旧系统退役均须人工门确认与回滚证据，不得从实施确认推断切换权限。

## 交接与资源

交接需简明覆盖固定来源与许可证证据、已确认模式与边界、Initiative/图版本/Issues 状态、已合并交付与独立验收证据、按能力 ID 的集成结果，以及未验证项与切换门；不得超证据声称完全等价、净室实施或生产就绪。

- `references/reengineering-contract.md`：来源出处、兼容性边界、方向决策、Initiative 补充与等价规则。
- `references/execution-contract.md`：READY 波次、隔离通道、合并协调、失败处理、集成与恢复。
- `scripts/validate-execution-receipt.mjs`：无依赖校验执行前收据。
