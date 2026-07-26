import path from "node:path";
import { writeJson, writeText } from "./lib.mjs";

function statusLabel(value) {
  return {
    pass: "通过",
    fail: "未通过",
    indeterminate: "不确定",
    uncertain: "待复核",
  }[value] ?? value;
}

export function writeRunReport({
  runRoot,
  manifest,
  subjectRuns,
  pairJudgments = [],
  release,
}) {
  const subjectMetrics = subjectRuns.reduce(
    (total, run) => {
      for (const turn of run.turns ?? []) {
        total.durationMs += Number(turn.subject?.durationMs ?? 0);
        total.toolCalls += Number(turn.subject?.metrics?.toolCalls ?? 0);
        for (const [name, value] of Object.entries(
          turn.subject?.metrics?.usage ?? {},
        )) {
          total.usage[name] = (total.usage[name] ?? 0) + Number(value);
        }
      }
      return total;
    },
    { durationMs: 0, toolCalls: 0, usage: {} },
  );
  const summary = {
    runId: manifest.runId,
    mode: manifest.mode,
    startedAt: manifest.startedAt,
    finishedAt: new Date().toISOString(),
    model: manifest.model,
    cliVersion: manifest.cliVersion,
    subjectRuns: subjectRuns.length,
    subjectVerdicts: Object.fromEntries(
      ["pass", "fail", "indeterminate"].map((verdict) => [
        verdict,
        subjectRuns.filter(
          ({ deterministic }) => deterministic.verdict === verdict,
        ).length,
      ]),
    ),
    judgments: pairJudgments.length,
    subjectMetrics,
    release,
  };
  writeJson(path.join(runRoot, "summary.json"), summary);

  const rows = subjectRuns
    .map(
      (run) =>
        `| ${run.caseId} | ${run.group} | ${run.condition} | ${run.repetition} | ${statusLabel(run.deterministic.verdict)} | ${run.deterministic.subjectTurns} | ${run.deterministic.criticalFailures.join("<br>") || "-"} |`,
    )
    .join("\n");
  const gates = release
    ? Object.entries(release.gates)
        .map(
          ([name, passed]) =>
            `- ${passed ? "PASS" : "FAIL"} \`${name}\``,
        )
        .join("\n")
    : "- 冒烟运行不计算发布门槛。";
  const report = [
    `# Thinloop Discovery 评测：${manifest.runId}`,
    "",
    `- 模式：${manifest.mode}`,
    `- Codex CLI：${manifest.cliVersion}`,
    `- 被测模型：${manifest.model.subject} / ${manifest.reasoning.subject}`,
    `- 开始：${manifest.startedAt}`,
    `- 完成：${summary.finishedAt}`,
    `- Subject 运行：${subjectRuns.length}`,
    `- Subject 总耗时：${Math.round(subjectMetrics.durationMs / 1000)} 秒`,
    `- Subject Tokens：${subjectMetrics.usage.totalTokens ?? 0}`,
    `- Subject 工具调用：${subjectMetrics.toolCalls}`,
    `- 匿名配对裁判：${pairJudgments.length}`,
    `- 总结论：${release ? statusLabel(release.verdict) : "不计分"}`,
    "",
    "## 发布门槛",
    "",
    gates,
    "",
    "## Subject 结果",
    "",
    "| Case | 类型 | 条件 | 重复 | 确定性结果 | 助手回合 | 关键问题 |",
    "|---|---|---|---:|---:|---:|---|",
    rows || "| - | - | - | - | - | - | - |",
    "",
    "## 证据边界",
    "",
    "- `raw/`：经过凭据和用户路径脱敏的 Codex JSONL 与 stderr。",
    "- `transcripts/`：仅保留用户和助手可见对话。",
    "- `diffs/`：逐回合 Git 状态、补丁和临时 SCD 状态。",
    "- `scores/`：确定性评分、匿名裁判和发布门槛。",
    "- 临时 `CODEX_HOME` 已在每次运行后删除；认证文件不属于结果。",
    "",
  ].join("\n");
  writeText(path.join(runRoot, "report.md"), report);
  return summary;
}
