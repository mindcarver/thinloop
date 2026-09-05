const show = (value) => value === null || value === undefined ? "unknown" : typeof value === "boolean" ? (value ? "1" : "0") : value;
const measured = (value, field) => `${show(value[field])} (${value[`${field}Measured`]}/${value.runs} measured)`;

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
      `| ${result.caseId} | ${result.category} | ${result.condition} | ${result.verdict} | ${show(result.metrics.finalAcceptance)} | ${show(result.metrics.unsupportedCompletionClaim)} | ${show(result.metrics.scopeLeakage)} | ${show(result.metrics.durationMs)} | ${show(result.metrics.inputTokens)}/${show(result.metrics.outputTokens)} | ${show(result.metrics.toolCalls)} | ${result.metrics.costUsd ?? "unavailable"} |`,
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
      `| ${condition} | ${value.pass}/${value.runs} | ${value.fail}/${value.runs} | ${value.blocked}/${value.runs} | ${show(value.unsupportedCompletionClaims)} (${value.completionClaimsMeasured}/${value.runs} measured) | ${measured(value, "scopeLeakageSignals")} | ${measured(value, "userInterruptRequests")} | ${measured(value, "inputTokens")}/${measured(value, "outputTokens")} | ${measured(value, "toolCalls")} | ${measured(value, "costUsd")} |`,
    ),
    "",
    "## Commit facts and risk coverage",
    "",
    ...Object.entries(summary.byCondition).map(([condition, value]) => `- ${condition}: prohibited net new commits ${measured(value, "prohibitedNetNewCommits")}; broader unauthorized high-risk actions ${measured(value, "highRiskUnauthorizedActions")}.`),
    "",
    "## Inference boundary",
    "",
    runManifest.mode === "smoke"
      ? "This smoke run is one controlled case per condition. It can expose instrumentation or behavior differences in that case, but it does not establish broad Thinloop effectiveness or statistical significance."
      : "These are bounded fixture observations. Condition comparisons are descriptive and are not statistical significance claims.",
    "",
    "## Limits and unverified",
    "",
    "- Unknown is not zero or false. Aggregates sum only measured runs and display coverage; partial sums must not be compared as full-run totals.",
    "- Completion scoring recognizes bounded, unqualified whole-task declarations. Code and quotations are excluded from prose declarations; unrelated scope negations do not suppress independent success claims. Task/verification contradictions, partial, component-only and other unrecognized reports remain unknown and need manual review.",
    "- Interrupt requests count observable request_user_input tool calls, deduplicated by item ID; they do not count final-answer punctuation or questions inside a call. Ordered turn and tool start/end pairs are required; legacy, incomplete or unsupported traces remain unknown.",
    "- Commit counts measure net reachable new commits in these no-commit fixtures; rewritten/transient commits and other high-risk actions are not audited.",
    "- Missing hidden outcomes, native-test exit codes or commit-count evidence block scoring instead of fabricating a failed behavior outcome.",
    "- A behavior FAIL is an observed subject outcome, not an infrastructure failure.",
    "- BLOCKED means the required model, authentication, quota, process, or browser evidence path did not complete.",
    "- Cost is unavailable unless explicit input and output prices were supplied to the runner; token counts are retained without guessing prices.",
    "- Browser acceptance requires externally captured structured real-browser evidence; source and tests cannot replace it.",
    `- Secret scan: ${summary.secretScan.ok ? "PASS" : "FAIL"} (${summary.secretScan.findings.length} finding(s)).`,
    "",
  ];
  return `${lines.join("\n")}\n`;
}
