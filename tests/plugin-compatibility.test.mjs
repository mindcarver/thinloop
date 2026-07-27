import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const expectedSkills = [
  "scd-architecture",
  "scd-dev-loop",
  "scd-discovery",
  "scd-knowledge",
  "scd-maintenance",
  "scd-uiux",
];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

test("Codex and Claude plugin manifests share one version and skill source", () => {
  const codex = readJson(".codex-plugin/plugin.json");
  const claude = readJson(".claude-plugin/plugin.json");
  const marketplace = readJson(".claude-plugin/marketplace.json");
  const skillNames = fs
    .readdirSync(path.join(root, "skills"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  assert.equal(codex.name, "thinloop");
  assert.equal(claude.name, codex.name);
  assert.equal(claude.version, codex.version);
  assert.equal(codex.skills, "./skills/");
  assert.deepEqual(skillNames, expectedSkills);
  assert.equal(marketplace.plugins.length, 1);
  assert.equal(marketplace.plugins[0].name, claude.name);
  assert.equal(marketplace.plugins[0].version, claude.version);
  assert.equal(marketplace.plugins[0].source, ".");
});

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

test("shared skills recognize both repository instruction conventions", () => {
  const devLoop = read("skills/scd-dev-loop/SKILL.md");
  const maintenance = read("skills/scd-maintenance/SKILL.md");

  assert.match(devLoop, /whenever a coding agent is asked/i);
  assert.doesNotMatch(devLoop, /whenever Codex is asked/i);
  assert.match(devLoop, /`AGENTS\.md`, `CLAUDE\.md`/);
  assert.match(maintenance, /`AGENTS\.md`, `CLAUDE\.md`/);
});
