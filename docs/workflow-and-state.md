# Thinloop 工作流与项目状态

[返回 README](../README.md)

Thinloop 只在复杂度真实出现时增加流程和产物。从 0 到 1 的新产品由
`.scd/product/prd.md` 保存产品级目标、MVP、`FR-*` 需求和成功指标；单交付由
GitHub Delivery Issue 保存切片边界和验收；多交付项目由 Initiative 保存交付
拓扑、各 Delivery Issue 保存自身切片。PR 保存实现、工程审阅、验证与回滚证据。

## 路由原则

`config/routing-kernel.json` 是八条路由的规范事实源，下方受控块由
`node scripts/sync-routing-kernel.mjs` 生成。具体 Skill 契约仍以各自
`SKILL.md` 为准。

<!-- thinloop-routing-kernel:start source=config/routing-kernel.json -->
1. **Next**：只问状态、阻塞或下一步 → `scd-next`：只读实时 Issue、PR、Initiative DAG 与验收证据，给出唯一下一行动。
2. **QuickDev**：清晰的单交付仓库变更 → `scd-quickdev`：以一个中文 Issue 为边界实现和验证；直接证据与独立验收通过后才合并，高风险动作仍需明确批准。
3. **Discovery**：产品结果仍不清楚，尤其是从 0 到 1 或多个相互依赖的产品决定 → `scd-discovery`。
4. **Project**：已批准的稳定结果包含多个可独立验证交付 → `scd-project`：只建立并校验 Initiative、Delivery Issues 与依赖 DAG，不执行实现。
5. **Execute**：已批准 Initiative 需要开始、继续、恢复或完成 → `scd-execute`：选择当前安全 READY 波次，每个 Issue 进入隔离 QuickDev 通道。
6. **Reengineering**：跨语言、框架、架构、存储或运行时替换，或项目级大幅重构 → `scd-reengineering`：先固定来源、兼容性与切换门，再消费批准的 DAG。
7. **条件设计**：只有真实复杂度需要时才加入设计：重要 Web 体验 → `scd-uiux`；领域、系统或共享接口边界 → `scd-architecture`。
8. **显式治理**：只有用户明确要求时才调用治理与个人能力：`scd-maintenance`、`scd-knowledge`、`scd-evolve`、`scd-interview`；普通开发不得自动触发。
<!-- thinloop-routing-kernel:end -->

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

QuickDev 的完成审计不把“任务勾完”当成交付。验收账要求每个验收标识有直接
`PASS` 证据；实施账要求每项任务为 `DONE`、`SUPERSEDED` 或 `N/A`，后两者
说明原因；交付账核对精确差异、必需检查、阻塞性评审、未知项和合并版本。任一账
未闭合时保持 Issue 开放。

实际差异修改页面、路由、组件交互、可见样式或响应式行为时，浏览器验收自动适用，
不依赖是否存在 UIUX 契约。关键旅程必须通过导航、按钮、表单等用户可见控件完成，
同时检查已触发状态、代表性视口、视觉对照、布局、控制台、网络和基础无障碍行为；
API 捷径、只打开首页、构建通过或静态截图都不能单独产生 `PASS`。

UIUX 的前端交接由三类互补事实组成：UX 契约负责行为、状态、响应式和无障碍；
项目内视觉产物负责具名视口中的布局、层级、密度和外观；共享机器契约负责数据、
操作、权限和错误。重要 UIUX 工作缺少主要界面或关键状态视觉图时保持 `draft`，
复杂交互缺少可练习原型时同样不能交接。重大新页面、整体改版和高成本视觉方向
取得一次用户确认后才能 `ready`；整体改版、高保真品牌表达或主观关键视觉验收
还会标记是否需要实现后最终视觉确认。普通页面仍由独立验收自主完成，不改变
QuickDev 默认免确认的实施流程。

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
QuickDev → 中文 Issue 默认继续 → 分支 → 开发与工程验收 → 完成审计 →（页面则浏览器验收）→ 独立验收 → PR → main 复核 → 关闭 Issue
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
