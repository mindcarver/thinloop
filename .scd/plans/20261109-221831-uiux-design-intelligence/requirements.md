---
status: approved
version: 1
created_at: 2026-11-09T22:18:31+08:00
updated_at: 2026-11-09T22:18:31+08:00
recorded_timezone: Asia/Shanghai
---

# 需求

scd-uiux 是流程治理型技能，设计质量全部委托给八维检查表（验收框架），缺少生成侧设计智力，导致视觉产出回落均值。经对 plugin87/ux-ui-agent-skills、ui-ux-pro-max、BMAD WDS、apple-design-skill、superdesign-skill 五个高星项目的源码分析，确认补入以下能力（用户已逐项确认清单与优先级，P2 两项暂不实施）。

## P0

1. 新增 `skills/scd-uiux/references/design-taste.md`：生成前五项方向决策块（领域与气质/受众与语气/动效深度/布局族/参考锚点，命名不出不得生成）、反模式黑名单（等权重卡片、全居中、#000压#fff、emoji 图标、满投影、彩虹强调色、单侧彩条、营销空话文案，逐条含原因与替代）、移动优先基准。
2. 升级 `skills/scd-uiux/references/visual-quality.md` 八维表为"具体阈值+反模式"：对比≥4.5:1、触控≥44×44px、最大标题≥2.5×正文、行长 45–75ch、4px 间距阶梯、外距>内距、一个主色至多一个强调色；自审轮次记录增加方向决策与变更原因。

## P1

3. 新增 `skills/scd-uiux/references/design-tokens.md`：三层令牌（primitive→semantic→component，原始令牌禁止直接引用）、命名规范、暗色在语义层切换、语义结构与视觉样式分离。
4. `skills/scd-uiux/references/visual-evidence.md` 增加两阶段保真度循环：先讨论再画图；低保真只决结构与层级（禁谈字体颜色）；确认即冻结参考后再高保真。
5. `skills/scd-uiux/assets/ux-contract.md` 增加设计决策日志栏。

## 挂接

- `skills/scd-uiux/SKILL.md`「形成可实施的视觉交付」挂接 design-taste。
- `skills/scd-uiux/references/experience-contract.md`「视觉与组件纪律」挂接 design-tokens。

## 边界（不得超出）

- 不改治理流程、状态机、确认机制或与其他技能的分工。
- 不引入外部服务依赖、大型知识库或多 agent 人格体系。
- visual-quality.md 为 scd-ui-polish 与 quickdev 共用，只做增量升级，不破坏既有"八维"术语与共用契约。
- 验收：确定性检查（内部链接、共用文件一致性、行数约束、发布清单版本相等）+ 编辑后新起隔离会话用真实提示词前向测试；通过后补丁版本 0.20.0→0.20.1 并同步全部发布清单。
