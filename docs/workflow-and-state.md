# Thinloop 工作流与项目状态

[返回 README](../README.md)

Thinloop 只在复杂度真实出现时增加流程和产物。GitHub Issue 是需求、任务和验收
的唯一真值源；PR 保存实现、工程审阅、验证与回滚证据。

## 路由原则

| 遇到什么 | Thinloop 怎么做 |
|---|---|
| 目标、边界和验收已经清楚 | 直接进入 QuickDev，不制造额外需求流程 |
| 多个上游产品决定仍会改变结果 | 用 Discovery 一次解决一个关键决定 |
| 体验或技术边界仍影响交付 | 按需调用 UIUX 或 Architecture，不设固定关卡 |
| 实现完成 | Agent 验证、自审、提 PR 并在工程闸门通过后合并 `main` |
| 合并完成 | Issue 保持 `awaiting-uat`，由用户只做真实使用验收 |
| 用户主动要求维护或沉淀 | 调用 Maintenance 或 Knowledge；普通开发不自动触发 |
| 用户主动要求优化 Thinloop | 调用 Evolve；先诊断和候选，按候选 ID 批准后才试验 |

默认不强制 TDD、角色系统、子代理或固定阶段。QuickDev 的实现请求包含任务内
Issue、分支、提交、推送、PR 与合资格合并；高风险合并和生产部署仍需明确授权。

## 工作闭环

```text
模糊任务 → Discovery → 批准 Issue →（按需 UIUX / Architecture）→ QuickDev
清晰任务 → 创建/确认 Issue ───────────────────────────────→ QuickDev
QuickDev → 分支 → 开发与工程验收 → PR → main → awaiting-uat → 真人使用验收
主动调用 → Maintenance / Knowledge
主动复盘 → Evolve → 候选 ID 审批 → 可回滚试验 → 证据
```

清晰任务从 QuickDev 直接开始；Maintenance、Knowledge 和 Evolve 只在用户
主动要求时出现。

## 最小项目状态

Thinloop 不创建项目 Wiki，只在需要时保留相应载体：

```text
.scd/
├── ux/                 # 按需：复杂 Web 体验
├── architecture.md     # 按需：系统基线
├── designs/            # 按需：高影响功能设计
├── knowledge/          # 主动沉淀的项目经验
├── evolution/          # 主动批准的 Skill 进化历史
└── tasks/current.md    # 未完成工作的一份临时状态

contracts/              # 按需：跨边界机器契约
```

仓库中已有的 `.scd/specs/` 文件仅保留为旧版本设计和评估历史；v0.7.0 开始的
新交付不会读取或创建本地产品规格。

## 权威契约

- [Discovery 产物契约](../skills/scd-discovery/references/artifacts.md)
- [QuickDev Issue 交付契约](../skills/scd-quickdev/references/issue-delivery-contract.md)
- [QuickDev 连续性契约](../skills/scd-quickdev/references/continuity-contract.md)
- [Architecture 契约](../skills/scd-architecture/references/architecture-contract.md)
- [Knowledge 存储契约](../skills/scd-knowledge/references/storage-contract.md)
- [Evolve 历史契约](../skills/scd-evolve/references/source-and-history-contract.md)
