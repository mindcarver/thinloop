---
status: draft
created_at: 2026-11-08T13:12:15+08:00
updated_at: 2026-11-08T13:22:52+08:00
recorded_timezone: Asia/Shanghai
plan_approved_at: null
implementation_authorized_at: null
source_baseline: 2926993ee2d58b240bce30b621a74515bc88cd06
---

# Thinloop 先询问、留存计划与时间的改造草稿

## 当前状态

本文依据当前对话保存已确认方向和待选方案。用户已授权保存草稿并纳入 Git；完整实施计划尚未确认，未获开工批准。本文件的字段与组织方式是当前草稿记录方式，不代表未来技能模板已经定稿。

## 文档索引

- [requirements.md](requirements.md)：已确认需求与来源。
- [decisions.md](decisions.md)：Q1–Q12 的选择、原文依据与实际记录时间。
- 本文件：调查依据、待决定项和计划进度。
- [architecture.md](architecture.md)：D1–D8完整技术方案，待本轮审阅。
- [implementation.md](implementation.md)：T1–T5文件范围、顺序及A1–A6验收，待本轮批准开工。

## 已查明的现状

检查基线为 main 2926993（v0.18.2）。

- skills/scd-quickdev/SKILL.md 与 references/issue-delivery-contract.md 明确默认免确认，用户主动要求时才启用确认门。
- skills/scd-discovery/SKILL.md 允许清晰变更直接实施，以及漏答问题以临时假设解锁下游。
- skills/scd-architecture/SKILL.md 允许可逆技术细节自主决策；ready 代表工程就绪，不等于用户另行批准。
- Discovery、QuickDev、Project 多处禁止永久实施计划；当前主要由 GitHub Issue 保存任务。
- skills/scd-execute/SKILL.md 将普通「继续」解释为允许当前及同图版本后续波次。
- PRD 模板已有部分时间字段，架构/功能设计/UX 模板缺少统一时间与批准版本记录。
- 相关测试显式约束默认免确认及禁止永久计划，需与最终批准规则同步变更。
- .scd 已有设计、规格和演进记录受 Git 跟踪；当前 .gitignore 不忽略 .scd 或 .scd/plans。

## 当前待确认

Q1–Q12全部已有明确选择。请审阅architecture.md的D1–D8和implementation.md的T1–T5：共享契约/模板、适用技能边界、文件命名、文档状态、Git批准关联、时间字段、临时忽略清单、旧任务恢复、具体修改范围、版本0.19.0与验收交付方式。

它们是完整候选方案，尚未批准实施。用户可以逐项修改，或明确确认当前Git版本的完整方案并授权开工。若只确认方案而未授权开工，则继续停留在规划。

## 计划约束

- 采用用户选择的10B：技能规则与检查清单，不新增运行时校验器或Hook。
- 采用11A：Git历史追溯，不复制版本目录。
- 采用12A：保留现有产品/系统基线位置，通过引用与增量衔接。
- 本次仅提交计划文档；产品技能行为及客户端尚未变更。

## 变更记录

- 2026-11-08T13:12:15+08:00：首次保存用户已确认的六项方向、当前源码依据与待决定问题。只新增本计划文档，未修改技能行为或客户端。

- 2026-11-08T13:16:03+08:00：记录Q7=B、Q8=B、Q9=A；按已确认的按需分文档方式提取需求与决策记录，保留初始草稿Git历史；列出Q10–Q12待选技术方案。

- 2026-11-08T13:22:52+08:00：记录Q10=B、Q11=A、Q12=A；形成architecture.md和implementation.md完整候选方案，保持draft和未授权开工状态。
