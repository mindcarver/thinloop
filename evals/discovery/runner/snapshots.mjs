import fs from "node:fs";
import path from "node:path";
import { commandName, ensureDir, runProcess, sha256 } from "./lib.mjs";

export const CONDITIONS = {
  baseline: {
    commit: "3141d81",
    skills: ["skills/scd-dev-loop"],
  },
  candidate: {
    commit: "bcdee83",
    skills: ["skills/scd-dev-loop", "skills/scd-discovery"],
  },
};

export async function resolveCommit(pluginRoot, ref) {
  const result = await runProcess(
    commandName("git"),
    ["rev-parse", "--verify", `${ref}^{commit}`],
    { cwd: pluginRoot, timeoutMs: 30_000 },
  );
  if (result.code !== 0) {
    throw new Error(`Cannot resolve commit ${ref}: ${result.stderr.trim()}`);
  }
  return result.stdout.trim();
}

export async function installConditionSnapshot({
  pluginRoot,
  codexHome,
  condition,
}) {
  const definition = CONDITIONS[condition];
  if (!definition) throw new Error(`Unknown condition: ${condition}`);

  const commit = await resolveCommit(pluginRoot, definition.commit);
  const tree = await runProcess(
    commandName("git"),
    [
      "ls-tree",
      "-r",
      "--name-only",
      commit,
      "--",
      ...definition.skills,
    ],
    { cwd: pluginRoot, timeoutMs: 30_000 },
  );
  if (tree.code !== 0) {
    throw new Error(`Cannot list skill snapshot: ${tree.stderr.trim()}`);
  }

  const files = tree.stdout.split(/\r?\n/).filter(Boolean);
  const manifest = [];
  for (const repositoryPath of files) {
    const content = await runProcess(
      commandName("git"),
      ["show", `${commit}:${repositoryPath}`],
      { cwd: pluginRoot, timeoutMs: 30_000 },
    );
    if (content.code !== 0) {
      throw new Error(
        `Cannot read ${repositoryPath} at ${commit}: ${content.stderr.trim()}`,
      );
    }
    const relative = repositoryPath.replace(/^skills\//, "");
    const target = path.join(codexHome, "skills", relative);
    ensureDir(path.dirname(target));
    fs.writeFileSync(target, content.stdout, "utf8");
    manifest.push({
      path: `skills/${relative.replaceAll(path.sep, "/")}`,
      sha256: sha256(content.stdout),
    });
  }

  return {
    condition,
    requestedCommit: definition.commit,
    commit,
    skills: definition.skills.map((item) => path.basename(item)),
    files: manifest,
  };
}
