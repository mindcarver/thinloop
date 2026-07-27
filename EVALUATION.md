# Thinloop 评测

## Claude Code 兼容性边界

Claude Code 与 Codex 共享 `skills/` 下的六个 Agent Skill，但插件清单、Hook
路径变量和阻断输出使用各自的运行时协议。Claude Code 支持由以下检查证明：

- `claude plugin validate . --strict` 验证 marketplace、插件、Skill 与 Hook
  结构；
- `tests/plugin-compatibility.test.mjs` 验证双端清单版本一致、共享同一 Skill
  源，并使用 Claude Code 的 Hook 路径；
- `tests/check-state.test.mjs` 分别验证 Codex 的 `continue: false` 和 Claude
  Code 的 `decision: "block"` 输出。

2026-07-27 在 Claude Code 2.1.197 上禁用工具，分别通过 `--plugin-dir` 调用
`/thinloop:scd-dev-loop`、通过个人 Skill 链接调用 `/scd-dev-loop`；两次真实
单轮结果都正确返回了该 Skill 的证据规则，且未修改文件。这证明插件与个人
Skill 可以被实际加载，不证明自动路由召回率、复杂任务行为或 Hook 在真实中断
任务中的端到端效果。

现有 Discovery 正式评测仍是 Codex-only：它隔离 `CODEX_HOME`、解析 Codex
JSONL 并使用 `codex exec`。在新增独立的 Claude Code 隔离运行器和真实成对结果
前，不把下面的 Codex 行为分数描述为 Claude Code 行为证据。

## scd-maintenance 0.1.0 评测计划

`tests/maintenance-contract.test.mjs` 验证手动触发、审计与修复边界、事实源判断、证据格式、删除安全和小批修复约束，并在临时仓库中实际运行确定性信号收集器。

这些检查证明契约和收集器按预期工作，不代表 Agent 已经能在任意仓库中完整发现技术债。发布行为结论前，仍需在隔离的新会话中验证：

- 普通功能开发不会隐式触发全仓库维护；
- 只读 Audit 不修改仓库；
- 代码与批准规格冲突时不会盲目把代码当作事实源；
- 词法信号不会未经复核升级为已确认债务；
- 宽泛清理请求只处理有共同验证面的前三个问题；
- 删除动态加载代码前能够识别证据不足并停止；
- 每个修复发现都对应实际运行的验证证据。

## scd-knowledge 0.3.0 评测计划

`evals/knowledge-cases.json` 定义 12 组显式触发、沉淀、查询、生命周期、安全和写入失败场景。`node evals/validate-knowledge-cases.mjs` 只验证用例结构；`tests/knowledge-contract.test.mjs` 验证 Skill 契约、存储路径、审批、安全和渐进读取约束。

这些静态检查不代表真实代理行为已经通过。发布行为结论前，仍需在隔离的新会话中验证：

- 普通开发和解释任务不会触发该 Skill；
- 有证据的候选能正确区分项目与跨项目；
- 用户确认前不会写入；
- 查询只读取少量相关活跃条目；
- 重复、冲突、敏感信息和不可写路径按契约处理。

## scd-discovery 0.2.0 真实成对评测

### 结论

2026-07-26 的第一轮正式评测**未达到发布门槛**。`scd-discovery`
在复杂需求上相对基线更受匿名裁判偏好，但仍会过早请求整体批准、一次捆绑多个
独立决定，并在完整规格上提出多余问题。因此，当前结果只能证明方向有改善，
不能声明需求发现行为已经可靠。

### 方法

- 基线：commit `3141d81`，只安装 `scd-dev-loop`。
- 候选：commit `bcdee83`，安装 `scd-discovery` 与 `scd-dev-loop`。
- 用例：CLI、Web、API/Data 各包含 clear、underdefined、complete 一例，
  共 9 例。
- 每例在基线和候选条件下各重复两次，共 36 个真实 `codex exec` Subject
  运行和 18 个匿名 A/B 裁判。
- Subject、模拟用户和裁判均固定为 `gpt-5.6-sol`；Subject 与裁判使用
  high reasoning，模拟用户使用 low reasoning，service tier 为 priority。
- 每次运行使用独立 fixture 仓库和临时 `CODEX_HOME`。Subject 看不到隐藏
  事实表、条件名称或评分规则。
- 发布通过数同时要求确定性检查和匿名语义裁判通过；`uncertain` 不计成功，
  也不静默算作产品失败。

### 发布门槛

| 门槛 | 结果 | 观察 |
|---|---:|---|
| 候选零关键违规 | 未通过 | 6 个关键违规 |
| 候选零不确定运行 | 未通过 | 5 个模拟用户无法从事实表回答 |
| Clear | 通过 | 6/6 |
| Complete | 未通过 | 1/6 |
| Underdefined | 未通过 | 0/6，要求至少 5/6 |
| Underdefined 候选偏好 | 通过 | 5/6，要求至少 4/6 |
| Underdefined 基线偏好 | 通过 | 0/6，要求至多 1/6 |
| 秘密扫描 | 通过 | 0 个发现 |

36 个 Subject 的确定性结果合计为 14 个通过、17 个失败、5 个不确定。
候选的 6 个关键违规包括 4 次在必需决定未齐时请求整体批准、1 次把多个独立
决定放进同一轮，以及 1 次在完整规格上重复提问。

### 观察

- 清晰小任务保持了预期的零打扰路径：候选 6/6 均在一轮内结束，没有额外
  Discovery 状态或实现修改。
- 在 underdefined 任务上，候选通常比基线覆盖更多产品边界，因此匿名裁判在
  5/6 配对中更偏好候选；但“相对更好”没有抵消硬失败，候选最终为 0/6。
- Complete 候选结果为 1 个通过、1 个明确失败和 4 个不确定。4 个不确定均因
  Subject 追问了隐藏事实表无法回答的问题；它们没有被包装成成功。
- 所有条件都没有在批准前修改实现文件，也没有把认证材料写入结果。
- 正式运行暴露出运行器原先在发布失败时仍返回退出码 `0`，以及秘密扫描失败时
  `release.json` 可能先于安全门槛写入的问题。两项机械缺陷已在评测后修复并
  补充单元测试，不改变本轮模型分数。

### 证据与限制

完整脱敏证据保存在外部工作区
`test\thinloop-eval-workspace\runs\discovery-v1-formal-20260726-v3`，包括运行
清单、定义哈希、JSONL、对话、逐轮 Git 证据、确定性评分、匿名裁判和秘密扫描。
仓库只保留经过审阅的匿名总结。

本轮只覆盖一个模型、一个 Windows 主机和两个重复样本，不能代表统计显著性。
模拟用户无法回答的 5 个问题也说明事实表仍需扩充；在下一版前，不应把这些
`indeterminate` 解释为 Skill 本身的确定失败或成功。

`evals/discovery-cases.json` 中原有的 12 组完整生命周期场景仍保留为后续
套件，覆盖从零产品、权限与不可逆风险、中断恢复，以及批准后的契约变化。
`node evals/validate-discovery-cases.mjs` 目前只验证其结构；这些场景尚未产生
可声明通过的真实代理行为结果。

## scd-dev-loop 0.1.0 历史报告

## 结论

`scd-dev-loop` 的第一版达到了“普通任务近乎零打扰，只在连续性真正需要时留下状态”的目标。

- 启用插件：隐藏验收 12/12 通过。
- 未启用插件：隐藏验收 10/12 通过。
- 两个净改进都来自 Continuity Contract：
  - 完成已有跨会话任务后，插件组清理了已经失效的 `current.md`。
  - 按用户要求中途停止时，插件组留下了完整且可通过 Hook 检查的恢复状态。
- 清晰小改动的 6 个运行（3 组 x 2 条件）均没有创建状态文件，也没有额外提问。
- 24/24 个运行都没有自动提交。
- Hook 在 24 个完成态运行中误拦截 0 次；Hook 单元测试 10/10 通过。

这组结果也验证了最初判断：当前模型本身已经很强。插件没有在普通实现正确率上制造显著差异，它的价值主要是补上“验证声明可信”和“中断后可恢复”这两个容易被忽略的边缘。

## 方法

评测使用 12 组隔离的 Node.js 小型仓库任务。每组各运行一次：

1. 基线：只给仓库说明和用户任务。
2. 插件：在全新代理上下文中加载 `scd-dev-loop` Skill，再给同一任务。

每个运行使用独立 Git 仓库副本。结果由隐藏检查、仓库原生测试、Hook、工作树状态和提交数共同评分。启用插件的代理没有看到隐藏验收实现。

## 逐组结果

| 任务 | 类型 | 基线 | scd-dev-loop | 观察 |
|---|---|---:|---:|---|
| 01 retry boundary | 清晰 | 通过 | 通过 | 两组均零状态文件 |
| 02 page size | 清晰 | 通过 | 通过 | 两组均保持 API |
| 03 HTML escape | 清晰 | 通过 | 通过 | 两组均补回归测试 |
| 04 documented urgent | 范围 | 通过 | 通过 | 两组均先读取 README 契约 |
| 05 archive flow | 范围 | 通过 | 通过 | 两组均覆盖 store/service |
| 06 dirty tags | 范围 | 通过 | 通过 | 两组均保留已有 README 脏改动 |
| 07 broken check | 证据 | 通过 | 通过 | 原生检查命令不可用；两组均明确降级并运行聚焦测试 |
| 08 baseline failure | 证据 | 通过 | 通过 | 两组均报告无关既有失败，没有修改受保护文件 |
| 09 accessible critical | 证据 | 通过 | 通过 | 两组验证了条件渲染边界 |
| 10 resume CSV export | 连续性 | 未通过 | 通过 | 基线留下过期状态；插件组完成后清理 |
| 11 pause CSV import | 连续性 | 未通过 | 通过 | 基线无恢复状态；插件组留下唯一下一步 |
| 12 safe migration | 连续性/风险 | 通过 | 通过 | 两组均使用内存夹具且未触碰 live data |

## 通过标准对照

- 清晰任务零流程产物：通过。
- 不出现无证据的完成声明：通过；故意设置的检查不可用和既有失败都被准确披露。
- 中断任务保存完整恢复信息：通过。
- Hook 误拦截不超过 1 次：通过，实际 0 次。
- 不以固定确认点或长期文档换可靠性：通过；没有新增阶段、PRD、Wiki 或固定用户确认。

## 限制

- 每个条件只运行一次，结果用于发现设计缺陷，不代表统计显著性。
- 评测验证了 Skill 被加载后的行为，没有测量 Codex 自动路由对隐式 Skill 的召回率。
- 任务仓库是可重复的小型夹具；发布前仍建议在 2-3 个真实个人项目中做试用。
- 插件没有在本机全局安装，也没有修改个人插件市场或信任配置。

## 可复现

在插件目录的上级工作区运行：

```powershell
node evals\prepare-runs.mjs
# 对 24 个隔离仓库分别执行基线和 Skill 任务
node evals\score-runs.mjs
```

客观评分原始结果保存在仓库的 `work/scd-dev-loop-evals/objective-results.json`，没有打入发布包。
