---
status: approved
version: 1
created_at: 2026-11-09T23:18:34+08:00
updated_at: 2026-11-09T23:18:34+08:00
recorded_timezone: Asia/Shanghai
---

# 实施计划

1. 分支 delivery/123-design-tokens-assets
2. 下载 plugin87 main 分支 tokens/ 与 components/ 全部文件（git tree API 清点后逐个 raw 下载）
3. NOTICES 两节（plugin87 MIT，来源 URL，无改动声明）
4. 测试排除：collectPayloadFiles 跳过路径段 /data/；断言计数不变（79）
5. design-tokens.md 末尾加"数据资产与用法"段
6. 验证：node --test tests/*.test.mjs 全绿；隔离会话 A3
7. PR #123 → 独立验收 → 合并 → 关 Issue → 图版本 3
