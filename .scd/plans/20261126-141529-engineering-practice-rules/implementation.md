---
status: approved
version: 1
created_at: 2026-11-26T14:15:29+08:00
updated_at: 2026-11-26T14:17:39+08:00
approved_at: 2026-11-26T14:17:32+08:00
recorded_timezone: Asia/Shanghai
---

# 实施计划

## 目标文件与精确变更边界
1. **新建共享契约**：
   - `skills/scd-quickdev/references/engineering-practice.md`
2. **接入工程契约与最新文档规则**：
   - `skills/scd-quickdev/SKILL.md`（“按阶段加载”表格 + “实施与验收”新增指针）
   - `skills/scd-quickdev/references/planning-contract.md`（「先调查，再逐项确认」加入外部库/SDK/框架/协议锁版与最新官方文档核对及离线 `UNVERIFIED` 规则）
   - `skills/scd-quickdev/references/release-contract.md`（独立验收补充 `code-review` 6 条结构反模式核对与目标仓库静态检查）
   - `skills/scd-architecture/SKILL.md`（聚焦/产品架构入口加入 GitHub 同类基座检索指针、最新文档核对与 `engineering-practice.md` 模块/接口规则）
   - `skills/scd-architecture/references/architecture-contract.md`（新增开源基座 Build vs Adopt/Adapt 三级决策与依赖方向/ACL 约束）
   - `skills/scd-architecture/references/interface-contract.md`（补充境界一次解析内部可信、窄接口、锁与事务最小化及最新协议文档核对）
   - `skills/scd-architecture/references/readiness-review.md`（系统边界补充依赖方向/ACL/事务最小化与候选复核项）
   - `skills/scd-reengineering/SKILL.md`（补充复用 `engineering-practice.md` 边界与结构门）
   - `skills/scd-test/references/acceptance-audit.md`（第一步盲验中补充对照 `engineering-practice.md` §4 的 6 条结构反模式门禁）
3. **接入完整项目 GitHub 同类方案检索**：
   - `skills/scd-research/references/product-research.md`（「竞品与替代」将 GitHub 同类开源项目列为一等替代比较源）
   - `skills/scd-discovery/SKILL.md`（「先调查，再提问 / 确定交付切片」对全新产品/应用/插件/服务前置 GitHub 同类查重与三级选型用户确认，L0/L1 局部明确免除）
4. **新增契约测试（先红后绿 Red Mode）**：
   - `tests/engineering-practice-contract.test.mjs`
5. **版本面与发布文档（`v0.24.0`）**：
   - `.codex-plugin/plugin.json`、`.claude-plugin/{plugin,marketplace}.json`、`.codebuddy-plugin/{plugin,marketplace}.json`、`.zcode-plugin/plugin.json`、`marketplace.json`、`README.md`、`docs/installation.md`、新建 `docs/releases/v0.24.0.md`。

## 实施步骤与依赖顺序
1. **T1（已完成前置）**：创建隔离工作树 `work/wt-155`、分支 `feat/155-engineering-practice-rules`、`Issue #155` 与 L1 草稿计划。
2. **T2（Red Mode）**：获批并授权开工后，先编写 `tests/engineering-practice-contract.test.mjs`，运行 `node --test tests/engineering-practice-contract.test.mjs` 确认精准失败在目标契约缺失断言上。
3. **T3（实施规则）**：编写 `skills/scd-quickdev/references/engineering-practice.md` 并完成各相关 `SKILL.md` 与 `references/*.md` 精确接入；复跑全量测试与跨宿主链接兼容性校验。
4. **T4（升版与全检）**：同步更新 11 处 `0.24.0` 版本表面与 `docs/releases/v0.24.0.md`，运行 `check-version.mjs`、`sync-routing-kernel.mjs --check`、`evals/thinloop/validate.mjs`、`dry` 干跑与 `node --test tests/*.test.mjs`。
5. **T5（独立验收、合入与刷新）**：提交 PR 与候选完成审计，触发 CI 并调用独立 Blind-First 新上下文子 Agent（`PASS` 后合入 `main`），同步 `main`、刷新与验证本机宿主、关闭 `#155` 并清理工作树与分支。

## 主要风险与防退化护栏
- **防过度抽象/越界重构**：契约首段明令禁止为单次逻辑强造接口/工厂，且禁止修改 Issue 范围外存量模块；
- **防 `SKILL.md` 体积回流膨胀**：详细规则留在共享参考文件中，`SKILL.md` 仅放最小指针与触发条件（总字节受控在 `< 82,000 B`）；
- **中文载荷与现有测试兼容**：保持纯中文表达与规范机器标识，确保 `chinese-skill-payload.test.mjs`、`routing-kernel.test.mjs` 等原有 419+ 用例零回归。
