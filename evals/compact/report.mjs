import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const sum = values => values.length && values.every(Number.isFinite) ? values.reduce((a, b) => a + b, 0) : null;
export function summarize(results, identities) {
  return Object.fromEntries(["baseline", "candidate"].map(condition => {
    const rows = results.filter(row => row.condition === condition);
    const identity = identities[condition];
    const entry = identity.inventory.find(file => file.file === "skills/scd-quickdev/SKILL.md");
    const tokens = Object.fromEntries(["inputTokens", "outputTokens", "cachedInputTokens", "cacheWriteInputTokens", "reasoningOutputTokens"]
      .map(key => [key, { total: sum(rows.map(row => row.evidence?.usage?.[key])), known: rows.filter(row => Number.isFinite(row.evidence?.usage?.[key])).length }]));
    return [condition, {
      samples: rows.length,
      verdicts: Object.fromEntries(["PASS", "FAIL", "BLOCKED"].map(verdict => [verdict, rows.filter(row => row.scored.verdict === verdict).length])),
      tokens, costUsd: null,
      durationMs: sum(rows.map(row => row.durationMs)),
      knownCompletedCommands: sum(rows.map(row => row.evidence?.knownCompletedCommands)),
      knownCompletedToolItems: sum(rows.map(row => row.evidence?.knownCompletedToolItems)),
      toolCoveragePartialSamples: rows.filter(row => row.evidence?.toolCountCoverage === "partial").length,
      userInputUnknownSamples: rows.filter(row => row.scored.metrics.userInterruptRequests === null).length,
      completionDeclarationUnknownSamples: rows.filter(row => row.scored.facts?.completionDeclaration?.state === "unknown").length,
      entryFullReadSamples: rows.filter(row => row.evidence?.entryFullyObserved).length,
      knownFullReadBytes: sum(rows.map(row => sum((row.evidence?.reads ?? []).filter(read => read.fullContentObserved).map(read => identity.inventory.find(file => file.file === read.file).bytes)))),
      entryBytes: entry.bytes, entryChars: entry.chars, payloadBytes: identity.bytes, payloadChars: identity.chars,
    }];
  }));
}

export function markdown({ manifest, results }) {
  const arms = summarize(results, manifest.frozen.identities);
  const lines = [
    "# QuickDev 精简成对实测", "",
    `候选冻结提交：\`${manifest.frozen.candidateRef}\`；旧 QuickDev：\`${manifest.frozen.definition.baselineQuickdevRef}\`。`,
    `CLI：${manifest.cli}；模型：${manifest.frozen.definition.model}；推理：${manifest.frozen.definition.reasoning}。`,
    "",
    "| 条件 | 样本 PASS/FAIL/BLOCKED | input | output | cached input | 总时长 ms | 已知命令 | 已知工具项 | 入口 bytes/chars | 总载荷 bytes/chars |",
    "|---|---|---:|---:|---:|---:|---:|---:|---|---|",
  ];
  for (const [condition, arm] of Object.entries(arms)) lines.push(`| ${condition} | ${arm.samples}: ${arm.verdicts.PASS}/${arm.verdicts.FAIL}/${arm.verdicts.BLOCKED} | ${arm.tokens.inputTokens.total ?? "unknown"} | ${arm.tokens.outputTokens.total ?? "unknown"} | ${arm.tokens.cachedInputTokens.total ?? "unknown"} | ${arm.durationMs ?? "unknown"} | ${arm.knownCompletedCommands ?? "unknown"} | ${arm.knownCompletedToolItems ?? "unknown"} | ${arm.entryBytes}/${arm.entryChars} | ${arm.payloadBytes}/${arm.payloadChars} |`);
  lines.push("", "| pair | task | repeat | baseline input/output | candidate input/output | baseline/candidate verdict |", "|---:|---|---:|---|---|---|");
  for (const pair of manifest.frozen.schedule) {
    const base = results.find(row => row.pair === pair.pair && row.condition === "baseline");
    const candidate = results.find(row => row.pair === pair.pair && row.condition === "candidate");
    if (!base || !candidate) continue;
    const token = row => `${row.evidence?.usage.inputTokens ?? "unknown"}/${row.evidence?.usage.outputTokens ?? "unknown"}`;
    lines.push(`| ${pair.pair} | ${pair.caseId} | ${pair.repeat} | ${token(base)} | ${token(candidate)} | ${base.scored.verdict}/${candidate.scored.verdict} |`);
  }
  lines.push("", "## 可观察边界", "",
    "显式调用且额外要求完整读取入口，两臂授权和环境一致；不衡量自动路由或普通自动注入路径的Token开销。每对两臂并发，只交错启动顺序，不是串行顺序平衡。局部fixture禁止外部Issue/PR和提交，完整交付协议另行回归。bytes/chars是静态文件规模，不等于真实用量。",
    "总时长是subject进程时长之和，两两并发，不能当作端到端墙钟时长；查看轨迹中的传输回退等基础设施事件后再解释时延。成本null；不宣称统计显著性或普遍节省。",
    "完整stdout读取证明只覆盖能从命令轨迹直接核对的文件；不计自动注入或部分读取。knownFullReadBytes每样本每文件只计一次，不是总上下文Token。已知命令次数指command_execution事件数，单条shell里的多个子命令仍算一个事件。未知事件不算成确定工具，用户输入/完成声明缺少可支持证据时保持unknown。", "",
    "```json", JSON.stringify(arms, null, 2), "```", "");
  return lines.join("\n");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const output = path.resolve(process.argv[2]);
  const manifest = JSON.parse(fs.readFileSync(path.join(output, "manifest.json")));
  const { results } = JSON.parse(fs.readFileSync(path.join(output, "summary.json")));
  fs.writeFileSync(path.join(output, "report.md"), markdown({ manifest, results }));
  fs.writeFileSync(path.join(output, "comparison.json"), JSON.stringify(summarize(results, manifest.frozen.identities), null, 2) + "\n");
}
