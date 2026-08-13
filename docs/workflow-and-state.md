# Thinloop 工作流与项目状态

[返回 README](../README.md)

Thinloop 只在复杂度真实出现时增加流程和产物。从 0 到 1 的新产品由
`.scd/product/prd.md` 保存产品级目标、MVP、`FR-*` 需求和成功指标；单交付由
GitHub Delivery Issue 保存切片边界和验收；多交付项目由 Initiative 保存交付
拓扑、各 Delivery Issue 保存自身切片。PR 保存实现、工程审阅、验证与回滚证据。

## 路由原则

| 遇到什么 | Thinloop 怎么做 |
|---|---|
| QuickDev 即将写 Issue 或开始实现 | 默认直接创建或更新中文 Issue 并自动继续；只有用户主动要求先看或先确认时才等待确认 |
| 目标、边界和验收已经清楚 | 直接进入 QuickDev，不制造额外需求流程 |
| 从 0 到 1，或多个上游产品决定仍会改变结果 | 用 Discovery 一次解决一个关键决定；新产品批准后形成轻量 PRD |
| 已批准目标跨越多个独立交付 | 用 Project 从 PRD/产品契约创建 Initiative、Delivery Issues 和依赖 DAG；不启动执行 loop |
| 已批准 Initiative 需要开始、继续、恢复或完成 | 用 Execute 复核实时 DAG，默认执行当前所有安全 READY Issues，也接受单 Issue、串行或并发上限覆盖 |
| 不清楚当前进度、未完成工作、阻塞或下一步 | 用 Next 只读检查实时 Issue、PR、Initiative DAG 和验收证据，给出唯一建议下一步和责任 Skill |
| 现有系统需要项目级重构或跨技术栈重新实现 | 用 Reengineering 固定上游、兼容边界和目标方向，再通过 Execute 消费批准的 Project DAG |
| 重要新页面、重要流程或整体改版需要设计 | 调用 UIUX；UX 契约、项目内 UI 图和必要原型一致后才可交接，重大视觉方向需要一次确认 |
| 技术边界仍影响交付 | 按需调用 Architecture，不设固定关卡 |
| 实现完成 | Agent 验证、自审并提交任务内变更 |
| 工程验证完成 | 一个独立 Agent 执行真实环境行为验收；只有验收 `PASS` 才能交付 |
| 用户主动要求维护或沉淀 | 调用 Maintenance 或 Knowledge；普通开发不自动触发 |
| 用户主动要求优化 Thinloop | 调用 Evolve；先诊断和候选，按候选 ID 批准后才试验 |

默认不强制 TDD、角色系统或固定阶段。Project 只拆解项目、校验 Issue 级 DAG
并报告 READY/BLOCKED，不启动 Agent、worktree 或长期 loop；Execute 消费批准
的图，把安全独立的 READY Issues 分配到隔离 QuickDev lanes，并让硬依赖和临时
协调冲突串行。Reengineering 在 Execute 外增加源码、兼容性、receipt、parity
和 cutover 门禁。Next 不修改上述图或启动实现，只在调用时从实时证据重建状态。
QuickDev 每个 lane 只固定使用一个独立验收 Agent，其实现请求包含任务内
Issue、分支、提交、推送、PR 与合资格合并；高风险合并和生产部署仍需明确授权。
Issue 是 QuickDev 的持久计划：默认免确认并自动继续；只有用户主动要求时才先确认
完整 Issue、实施方案和 tasks，此后任何实质性计划变化都要重新确认。
QuickDev 创建或更新的 Issue 标题、正文、验收、tasks 和验证记录统一使用中文，
但命令、路径、代码标识和机器状态保持规范原值。
十二个 Thinloop Skill 的说明、Agent 提示词、参考契约与模板也统一使用中文。

UIUX 的前端交接由三类互补事实组成：UX 契约负责行为、状态、响应式和无障碍；
项目内视觉产物负责具名视口中的布局、层级、密度和外观；共享机器契约负责数据、
操作、权限和错误。重要 UIUX 工作缺少主要界面或关键状态视觉图时保持 `draft`，
复杂交互缺少可练习原型时同样不能交接。重大新页面、整体改版和高成本视觉方向
取得一次用户确认后才能 `ready`；这不会改变 QuickDev 默认免确认的实施流程。

## 工作闭环

```text
模糊的现有产品单交付 → Discovery → 批准 Issue →（按需 UIUX / Architecture）→ QuickDev
从 0 到 1 → Discovery → 批准 PRD →（按需 UIUX / Architecture）→ Project 或 Delivery Issue
重要 UI → UIUX → UX 契约 + 项目内视觉交付 + 必要原型 →（重大设计确认）→ QuickDev
清晰单交付 → 创建/确认 Issue ─────────────────────────────────→ QuickDev
多交付项目 → 批准 PRD/产品契约 → Project → Initiative + Delivery Issue DAG
批准 Initiative → Execute → 当前安全 READY 波次 → 隔离 QuickDev lanes → 重算 DAG
已选 READY Delivery Issue ────────────────────────────────────→ QuickDev
不知道下一步 → Next → 实时状态分类 → 唯一建议 → Project / Execute / QuickDev / 其他责任 Skill
项目级重构/重写 → Reengineering → 基线与兼容边界 → Project DAG → Execute → QuickDev lanes
QuickDev → 默认继续或主动确认 → 中文 Issue 方案与 tasks → 分支 → 开发与工程验收 → 独立行为验收 → PR → main → 关闭 Issue
主动调用 → Maintenance / Knowledge
主动复盘 → Evolve → 候选 ID 审批 → 可回滚试验 → 证据
```

清晰任务从 QuickDev 直接开始；Project 只在多个独立交付真实存在时出现。用户
选择一个 READY Issue 时直接进入 QuickDev；用户说“开始/继续/恢复这个项目”时，
Execute 默认选择当前所有安全 READY 节点，并允许用户指定单 Issue、串行或最大
并发数。Reengineering 复用 Execute 的通用编排，但保留再工程专属门禁。
Next 只读回答“现在到哪、还有什么、接下来做什么”，不是后台提醒服务。
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
- [Execute 执行契约](../skills/scd-execute/references/execution-contract.md)
- [Next 状态导航契约](../skills/scd-next/references/status-contract.md)
- [QuickDev Issue 交付契约](../skills/scd-quickdev/references/issue-delivery-contract.md)
- [QuickDev 连续性契约](../skills/scd-quickdev/references/continuity-contract.md)
- [Architecture 契约](../skills/scd-architecture/references/architecture-contract.md)
- [Knowledge 存储契约](../skills/scd-knowledge/references/storage-contract.md)
- [Interview 面试题契约](../skills/scd-interview/references/interview-contract.md)
- [Evolve 历史契约](../skills/scd-evolve/references/source-and-history-contract.md)
- [Reengineering 再工程契约](../skills/scd-reengineering/references/reengineering-contract.md)
- [Reengineering 执行契约](../skills/scd-reengineering/references/execution-contract.md)
