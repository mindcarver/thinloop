---
status: approved
version: 1
created_at: 2026-11-09T23:18:34+08:00
updated_at: 2026-11-09T23:18:34+08:00
recorded_timezone: Asia/Shanghai
---

# 需求（来自 Issue #123 契约，APPROVED）

- data/tokens/ 收录 plugin87 14 个 DTCG 令牌 JSON；data/components/ 收录 11 份组件规范
- 建立 data/THIRD-PARTY-NOTICES.md（来源/许可/改动），本节点先写 tokens/components 两节
- tests/chinese-skill-payload.test.mjs 排除 skills/*/data/，authored 计数保持精确
- references/design-tokens.md 挂接数据路径并补组件规范用法段（中文）
- 验收 A1：14 令牌 JSON 可解析含 $type/$value；11 组件规范完整
- 验收 A2：全量测试绿
- 验收 A3：隔离会话从 data/tokens 给出按钮语义色具体值
