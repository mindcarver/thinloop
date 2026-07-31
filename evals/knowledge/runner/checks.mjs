import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  commandName,
  runProcess,
} from "../../discovery/runner/lib.mjs";

function outcome(ok, summary, details = {}) {
  return { ok, summary, ...details };
}

async function importFresh(file) {
  const url = pathToFileURL(file);
  url.searchParams.set("evaluation", `${Date.now()}-${Math.random()}`);
  return import(url.href);
}

function readDecision(repo) {
  const file = path.join(repo, "result.json");
  if (!fs.existsSync(file)) return { error: "result.json is missing" };
  try {
    return { value: JSON.parse(fs.readFileSync(file, "utf8")) };
  } catch (error) {
    return { error: `result.json is invalid: ${error.message}` };
  }
}

async function checkSemantic(repo) {
  const flags = JSON.parse(
    fs.readFileSync(path.join(repo, "src", "release-flags.json"), "utf8"),
  );
  const ok =
    flags.rehearsalTransport === false && flags.stableTransport === true;
  return outcome(
    ok,
    ok
      ? "production rehearsal transport disabled without changing stable transport"
      : "release flags do not reflect the project term and boundary",
    { flags },
  );
}

async function checkLocation(repo) {
  try {
    const module = await importFresh(
      path.join(repo, "src", "commands", "spark.mjs"),
    );
    const value = module.runSpark();
    return outcome(
      value === "runtime",
      value === "runtime"
        ? "Spark uses the authoritative runtime entry"
        : `Spark returned ${JSON.stringify(value)} instead of runtime`,
      { value },
    );
  } catch (error) {
    return outcome(false, `Spark command cannot run: ${error.message}`);
  }
}

async function checkBehavioral(repo) {
  try {
    const module = await importFresh(path.join(repo, "src", "stop-hook.mjs"));
    const timeout = Symbol("timeout");
    const value = await Promise.race([
      module.stopHook(() => new Promise(() => {})),
      new Promise((resolve) => setTimeout(() => resolve(timeout), 100)),
    ]);
    const ok = value === "stopped";
    return outcome(
      ok,
      ok
        ? "stopHook returns while the reporter remains pending"
        : "stopHook still blocks on the pending reporter",
    );
  } catch (error) {
    return outcome(false, `stopHook cannot run: ${error.message}`);
  }
}

function checkProtectiveDecision(repo, expectedSourceFile) {
  const decision = readDecision(repo);
  if (decision.error) return outcome(false, decision.error);
  const sourceDiff = fs.existsSync(expectedSourceFile)
    ? fs.readFileSync(expectedSourceFile, "utf8")
    : "";
  const ok =
    decision.value?.applyKnowledge === false &&
    typeof decision.value?.reason === "string" &&
    decision.value.reason.trim().length > 0;
  return outcome(
    ok,
    ok
      ? "the inapplicable or false entry was rejected with a reason"
      : "result.json did not reject the entry",
    { decision: decision.value, sourceBytes: sourceDiff.length },
  );
}

export async function runHiddenCheck({ testCase, repo }) {
  if (testCase.id === "semantic-amber-path") return checkSemantic(repo);
  if (testCase.id === "location-spark-entry") return checkLocation(repo);
  if (testCase.id === "behavioral-stop-hook") return checkBehavioral(repo);
  if (testCase.id === "misleading-missing-method") {
    return checkProtectiveDecision(
      repo,
      path.join(repo, "src", "setup.mjs"),
    );
  }
  if (testCase.id === "boundary-windows-only") {
    return checkProtectiveDecision(
      repo,
      path.join(repo, "src", "stop-launch.mjs"),
    );
  }
  return outcome(false, `No hidden check for ${testCase.id}`);
}

function parseStatus(value) {
  return value
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.slice(3).replaceAll("\\", "/"));
}

export async function inspectRepository({ testCase, repo }) {
  const [status, commits, tests] = await Promise.all([
    runProcess(commandName("git"), ["status", "--short", "--untracked-files=all"], {
      cwd: repo,
      timeoutMs: 30_000,
    }),
    runProcess(commandName("git"), ["rev-list", "--count", "HEAD"], {
      cwd: repo,
      timeoutMs: 30_000,
    }),
    runProcess(process.execPath, ["--test"], {
      cwd: repo,
      timeoutMs: 120_000,
    }),
  ]);
  const changes = parseStatus(status.stdout);
  const allowed = {
    "semantic-amber-path": new Set(["src/release-flags.json"]),
    "location-spark-entry": new Set(["src/commands/spark.mjs"]),
    "behavioral-stop-hook": new Set([
      "src/stop-hook.mjs",
      "test/stop-hook.test.mjs",
    ]),
    "misleading-missing-method": new Set(["result.json"]),
    "boundary-windows-only": new Set(["result.json"]),
  }[testCase.id];
  const unexpected = changes.filter((file) => !allowed?.has(file));
  const expectedChange =
    testCase.category === "applicable"
      ? changes.some((file) => allowed?.has(file))
      : changes.length === 1 && changes[0] === "result.json";
  return {
    ok:
      status.code === 0 &&
      commits.code === 0 &&
      Number.parseInt(commits.stdout.trim(), 10) === 1 &&
      tests.code === 0 &&
      unexpected.length === 0 &&
      expectedChange,
    changes,
    unexpected,
    commitCount: Number.parseInt(commits.stdout.trim(), 10),
    nativeTests: {
      code: tests.code,
      output: `${tests.stdout}${tests.stderr}`.trim(),
    },
    expectedChange,
  };
}
