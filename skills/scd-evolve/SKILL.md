---
name: scd-evolve
description: "诊断已完成或暂停的开发交互，并对真实使用过的 Thinloop 技能提出一项经过证据分级的改进。只有用户明确要求根据当前对话或提供的转录演进、改进或自优化 Thinloop，或明确确认实施此前提出的演进候选项时使用。"
---

# SCD 技能演进

开始执行前必须先读取并遵守[步骤沟通](../scd-quickdev/references/step-communication.md)；直接调用本技能也适用。

通过人工确认且可逆的试验改进 Thinloop，默认把对话证据视为不完整，不得仅因结果不佳重写技能。设计或实施前读[计划确认契约](../scd-quickdev/references/planning-contract.md)（只读查询/审计不建计划，保持更窄治理权限）。

## 触发与选择模式

只有用户明确调用 `scd-evolve` 或明确要求 Thinloop 分析交互改进自身时使用；普通开发期间、任务结束或通过 hook 均不得自动调用。不得搜索平台会话存储或日志，只分析可见交互、工具证据及用户提供的转录。

- **诊断并建议：** 确认前不得写入仓库，包括历史。
- **实施已确认候选项：** 仅当上下文含精确候选项且用户明确确认其候选 ID 时继续，写入前重解来源权威。
- **恢复中断试验：** 读脱敏历史与当前保留候选项；精确差异或回滚权缺失时不重建，以 `trial-unverified` 停止或索取缺失项。

## 诊断并建议

阅读 [diagnosis-contract.md](./references/diagnosis-contract.md) 后：

1. 将覆盖范围标为 `full-transcript`、`visible-context` 或 `partial`，列出交互中有证据证明确实使用的 Thinloop 技能（无则停止）。
2. 识别匹配信号与未观察信号，在 Thinloop 技能、Agent、需求、工具/环境、模型、第三方技能或证据不足间归因并保留竞争解释。
3. 最多提出一个同根因批次（优先单技能；多个 Thinloop 目标必须有明确耦合理由），分配稳定候选 ID（如 `EVO-20260727-trigger-routing`），按 [evolution-candidate.md](./assets/evolution-candidate.md) 展示精确 add/delete/replace 操作。
4. 请求用户确认或拒绝该候选 ID 后停止，不修改来源、历史、配置或版本。一个匹配信号即可提案，等级标为 `exploratory`、`supported` 或 `confirmed`，不夸大等级。

## 实施已确认候选项

阅读 [source-and-history-contract.md](./references/source-and-history-contract.md) 与 [trial-contract.md](./references/trial-contract.md) 后：

1. 核对确认包含未变动的精确候选 ID，并用 `node <scd-evolve-root>/scripts/resolve-source-root.mjs`（支持 `--root` / `--config`）从绝对路径或用户 `.scd/config.json` 的 `thinloop_source_root` 解析 Thinloop 检出（不从安装目录或插件缓存推断）；若候选文件有未提交冲突、非 Git 检出或指向缓存则停止。
2. 在仓库外临时准备脱敏 `proposed` 记录并用 `scripts/evolution-history.mjs append --root <authoritative-root> --record <sanitized-record.json>` 依次追加 `proposed` 与 `trial`；在仓库外快照候选拥有文件（禁止宽泛 Git reset/restore/checkout/clean），将精确批次交给 `scd-quickdev` 实施（不作相邻清理）。
3. 按变更种类验证：`instruction`/`trigger`/`workflow` 运行确定性检查与新隔离 Agent 前向会话；`script`/`format` 运行确定性测试（行为变化时补隔离会话）；`packaging`/`documentation` 运行清单、链接与内容检查。
4. 终态收口：全部通过则递增一个补丁版本、同步发布清单并重跑检查后追加 `accepted`；失败从快照恢复并追加 `reverted`；独立验证不可用追加 `trial-unverified` 报告缺口；用户拒绝则恢复并追加 `rejected`。清理临时快照后报告变更、历史、版本与盲区。除非单独授权，不得暂存、提交、推送、发布、部署、重装或修改消费者代码。

## 自演进、隐私与资源

`scd-evolve` 仅当历史中存在更早的不同独立运行（以 `source_run_id` 具名）时才可将自身作目标，严禁同运行中自诊自改。私有对话证据仅临时使用，绝不持久化原始对话、日志、项目名、绝对路径、源码或凭据（脱敏时设 `evidence_redacted: true`；脱敏消去依据则不实施）。

- [diagnosis-contract.md](./references/diagnosis-contract.md) / [source-and-history-contract.md](./references/source-and-history-contract.md) / [trial-contract.md](./references/trial-contract.md)
- [evolution-candidate.md](./assets/evolution-candidate.md) / `scripts/resolve-source-root.mjs` / `scripts/evolution-history.mjs`
