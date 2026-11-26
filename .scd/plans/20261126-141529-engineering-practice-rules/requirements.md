---
status: approved
version: 1
created_at: 2026-11-26T14:15:29+08:00
updated_at: 2026-11-26T14:17:39+08:00
approved_at: 2026-11-26T14:17:32+08:00
recorded_timezone: Asia/Shanghai
---

# 需求与来源

## 来源
1. 用户请求（2026-11-26）：在 Thinloop 中增加通用工程最佳实践设计（使任意 Agent 在架构设计、接口设计、写代码时遵守高内聚低耦合等工程规则）；
2. 用户追加需求（2026-11-26）：
   - 设计完整项目时，先去 GitHub 检索同类功能实现，能用则用、否则适配或借鉴；
   - 开发新功能时优先查看最新官方文档；
3. 用户方向选择确认（2026-11-26）：`1A 2A 3A`。

## 范围约束
- **范围内**：
  - `skills/scd-quickdev/references/engineering-practice.md`（新建共享工程最佳实践契约）；
  - `skills/scd-research/references/product-research.md`、`skills/scd-discovery/SKILL.md`、`skills/scd-architecture/{SKILL.md,references/architecture-contract.md,references/interface-contract.md,references/readiness-review.md}`；
  - `skills/scd-quickdev/{SKILL.md,references/planning-contract.md,references/release-contract.md}`、`skills/scd-reengineering/SKILL.md`、`skills/scd-test/references/acceptance-audit.md`；
  - 新增 `tests/engineering-practice-contract.test.mjs`；
  - `v0.24.0` 全 11 处版本表面与 `docs/releases/v0.24.0.md`。
- **范围外**：
  - 不新增第 16 个 Skill（维持 `config/routing-kernel.json` 15 技能边界）；
  - 不借规则改造顺手重构仓库既有非相关脚本或删除无关未跟踪文件；
  - 不改动既有开放 Issue `#122`、`#104`；不擅自打 Tag 或发 Release。

## 开工前 `scd-test` 验收与测试设计矩阵（P0 / P1）

| 验收 ID | 风险级 | 起始状态与测试操作 | 预期可观察结果 | 关键反例与触发 NFR | 验证方式与 Red Mode |
| --- | --- | --- | --- | --- | --- |
| **A1** | `P0` | 检查 `engineering-practice.md` 与 `scd-quickdev`、`scd-architecture`、`scd-reengineering`、`scd-test/references/acceptance-audit.md` 在全部 10 种平台安装布局（symlink + copy）下的相对路径解析 | 全 10 平台解析到同一规范文件；正文包含 §1 模块高内聚/低耦合/单向依赖/ACL、§2 接口边界 Parse-Don't-Validate/窄接口/显式错误/事务最小化、§3 编码复用/早返回/清理/防过工程与防越界、§4 6 条结构反模式 | 反例：若缺失任意一节或任意消费端链接失效/指向不同路径或超界改写，断言失败；跨宿主布局兼容性校验 | 自动化 `tests/engineering-practice-contract.test.mjs`（先红后绿 Red Mode） |
| **A2** | `P0` | 校验 `scd-research/references/product-research.md`、`scd-discovery/SKILL.md`、`scd-architecture/SKILL.md` 与 `architecture-contract.md` | 完整项目/新系统/新模块设计要求先检索 GitHub 同类方案；提供 `直接复用/集成`、`Fork 适配`、`借鉴自研` 三级选型与许可证/维护/安全边界核对并交用户确认；L0/L1 局部小修显式不强制 | 反例：缺少三级选型确认门槛、缺少许可证/不信任代码隔离边界、或未豁免 L0/L1 局部小修 | 自动化 `tests/engineering-practice-contract.test.mjs`（先红后绿 Red Mode） |
| **A3** | `P0` | 校验 `planning-contract.md`、`engineering-practice.md`、`scd-architecture/SKILL.md` 与 `interface-contract.md` | 开发新功能/协议集成前要求先查本地锁版（`package.json`/lockfile 等）再查对应版本最新官方文档/类型源码并记版本与来源日期；离线/不可访问优先查本地源码并显式标 `UNVERIFIED`，严禁编造已读最新文档或私自升大版本 | 反例：只要求查文档但缺少锁版前提或离线 `UNVERIFIED` 诚实出口 | 自动化 `tests/engineering-practice-contract.test.mjs`（先红后绿 Red Mode） |
| **A4** | `P1` | 校验 `scd-test/references/acceptance-audit.md`、`release-contract.md` 与全部 15 个 `SKILL.md` 体积 | `acceptance-audit.md` 与 `release-contract.md` 在 Blind-First 流程中保留 `test-review` 5 条并接入 `code-review` 6 条结构反模式；15 个 `SKILL.md` 总字节 `< 82,000 B` | 反例：丢弃原有 Blind-First/受控 `WAIVED` 不变量，或把大段规范正文塞入 `SKILL.md` 造成回流膨胀 | 自动化 `tests/engineering-practice-contract.test.mjs` + 既有测试套件 |
| **A5** | `P1` | 全量运行仓库门禁脚本与单元测试 | `check-version.mjs --tag v0.24.0 --require-release-notes`、`sync-routing-kernel.mjs --check`、`evals/thinloop/validate.mjs`、`evals/thinloop/runner/run.mjs --mode dry` 与 `node --test tests/*.test.mjs` 全部 0 失败 | 反例：任意既有测试（含中文载荷、路由内核、步骤沟通、版本一致性）回归 | 真实 CLI 运行观察 |
| **A6** | `P1` | PR 通过 CI 与独立 Blind-First 验收后合并 `main`，执行本地宿主刷新 | `Codex`、`Claude Code`、`ZCode`、`Antigravity` 等刷新至 `0.24.0` 且 `verify-install.mjs` 无 FAIL / 无重复暴露 | 缺失/不受控宿主按契约记 `MANUAL` 或 `SKIP` | 真实安装探测输出 |
