import fs from "node:fs";
import path from "node:path";
import {
  commandName,
  copyTree,
  ensureDir,
  removeWithin,
  runProcess,
  writeJson,
  writeText,
} from "./lib.mjs";
import { fixturesRoot } from "./cases.mjs";

async function mustRun(command, args, options) {
  const result = await runProcess(command, args, options);
  if (result.code !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed:\n${result.stdout}\n${result.stderr}`,
    );
  }
  return result;
}

export async function prepareFixture({ workspaceRoot, runKey, testCase }) {
  const repositoriesRoot = ensureDir(path.join(workspaceRoot, "repositories"));
  const repo = path.join(repositoriesRoot, runKey);
  if (fs.existsSync(repo)) removeWithin(repositoriesRoot, repo);
  copyTree(path.join(fixturesRoot, testCase.fixture), repo);

  await mustRun(commandName("git"), ["init", "-q"], {
    cwd: repo,
    timeoutMs: 30_000,
  });
  await mustRun(
    commandName("git"),
    ["config", "user.name", "Thinloop Discovery Eval"],
    { cwd: repo, timeoutMs: 30_000 },
  );
  await mustRun(
    commandName("git"),
    ["config", "user.email", "thinloop-eval@example.invalid"],
    { cwd: repo, timeoutMs: 30_000 },
  );
  await mustRun(commandName("git"), ["add", "."], {
    cwd: repo,
    timeoutMs: 30_000,
  });
  await mustRun(
    commandName("git"),
    ["commit", "-q", "-m", "fixture baseline"],
    { cwd: repo, timeoutMs: 30_000 },
  );

  const nativeTests = await runProcess(process.execPath, ["--test"], {
    cwd: repo,
    timeoutMs: 120_000,
  });
  if (nativeTests.code !== 0) {
    throw new Error(
      `Fixture native tests failed for ${testCase.id}:\n${nativeTests.stdout}\n${nativeTests.stderr}`,
    );
  }
  return {
    repo,
    nativeTests: {
      code: nativeTests.code,
      durationMs: nativeTests.durationMs,
      output: `${nativeTests.stdout}${nativeTests.stderr}`.trim(),
    },
  };
}

export async function captureRepositoryEvidence({
  repo,
  outputDir,
  turn,
  redactor,
}) {
  ensureDir(outputDir);
  const [status, diff] = await Promise.all([
    runProcess(
      commandName("git"),
      ["status", "--short", "--untracked-files=all"],
      { cwd: repo, timeoutMs: 30_000 },
    ),
    runProcess(commandName("git"), ["diff", "--binary", "--no-ext-diff"], {
      cwd: repo,
      timeoutMs: 30_000,
    }),
  ]);
  const safeStatus = redactor(`${status.stdout}${status.stderr}`);
  const safeDiff = redactor(`${diff.stdout}${diff.stderr}`);
  writeText(path.join(outputDir, `turn-${turn}-status.txt`), safeStatus.text);
  writeText(path.join(outputDir, `turn-${turn}.patch`), safeDiff.text);

  const transient = path.join(repo, ".scd", "tasks", "current.md");
  let currentTask;
  if (fs.existsSync(transient)) {
    currentTask = redactor(fs.readFileSync(transient, "utf8"));
    writeText(
      path.join(outputDir, `turn-${turn}-current.md`),
      currentTask.text,
    );
  }
  const summary = {
    statusCode: status.code,
    diffCode: diff.code,
    secretRedactions:
      safeStatus.secretReplacements +
      safeDiff.secretReplacements +
      (currentTask?.secretReplacements ?? 0),
  };
  writeJson(path.join(outputDir, `turn-${turn}-evidence.json`), summary);
  return summary;
}
