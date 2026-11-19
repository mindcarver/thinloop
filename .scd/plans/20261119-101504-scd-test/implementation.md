---
status: draft
version: 1
created_at: 2026-11-19T10:15:04+08:00
updated_at: 2026-11-19T10:15:04+08:00
recorded_timezone: Asia/Shanghai
---

# 首版实施与验证

1. **T1 技能。** 创建 `skills/scd-test/SKILL.md`、`agents/openai.yaml`、`references/test-design.md` 和 `references/acceptance-audit.md`（后三项位于同一技能目录）。入口用中文描述和按需参考。设计模式先读来源、建立验收映射、选择能直接观察结果的最小层级；行为回归优先验证基线指定失败和候选通过。验收模式从批准引用和目标版本复核、审查断言变化、调用原生验证和必要的真实浏览器，最后逐项提交证据。复用当前步骤沟通、证据和页面规则；在首版保留 QuickDev 的编排与既有验收门。BMAD 的冻结情景与缺口审查、TEA 的断言追溯采用原创说明。
2. **T2 路由与目录。** 给 `config/routing-kernel.json` 增加独立 Test 路由，在 `scripts/sync-routing-kernel.mjs` 更新路由枚举与 15 项唯一覆盖，从源码生成 AGENTS.md、README.md、docs/workflow-and-state.md 和 .codex-plugin/plugin.json 的路由区。README 目录、生成器 `scripts/generate-readme-diagrams.mjs` 与相应新 SVG 同步新增技能。同步 `config/platform-capabilities.json` 和当前目录说明。QuickDev 不增加自动调用。
3. **T3 发布与打包。** 新增能力采用 v0.22.0。同步 `.codex-plugin/plugin.json`、`.claude-plugin/{plugin,marketplace}.json`、`.codebuddy-plugin/{plugin,marketplace}.json`、`.zcode-plugin/plugin.json`、`marketplace.json`、README 和 `docs/installation.md`，新增 `docs/releases/v0.22.0.md`。安装与验证文档、`.dsh-plugin/README.md`、当前行为评测 manifest 和对应结构回归随技能目录更新；历史运行和历史版本的观测不改写。交付目标为合并和本地更新，正式发布 Tag 不在本 Issue。
4. **T4 行为验证。** 在 `evals/delivery/scd-test-scenarios.md` 保存可复用的合成场景和预期，运行时在隔离副本提供实际计划、候选及可运行检查，保留判断与工具观察证据。设计例至少能看出「用户显式建立」这个约定，保留其验收 ID。验收正例应通过；保留原测试目标的基线通过，翻转为自动创建、同时改绿候选测试的反例仍失败；界面没有可运行的流式回复明确阻塞。专项至少用真实 ZCode 会话执行，且用独立新上下文验收复核。区分能力发现、真实调用与行为通过。结果不能用文案匹配或重复引用已有报告充数。复用已有 runner、测试环境与断言，不增加运行时校验器、外部包或 Hook。
5. **T5 常规交付。** 整套 Node 测试及 CI、路由/图生成/版本校验通过后，对照确切差异做独立验收。有 PASS 再走保留批准历史的 GitHub merge。核对合并后 main、安装负载和任务资源清理，验收、实施、交付三本账闭合后关 Issue。未观察到的必需行为或安装依然缺证时按仓库契约报告。

涉及当前目录数量的现有回归包括 routing-kernel、readme-product-surface、platform-capabilities、plugin-compatibility、chinese-skill-payload、opencode-compatibility、step-communication、thinloop-current-eval 及 ZCode 安装样本。更新受影响的现有断言，仅增加可发现性与行为所需覆盖。
