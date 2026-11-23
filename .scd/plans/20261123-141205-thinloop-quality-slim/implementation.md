---
status: draft
version: 1
created_at: 2026-11-23T14:12:05+08:00
updated_at: 2026-11-23T14:12:05+08:00
recorded_timezone: Asia/Shanghai
---

# 项目交付拓扑与执行规划（DAG Revision 1）

## 规范依赖图（经 `validate-project-graph.mjs` 确定性验证）

因果前置关系（只对真实硬依赖建边；共享文件冲突记入下方协调说明，不伪造依赖边）：

- Wave 1（初始可 READY，5 个节点）：
  - `uiux-corpus-slim`（D1）
  - `planning-tiers-squash`（D2）
  - `uiux-method-dom-audit`（D4）
  - `project-cross-readiness`（D5）
  - `antigravity-first-class`（D6）
- Wave 2（解锁，1 个节点）：
  - `test-acceptance-upgrade`（D3）← 依赖 `planning-tiers-squash`（消费 D2 定义的 L0 分级与 `release-contract.md` 门禁规则）
- Wave 3（解锁，1 个节点）：
  - `skill-instruction-slimming`（D7）← 依赖 `uiux-corpus-slim`、`planning-tiers-squash`、`test-acceptance-upgrade`、`uiux-method-dom-audit`、`project-cross-readiness`（需待全部技能契约改动定型后再统一瘦身去重）
- Wave 4（集成与发布门，1 个节点）：
  - `eval-integration-release`（D8）← 依赖 `skill-instruction-slimming`、`antigravity-first-class`

```json
{
  "schemaVersion": 1,
  "revision": 1,
  "nodes": [
    {
      "id": "uiux-corpus-slim",
      "issue": null,
      "contract": "planned",
      "delivery": "open",
      "humanGate": "clear",
      "dependsOn": [],
      "blockers": ["等待项目方案确认并实例化 Delivery Issue"]
    },
    {
      "id": "planning-tiers-squash",
      "issue": null,
      "contract": "planned",
      "delivery": "open",
      "humanGate": "clear",
      "dependsOn": [],
      "blockers": ["等待项目方案确认并实例化 Delivery Issue"]
    },
    {
      "id": "test-acceptance-upgrade",
      "issue": null,
      "contract": "planned",
      "delivery": "open",
      "humanGate": "clear",
      "dependsOn": ["planning-tiers-squash"],
      "blockers": ["等待项目方案确认并实例化 Delivery Issue"]
    },
    {
      "id": "uiux-method-dom-audit",
      "issue": null,
      "contract": "planned",
      "delivery": "open",
      "humanGate": "clear",
      "dependsOn": [],
      "blockers": ["等待项目方案确认并实例化 Delivery Issue"]
    },
    {
      "id": "project-cross-readiness",
      "issue": null,
      "contract": "planned",
      "delivery": "open",
      "humanGate": "clear",
      "dependsOn": [],
      "blockers": ["等待项目方案确认并实例化 Delivery Issue"]
    },
    {
      "id": "antigravity-first-class",
      "issue": null,
      "contract": "planned",
      "delivery": "open",
      "humanGate": "clear",
      "dependsOn": [],
      "blockers": ["等待项目方案确认并实例化 Delivery Issue"]
    },
    {
      "id": "skill-instruction-slimming",
      "issue": null,
      "contract": "planned",
      "delivery": "open",
      "humanGate": "clear",
      "dependsOn": [
        "uiux-corpus-slim",
        "planning-tiers-squash",
        "test-acceptance-upgrade",
        "uiux-method-dom-audit",
        "project-cross-readiness"
      ],
      "blockers": ["等待项目方案确认并实例化 Delivery Issue"]
    },
    {
      "id": "eval-integration-release",
      "issue": null,
      "contract": "planned",
      "delivery": "open",
      "humanGate": "clear",
      "dependsOn": [
        "skill-instruction-slimming",
        "antigravity-first-class"
      ],
      "blockers": ["等待项目方案确认并实例化 Delivery Issue"]
    }
  ]
}
```

## 执行期协调说明（非硬依赖边）

- `uiux-corpus-slim`（D1）与 `uiux-method-dom-audit`（D4）均会修改 `skills/scd-uiux/SKILL.md`；在 `scd-execute` 调度 Wave 1 时建议先合并其一再变基另一方，或串行化这两个节点以减少合并冲突。
- 其余 Wave 1 节点（D2、D5、D6 与 D1/D4 之一）文件所有权完全隔离，可安全并行开发、逐个串行合并。
- D8 运行真实模型三臂评测涉及付费模型配额与本机运行时（Codex CLI 认证及浏览器证据），进入 D8 执行前先核对可用凭据与运行预算。

## 权限与交付边界

- 确认本计划与项目拓扑后，由 `scd-project` 在 GitHub 创建 1 个中文 Initiative + 8 个中文 Delivery Issues 并回填规范依赖图，然后停止（Project 不运行实现循环）。
- 只有用户明确授权开始执行（或按 `scd-execute` / 选中单个 READY Issue 交给 `scd-quickdev`）后，才进入编码、独立验收、PR 合并与清理。
