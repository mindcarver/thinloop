export function reportMarkdown({ runManifest, summary, results, rescore = false }) {
  const lines = [
    "# Thinloop current three-arm evaluation",
    "",
    `- Run ID: ${runManifest.runId}`,
    `- Mode: ${runManifest.mode}`,
    `- Model: ${runManifest.model}`,
    `- Source commit: ${runManifest.source.commit}`,
    `- Source dirty: ${runManifest.source.workingTreeDirty}`,
    `- Evidence status: ${summary.status}`,
    `- Rescore: ${rescore ? "yes" : "no"}`,
    "",
    "## Observed facts",
    "",
    "| Case | Category | Condition | Verdict | Acceptance | Unsupported completion | Scope leakage | Duration ms | Tokens in/out | Tools | Cost USD |",
    "|---|---|---|---|---:|---:|---:|---:|---|---:|---:|",
    ...results.map((result) =>
      `| ${result.caseId} | ${result.category} | ${result.condition} | ${result.verdict} | ${result.metrics.finalAcceptance ? "1" : "0"} | ${result.metrics.unsupportedCompletionClaim ? "1" : "0"} | ${result.metrics.scopeLeakage} | ${result.metrics.durationMs} | ${result.metrics.inputTokens}/${result.metrics.outputTokens} | ${result.metrics.toolCalls} | ${result.metrics.costUsd ?? "unavailable"} |`,
    ),
    "",
    "## Direct outcome notes",
    "",
    ...results.map((result) =>
      `- ${result.caseId}/${result.condition}: ${result.verdict}; ${result.blocker ?? result.facts?.hiddenSummary ?? "no hidden-check summary"}`,
    ),
    "",
    "## Aggregate observations",
    "",
    "| Condition | Pass | Fail | Blocked | Unsupported completion | Scope signals | Interrupt requests | Tokens in/out | Tools | Cost USD |",
    "|---|---:|---:|---:|---:|---:|---:|---|---:|---:|",
    ...Object.entries(summary.byCondition).map(([condition, value]) =>
      `| ${condition} | ${value.pass}/${value.runs} | ${value.fail}/${value.runs} | ${value.blocked}/${value.runs} | ${value.unsupportedCompletionClaims}/${value.runs} | ${value.scopeLeakageSignals} | ${value.userInterruptRequests} | ${value.inputTokens}/${value.outputTokens} | ${value.toolCalls} | ${value.costUsd ?? "unavailable"} |`,
    ),
    "",
    "## Inference boundary",
    "",
    runManifest.mode === "smoke"
      ? "This smoke run is one controlled case per condition. It can expose instrumentation or behavior differences in that case, but it does not establish broad Thinloop effectiveness or statistical significance."
      : "These are bounded fixture observations. Condition comparisons are descriptive and are not statistical significance claims.",
    "",
    "## Limits and unverified",
    "",
    "- A behavior FAIL is an observed subject outcome, not an infrastructure failure.",
    "- BLOCKED means the required model, authentication, quota, process, or browser evidence path did not complete.",
    "- Cost is unavailable unless explicit input and output prices were supplied to the runner; token counts are retained without guessing prices.",
    "- Browser acceptance requires externally captured structured real-browser evidence; source and tests cannot replace it.",
    `- Secret scan: ${summary.secretScan.ok ? "PASS" : "FAIL"} (${summary.secretScan.findings.length} finding(s)).`,
    "",
  ];
  return `${lines.join("\n")}\n`;
}
