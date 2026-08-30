# Thinloop 当前版本三臂整体评测

这套评测比较同一模型、同一任务和同一隔离方式下的三种上下文条件：

- `native`：不安装 Thinloop，也不增加额外提示；
- `prompt`：不安装 Thinloop，只增加一段固定的“验证并保存进度”短提示；
- `thinloop`：安装当前工作树的全部规范 `scd-*` Skill，不增加短提示。

`manifest.json` 固定评测版本、三臂、七类任务、smoke 子集和公开指标。七类任务分别是清晰 Bug、定义不足功能、多 Issue 项目、中断恢复、无关脏改动、页面验收、测试绿但行为未闭合。

## 运行

无模型、无认证的定义与仪器检查：

```bash
node evals/thinloop/validate.mjs
node evals/thinloop/runner/run.mjs --mode dry
```

真实最小 smoke 固定运行 `false-completion-audit` 的三个条件，共三次 subject：

```bash
node evals/thinloop/runner/run.mjs --mode smoke --run-id <unique-id>
```

`full` 运行七类任务的全部三个条件。页面用例还必须用 `--browser-evidence <json>` 提供三个条件各自的真实交互观察；缺少时该用例直接 `BLOCKED`，不会用测试或源码检查替代浏览器：

```bash
node evals/thinloop/runner/run.mjs --mode full --run-id <unique-id> --browser-evidence <file>
```

可以用 `--case <id>`、`--conditions native,prompt,thinloop`、`--workspace <path>`、`--model <model>` 和 `--reasoning <effort>` 缩小诊断。Run ID 永不覆盖。

默认不估算成本。只有同时显式提供 `--input-price` 和 `--output-price`（每百万 Token 美元单价）时才计算 `costUsd`；否则只保存实际 Token，并把成本标为不可确认。

## 证据与重评分

每个真实运行保存：

- `manifest.json`：完整冻结的定义、源提交、模型和条件；
- `raw/` 与 `diffs/`：脱敏 subject 输出和仓库差异证据；
- `observations/`：公开评分器消费的脱敏事实；
- `summary.json` 与 `report.md`：逐任务和逐条件聚合；
- 秘密扫描结论包含在 summary/report 中。

临时 Codex Home 在每个 subject 后删除。重评分只读取冻结定义和 `observations/`，不需要模型、认证或原 fixture 仓库：

```bash
node evals/thinloop/runner/rescore.mjs --run <saved-run-directory>
```

结果区分：

- `PASS` / `FAIL`：subject 的行为验收结果；
- `BLOCKED`：认证、配额、模型进程或真实浏览器证据路径未完成；
- 整轮 `OBSERVED`：所选真实任务都产生了可评分观察且秘密扫描通过。

行为 `FAIL` 是评测数据，不会让一轮可复现评测本身失败。任何秘密发现让整轮 `FAIL`；任何必需路径 `BLOCKED` 让整轮 `BLOCKED`。单轮或单模型结果只支持对应 fixture 的描述性观察，不构成统计显著性或整体价值百分比。
