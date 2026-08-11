---
name: scd-evolve
description: "诊断一段已完成或暂停的开发交互，并对真实使用过的 Thinloop 技能提出一项经过证据分级的改进。只有用户明确要求根据当前对话或提供的转录演进、改进或自优化 Thinloop，或明确确认实施此前提出的演进候选项时使用。"
---

# SCD 技能演进

通过人工确认且可逆的试验改进 Thinloop。默认把对话证据视为不完整，区分技能缺陷和其他原因；不得仅因结果令人失望就重写技能。

## 触发策略

只有用户明确调用 `scd-evolve`，或明确要求 Thinloop 分析交互并改进自身时使用。

普通开发期间、任务完成时、通过 hook，或 Agent 发现可能技能弱点时都不得自动调用。不得搜索平台会话存储或日志。只分析可见交互、其中可见工具证据，以及用户有意提供的转录。

## 选择模式

**诊断并建议：** 执行下方证据工作流。确认前不得写入仓库，包括历史。

**实施已确认候选项：** 只有当前对话包含精确候选项且用户明确确认其候选 ID 时继续。每次写入前重新解析来源权威并检查边界。

**恢复中断试验：** 阅读脱敏历史，以及当前上下文保留的明确候选项。精确差异或回滚所有权不可用时，不得从历史重建；以 `trial-unverified` 停止，或请求缺失候选项。

## 诊断并建议

1. 阅读 [diagnosis-contract.md](./references/diagnosis-contract.md)。
2. 把覆盖范围精确标为 `full-transcript`、`visible-context` 或 `partial`。
3. 列出交互中有证据证明确实使用的 Thinloop 技能。没有时报告不存在可编辑目标并停止。
4. 识别观察信号，区分匹配信号和相关但未观察到的信号。
5. 在 Thinloop 技能、Agent、需求、工具或环境、模型限制、第三方技能、证据不足之间归因，并保留竞争性解释。
6. 最多提出一个同根因批次。优先单一目标技能；多个 Thinloop 目标必须有明确耦合理由。
7. 分配稳定候选 ID，例如 `EVO-20260727-trigger-routing`。
8. 使用 [evolution-candidate.md](./assets/evolution-candidate.md) 展示候选项，包含精确且有边界的 add/delete/replace 操作。
9. 以请求用户确认或拒绝该候选 ID 结束。不得修改来源、历史、配置、版本或已安装技能。

一个匹配信号即可提出候选项。等级使用 `exploratory`、`supported` 或 `confirmed`；不得为弥补证据不完整而夸大等级。

## 实施已确认候选项

1. 确认用户确认中包含精确候选 ID，且候选项自展示后未变化。任一不满足则返回建议阶段。
2. 阅读 [source-and-history-contract.md](./references/source-and-history-contract.md) 和 [trial-contract.md](./references/trial-contract.md)。
3. 从明确绝对路径覆盖或用户级 `.scd/config.json` 的 `thinloop_source_root` 解析权威 Thinloop 检出：

   ```bash
   node <scd-evolve-root>/scripts/resolve-source-root.mjs
   ```

   明确调用覆盖使用 `--root <absolute-path>`，测试配置使用 `--config <absolute-config-path>`。不得从已安装技能路径或运行时插件缓存推断权威来源。
4. 检查 Git 状态和每个候选项拥有的文件。如果候选文件有重叠未提交变更、目标不是 Thinloop Git 检出或解析路径是插件缓存，写入前停止。
5. 准备脱敏 `proposed` 事件，并在不保存原始证据的情况下验证。通过确认门后依次追加 `proposed` 和 `trial`：

   ```bash
   node <authoritative-root>/skills/scd-evolve/scripts/evolution-history.mjs append \
     --root <authoritative-root> \
     --record <sanitized-record.json>
   ```

   脱敏记录保存在仓库外临时位置，追加结果确定后删除。
6. 只在仓库外临时位置快照候选项拥有的文件。不得使用宽泛 Git restore、reset、checkout 或 clean 命令。
7. 把精确的已确认批次交给 `scd-quickdev`。保留候选 ID、目标技能、操作和验收证据，不添加相邻清理。
8. 按变更种类验证：
   - `instruction`、`trigger` 或 `workflow`：运行相关确定性检查和新的隔离 Agent 会话前向测试；
   - `script` 或 `format`：运行相关确定性测试；只有 Agent 行为也变化时才使用隔离会话；
   - `packaging` 或 `documentation`：运行直接耦合的清单、链接和内容检查。
9. 根据观察证据决定：
   - 通过：只递增一个补丁版本，同步全部发布清单，重新运行相关测试；只有完整提升状态通过后才追加 `accepted`；
   - 失败：只从快照恢复候选项拥有的文件，并追加 `reverted`；
   - 必需独立验证不可用：追加 `trial-unverified`，保持试验未提升，报告精确缺口；
   - 用户在试验前或期间拒绝：追加 `rejected`，恢复所有试验拥有变更。
10. 达到已验证终止状态后删除临时快照。报告来源变更、历史状态、版本状态、检查和剩余盲区。

除非用户单独授权，不得暂存、提交、推送、发布、部署、重新安装、更新运行时缓存或编辑消费者项目代码。

## 自演进边界

`scd-evolve` 只有在已记录此前独立演进运行，并将其运行 ID 具名为 `source_run_id` 时才能把自身作为目标。当前诊断运行和来源运行必须不同。

同一运行中不得同时诊断并修改 `scd-evolve`。缺少此前记录代表自演进不具备资格，而不是置信度较低。

## 证据与隐私

私有对话证据只临时使用。仅持久化抽象信号类型、简短脱敏摘要、SHA-256 指纹、覆盖范围、归因、操作、验证结果和版本元数据。

绝不持久化原始对话文本、提示词、日志、消费者项目名称、绝对路径、源码、代码片段、用户数据、凭据、令牌或身份验证材料。需要脱敏时设置 `evidence_redacted: true`。脱敏会移除候选项依据时，不实施。

## 资源

- [diagnosis-contract.md](./references/diagnosis-contract.md)：证据覆盖、归因、信号和候选等级。
- [source-and-history-contract.md](./references/source-and-history-contract.md)：来源权威、配置、JSONL 生命周期和隐私规则。
- [trial-contract.md](./references/trial-contract.md)：确认、回滚、验证、提升和自演进。
- [evolution-candidate.md](./assets/evolution-candidate.md)：诊断与候选展示模板。
- `scripts/resolve-source-root.mjs`：只读权威检出解析器。
- `scripts/evolution-history.mjs`：无依赖历史验证器和原子追加器。
