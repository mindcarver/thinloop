import { sha256 } from "./lib.mjs";

function visibleTranscript(run) {
  return run.transcript.map(({ role, message }) => ({ role, message }));
}

export function blindedPair({ testCase, repetition, baseline, candidate }) {
  const candidateFirst =
    Number.parseInt(sha256(`${testCase.id}:${repetition}`).slice(0, 2), 16) % 2 ===
    0;
  return {
    A: candidateFirst ? candidate : baseline,
    B: candidateFirst ? baseline : candidate,
    labels: candidateFirst
      ? { A: "candidate", B: "baseline" }
      : { A: "baseline", B: "candidate" },
  };
}

export function buildJudgePrompt({
  testCase,
  repetition,
  baseline,
  candidate,
}) {
  const pair = blindedPair({ testCase, repetition, baseline, candidate });
  const facts = Object.fromEntries(
    testCase.facts.map(({ id, answer }) => [id, answer]),
  );
  const payload = {
    caseId: testCase.id,
    group: testCase.group,
    initialPrompt: testCase.initialPrompt,
    requiredDecisionIds: testCase.requiredDecisionIds,
    facts,
    transcriptA: visibleTranscript(pair.A),
    transcriptB: visibleTranscript(pair.B),
  };
  return {
    labels: pair.labels,
    prompt: [
      "你是一个匿名的软件需求发现评测裁判。",
      "A 和 B 来自相同模型、相同仓库和相同用户条件；不得猜测它们使用了什么插件。",
      "先分别判断是否满足任务，再做偏好比较。",
      "关注：是否读取并利用仓库事实、问题是否重要、是否一次只要求一个独立决定、是否重复询问已有答案、推荐是否有理由、是否区分事实/决定/假设、是否形成无矛盾且可验证的契约、是否在明确批准前实施，以及清晰任务是否零打扰。",
      "确定性文件检查不由你推翻。证据不足时使用 uncertain，不得靠印象补全。",
      "evidence 必须引用两份转录中的短片段或明确缺失。",
      "",
      JSON.stringify(payload, null, 2),
    ].join("\n"),
  };
}

export function mapJudgeOutput({ output, labels }) {
  const mapPreference = {
    A: labels.A,
    B: labels.B,
    tie: "tie",
    uncertain: "uncertain",
  };
  return {
    ...output,
    mappedPreference: mapPreference[output.preference],
    baselineVerdict: labels.A === "baseline" ? output.aVerdict : output.bVerdict,
    candidateVerdict:
      labels.A === "candidate" ? output.aVerdict : output.bVerdict,
  };
}
