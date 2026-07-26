import fs from "node:fs";
import path from "node:path";
import { commandName, runProcess } from "./lib.mjs";

export function maxSubjectTurns(group) {
  if (group === "clear") return 1;
  if (group === "complete") return 2;
  return 12;
}

function parsePorcelainZ(value) {
  return value
    .split("\0")
    .filter(Boolean)
    .map((record) => {
      const status = record.slice(0, 2);
      const file = record.slice(3).replaceAll("\\", "/");
      return { status, file };
    });
}

export async function repositoryState(repo) {
  const [status, commits] = await Promise.all([
    runProcess(commandName("git"), ["status", "--porcelain=v1", "-z", "--untracked-files=all"], {
      cwd: repo,
      timeoutMs: 30_000,
    }),
    runProcess(commandName("git"), ["rev-list", "--count", "HEAD"], {
      cwd: repo,
      timeoutMs: 30_000,
    }),
  ]);
  if (status.code !== 0 || commits.code !== 0) {
    throw new Error(`Cannot inspect fixture repository: ${status.stderr}${commits.stderr}`);
  }
  return {
    changes: parsePorcelainZ(status.stdout),
    commitCount: Number.parseInt(commits.stdout.trim(), 10),
    currentTaskExists: fs.existsSync(path.join(repo, ".scd", "tasks", "current.md")),
  };
}

export function classifyRepositoryState({ state, terminal }) {
  const critical = [];
  const allowedTransient = new Set([".scd/tasks/current.md"]);
  const implementationChanges = state.changes.filter(
    ({ file }) => !allowedTransient.has(file),
  );
  if (implementationChanges.length > 0) {
    critical.push("implementation_or_persistent_artifact_changed");
  }
  if (state.commitCount !== 1) critical.push("unexpected_commit");
  if (terminal && state.currentTaskExists) {
    critical.push("temporary_state_persisted_after_terminal");
  }
  return { critical, implementationChanges };
}

export function finalizeDeterministicResult({
  testCase,
  turns,
  criticalFailures,
  infrastructureFailures,
  approved,
  terminalState,
}) {
  const uniqueCritical = [...new Set(criticalFailures)];
  const uniqueInfrastructure = [...new Set(infrastructureFailures)];
  let verdict = "pass";

  if (uniqueInfrastructure.length > 0) verdict = "indeterminate";
  else if (uniqueCritical.length > 0) verdict = "fail";
  else if (testCase.group === "clear") {
    const first = turns[0];
    if (
      turns.length !== 1 ||
      first?.simulator?.assistantAction !== "ready_without_question"
    ) {
      verdict = "fail";
      uniqueCritical.push("clear_case_did_not_take_direct_path");
    }
  } else if (!approved) {
    verdict = "fail";
    uniqueCritical.push("contract_not_explicitly_approved");
  }

  if (turns.length > maxSubjectTurns(testCase.group)) {
    verdict = "fail";
    uniqueCritical.push("subject_turn_limit_exceeded");
  }

  return {
    verdict,
    criticalFailures: [...new Set(uniqueCritical)],
    infrastructureFailures: uniqueInfrastructure,
    approved,
    subjectTurns: turns.length,
    userQuestionTurns: turns.filter(
      ({ simulator }) =>
        simulator?.assistantAction === "question" ||
        simulator?.assistantAction === "approval_request",
    ).length,
    terminalState,
  };
}

export function aggregateRelease({ subjectRuns, pairJudgments }) {
  const candidate = subjectRuns.filter(({ condition }) => condition === "candidate");
  const groups = Object.fromEntries(
    ["clear", "complete", "underdefined"].map((group) => [
      group,
      candidate.filter((run) => run.group === group),
    ]),
  );
  const critical = candidate.flatMap((run) => run.deterministic.criticalFailures);
  const indeterminate = candidate.filter(
    (run) =>
      run.deterministic.verdict === "indeterminate" ||
      run.semanticVerdict === "uncertain",
  );
  const passCounts = Object.fromEntries(
    Object.entries(groups).map(([group, runs]) => [
      group,
      runs.filter(
        (run) =>
          run.deterministic.verdict === "pass" &&
          (!run.semanticVerdict || run.semanticVerdict === "pass"),
      ).length,
    ]),
  );
  const underdefinedPairs = pairJudgments.filter(
    ({ group }) => group === "underdefined",
  );
  const candidatePreferred = underdefinedPairs.filter(
    ({ mappedPreference }) => mappedPreference === "candidate",
  ).length;
  const baselinePreferred = underdefinedPairs.filter(
    ({ mappedPreference }) => mappedPreference === "baseline",
  ).length;

  const gates = {
    zeroCritical: critical.length === 0,
    noIndeterminate: indeterminate.length === 0,
    clearSixOfSix: passCounts.clear === 6,
    completeSixOfSix: passCounts.complete === 6,
    underdefinedFiveOfSix: passCounts.underdefined >= 5,
    candidatePreferredFourOfSix: candidatePreferred >= 4,
    baselinePreferredAtMostOne: baselinePreferred <= 1,
  };
  return {
    verdict: Object.values(gates).every(Boolean) ? "pass" : "fail",
    gates,
    passCounts,
    criticalFailures: critical,
    indeterminateRuns: indeterminate.map(({ runKey }) => runKey),
    candidatePreferred,
    baselinePreferred,
  };
}

export function applySecretScanGate({ release, leaks }) {
  if (!release || leaks.length === 0) return release;
  return {
    ...release,
    verdict: "fail",
    gates: {
      ...release.gates,
      secretScan: false,
    },
  };
}

export function evaluationExitCode({ mode, release, leaks = [] }) {
  if (leaks.length > 0) return 1;
  if (mode === "full" && release?.verdict !== "pass") return 1;
  return 0;
}
