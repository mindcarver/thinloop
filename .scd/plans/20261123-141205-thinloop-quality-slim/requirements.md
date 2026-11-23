---
status: approved
version: 1
created_at: 2026-11-23T14:12:05+08:00
updated_at: 2026-11-23T14:17:30+08:00
recorded_timezone: Asia/Shanghai
---

# 需求与项目验收（Initiative v1）

## 项目目标与边界

对 Thinloop v0.22.1 实施系统性质量强化与轻量化演进，解决实测中暴露的 33 MB 未接入语料膨胀、小任务流程过重及 Squash Merge 阻断、测试验收防锚定与反模式盲区、UI/UX B 端误伤与量化核验缺失、跨产物一致性核对缺口、Antigravity 一等平台支持及指令 Token 税问题，并最终形成 `v0.23.0` 集成发布与三臂评测证据。

- **范围内**：D1–D8 八个可独立验证切片（UIUX 语料瘦身与检索修复、计划契约 L0/L1/L2 分级与 Squash Merge 兼容、`scd-test` 与独立验收升级、`scd-uiux` 与页面验收升级、`scd-project` 跨产物交叉就绪核对、Antigravity 一等支持、15 个 `SKILL.md` 指令瘦身去重、v0.23.0 集成发布与三臂评测）。
- **范围外**：不修改既有开放 Issue #122 和 #104；不引入 BMAD 拟人角色剧场或本地 Story 文件库；不新增第 16 个 Skill；不提交/清理仓库中既有无关未跟踪文件；不自动打 Git Release Tag 或强制安装缺失宿主。

## 项目级集成验收（P1–P4）

- **P1**：全部 D1–D7 Delivery Issues 通过独立验收、合并至 `main` 并完成清理关闭；依赖图经 `validate-project-graph.mjs` 确定性验证全绿。
- **P2**：`skills/scd-uiux` 体积从 35 MB 降至 2 MB 以内且全量 `node --test tests/*.test.mjs` 与 `scripts/check-version.mjs`、`scripts/sync-routing-kernel.mjs --check` 全部通过。
- **P3**：已安装宿主（ZCode、Claude Code、Codex、Antigravity）刷新并核验 `v0.23.0` 完整载荷与各自支持的 Hook（缺失环境或凭据的项诚实保持 `UNVERIFIED` / `BLOCKED`）。
- **P4**：在改造合并后的基线上执行 `evals/thinloop/` 其余 6 类任务三臂评测并更新 `EVALUATION.md`（若真实模型凭据或浏览器证据路径不可用，按评测契约诚实记为 `BLOCKED`，不伪造结论）。

## 八个 Delivery 切片与可观察验收

| 节点 | 切片范围 | 核心可观察验收 |
|---|---|---|
| D1 `uiux-corpus-slim` | 移除 `skills/scd-uiux/data/vendor/`（33 MB）与 10 个非 Web `stacks/` CSV（`avalonia/flutter/javafx/jetpack-compose/react-native/swiftui/uno/uwp/winui/wpf`）；更新 `THIRD-PARTY-NOTICES.md`；升级 `scripts/search.mjs` 中英关键词映射与 `SKILL.md` 英文检索指引。 | A1：`data/vendor/` 与 10 个非 Web CSV 已移除，保留 12 个 Web CSV，`skills/scd-uiux` ≤ 2 MB；A2：中文关键词（如“后台 暗色 表格”）与英文关键词运行 `search.mjs` 均能命中有效条目且不命中已删非 Web 栈；A3：相关单测与 `visual-quality-contract.test.mjs` 通过。 |
| D2 `planning-tiers-squash` | 修订 `planning-contract.md`、`release-contract.md`、`issue-delivery-contract.md`、`scd-quickdev/SKILL.md` 与对应契约测试：引入 L0/L1/L2 分级（L0 免建 6 模板 `.scd/plans/` 与双次计划提交，仍需先确认具体方案），并兼容仅允许 Squash Merge 的消费者仓库（以合并后 `main` 上的计划文件、批准记录与 PR 合并提交通过持久可达性检查）。 | A1：契约清晰定义 L0/L1/L2 适用边界且明确保留逐项技术确认底线；A2：Squash Merge 仓库具备明确、可执行的持久可达性放行路径而非一律 `BLOCKED`，普通 Merge 仓库保留历史 SHA 核对；A3：`planning-contract.test.mjs` 与 `quickdev-contract.test.mjs` 更新并通过。 |
| D3 `test-acceptance-upgrade` | 升级 `skills/scd-test/`（`SKILL.md`、`test-design.md`、`acceptance-audit.md`）与 `release-contract.md`、`evidence-contract.md`：Blind-First 先盲验后对账、`test-review` 5 条测试反模式审计、P0/P1/P2 风险分层、P0/缺陷先红后绿 ATDD、5 行条件触发式 NFR、非 P0/非高风险显式 `WAIVED` 出口、L0 纯文档/文案无行为改动免强制独立子 Agent（行为与页面改动仍强制）。 | A1：独立验收流程强制拆为 Blind-First 盲验 + 对账两步，并列出 5 条测试反模式门禁；A2：测试设计明确 P0/P1/P2、P0/缺陷先红后绿与 5 项触发式 NFR；A3：`WAIVED` 严格限定非 P0/非高风险且需用户明示批准记录，行为/页面改动保持强制独立子 Agent；A4：契约测试更新并通过。 |
| D4 `uiux-method-dom-audit` | 升级 `scd-uiux`（`SKILL.md`、`design-taste.md`、`visual-quality.md`、`visual-evidence.md`、`design-tokens.md`）、`scd-ui-polish/SKILL.md`、`page-acceptance.md`：分轨品味标准（展示/营销型 Web vs 高密度工具/工作台型 Web App）、Brownfield 存量令牌提取、带状态切换条的令牌驱动 HTML 原型默认配方，以及零依赖浏览器 DOM 量化探测脚本 `skills/scd-uiux/scripts/dom-audit.mjs` 及单测。 | A1：品味黑名单与八维阈值区分展示站与工作台两轨，解除对 B 端指标卡/标题比/桌面工具的误伤；A2：契约明确 Brownfield 令牌提取与带 `loading/empty/error/success/dark/mobile` 切换条的令牌驱动 HTML 原型规范；A3：`dom-audit.mjs` 无第三方依赖，能检出溢出、`<12px` 字号、`<44px` 触控区、标题跳级/多 `h1`、缺 `alt`/可访问名、断链图与对比度预警，并有针对正反例的自动单测通过。 |
| D5 `project-cross-readiness` | 在 `skills/scd-project/SKILL.md` 与 `references/project-contract.md` 增加跨产物交叉就绪核对（当项目存在 PRD、UX 或 Architecture/共享接口契约时，拆解和标 `READY` 前逐项核对 `FR-*` ↔ `UI-*` ↔ 共享接口操作/字段/错误态一致性，缺口回流责任技能）。 | A1：`scd-project` 与 `project-contract.md` 明确跨产物三方交叉核对清单与缺口回流规则；A2：`project-contract.test.mjs` 增补回归断言并通过。 |
| D6 `antigravity-first-class` | 将 Antigravity 2.0 正式纳入 Thinloop 支持平台：`hooks/check-state.mjs` 适配 Antigravity `Stop` 协议（camelCase `hookEventName` / `continuationActive` / `terminationReason`、`{"decision":"continue","reason":...}`）；更新 `config/platform-capabilities.json`、`scripts/verify-install.mjs`、`scripts/refresh-install.mjs`、`docs/installation.md` 与单测（含检测 `skills.json` 与全局插件防重复暴露）。 | A1：`check-state.mjs` 在 Antigravity `Stop` 协议下对 `NO_TOOL_CALL` + 不可恢复状态输出 `{"decision":"continue","reason":...}`，对 `USER_CANCELED`/`ERROR` 或 `continuationActive:true` 放行防循环，并有单测覆盖；A2：`platform-capabilities.json`、`verify-install.mjs`、`refresh-install.mjs` 与 `docs/installation.md` 完整覆盖 Antigravity 插件结构（`plugin.json`/`hooks.json`/仅路由内核的 `rules/AGENTS.md`/`skills` 软链）与单测。 |
| D7 `skill-instruction-slimming` | 在 D1–D5 全部合并后，对 15 个 `SKILL.md` 执行指令瘦身与跨文件重复规则去重，降低常驻入口字节数与 Token 税，同时保留所有契约红线与精确引用指针。 | A1：15 个 `SKILL.md` 总字节数较合并前可观测下降，且单文件超长主入口明显收敛；A2：全套仓库测试与 `sync-routing-kernel.mjs --check` 零退化通过；A3：记录瘦身前后逐文件字节数对照证据。 |
| D8 `eval-integration-release` | 集成与发布门：在 D1–D7 全量合并后提升版本至 `v0.23.0`（同步 11 个版本面 + 新增 `docs/releases/v0.23.0.md` + `docs/installation.md` 升级条目），验证全套测试与已安装宿主刷新，并在可用凭据下运行 `evals/thinloop/` 其余 6 类任务三臂评测并更新 `EVALUATION.md`。 | A1：`check-version.mjs` 与全量仓库测试全绿；A2：已安装 ZCode/Claude Code/Codex/Antigravity 按实测环境完成刷新核验（缺失项记 `UNVERIFIED`）；A3：`evals/thinloop/` 其余 6 类任务运行并写入脱敏观测或按实测边界诚实记 `BLOCKED`。 |
