---
status: approved
version: 1
created_at: 2026-11-09T22:18:31+08:00
updated_at: 2026-11-09T22:18:31+08:00
recorded_timezone: Asia/Shanghai
---

# 实施计划

## 文件与顺序

| 序 | 文件 | 操作 | 依赖 |
|---|---|---|---|
| 1 | `skills/scd-uiux/references/design-taste.md` | 新建（约 70–100 行） | 无 |
| 2 | `skills/scd-uiux/references/design-tokens.md` | 新建（约 45–60 行） | 无 |
| 3 | `skills/scd-uiux/references/visual-quality.md` | 八维表加"阈值/反模式"双列；黑名单链接；轮次记录加方向决策与变更原因 | 1 |
| 4 | `skills/scd-uiux/references/visual-evidence.md` | 保真度表加两阶段行；新增"两阶段保真度循环"小节 | 1 |
| 5 | `skills/scd-uiux/references/experience-contract.md` | "视觉与组件纪律"挂接 design-tokens 一句 | 2 |
| 6 | `skills/scd-uiux/assets/ux-contract.md` | "视觉方向与系统增量"加方向块占位与设计决策日志栏 | 1、3 |
| 7 | `skills/scd-uiux/SKILL.md` | "形成可实施的视觉交付"挂接 design-taste 一句 | 1 |
| 8 | 发布清单（`.codex-plugin/plugin.json`、`.claude-plugin/plugin.json` 等 grep 确认全集） | 0.20.0→0.20.1 | 1–7 通过验证后 |

## 验证

1. 确定性：全部新增/修改文件的内部相对链接可解析；`grep -r "visual-quality"` 确认 scd-ui-polish/quickdev 引用不受破坏；八维术语保留；各文件行数在预算内；全部发布清单版本相等且无 0.20.0 残留。
2. 隔离会话前向测试（instruction+workflow 必需）：编辑后新起子代理，仅提供修改后技能路径与一个新页面设计简报提示词，期望：先产出五项方向块并排查黑名单，再生成视觉产物。
3. 交付门：PR 独立验收子代理返回 PASS；页面类变更不适用（本任务为技能文档，无页面交互）。

## 交付

分支 `evo/20261109-uiux-design-intelligence` → PR → 独立验收 PASS → 合并 → 同步本地 main → 按 Thinloop 交付默认核对已安装 ZCode / Claude Code / Codex 与合并后 main 一致（含仓库内变更的负载刷新）。

## 风险与停止条件

- 隔离会话测试失败：按 trial 契约从 `/tmp/thinloop-evo-20261109-snapshot` 恢复候选文件并追加 `reverted`，报告差距。
- 共用 visual-quality.md 的相邻技能行为回归：八维行名与"八维都要考虑；未触发维度记录 N/A"等共用语句保持原文不动，只增列与小节。
- 清单版本同步遗漏：以 `grep -rn '0\.20\.0'` 全仓核对归零。
