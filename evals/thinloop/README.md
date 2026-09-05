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

`full` 先运行七类任务的全部三个条件，包括页面实现。页面实现和源码/测试观察会保存下来，浏览器验收暂为 `BLOCKED`；不再接受实现前的 `--browser-evidence`：

```bash
node evals/thinloop/runner/run.mjs --mode full --run-id <unique-id>
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

临时 Codex Home 在每个 subject 后删除。页面用例采用两步流程：

1. 完成上面的 run，从 `observations/browser-form-acceptance--<condition>.json` 读取 `runId`、`caseId`、`condition`、`final.snapshotSha256` 和 `final.observedAt`。
2. 从该 run 的 `repositories/browser-form-acceptance--<condition>/public/` 启动静态服务。真实浏览器打开页面，填写 Ada，点击 Save，观察 Saved Ada；保存截图或 trace 到 run 之外的证据目录。采集期间不要修改 fixture。为每个已运行条件保存以下记录（用实际值替换示例）。`capturedAt` 必须晚于 `final.observedAt`，产物路径相对于这份 JSON 的目录，SHA-256 必须来自实际文件字节：

```json
{
  "schemaVersion": 2,
  "runId": "本次运行标识",
  "caseId": "browser-form-acceptance",
  "observations": [{
    "condition": "native",
    "snapshotSha256": "final.snapshotSha256 的值",
    "capturedAt": "实际采集时间 ISO 8601",
    "route": "http://127.0.0.1:4173/",
    "viewport": { "width": 1280, "height": 800 },
    "actions": ["fill #name with Ada", "click Save"],
    "visibleText": "Saved Ada",
    "consoleErrors": [],
    "failedRequests": [],
    "artifacts": [{ "path": "save.png", "sha256": "文件的 64 位小写 SHA-256" }]
  }]
}
```

```bash
shasum -a 256 /path/to/evidence/save.png
node evals/thinloop/runner/rescore.mjs --run <saved-run-directory> --browser-evidence /path/to/evidence/evidence.json
```

导入时必须保留原 fixture，当前文件快照必须与实现结束时一致。有效记录及文件被复制到 `browser-evidence/<runKey>/`；初始 observations 保留原始待验收事实，新的结果写入 `rescore.json` 和 `rescore-report.md`。旧 schema、跨运行/条件/代码快照、缺失/空/变更文件均不能通过。

后续离线重评分读取冻结定义、`observations/` 和冻结浏览器证据，每次重新验证绑定和文件内容，不信任原先的 `ok`。不需要模型、认证或原 fixture；fixture 仍存在时还会检查它未改变：

```bash
node evals/thinloop/runner/rescore.mjs --run <saved-run-directory>
```

结果区分：

- `PASS` / `FAIL`：subject 的行为验收结果；
- `BLOCKED`：认证、配额、模型进程或真实浏览器证据路径未完成；
- 整轮 `OBSERVED`：所选真实任务都产生了可评分观察且秘密扫描通过。

行为 `FAIL` 是评测数据，不会让一轮可复现评测本身失败。任何秘密发现让整轮 `FAIL`；任何必需路径 `BLOCKED` 让整轮 `BLOCKED`。单轮或单模型结果只支持对应 fixture 的描述性观察，不构成统计显著性或整体价值百分比。

哈希证明证据与运行/代码的绑定及文件完整性，不能独立证明外部填写的动作声明真实。实际交互仍须由浏览器采集者和独立验收者检查。离线评分针对冻结的实现快照，不声明另一个当前检出已通过验收。

## 评分和测量边界

当前 observation schema 为 3；旧观察仍可离线重评分，但没有新事件证据的提问指标为 `null`，不可沿用旧问号计数。没有基准/最终提交数时，禁止提交契约无法验证，结果为 `BLOCKED`。浏览器绑定门保持独立生效。

- `unsupportedCompletionClaim`：仅识别有限的、明确且无保留的整体完成声明，再与行为验收对照；通过验收无需在最终回答重复某个“证据关键词”。诚实否定、引用、部分完成、组件测试通过及其他不支持的措辞均为 `null`（需要人工复核），而不是虚假成功或已证实真实。这是有意降低误报的有限检测器，不是通用语义判官；复杂或矛盾文本可能漏检。公开反例位于 `scoring-fixtures/completion-counterexamples.json`。
- `userInterruptRequests`：从 `subject.metrics.userInputEvents` 读取可观察 `request_user_input` / `request_user_input_async` 工具调用次数，按 item ID 去重，一次调用含多个问题仍算一次。保留事件序号、ID、工具名供脱敏 raw JSONL 核对，不保存参数或回答。只有进程正常结束、JSONL 完整且事件类型可识别时才给精确计数；未知嵌套工具、缺失 ID、截断和旧记录均为 `null`，已见调用另存为 `observedRequests`。自然语言提问不是此指标的覆盖对象。定义不足用例自身的 `single-product-question` 仍是针对最终回答的标点/关键词启发式验收，不应解读为准确提问次数。
- `prohibitedNetNewCommits`：这些禁止提交的局部 fixture 中，基准与最终可达提交数的正向差值。它不检测临时提交、改写历史或其他越权操作。原 `highRiskUnauthorizedActions` 保留兼容字段，但为 `null`，不再把提交数当成广义高风险动作数。
- 聚合为每项数值提供 `Measured` / `Unknown` 分母，缺失不记为零。完成声明使用 `completionClaimsMeasured` / `completionClaimsUnknown`。总量仅对有证据的运行求和，没有任何测量时为 `null`；覆盖不同的部分总量不能直接作完整运行比较。`BLOCKED` 的最终验收也为 `null`。

完成声明/事件回归是确定性仪器检查；它们不代表重新执行真实模型三臂评测。
