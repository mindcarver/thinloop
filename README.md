# THINLOOP

![Thinloop：把复杂开发收束为清晰闭环](./assets/thinloop-retro-hero.png)

```text
┌──────────────────────────────────────────────────────────────┐
│  SCD / SIMPLIFY COMPLEX DEVELOPMENT                         │
│  BUILD 0.1.0 · CODEX DEVELOPMENT INSTRUMENT                 │
└──────────────────────────────────────────────────────────────┘
```

> 模型已经足够强。
>
> 我们需要的不是更重的流程，而是更可靠的结果。

Thinloop 是一个轻量 Codex 开发插件。它不规定固定阶段，不接管你的开发方式，只在真正重要的地方维护三个结果契约：

| 信号通道 | 它守住什么 | 默认表现 |
|---|---|---|
| `SCOPE` | 目标、边界和验收条件足以开始 | 只有实质歧义才询问 |
| `EVIDENCE` | 完成声明必须对应真实验证 | 无法验证时明确降级 |
| `CONTINUITY` | 中断后能恢复到正确下一步 | 只有必要时才保存状态 |

普通任务应该像拨动一枚机械开关：直接、安静、可预测。

---

## 01 / 它刻意不做什么

Thinloop 不是另一套庞大的开发方法论。

- 不强制 TDD。
- 不强制 PRD、角色分工或阶段播报。
- 不默认创建工作树、子代理或项目 Wiki。
- 不自动暂存、提交、推送或部署。
- 不因为一个小改动就生成计划和状态文件。

核心只有一个 Skill：

```text
scd-dev-loop
```

Scope、Evidence、Continuity 是它内部按需读取的参考契约，不会膨胀成一排需要手动选择的技能。

---

## 02 / 工作方式

```text
复杂请求
   │
   ├── 范围是否足够清楚？ ── 否 ──> 只问一个真正影响结果的问题
   │
   ├── 实现最小且完整的改动
   │
   ├── 运行当前风险下最强的实际验证
   │
   └── 是否可能跨会话？ ── 是 ──> 保存最小恢复状态
                                             │
                                             └── 完成后清理
```

验证证据按风险自适应：

```text
行为/回归测试
      ↓
类型检查 · 构建 · Lint
      ↓
真实运行 · API · UI
      ↓
静态检查 + 明确未验证边界
```

---

## 03 / 安装到 Codex

### Windows：推荐使用目录联接

开发中的仓库不需要复制。把 Skill 目录联接到 Codex，后续修改项目文件即可立即保持同步：

```powershell
$source = "C:\Users\Administrator\workspace\mindcarver\thinloop\skills\scd-dev-loop"
$target = "$env:USERPROFILE\.codex\skills\scd-dev-loop"

New-Item -ItemType Junction -Path $target -Target $source
```

验证联接：

```powershell
Get-Item -Force "$env:USERPROFILE\.codex\skills\scd-dev-loop" |
  Format-List FullName,LinkType,Target
```

> Codex 官方支持扫描软连接形式的 Skill 目录。新安装的 Skill 在下一次任务中可用。

需要显式调用时：

```text
使用 $scd-dev-loop 完成这个仓库改动。
```

正常情况下无需显式调用；Skill 描述会让 Codex 在功能实现、Bug 修复、重构、迁移和恢复未完成工作时自动选择它。

### 关于 Hook

Skill 目录联接能实时同步核心方法，但插件根目录中的 `PreCompact` / `Stop` Hook 只有在完整插件被启用并完成信任审查后才会加载。

Hook 是机械兜底，不是语义执行引擎。它只检查由 Thinloop 管理的：

```text
.ai/tasks/current.md
```

没有这个文件时直接放行；Hook 自身异常时也会放行并给出警告，避免死锁。

---

## 04 / 最小恢复状态

只有任务可能跨会话、多条验收路径需要分别完成、关键决策需要保留，或用户主动暂停时，才创建：

```yaml
managed_by: scd-dev-loop
status: active
updated_at: 2026-07-26T11:00:00+08:00
```

正文固定保存：

```text
Outcome
Boundaries
Acceptance
Decisions
Evidence
Next action
```

同一工作树最多一个 `current.md`。完成后保留长期有效的决策，删除临时恢复状态。

---

## 05 / 仓库结构

```text
thinloop/
├─ .codex-plugin/
│  └─ plugin.json
├─ assets/
│  └─ thinloop-retro-hero.png
├─ skills/
│  └─ scd-dev-loop/
│     ├─ SKILL.md
│     ├─ agents/openai.yaml
│     ├─ assets/current-task.md
│     └─ references/
├─ hooks/
│  ├─ hooks.json
│  └─ check-state.mjs
├─ tests/
└─ evals/
```

运行本地检查：

```powershell
node --test tests\check-state.test.mjs

py C:\Users\Administrator\.codex\skills\.system\skill-creator\scripts\quick_validate.py `
  skills\scd-dev-loop

py C:\Users\Administrator\.codex\skills\.system\plugin-creator\scripts\validate_plugin.py .
```

---

## 06 / 已有证据

第一版使用 12 组、24 次隔离任务做配对评测：

| 条件 | 隐藏验收 | Hook 误拦截 | 自动提交 |
|---|---:|---:|---:|
| 未启用 Thinloop | 10 / 12 | 0 | 0 |
| 启用 Thinloop | 12 / 12 | 0 | 0 |

清晰小改动保持零额外提问、零状态文件。净提升集中在连续性：

- 完成已有跨会话任务后，清理失效状态。
- 按要求中途停止时，留下完整且唯一的下一步。

完整方法与限制见 [EVALUATION.md](./EVALUATION.md)。

---

## 07 / 设计原则

```text
LESS CEREMONY.
STRONGER EVIDENCE.
CONTINUITY ONLY WHEN IT MATTERS.
```

中文就是：

> 少一点仪式，多一点证据；只在真正需要时保存连续性。

---

MIT License · 2026 mindcarver
