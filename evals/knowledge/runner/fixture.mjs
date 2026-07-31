import fs from "node:fs";
import path from "node:path";
import {
  commandName,
  copyTree,
  ensureDir,
  removeWithin,
  runProcess,
  writeText,
} from "../../discovery/runner/lib.mjs";
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

function knowledgeMarkdown(knowledge) {
  return `---
status: active
scope: project
origin: behavior-evaluation-fixture
updated: 2026-07-31
---

# ${knowledge.title}

- Trigger: ${knowledge.trigger}
- Guidance: ${knowledge.guidance}
- Boundary: ${knowledge.boundary}
- Evidence: ${knowledge.evidence}
- Source: ${knowledge.source}
`;
}

function installKnowledge(repo, knowledge) {
  const root = path.join(repo, ".scd", "knowledge");
  const entry = path.join(root, "entries", `${knowledge.slug}.md`);
  writeText(entry, knowledgeMarkdown(knowledge));
  writeText(
    path.join(root, "INDEX.md"),
    `# Knowledge index\n\n- [${knowledge.title}](entries/${knowledge.slug}.md) - ${knowledge.trigger}\n`,
  );
}

export async function prepareFixture({
  workspaceRoot,
  runKey,
  testCase,
  condition,
}) {
  const repositoriesRoot = ensureDir(path.join(workspaceRoot, "repositories"));
  const repo = path.join(repositoriesRoot, runKey);
  if (fs.existsSync(repo)) removeWithin(repositoriesRoot, repo);
  copyTree(path.join(fixturesRoot, testCase.fixture), repo);
  if (condition === "knowledge") installKnowledge(repo, testCase.knowledge);

  await mustRun(commandName("git"), ["init", "-q"], { cwd: repo });
  await mustRun(
    commandName("git"),
    ["config", "user.name", "Thinloop Knowledge Eval"],
    { cwd: repo },
  );
  await mustRun(
    commandName("git"),
    ["config", "user.email", "thinloop-eval@example.invalid"],
    { cwd: repo },
  );
  await mustRun(commandName("git"), ["add", "."], { cwd: repo });
  await mustRun(
    commandName("git"),
    ["commit", "-q", "-m", "fixture baseline"],
    { cwd: repo },
  );

  const nativeTests = await runProcess(process.execPath, ["--test"], {
    cwd: repo,
    timeoutMs: 120_000,
  });
  if (nativeTests.code !== 0) {
    throw new Error(
      `Fixture baseline failed for ${testCase.id}:\n${nativeTests.stdout}\n${nativeTests.stderr}`,
    );
  }
  return { repo, nativeTests };
}
