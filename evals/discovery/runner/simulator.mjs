export function buildSimulatorPrompt({
  testCase,
  assistantMessage,
  resolvedDecisionIds,
}) {
  const facts = Object.fromEntries(
    testCase.facts.map(({ id, answer }) => [id, answer]),
  );
  const unresolved = testCase.requiredDecisionIds.filter(
    (id) => !resolvedDecisionIds.includes(id),
  );

  return [
    "你是一个受约束的评测用户模拟器，不是开发助手，也不是裁判。",
    "只分析被测助手最新一条面向用户的消息，并严格根据事实表回答。",
    "不得补充事实表之外的信息，不得主动给出整份需求，不得提到评测、Skill、Thinloop 或评分标准。",
    "decisionIds 必须只包含事实表中与最新问题直接对应的 id。",
    "一个上游选择可能同时对应多个事实 id；decisionIds 数量不等于问题数量。",
    "independentQuestionCount 只计算用户需要分别作答的独立决定数。一个问题即使答案会解决多个事实，也计为 1；并列要求用户决定两件事才计为 2。",
    "repeatsResolvedDecision 只有在当前问题要求用户再次决定已经回答过的同一可观察行为时才为 true。追问同一大分支里尚未决定的不同子行为，或解决新发现的矛盾，不算重复。",
    "如果事实表包含 bounded_default_acceptance，且助手已给出一个不扩大既定范围、权限、数据或依赖边界的保守具体建议，可以用该 id 回答接受。",
    "助手推荐的选项与某个尚未解决的事实不同，是正常的用户选择题：action 必须为 answer，并用对应事实 id 回答真实偏好，绝不能标为 invalid。",
    "若助手要求推翻已经解决的事实，应通过 repeatsResolvedDecision 标记；不要把它与缺少事实混为一谈。",
    "只有当 unresolvedDecisionIds 为空且助手明确请求批准合并契约时，action 才能为 approve。",
    "如果助手请求批准但仍有未解决决定，action 设为 stop，message 简短说明还不能批准。",
    "如果最新问题需要的事实不在 facts 中，不得用常识或猜测回答；action 必须为 invalid，decisionIds 为空，message 只说明当前没有这项信息。",
    "如果助手没有提问也没有请求批准，按内容选择 ready_without_question 或 other，并将 action 设为 stop。",
    "message 必须是一条自然、简短、可以直接发送给助手的中文用户回复。",
    "",
    JSON.stringify(
      {
        caseId: testCase.id,
        group: testCase.group,
        facts,
        requiredDecisionIds: testCase.requiredDecisionIds,
        resolvedDecisionIds,
        unresolvedDecisionIds: unresolved,
        assistantMessage,
      },
      null,
      2,
    ),
  ].join("\n");
}

export function validateSimulatorOutput({
  output,
  testCase,
  resolvedDecisionIds,
}) {
  const errors = [];
  if (!output || typeof output !== "object") {
    return { ok: false, errors: ["missing structured simulator output"] };
  }
  const factIds = new Set(testCase.facts.map(({ id }) => id));
  for (const id of output.decisionIds ?? []) {
    if (!factIds.has(id)) errors.push(`unknown decision id: ${id}`);
  }

  const unresolved = testCase.requiredDecisionIds.filter(
    (id) => !resolvedDecisionIds.includes(id),
  );
  if (output.action === "approve" && unresolved.length > 0) {
    errors.push(`approval attempted with unresolved decisions: ${unresolved.join(",")}`);
  }
  if (
    output.action === "answer" &&
    (!output.decisionIds || output.decisionIds.length === 0)
  ) {
    errors.push("answer action requires at least one decision id");
  }
  if (
    output.action === "invalid" &&
    (output.decisionIds?.length ?? 0) > 0
  ) {
    errors.push("invalid action requires an empty decision id list");
  }
  if (
    output.assistantAction === "question" &&
    output.independentQuestionCount < 1
  ) {
    errors.push("question action requires a positive independent question count");
  }
  if (
    ["ready_without_question", "other"].includes(output.assistantAction) &&
    output.independentQuestionCount !== 0
  ) {
    errors.push("non-question action requires zero independent questions");
  }
  return { ok: errors.length === 0, errors };
}

export function classifySimulatorGate(output) {
  if (output.independentQuestionCount > 1) {
    return {
      critical: "multiple_independent_decisions_in_one_turn",
    };
  }
  if (output.action === "invalid") {
    return {
      infrastructure: "simulator_cannot_answer_from_factsheet",
    };
  }
  return {};
}

export function deterministicUserReply({
  simulatorOutput,
  testCase,
  resolvedDecisionIds,
}) {
  const unresolved = testCase.requiredDecisionIds.filter(
    (id) => !resolvedDecisionIds.includes(id),
  );
  if (
    simulatorOutput.assistantAction === "approval_request" &&
    unresolved.length > 0
  ) {
    return {
      terminal: true,
      hardFailure: "approval_requested_before_required_decisions",
      message: "现在还不能批准，仍有关键行为没有确认。",
    };
  }
  if (simulatorOutput.action === "approve") {
    return {
      terminal: false,
      approved: true,
      message: "同意，这份合并需求准确，可以作为后续实现依据；但这次不要开始实现。",
    };
  }
  if (simulatorOutput.action === "answer") {
    const factById = new Map(testCase.facts.map(({ id, answer }) => [id, answer]));
    const answers = simulatorOutput.decisionIds
      .map((id) => factById.get(id))
      .filter(Boolean);
    return {
      terminal: false,
      message: answers.join("\n\n"),
    };
  }
  return {
    terminal: true,
    message: simulatorOutput.message,
  };
}
