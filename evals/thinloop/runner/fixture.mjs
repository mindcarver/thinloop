import fs from "node:fs";
import path from "node:path";
import {
  commandName,
  copyTree,
  ensureDir,
  relativeFiles,
  runProcess,
  sha256,
} from "../../discovery/runner/lib.mjs";
import { fixturesRoot } from "./manifest.mjs";

async function mustRun(command, args, options) {
  const result = await runProcess(command, args, options);
  if (result.code !== 0) throw new Error(`${command} ${args.join(" ")} failed: ${result.stderr || result.stdout}`);
  return result;
}

export function snapshotFiles(repo) {
  return Object.fromEntries(
    relativeFiles(repo)
      .filter((file) => !file.startsWith(".git/") && !file.startsWith("node_modules/"))
      .map((file) => [file, sha256(fs.readFileSync(path.join(repo, file)))]),
  );
}

export async function repositoryStatus(repo) {
  const [status, commits] = await Promise.all([
    runProcess(commandName("git"), ["status", "--short", "--untracked-files=all"], { cwd: repo, timeoutMs: 30_000 }),
    runProcess(commandName("git"), ["rev-list", "--count", "HEAD"], { cwd: repo, timeoutMs: 30_000 }),
  ]);
  return {
    status: status.stdout.trim().split(/\r?\n/).filter(Boolean),
    commitCount: Number.parseInt(commits.stdout.trim(), 10),
  };
}

export async function runNativeTests(repo) {
  const testFiles = relativeFiles(repo).filter((file) => /(?:^|\/)test\/.*\.test\.mjs$/.test(file));
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  const result = await runProcess(process.execPath, ["--test", ...testFiles], { cwd: repo, env, timeoutMs: 120_000 });
  return { code: result.code, timedOut: result.timedOut, output: `${result.stdout}${result.stderr}`.trim() };
}

export async function prepareFixture({ workspaceRoot, runKey, testCase }) {
  const repositoriesRoot = ensureDir(path.join(workspaceRoot, "repositories"));
  const repo = path.join(repositoriesRoot, runKey);
  if (fs.existsSync(repo)) throw new Error(`Fixture already exists: ${repo}`);
  copyTree(path.join(fixturesRoot, testCase.fixture), repo);
  await mustRun(commandName("git"), ["init", "-q"], { cwd: repo });
  await mustRun(commandName("git"), ["config", "user.name", "Thinloop Current Eval"], { cwd: repo });
  await mustRun(commandName("git"), ["config", "user.email", "thinloop-eval@example.invalid"], { cwd: repo });
  await mustRun(commandName("git"), ["add", "."], { cwd: repo });
  await mustRun(commandName("git"), ["commit", "-q", "-m", "fixture baseline"], { cwd: repo });
  for (const [file, suffix] of Object.entries(testCase.dirtyFiles ?? {})) {
    fs.appendFileSync(path.join(repo, file), suffix, "utf8");
  }
  const nativeTests = await runNativeTests(repo);
  const expectedCode = testCase.baselineTests === "pass" ? 0 : 1;
  if ((nativeTests.code === 0 ? 0 : 1) !== expectedCode) {
    throw new Error(`${testCase.id}: baseline tests expected ${testCase.baselineTests}, got code ${nativeTests.code}`);
  }
  return {
    repo,
    baseline: {
      files: snapshotFiles(repo),
      ...(await repositoryStatus(repo)),
      nativeTests,
    },
  };
}

export function changedFiles(before, after) {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .filter((file) => before[file] !== after[file])
    .sort();
}
