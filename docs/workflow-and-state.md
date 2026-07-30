# Thinloop 工作流与项目状态

[返回 README](../README.md)

Thinloop 只在复杂度真实出现时增加流程和产物。从 0 到 1 的新产品由
`.scd/product/prd.md` 保存产品级目标、MVP、`FR-*` 需求和成功指标；单交付由
GitHub Delivery Issue 保存切片边界和验收；多交付项目由 Initiative 保存交付
拓扑、各 Delivery Issue 保存自身切片。PR 保存实现、工程审阅、验证与回滚证据。

## 路由原则

| 遇到什么 | Thinloop 怎么做 |
|---|---|
| 目标、边界和验收已经清楚 | 直接进入 QuickDev，不制造额外需求流程 |
| 从 0 到 1，或多个上游产品决定仍会改变结果 | 用 Discovery 一次解决一个关键决定；新产品批准后形成轻量 PRD |
| 已批准目标跨越多个独立交付 | 用 Project 从 PRD/产品契约创建 Initiative、Delivery Issues 和依赖 DAG；不启动执行 loop |
| 现有系统需要项目级重构或跨技术栈重新实现 | 用 Reengineering 固定上游、兼容边界和目标方向，再消费批准的 Project DAG |
| 体验或技术边界仍影响交付 | 按需调用 UIUX 或 Architecture，不设固定关卡 |
| 实现完成 | Agent 验证、自审并提交任务内变更 |
| 工程验证完成 | 一个独立 Agent 优先通过 Open Code Review 审查 diff，通过后执行真实环境验收；只有 `REVIEW_PASS` 和验收 `PASS` 才能交付 |
| 用户主动要求维护或沉淀 | 调用 Maintenance 或 Knowledge；普通开发不自动触发 |
| 用户主动要求优化 Thinloop | 调用 Evolve；先诊断和候选，按候选 ID 批准后才试验 |

默认不强制 TDD、角色系统、额外子代理或固定阶段。Project 只拆解项目、校验
Issue 级 DAG 并报告 READY/BLOCKED，不启动 Agent、worktree 或长期 loop；
Reengineering 是限定于已批准再工程 Initiative 的外部执行器，可将安全独立的
READY Issues 分配到隔离 QuickDev lane，并让硬依赖串行。QuickDev 只固定使用
一个独立审查与验收 Agent。QuickDev 的实现请求包含任务内 Issue、
分支、提交、推送、PR 与合资格合并；高风险合并和生产部署仍需明确授权。

## 工作闭环

```text
模糊的现有产品单交付 → Discovery → 批准 Issue →（按需 UIUX / Architecture）→ QuickDev
从 0 到 1 → Discovery → 批准 PRD →（按需 UIUX / Architecture）→ Project 或 Delivery Issue
清晰单交付 → 创建/确认 Issue ─────────────────────────────────→ QuickDev
多交付项目 → 批准 PRD/产品契约 → Project → Initiative + Delivery Issue DAG → 停止
已选 READY Delivery Issue ────────────────────────────────────→ QuickDev
项目级重构/重写 → Reengineering → 基线与兼容边界 → Project DAG → READY 波次 → QuickDev lanes
QuickDev → 分支 → 开发与工程验收 → 独立代码审查 → 独立行为验收 → PR → main → 关闭 Issue
主动调用 → Maintenance / Knowledge
主动复盘 → Evolve → 候选 ID 审批 → 可回滚试验 → 证据
```

清晰任务从 QuickDev 直接开始；Project 只在多个独立交付真实存在时出现，并把
一个被明确选择的 READY Delivery Issue 交给 QuickDev。Reengineering 只消费
用户批准的项目级重构或重新实现图，不把普通 Project 变成自动执行器。
Maintenance、Knowledge 和 Evolve 只在用户主动要求时出现。

## 最小项目状态

Thinloop 不创建项目 Wiki，只在需要时保留相应载体：

```text
.scd/
├── product/prd.md      # 从 0 到 1：批准的轻量产品需求基线
├── ux/                 # 按需：复杂 Web 体验
├── architecture.md     # 按需：系统基线
├── designs/            # 按需：高影响功能设计
├── knowledge/          # 主动沉淀的项目经验
├── evolution/          # 主动批准的 Skill 进化历史
└── tasks/current.md    # 未完成工作的一份临时状态

contracts/              # 按需：跨边界机器契约
```

PRD 只管理产品级 why/what、MVP、`FR-*` 和成功指标。Project 的 Initiative、
Delivery Issues 和 DAG 位于 GitHub，不创建本地项目 Wiki、永久实施计划或
调度数据库，也不把 PRD 变成执行计划。

仓库中已有的 `.scd/specs/` 文件仅保留为旧版本设计和评估历史；普通新交付
不会读取或创建它们。`.scd/product/prd.md` 只用于批准后的绿地产品基线，不是
旧版按交付生成的 Spec。

## 权威契约

- [Discovery 产物契约](../skills/scd-discovery/references/artifacts.md)
- [Project 项目契约](../skills/scd-project/references/project-contract.md)
- [QuickDev Issue 交付契约](../skills/scd-quickdev/references/issue-delivery-contract.md)
- [QuickDev 连续性契约](../skills/scd-quickdev/references/continuity-contract.md)
- [Architecture 契约](../skills/scd-architecture/references/architecture-contract.md)
- [Knowledge 存储契约](../skills/scd-knowledge/references/storage-contract.md)
- [Evolve 历史契约](../skills/scd-evolve/references/source-and-history-contract.md)
- [Reengineering 再工程契约](../skills/scd-reengineering/references/reengineering-contract.md)
- [Reengineering 执行契约](../skills/scd-reengineering/references/execution-contract.md)
