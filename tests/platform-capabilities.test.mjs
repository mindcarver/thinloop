import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  formatText,
  inspectInstallations,
} from "../scripts/verify-install.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registryPath = path.join(root, "config", "platform-capabilities.json");
const checkerPath = path.join(root, "scripts", "verify-install.mjs");
const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
const expectedVersion = JSON.parse(
  fs.readFileSync(path.join(root, registry.product.versionManifest), "utf8"),
).version;
const expectedSkills = fs
  .readdirSync(path.join(root, registry.product.skillsRoot), {
    withFileTypes: true,
  })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function platform(id) {
  return registry.platforms.find((entry) => entry.id === id);
}

function makeFixture() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "thinloop-install-"));
}

function fixtureSkillRoot(homeDir, platformId, environment = {}) {
  const installation = platform(platformId).installation;
  const override = installation.skillRootOverride;
  const overrideRoot = override && environment[override.environment];
  if (overrideRoot) {
    return path.join(overrideRoot, ...override.suffix.split("/"));
  }
  return path.join(homeDir, ...installation.skillRoot.split("/"));
}

function linkSkills(
  homeDir,
  platformId,
  skillNames = expectedSkills,
  environment = {},
) {
  const skillRoot = fixtureSkillRoot(homeDir, platformId, environment);
  fs.mkdirSync(skillRoot, { recursive: true });
  for (const skillName of skillNames) {
    fs.symlinkSync(
      path.join(root, "skills", skillName),
      path.join(skillRoot, skillName),
      process.platform === "win32" ? "junction" : "dir",
    );
  }
}

function makePluginInstall(
  platformId,
  {
    version = expectedVersion,
    missingHooks = [],
    manifestOverrides = {},
    extraSkills = [],
  } = {},
) {
  const definition = platform(platformId);
  const installPath = makeFixture();
  const manifestPath = path.join(
    installPath,
    ...definition.installation.manifest.split("/"),
  );
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  const manifest = {
    ...readJson(definition.installation.manifest),
    version,
    ...manifestOverrides,
  };
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(manifest),
  );

  const installedSkillRoot = path.join(
    installPath,
    ...definition.installation.skillRoot.split("/"),
  );
  for (const skillName of [...expectedSkills, ...extraSkills]) {
    const skillPath = path.join(installedSkillRoot, skillName);
    fs.mkdirSync(skillPath, { recursive: true });
    fs.writeFileSync(path.join(skillPath, "SKILL.md"), `# ${skillName}\n`);
  }

  const hookSources = [
    ...new Set(definition.capabilities.hooks.map((hook) => hook.source)),
  ];
  for (const relativePath of hookSources) {
    const configuration = readJson(relativePath);
    for (const event of missingHooks) {
      delete configuration.hooks?.[event];
    }
    const absolutePath = path.join(
      installPath,
      ...relativePath.split("/"),
    );
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, JSON.stringify(configuration));
  }
  const handlerPath = path.join(
    installPath,
    ...definition.capabilities.hookHandler.split("/"),
  );
  fs.mkdirSync(path.dirname(handlerPath), { recursive: true });
  fs.copyFileSync(
    path.join(root, definition.capabilities.hookHandler),
    handlerPath,
  );

  return installPath;
}

function pluginRunner(recordsByExecutable) {
  return ([executable]) => ({
    status: 0,
    stdout: JSON.stringify(recordsByExecutable[executable] ?? []),
    stderr: "",
  });
}

function resultMap(report) {
  return Object.fromEntries(
    report.results.map((result) => [result.id, result]),
  );
}

test("platform registry is the five-platform capability contract", () => {
  assert.equal(registry.schemaVersion, 1);
  assert.deepEqual(
    registry.platforms.map((entry) => entry.id),
    ["codex", "opencode", "claude-code", "workbuddy", "zcode"],
  );
  assert.equal(expectedSkills.length, 7);

  const installation = read("docs/installation.md");
  const verification = read("docs/verification.md");
  const readme = read("README.md");
  assert.match(readme, new RegExp(`<kbd>v${escapeRegex(expectedVersion)}</kbd>`));

  for (const definition of registry.platforms) {
    assert.match(
      installation,
      new RegExp(escapeRegex(definition.installation.summary)),
    );
    assert.match(
      installation,
      new RegExp(escapeRegex(definition.installation.takesEffect)),
    );
    assert.match(
      verification,
      new RegExp(escapeRegex(definition.verification.summary)),
    );

    if (definition.installation.manifest) {
      const manifest = readJson(definition.installation.manifest);
      assert.equal(manifest.name, registry.product.name);
      assert.equal(manifest.version, expectedVersion);
    }
    for (const hook of definition.capabilities.hooks) {
      const hooks = readJson(hook.source).hooks?.[hook.event];
      assert.ok(Array.isArray(hooks), `${definition.id} ${hook.event}`);
      if (hook.matcher) {
        assert.ok(
          hooks.some((group) => group.matcher === hook.matcher),
          `${definition.id} ${hook.event}(${hook.matcher})`,
        );
      }
    }
    if (definition.capabilities.hookHandler) {
      assert.ok(
        fs.existsSync(path.join(root, definition.capabilities.hookHandler)),
        `${definition.id} hook handler`,
      );
    }
  }
});

test("read-only checker verifies complete automatic installs", () => {
  const homeDir = makeFixture();
  const claudePath = makePluginInstall("claude-code");
  try {
    linkSkills(homeDir, "codex");
    linkSkills(homeDir, "opencode");
    const report = inspectInstallations({
      registryPath,
      sourceRoot: root,
      homeDir,
      environment: {},
      runCommand: pluginRunner({
        claude: [
          {
            id: "thinloop@thinloop",
            version: expectedVersion,
            enabled: true,
            installPath: claudePath,
          },
        ],
      }),
    });
    const results = resultMap(report);

    assert.equal(report.readOnly, true);
    assert.equal(report.exitCode, 0);
    assert.equal(results.codex.status, "PASS");
    assert.equal(results.opencode.status, "MANUAL");
    assert.equal(results["claude-code"].status, "PASS");
    assert.equal(results.workbuddy.status, "MANUAL");
    assert.equal(results.zcode.status, "MANUAL");
    assert.match(formatText(report), /Mode: read-only/);
  } finally {
    fs.rmSync(homeDir, { recursive: true, force: true });
    fs.rmSync(claudePath, { recursive: true, force: true });
  }
});

test("checker reports missing, partial, stale, and hook-mismatched installs", () => {
  const homeDir = makeFixture();
  const claudePath = makePluginInstall("claude-code", {
    version: "0.0.0",
    missingHooks: ["Stop"],
  });
  try {
    linkSkills(homeDir, "opencode", expectedSkills.slice(0, -1));
    const report = inspectInstallations({
      registryPath,
      sourceRoot: root,
      homeDir,
      environment: {},
      runCommand: pluginRunner({
        claude: [
          {
            id: "thinloop@thinloop",
            version: "0.0.0",
            enabled: true,
            installPath: claudePath,
          },
        ],
      }),
    });
    const results = resultMap(report);

    assert.equal(report.exitCode, 1);
    assert.equal(results.codex.status, "FAIL");
    assert.equal(results.opencode.status, "FAIL");
    assert.equal(results["claude-code"].status, "FAIL");
    assert.equal(results.workbuddy.status, "MANUAL");
    assert.equal(results.zcode.status, "MANUAL");
    assert.match(
      results["claude-code"].checks.find((check) => check.name === "version").detail,
      /0\.0\.0 installed/,
    );
    assert.match(
      results["claude-code"].checks.find((check) => check.name === "hooks")
        .detail,
      /Stop/,
    );
  } finally {
    fs.rmSync(homeDir, { recursive: true, force: true });
    fs.rmSync(claudePath, { recursive: true, force: true });
  }
});

test("unavailable automatic plugin CLI stays unverified instead of failing", () => {
  const homeDir = makeFixture();
  try {
    linkSkills(homeDir, "codex");
    linkSkills(homeDir, "opencode");
    const report = inspectInstallations({
      registryPath,
      sourceRoot: root,
      homeDir,
      environment: {},
      runCommand: ([executable]) => ({
        status: null,
        stdout: "",
        stderr: "",
        error: Object.assign(new Error(`${executable} unavailable`), {
          code: "ENOENT",
        }),
      }),
    });
    const results = resultMap(report);

    assert.equal(report.exitCode, 0);
    assert.equal(results.opencode.status, "MANUAL");
    assert.equal(results["claude-code"].status, "UNVERIFIED");
    assert.equal(results.workbuddy.status, "MANUAL");
    assert.equal(results.zcode.status, "MANUAL");
  } finally {
    fs.rmSync(homeDir, { recursive: true, force: true });
  }
});

test("missing plugin evidence stays unverified instead of being guessed", () => {
  const homeDir = makeFixture();
  try {
    linkSkills(homeDir, "codex");
    linkSkills(homeDir, "opencode");
    const report = inspectInstallations({
      registryPath,
      sourceRoot: root,
      homeDir,
      environment: {},
      runCommand: pluginRunner({
        claude: [{ id: "thinloop@thinloop" }],
      }),
    });
    const results = resultMap(report);

    assert.equal(report.exitCode, 0);
    assert.equal(results["claude-code"].status, "UNVERIFIED");
    assert.equal(results.workbuddy.status, "MANUAL");
    assert.match(
      results["claude-code"].checks.find((check) => check.name === "version").detail,
      /did not report a version/,
    );
  } finally {
    fs.rmSync(homeDir, { recursive: true, force: true });
  }
});

test("checker has a dedicated not-installed fixture", () => {
  const homeDir = makeFixture();
  try {
    linkSkills(homeDir, "codex");
    linkSkills(homeDir, "opencode");
    const report = inspectInstallations({
      registryPath,
      sourceRoot: root,
      homeDir,
      environment: {},
      runCommand: pluginRunner({
        claude: [],
      }),
    });
    const results = resultMap(report);

    assert.equal(report.exitCode, 1);
    assert.equal(results["claude-code"].status, "FAIL");
    assert.equal(results.workbuddy.status, "MANUAL");
    assert.match(
      results["claude-code"].checks.find((check) => check.name === "plugin")
        .detail,
      /is not installed/,
    );
  } finally {
    fs.rmSync(homeDir, { recursive: true, force: true });
  }
});

test("checker honors CODEX_HOME and XDG_CONFIG_HOME independently", () => {
  const homeDir = makeFixture();
  const environment = {
    CODEX_HOME: path.join(homeDir, "custom-codex"),
    XDG_CONFIG_HOME: path.join(homeDir, "custom-xdg"),
  };
  const claudePath = makePluginInstall("claude-code");
  try {
    linkSkills(homeDir, "codex", expectedSkills, environment);
    linkSkills(homeDir, "opencode", expectedSkills, environment);
    const report = inspectInstallations({
      registryPath,
      sourceRoot: root,
      homeDir,
      environment,
      runCommand: pluginRunner({
        claude: [
          {
            id: "thinloop@thinloop",
            version: expectedVersion,
            enabled: true,
            installPath: claudePath,
          },
        ],
      }),
    });
    const results = resultMap(report);

    assert.equal(results.codex.status, "PASS");
    assert.equal(results.opencode.status, "MANUAL");
    assert.match(
      results.codex.checks.find((check) => check.name === "skills").detail,
      /custom-codex/,
    );
    assert.match(
      results.opencode.checks.find((check) => check.name === "skills").detail,
      /custom-xdg/,
    );
  } finally {
    fs.rmSync(homeDir, { recursive: true, force: true });
    fs.rmSync(claudePath, { recursive: true, force: true });
  }
});

test("checker rejects unexpected legacy skills", () => {
  const homeDir = makeFixture();
  const claudePath = makePluginInstall("claude-code", {
    extraSkills: ["scd-dev-loop"],
  });
  try {
    linkSkills(homeDir, "codex");
    linkSkills(homeDir, "opencode");
    const legacyPath = path.join(
      fixtureSkillRoot(homeDir, "codex"),
      "scd-dev-loop",
    );
    fs.mkdirSync(legacyPath);
    fs.writeFileSync(path.join(legacyPath, "SKILL.md"), "# legacy\n");

    const report = inspectInstallations({
      registryPath,
      sourceRoot: root,
      homeDir,
      environment: {},
      runCommand: pluginRunner({
        claude: [
          {
            id: "thinloop@thinloop",
            version: expectedVersion,
            enabled: true,
            installPath: claudePath,
          },
        ],
      }),
    });
    const results = resultMap(report);

    assert.equal(results.codex.status, "FAIL");
    assert.equal(results["claude-code"].status, "FAIL");
    assert.match(
      results.codex.checks.find((check) => check.name === "skills").detail,
      /unexpected scd skills: scd-dev-loop/,
    );
    assert.match(
      results["claude-code"].checks.find((check) => check.name === "skills")
        .detail,
      /unexpected scd skills: scd-dev-loop/,
    );
  } finally {
    fs.rmSync(homeDir, { recursive: true, force: true });
    fs.rmSync(claudePath, { recursive: true, force: true });
  }
});

test("checker rejects broken plugin manifest and hook wiring", () => {
  const homeDir = makeFixture();
  const claudePath = makePluginInstall("claude-code", {
    manifestOverrides: { hooks: undefined },
  });
  const hookPath = path.join(claudePath, "hooks", "hooks.claude.json");
  const hooks = JSON.parse(fs.readFileSync(hookPath, "utf8"));
  hooks.hooks.Stop[0].hooks[0].command = "node wrong-handler.mjs";
  fs.writeFileSync(hookPath, JSON.stringify(hooks));
  try {
    linkSkills(homeDir, "codex");
    linkSkills(homeDir, "opencode");
    const report = inspectInstallations({
      registryPath,
      sourceRoot: root,
      homeDir,
      environment: {},
      runCommand: pluginRunner({
        claude: [
          {
            id: "thinloop@thinloop",
            version: expectedVersion,
            enabled: true,
            installPath: claudePath,
          },
        ],
      }),
    });
    const results = resultMap(report);

    assert.equal(results["claude-code"].status, "FAIL");
    assert.equal(results.workbuddy.status, "MANUAL");
    assert.match(
      results["claude-code"].checks.find((check) => check.name === "manifest")
        .detail,
      /hooks wiring differs from source/,
    );
    assert.match(
      results["claude-code"].checks.find((check) => check.name === "hooks")
        .detail,
      /hooks\.claude\.json differs from source/,
    );
  } finally {
    fs.rmSync(homeDir, { recursive: true, force: true });
    fs.rmSync(claudePath, { recursive: true, force: true });
  }
});

test("checker never executes probes registered as manual", () => {
  const homeDir = makeFixture();
  const calls = [];
  try {
    linkSkills(homeDir, "codex");
    linkSkills(homeDir, "opencode");
    const report = inspectInstallations({
      registryPath,
      sourceRoot: root,
      homeDir,
      environment: {},
      runCommand: (command) => {
        calls.push(command);
        return { status: 0, stdout: "[]", stderr: "" };
      },
    });
    const results = resultMap(report);
    const runtimeCheck = results.opencode.checks.find(
      (check) => check.name === "runtime-discovery",
    );

    assert.deepEqual(calls, [["claude", "plugin", "list", "--json"]]);
    assert.equal(runtimeCheck.status, "MANUAL");
    assert.match(runtimeCheck.detail, /可能写入日志/);
    assert.equal(results.workbuddy.status, "MANUAL");
    assert.match(results.workbuddy.checks[0].detail, /写客户端日志/);
  } finally {
    fs.rmSync(homeDir, { recursive: true, force: true });
  }
});

test("checker source and registered probes are read-only", () => {
  const checker = read("scripts/verify-install.mjs");
  assert.doesNotMatch(
    checker,
    /\b(?:writeFile|appendFile|mkdir|rm|rename|unlink|symlink)(?:Sync)?\b/,
  );
  assert.equal(platform("opencode").verification.mode, "skill-links");
  assert.deepEqual(platform("opencode").verification.manualRuntime.command, [
    "opencode",
    "debug",
    "skill",
  ]);
  assert.equal(
    platform("opencode").verification.manualRuntime.checkerEligible,
    false,
  );
  assert.deepEqual(platform("claude-code").verification.command, [
    "claude",
    "plugin",
    "list",
    "--json",
  ]);
  assert.equal(platform("workbuddy").verification.mode, "manual");
  assert.match(platform("workbuddy").verification.manualFallback, /写客户端日志/);
  assert.equal(platform("zcode").verification.mode, "manual");
});

test("checker reserves exit code 2 for invalid invocation", () => {
  const result = spawnSync(
    process.execPath,
    [checkerPath, "--format", "yaml"],
    { cwd: root, encoding: "utf8" },
  );

  assert.equal(result.status, 2);
  assert.match(result.stderr, /--format must be json or text/);
});
