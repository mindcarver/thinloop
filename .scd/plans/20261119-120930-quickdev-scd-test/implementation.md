---
status: draft
version: 1
created_at: 2026-11-19T12:09:30+08:00
updated_at: 2026-11-19T12:09:30+08:00
recorded_timezone: Asia/Shanghai
---

# 具体方案、文件和验证安排

1. **开工前交接。** 在 `skills/scd-quickdev/SKILL.md` 的边界与计划阶段判断关键行为，命中后读取并执行 `../scd-test/SKILL.md` 的设计模式。既有批准计划中匹配当前范围的证据设计可直接复用。把关键场景放入现有需求与验证章节。更新 `skills/scd-quickdev/references/issue-delivery-contract.md` 让 Issue 引用批准场景并回填执行证据，无须维护第二份验收标准。
2. **合并前交接。** 在 `skills/scd-quickdev/references/release-contract.md` 明确向现有独立子 Agent 提供本次适用的 scd-test 路径、原始需求依据、获批版本、Issue、完整差异目标和环境。需要时沿用页面和高风险门。验收者须启动验收模式并实际复验，返回调用、目标、逐项证据与状态。实施者提供条件，验收者判断结果。合并门沿用准确候选的 PASS 要求，候选 HEAD 或相应验收基线变更时重验。
3. **说明和发布。** 修改 `config/routing-kernel.json` 的 QuickDev 入口摘要并用现有同步脚本生成 AGENTS.md、README.md、docs/workflow-and-state.md 和 .codex-plugin/plugin.json。README 与工作流说明按当前契约简述先设计后开工、合并前独立验收。发布为 v0.22.1，同步现有七份插件／市场清单、README、安装说明和新增的 `docs/releases/v0.22.1.md`。技能数量仍为 15。接入使用现有技能契约和独立验收，仓库保护、Hook 与依赖保持现行配置。
4. **隔离试跑。** 把可复用场景与运行办法放入 `evals/delivery/quickdev-scd-test-scenarios.md`。旧行为的实际历史基线、候选、冻结断言和补充直接探针在本地隔离重放。工具回归用另一个小型合成仓库，批准要求、测试和被测代码分别可读，候选只改变行为与断言，使用正确的治理 Issue，避免因无关差异或 Issue 错配被提前拒绝。测试以现有 Node、Git、ZCode 与本地模拟 Issue/PR 数据完成。模拟合并走本地仓库或记录器，观察是否真实读取两段技能、开工前的测试设计与独立委派、子 Agent 直接执行的返回值、父 Agent 合并动作和主分支状态。负例预期因行为退化返回 FAIL，不能把无独立工具或凭据的 BLOCKED 当成拦截实证。正例预期通过验收并可合并。用 `tests/quickdev-contract.test.mjs` 检查引用可解析和两阶段职责，实际行为结论来自回放。
5. **交付。** 运行仓库 Node 测试、版本／生成面检查和约定的 CI；对精确目标做独立验收，再按现有规则合并、同步 main、刷新已安装宿主、清理并关闭 Issue。正式发布 Tag 与修复历史应用都不是本次交付动作。

关键取舍已列入 v1：前置设计按关键行为条件触发，末端复用全部 QuickDev 现有的独立验收。使用技能交接和现有合并约束，验证 QuickDev 的实际决策及可观察动作。现有发布门由仓库和各宿主各自继续执行。
