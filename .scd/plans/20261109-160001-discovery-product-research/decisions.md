---
status: approved
version: 2
created_at: 2026-11-09T16:00:01+08:00
updated_at: 2026-11-09T16:50:08+08:00
recorded_timezone: Asia/Shanghai
---

# 决策与事件

## E1：用户请求（非具体方案批准）

- 类型：需求来源
- 原文：“我不需要你安装……把他的能力，内化到我的scd 技能里，可以完全参考，或者取可取的地方，我有的就不要加，我缺少的优化”。
- 解释：允许调查 pm-skills、对照 Thinloop 和提出缺口内化；不安装该外部插件。
- 任务范围：现有 SCD 的产品前期用户/竞品/假设验证能力。
- 文件及版本：本目录四份文档 v2 / draft。
- 目标Git SHA：`7da112df7d373d63c9ffb2e8dfedc12fee7215b9`（调查基线，非方案批准）。
- occurred_at：null（原消息精确时间不可得）。
- recorded_at：2026-11-09T16:00:01+08:00

## E2：用户确认独立技能

- 类型：产品组织决策（已确认）
- 原文：“我觉得还是单独会比较好点”。前文明确问题是是否创建新的 SCD 技能。
- 结论：采用独立技能，取代 v1 的“增强 Discovery、不新增技能”组织方案。
- 尚未确认：具体名称 scd-research、自动路由条件、交接规则、文件/版本/验证方案及该版本开工授权；这些均作为下面整版方案待确认项。
- 目标Git SHA：`981cbe1cbc5a1f2510b82e9b9e8b2ac834b9f113`（被修订的 v1 计划）。
- occurred_at：null（原消息精确时间不可得）。
- recorded_at：2026-11-09T16:42:23+08:00

## 待确认的推荐选择（可一次批准）

1. 新增 scd-research，研究方法独立放置；Discovery 只负责产品契约并消费研究结论。总目录 14 个技能、9 条规范路由。
2. 显式研究请求与缺乏关键机会证据的新产品进入 Research；已有依据、固定形态、明确跳过或清晰变更保持原快速路径。
3. 按 requirements.md R1–R5 落地用户/替代、竞品、证据、假设验证；只研究时就结束，不自动生成 PRD 或启动实施。
4. 按 implementation.md 的具体文件范围同步目录/路由/兼容性、0.20.0 版本，运行工程检查与独立行为场景；不改历史评测结果或运行旧 36 次完整评测。
5. 整版批准后创建中文 Issue，连续完成普通 Git/PR/合并和已安装宿主 Thinloop 刷新（含第 14 个技能）；不安装 phuryn/pm-skills 或缺失宿主。

v2 方案批准：尚未收到。v2 开工授权：尚未收到。已确认“独立”不等于批准尚未展示的全部具体选择。

## E3：v2 方案批准与开工授权

- 类型：批准与开工（用户明确合并授权）。
- 原文：“确认按 v2 方案开始实施，新增独立的 scd-research，完成验证和合并后同步更新本机已有的 SCD 技能。”
- 目标Git SHA：`515ade14d4e5e1b0543deb73bfd4b4b9d4aefafd`。
- 精确文件：本目录 plan.md、requirements.md、implementation.md、decisions.md，v2。
- 范围：v2 的 T1–T7、A1–A6，包括普通交付和本机已有 Thinloop 同步；不安装外部 pm-skills。
- occurred_at：null（消息精确时间不可得）。
- recorded_at：2026-11-09T16:50:08+08:00
- 未决选择：本版范围内无；实质变化另行确认。

## E4：实施与工程检查

- recorded_at：2026-11-09T16:55:45+08:00
- 方案：v2，批准版本 515ade14d4e5e1b0543deb73bfd4b4b9d4aefafd，Issue #118。
- 当前评测定义 evals/thinloop/manifest.json 的载荷技能表同步新增 scd-research，否则已有 dry-run 明确报目录不一致；属于第 14 个技能的必要目录同步，不改变历史冻结评测或评分器。
- 工程：369/369 测试通过，版本/路由/评测定义与 dry-run、交付协议、流程图和插件 strict validation 通过。Research/Discovery quick_validate 通过（uv 临时 PyYAML，不增加项目依赖）。
- 独立验收、远端 CI、合并、安装更新与资源清理尚待完成。
