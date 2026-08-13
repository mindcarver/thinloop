import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const expectedSkills = [
  "scd-architecture",
  "scd-discovery",
  "scd-evolve",
  "scd-execute",
  "scd-interview",
  "scd-knowledge",
  "scd-maintenance",
  "scd-next",
  "scd-project",
  "scd-quickdev",
  "scd-reengineering",
  "scd-uiux",
];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

test("Codex, Claude, WorkBuddy, and ZCode manifests share one version and skill source", () => {
  const codex = readJson(".codex-plugin/plugin.json");
  const claude = readJson(".claude-plugin/plugin.json");
  const workbuddy = readJson(".codebuddy-plugin/plugin.json");
  const zcode = readJson(".zcode-plugin/plugin.json");
  const claudeMarketplace = readJson(".claude-plugin/marketplace.json");
  const workbuddyMarketplace = readJson(".codebuddy-plugin/marketplace.json");
  const zcodeMarketplace = readJson("marketplace.json");
  const skillNames = fs
    .readdirSync(path.join(root, "skills"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  assert.equal(codex.name, "thinloop");
  assert.equal(codex.version, "0.15.0");
  assert.equal(claude.name, codex.name);
  assert.equal(workbuddy.name, codex.name);
  assert.equal(zcode.name, codex.name);
  assert.equal(claude.version, codex.version);
  assert.equal(workbuddy.version, codex.version);
  assert.equal(zcode.version, codex.version);
  assert.equal(codex.skills, "./skills/");
  assert.deepEqual(workbuddy.skills, [codex.skills]);
  assert.equal(zcode.skills, codex.skills);
  assert.deepEqual(skillNames, expectedSkills);
  for (const manifest of [codex, claude, workbuddy, zcode]) {
    assert.match(manifest.description, /multi-Issue project decomposition/i);
    assert.match(manifest.description, /dependency DAG/i);
    assert.match(manifest.description, /READY-wave execution/i);
    assert.match(manifest.description, /read-only project-status navigation/i);
    assert.match(manifest.description, /cross-stack reimplementation/i);
  }
  assert.match(codex.interface.defaultPrompt, /SCD Project/);
  assert.match(codex.interface.defaultPrompt, /does not run an implementation loop/);
  assert.match(codex.interface.defaultPrompt, /SCD Execute/);
  assert.match(codex.interface.defaultPrompt, /current safe READY wave/);
  assert.match(codex.interface.defaultPrompt, /SCD Next/);
  assert.match(codex.interface.defaultPrompt, /single next action/);
  assert.match(codex.interface.defaultPrompt, /SCD Reengineering/);
  assert.match(codex.interface.defaultPrompt, /safe READY wave/);
  for (const marketplace of [
    claudeMarketplace,
    workbuddyMarketplace,
    zcodeMarketplace,
  ]) {
    assert.equal(marketplace.plugins.length, 1);
    assert.equal(marketplace.plugins[0].name, codex.name);
    assert.equal(marketplace.plugins[0].version, codex.version);
    assert.equal(marketplace.plugins[0].source, ".");
  }
});

test("WorkBuddy plugin uses its native hook root and continuation protocol", () => {
  const workbuddy = readJson(".codebuddy-plugin/plugin.json");
  const hooks = readJson("hooks/hooks.workbuddy.json");
  const commands = Object.values(hooks.hooks)
    .flat()
    .flatMap((group) => group.hooks)
    .map((hook) => hook.command);

  assert.equal(workbuddy.hooks, "./hooks/hooks.workbuddy.json");
  assert.deepEqual(Object.keys(hooks.hooks).sort(), ["PreCompact", "Stop"]);
  assert.ok(
    commands.every((command) => command.includes("${CODEBUDDY_PLUGIN_ROOT}")),
  );
  assert.ok(commands.every((command) => !command.includes("${PLUGIN_ROOT}")));
  assert.ok(commands.every((command) => !command.includes("${CLAUDE_PLUGIN_ROOT}")));
});

test(
  "WorkBuddy POSIX hook command resolves its plugin root",
  { skip: process.platform === "win32" },
  () => {
    const stopHook = readJson("hooks/hooks.workbuddy.json").hooks.Stop[0].hooks[0];
    const result = spawnSync(stopHook.command, {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, CODEBUDDY_PLUGIN_ROOT: root },
      input: JSON.stringify({ cwd: root, hook_event_name: "Stop" }),
      shell: true,
    });

    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, "");
  },
);

test("Claude plugin uses its native hook path and decision protocol", () => {
  const claude = readJson(".claude-plugin/plugin.json");
  const hooks = readJson("hooks/hooks.claude.json");
  const commands = Object.values(hooks.hooks)
    .flat()
    .flatMap((group) => group.hooks)
    .map((hook) => hook.command);

  assert.equal(claude.hooks, "./hooks/hooks.claude.json");
  assert.deepEqual(Object.keys(hooks.hooks).sort(), ["PreCompact", "Stop"]);
  assert.ok(commands.every((command) => command.includes("${CLAUDE_PLUGIN_ROOT}")));
  assert.ok(commands.every((command) => !command.includes("${PLUGIN_ROOT}")));
});

test("ZCode plugin maps compaction and Stop to supported hook protocols", () => {
  const zcode = readJson(".zcode-plugin/plugin.json");
  const zcodeHooks = readJson("hooks/hooks.zcode.json");
  const sharedHooks = readJson("hooks/hooks.json");
  const sessionStart = zcodeHooks.hooks.SessionStart[0];
  const sessionHook = sessionStart.hooks[0];
  const stopHook = sharedHooks.hooks.Stop[0].hooks[0];

  assert.equal(zcode.hooks, "./hooks/hooks.zcode.json");
  assert.equal(sessionStart.matcher, "compact");
  assert.equal(sessionHook.type, "process");
  assert.deepEqual(sessionHook.args, [
    "${ZCODE_PLUGIN_ROOT}/hooks/check-state.mjs",
  ]);
  assert.match(stopHook.command, /\$CLAUDE_PLUGIN_ROOT/);
  assert.match(stopHook.command, /\$PLUGIN_ROOT/);
  assert.match(stopHook.commandWindows, /\$env:CLAUDE_PLUGIN_ROOT/);
  assert.match(stopHook.commandWindows, /\$env:PLUGIN_ROOT/);
});

test(
  "shared POSIX hook command resolves Codex and ZCode plugin roots",
  { skip: process.platform === "win32" },
  () => {
    const stopHook = readJson("hooks/hooks.json").hooks.Stop[0].hooks[0];

    for (const env of [
      { PLUGIN_ROOT: root, CLAUDE_PLUGIN_ROOT: "" },
      { PLUGIN_ROOT: "", CLAUDE_PLUGIN_ROOT: root },
    ]) {
      const result = spawnSync(stopHook.command, {
        cwd: root,
        encoding: "utf8",
        env: { ...process.env, ...env },
        input: JSON.stringify({ cwd: root, hook_event_name: "Stop" }),
        shell: true,
      });

      assert.equal(result.status, 0, result.stderr);
      assert.equal(result.stdout, "");
    }
  },
);

test("shared skills recognize both repository instruction conventions", () => {
  const quickdev = read("skills/scd-quickdev/SKILL.md");
  const execute = read("skills/scd-execute/SKILL.md");
  const maintenance = read("skills/scd-maintenance/SKILL.md");
  const reengineering = read("skills/scd-reengineering/SKILL.md");

  assert.match(quickdev, /编码 Agent 被要求修改仓库时/);
  assert.doesNotMatch(quickdev, /whenever Codex is asked/i);
  assert.match(quickdev, /`AGENTS\.md`、`CLAUDE\.md`/);
  assert.match(execute, /`AGENTS\.md`、`CLAUDE\.md`/);
  assert.match(maintenance, /`AGENTS\.md`、`CLAUDE\.md`/);
  assert.match(reengineering, /`AGENTS\.md`、`CLAUDE\.md`/);
});
