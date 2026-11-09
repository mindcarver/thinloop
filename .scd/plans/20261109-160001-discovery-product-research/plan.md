---
status: approved
version: 2
created_at: 2026-11-09T16:00:01+08:00
updated_at: 2026-11-09T16:58:17+08:00
recorded_timezone: Asia/Shanghai
---

# Discovery 产品研究内化方案

用户请求：参考 phuryn/pm-skills，把缺失的产品前期研究能力内化到现有 SCD；已有的不重复增加，不安装上游插件。

- 本任务是 Thinloop 的一个技能能力交付，不创建新的消费产品 PRD。
- 已确认选择：用户明确要求独立技能（E2），取代 v1 的增强 Discovery 方案。
- 方案文档：本目录 `requirements.md`、`implementation.md`、`decisions.md`，均为 v2 / draft。
- Thinloop 基线：`7da112df7d373d63c9ffb2e8dfedc12fee7215b9`，与调查时 origin/main 一致；版本 0.19.0。
- 上游参考：phuryn/pm-skills，`9af7bfd0bc47fdad43c2eaa7a43cd13918e7aaef`，MIT，Copyright (c) 2026 Pawel Huryn。
- 推荐方案：新增独立 scd-research，承担产品前期用户、竞品、替代方案和风险假设研究；scd-discovery 消费研究结论并定义产品。保留既有确认边界；技能目录由十三变为十四。
- 审批状态：用户已明确批准 v2 并授权实施、验证、合并和本机已有 SCD 同步，见 decisions.md E3。批准提交为 `515ade14d4e5e1b0543deb73bfd4b4b9d4aefafd`。
- 当前进度：技能、目录、路由、版本和场景已实现；工程检查已通过。独立验收、合并后客户端更新和关闭审计继续记录到 Issue #118。
- 交付跟踪：中文 Issue #118，PR #119；它们负责执行验收状态，本计划继续保留具体方案及批准版本。
