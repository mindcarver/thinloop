import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { refreshInstallation } from "../scripts/refresh-install.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const version = JSON.parse(fs.readFileSync(path.join(root, ".codex-plugin/plugin.json"))).version;
const names = fs.readdirSync(path.join(root, "skills"), { withFileTypes: true })
  .filter(entry => entry.isDirectory() &&
    fs.existsSync(path.join(root, "skills", entry.name, "SKILL.md")))
  .map(entry => entry.name);
const fixture = () => fs.mkdtempSync(path.join(os.tmpdir(), "thinloop-refresh-"));

function pluginPayload(target) {
  for (const dir of ["skills", "hooks", ".claude-plugin", ".zcode-plugin"]) {
    fs.cpSync(path.join(root, dir), path.join(target, dir), { recursive: true });
  }
}

test("Codex refresh is repeatable, repairs stale owned links and preserves other skills", async () => {
  const home = fixture();
  const old = path.join(home, "old-thinloop");
  const skillRoot = path.join(home, "custom-codex", "skills");
  try {
    fs.cpSync(path.join(root, "skills"), path.join(old, "skills"), { recursive: true });
    fs.cpSync(path.join(root, ".codex-plugin"), path.join(old, ".codex-plugin"), { recursive: true });
    fs.mkdirSync(skillRoot, { recursive: true });
    for (const name of names.slice(0, -1)) fs.symlinkSync(path.join(old, "skills", name), path.join(skillRoot, name), "dir");
    fs.writeFileSync(path.join(skillRoot, "unrelated"), "preserve");
    for (let attempt = 0; attempt < 2; attempt++) {
      const report = await refreshInstallation({ platformId: "codex", sourceRoot: root, homeDir: home,
        environment: { CODEX_HOME: path.join(home, "custom-codex") },
        runCommand() { throw new Error("Codex links should not call a plugin CLI"); },
      });
      assert.equal(report.results[0].status, "PASS");
      for (const name of names) assert.equal(fs.realpathSync(path.join(skillRoot, name)), path.join(root, "skills", name));
      assert.equal(fs.readFileSync(path.join(skillRoot, "unrelated"), "utf8"), "preserve");
    }
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});

test("Codex refuses a missing installation or colliding non-link before any changes", async () => {
  const home = fixture();
  const skills = path.join(home, ".codex/skills");
  try {
    const options = { platformId: "codex", sourceRoot: root, homeDir: home, environment: {} };
    await assert.rejects(refreshInstallation(options), /No installed Codex Thinloop/);
    assert.equal(fs.existsSync(skills), false);
    fs.mkdirSync(path.join(skills, names[0]), { recursive: true });
    await assert.rejects(refreshInstallation(options), /Refusing to replace non-link/);
    assert.deepEqual(fs.readdirSync(skills), [names[0]]);
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});

test("Claude refresh scopes native commands to Thinloop and rechecks payload", async () => {
  const home = fixture();
  const installed = path.join(home, "installed");
  const commands = [];
  let current = "0.0.0";
  try {
    const report = await refreshInstallation({ platformId: "claude-code", sourceRoot: root, homeDir: home,
      runCommand(command) {
        commands.push(command);
        if (command[2] === "list") return JSON.stringify([{ id: "thinloop@thinloop", version: current, enabled: true, scope: "user", installPath: installed }]);
        if (command[2] === "marketplace" && command[3] === "list") return JSON.stringify([{ name: "thinloop", source: "directory", path: root }]);
        if (command[2] === "update") { pluginPayload(installed); current = version; }
        return "";
      },
    });
    assert.equal(report.results[0].status, "PASS");
    assert.deepEqual(commands, [
      ["claude", "plugin", "list", "--json"],
      ["claude", "plugin", "marketplace", "list", "--json"],
      ["claude", "plugin", "marketplace", "update", "thinloop"],
      ["claude", "plugin", "update", "thinloop@thinloop", "--scope", "user"],
      ["claude", "plugin", "list", "--json"],
    ]);
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});

test("native updater refuses absent or disabled plugins without mutation", async () => {
  for (const platformId of ["zcode", "claude-code"]) {
    for (const records of [[], [{ id: "thinloop@thinloop", enabled: false }]]) {
      const calls = [];
      await assert.rejects(refreshInstallation({ platformId, sourceRoot: root,
        runCommand(command) { calls.push(command); return JSON.stringify(platformId === "zcode" ? { plugins: records } : records); },
        request() { throw new Error("must not call update API"); },
      }), /already be installed and enabled/);
      assert.equal(calls.length, 1);
    }
  }
});

test("ZCode refuses wrong marketplace and unverified update results", async () => {
  for (const source of ["/not-the-source", root]) {
    const requests = [];
    const options = { platformId: "zcode", sourceRoot: root,
      runCommand: () => JSON.stringify({ plugins: [{ id: "thinloop@thinloop", enabled: true }] }),
      async request(method, params) {
        requests.push([method, params]);
        if (method === "plugins/overview") return { marketplaces: [{ id: "thinloop", source: { source: "directory", path: source } }] };
        return { diagnostics: [{ severity: "error", pluginId: "thinloop@thinloop" }] };
      },
    };
    await assert.rejects(refreshInstallation(options));
    assert.equal(requests.length, source === root ? 2 : 1);
    if (source === root) assert.equal(requests[1][1].marketplace, "thinloop");
  }
});


test("Codex preflight refuses an unrelated same-name link without changing other links", async () => {
  const home = fixture();
  try {
    const skillRoot = path.join(home, ".codex/skills");
    const other = path.join(home, "other", "skills", names.at(-1));
    fs.mkdirSync(other, { recursive: true });
    fs.mkdirSync(path.join(home, "other", ".codex-plugin"));
    fs.writeFileSync(path.join(home, "other", ".codex-plugin/plugin.json"), JSON.stringify({ name: "other" }));
    fs.mkdirSync(skillRoot, { recursive: true });
    fs.symlinkSync(path.join(root, "skills", names[0]), path.join(skillRoot, names[0]), "dir");
    fs.symlinkSync(other, path.join(skillRoot, names.at(-1)), "dir");
    const before = fs.readlinkSync(path.join(skillRoot, names[0]));
    await assert.rejects(refreshInstallation({ platformId: "codex", sourceRoot: root, homeDir: home, environment: {} }), /Not an owned Thinloop link/);
    assert.equal(fs.readlinkSync(path.join(skillRoot, names[0])), before);
    assert.equal(fs.readlinkSync(path.join(skillRoot, names.at(-1))), other);
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});


test("Claude repairs confirmed same-version payload drift through one native keep-data reinstall", async () => {
  const home = fixture();
  const installed = path.join(home, "installed");
  const commands = [];
  try {
    pluginPayload(installed);
    const changed = path.join(installed, "hooks/validate-state.mjs");
    fs.appendFileSync(changed, "\n// same-version installed drift\n");
    const runCommand = command => {
      commands.push(command);
      if (command[2] === "list") return JSON.stringify([{ id: "thinloop@thinloop", version, enabled: true, scope: "user", installPath: installed }]);
      if (command[2] === "marketplace" && command[3] === "list") return JSON.stringify([{ name: "thinloop", source: "directory", path: root }]);
      if (command[2] === "install") pluginPayload(installed);
      return "";
    };
    for (let attempt = 0; attempt < 2; attempt++) {
      const report = await refreshInstallation({ platformId: "claude-code", sourceRoot: root, homeDir: home, runCommand });
      assert.equal(report.results[0].status, "PASS");
      assert.deepEqual(fs.readFileSync(changed), fs.readFileSync(path.join(root, "hooks/validate-state.mjs")));
    }
    assert.deepEqual(commands.filter(command => ["uninstall", "install"].includes(command[2])), [
      ["claude", "plugin", "uninstall", "thinloop@thinloop", "--scope", "user", "--keep-data"],
      ["claude", "plugin", "install", "thinloop@thinloop", "--scope", "user"],
    ]);
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});

test("Claude does not reinstall when update leaves version or install-path evidence unresolved", async () => {
  const home = fixture();
  try {
    for (const versionAfterUpdate of ["0.0.0", undefined]) {
      const calls = [];
      await assert.rejects(refreshInstallation({ platformId: "claude-code", sourceRoot: root, homeDir: home,
        runCommand(command) {
          calls.push(command);
          if (command[2] === "list") return JSON.stringify([{ id: "thinloop@thinloop", version: versionAfterUpdate, enabled: true, scope: "user", installPath: path.join(home, "missing") }]);
          if (command[2] === "marketplace" && command[3] === "list") return JSON.stringify([{ name: "thinloop", source: "directory", path: root }]);
          return "";
        },
      }), /did not verify PASS/);
      assert.equal(calls.some(command => ["uninstall", "install"].includes(command[2])), false);
    }
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});
