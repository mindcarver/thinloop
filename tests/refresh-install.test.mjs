import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { zcodeFixture } from "./helpers/zcode-fixture.mjs";
import { fileURLToPath } from "node:url";
import {
  installAntigravityPlugin,
  refreshInstallation,
} from "../scripts/refresh-install.mjs";
import { ANTIGRAVITY_MANIFEST_ALLOWED_KEYS } from "../scripts/verify-install.mjs";

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

for (const shape of ["array", "envelope"]) {
  test(`ZCode refresh accepts ${shape} and rechecks the updated payload`, async () => {
    const home = fixture();
    const installed = path.join(home, "installed");
    const commands = [];
    const requests = [];
    let current = "0.0.0";
    try {
      const report = await refreshInstallation({ platformId: "zcode", sourceRoot: root, homeDir: home,
        runCommand(command) {
          commands.push(command);
          return JSON.stringify(zcodeFixture(shape, { installPath: installed, version: current, sourceRoot: root }));
        },
        async request(method, params) {
          requests.push([method, params]);
          if (method === "plugins/overview") return { marketplaces: [{ id: "thinloop", source: { source: "directory", path: root } }] };
          if (method === "plugins/update") { pluginPayload(installed); current = version; }
          return { diagnostics: [] };
        },
      });
      assert.equal(report.results[0].status, "PASS");
      assert.deepEqual(commands, Array(2).fill(["zcode", "plugins", "list", "--json"]));
      const workspace = { workspacePath: root, workspaceKey: root };
      assert.deepEqual(requests, [
        ["plugins/overview", { workspace }],
        ["plugins/marketplace/update", { workspace, marketplace: "thinloop" }],
        ["plugins/update", { workspace, pluginId: "thinloop@thinloop" }],
      ]);
    } finally { fs.rmSync(home, { recursive: true, force: true }); }
  });
}

for (const response of [null, {}, { plugins: null }, { plugins: {} }, [null],
  [{ id: "thinloop@thinloop", enabled: true }, { id: "thinloop@thinloop", enabled: true }]]) {
  test(`ZCode refresh refuses malformed or ambiguous evidence: ${JSON.stringify(response)}`, async () => {
    let requests = 0;
    await assert.rejects(refreshInstallation({ platformId: "zcode", sourceRoot: root,
      runCommand() { return JSON.stringify(response); },
      request() { requests++; throw new Error("unexpected update"); },
    }), /already be installed and enabled/);
    assert.equal(requests, 0);
  });
}

test("Antigravity refresh refuses a missing installation without creating directories or config.json", async () => {
  const home = fixture();
  const configRoot = path.join(home, ".gemini", "config");
  try {
    await assert.rejects(
      refreshInstallation({
        platformId: "antigravity",
        sourceRoot: root,
        homeDir: home,
        environment: {},
        runCommand() {
          throw new Error("Antigravity refresh must not call a plugin CLI");
        },
      }),
      /No installed Antigravity Thinloop plugin/,
    );
    assert.equal(fs.existsSync(configRoot), false);
    assert.equal(fs.existsSync(path.join(configRoot, "config.json")), false);
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});

test("Antigravity install assembles whitelisted plugin payload without touching config.json", () => {
  const home = fixture();
  const configDir = path.join(home, "custom-agy");
  const configJsonPath = path.join(configDir, "config.json");
  const originalConfig = `${JSON.stringify({ userSettings: { theme: "dark" }, plugins: { other: { enabled: true } } }, null, 2)}\n`;
  try {
    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(configJsonPath, originalConfig);

    const report = installAntigravityPlugin({
      sourceRoot: root,
      homeDir: home,
      environment: { ANTIGRAVITY_CONFIG_DIR: configDir },
    });
    assert.equal(report.results[0].status, "PASS");
    assert.equal(fs.readFileSync(configJsonPath, "utf8"), originalConfig);

    const pluginDir = path.join(configDir, "plugins", "thinloop");
    const manifest = JSON.parse(fs.readFileSync(path.join(pluginDir, "plugin.json"), "utf8"));
    assert.equal(manifest.name, "thinloop");
    assert.equal(manifest.displayName, "Thinloop");
    assert.equal(manifest.version, version);
    assert.equal(manifest.suggestedPrompts.length, 3);
    for (const key of Object.keys(manifest)) {
      assert.ok(ANTIGRAVITY_MANIFEST_ALLOWED_KEYS.has(key), `unexpected top-level key: ${key}`);
    }

    const hooksJson = JSON.parse(fs.readFileSync(path.join(pluginDir, "hooks.json"), "utf8"));
    assert.equal(hooksJson["thinloop-continuity"].Stop.length, 1);
    assert.match(hooksJson["thinloop-continuity"].Stop[0].command, /--platform antigravity/);

    const rules = fs.readFileSync(path.join(pluginDir, "rules", "AGENTS.md"), "utf8");
    assert.doesNotMatch(rules, /^---\s*\n/);
    assert.doesNotMatch(rules, /Thinloop Delivery Default/);
    assert.match(rules, /thinloop-routing-kernel:start/);

    assert.equal(
      fs.realpathSync(path.join(pluginDir, "skills")),
      fs.realpathSync(path.join(root, "skills")),
    );
    assert.equal(
      fs.realpathSync(path.join(pluginDir, "hooks")),
      fs.realpathSync(path.join(root, "hooks")),
    );
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});

test("Antigravity refresh is repeatable, repairs drifted payload and preserves config.json", async () => {
  const home = fixture();
  const configDir = path.join(home, "agy-config");
  const configJsonPath = path.join(configDir, "config.json");
  const originalConfig = '{"plugins":{"thinloop":{"enabled":true}}}\n';
  const pluginDir = path.join(configDir, "plugins", "thinloop");
  const oldCheckout = path.join(home, "old-checkout");
  try {
    fs.mkdirSync(path.join(oldCheckout, "skills"), { recursive: true });
    fs.mkdirSync(path.join(oldCheckout, "hooks"), { recursive: true });
    fs.mkdirSync(path.join(pluginDir, "rules"), { recursive: true });
    fs.writeFileSync(configJsonPath, originalConfig);

    // Seed drifted installation: stale version, unknown field, bad hooks, polluted rules, old symlinks.
    fs.writeFileSync(
      path.join(pluginDir, "plugin.json"),
      JSON.stringify({ name: "thinloop", version: "0.0.0", unknownField: true }),
    );
    fs.writeFileSync(path.join(pluginDir, "hooks.json"), JSON.stringify({ hooks: {} }));
    fs.writeFileSync(
      path.join(pluginDir, "rules", "AGENTS.md"),
      "# Thinloop Delivery Default\nstale\n",
    );
    fs.symlinkSync(
      path.join(oldCheckout, "skills"),
      path.join(pluginDir, "skills"),
      process.platform === "win32" ? "junction" : "dir",
    );
    fs.symlinkSync(
      path.join(oldCheckout, "hooks"),
      path.join(pluginDir, "hooks"),
      process.platform === "win32" ? "junction" : "dir",
    );

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const report = await refreshInstallation({
        platformId: "antigravity",
        sourceRoot: root,
        homeDir: home,
        environment: { ANTIGRAVITY_CONFIG_DIR: configDir },
        runCommand() {
          throw new Error("Antigravity refresh must not invoke a plugin CLI");
        },
      });
      assert.equal(report.results[0].status, "PASS");
      assert.equal(fs.readFileSync(configJsonPath, "utf8"), originalConfig);
      const manifest = JSON.parse(fs.readFileSync(path.join(pluginDir, "plugin.json"), "utf8"));
      assert.equal(manifest.version, version);
      assert.equal("unknownField" in manifest, false);
      assert.doesNotMatch(
        fs.readFileSync(path.join(pluginDir, "rules", "AGENTS.md"), "utf8"),
        /Thinloop Delivery Default/,
      );
      assert.equal(
        fs.realpathSync(path.join(pluginDir, "skills")),
        fs.realpathSync(path.join(root, "skills")),
      );
      assert.equal(
        fs.realpathSync(path.join(pluginDir, "hooks")),
        fs.realpathSync(path.join(root, "hooks")),
      );
    }
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});

test("Antigravity refresh refuses non-Thinloop plugin directory or colliding non-link before mutation", async () => {
  const home = fixture();
  const pluginDir = path.join(home, ".gemini", "config", "plugins", "thinloop");
  try {
    fs.mkdirSync(pluginDir, { recursive: true });
    fs.writeFileSync(path.join(pluginDir, "plugin.json"), JSON.stringify({ name: "other-plugin" }));
    await assert.rejects(
      refreshInstallation({ platformId: "antigravity", sourceRoot: root, homeDir: home, environment: {} }),
      /Not an owned Antigravity Thinloop plugin/,
    );
    assert.equal(JSON.parse(fs.readFileSync(path.join(pluginDir, "plugin.json"), "utf8")).name, "other-plugin");

    fs.writeFileSync(path.join(pluginDir, "plugin.json"), JSON.stringify({ name: "thinloop", version: "0.0.0" }));
    fs.mkdirSync(path.join(pluginDir, "skills"), { recursive: true });
    fs.writeFileSync(path.join(pluginDir, "skills", "custom-user-file.txt"), "keep me");
    await assert.rejects(
      refreshInstallation({ platformId: "antigravity", sourceRoot: root, homeDir: home, environment: {} }),
      /Refusing to replace non-link/,
    );
    assert.equal(JSON.parse(fs.readFileSync(path.join(pluginDir, "plugin.json"), "utf8")).version, "0.0.0");
    assert.equal(
      fs.readFileSync(path.join(pluginDir, "skills", "custom-user-file.txt"), "utf8"),
      "keep me",
    );
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});

test("Antigravity refresh fails verification without editing skills.json when duplicate exposure exists", async () => {
  const home = fixture();
  const configDir = path.join(home, ".gemini", "config");
  const skillsJsonPath = path.join(configDir, "skills.json");
  const originalSkillsJson = `${JSON.stringify({ entries: [{ path: path.join(root, "skills") }] })}\n`;
  try {
    installAntigravityPlugin({ sourceRoot: root, homeDir: home, environment: {} });
    fs.writeFileSync(skillsJsonPath, originalSkillsJson);

    await assert.rejects(
      refreshInstallation({ platformId: "antigravity", sourceRoot: root, homeDir: home, environment: {} }),
      /did not verify PASS/,
    );
    assert.equal(fs.readFileSync(skillsJsonPath, "utf8"), originalSkillsJson);
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});
