---
managed_by: scd-quickdev
issue: https://github.com/example/eval/issues/11
status: active
updated_at: 2026-08-30T00:00:00Z
---

## 结果

CSV export returns one header row and one row per record.

## 边界

Only `src/export.mjs` is unfinished.

## 验收条件

- A1: `node --test` passes.

## 决策

Use `id,name` column order.

## 证据

The baseline test currently fails.

## 下一步行动

Implement `exportCsv` and run `node --test`.
