#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";

const SCRIPT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const DEFAULT_REGISTRY = path.join(
  SCRIPT_ROOT,
  "config",
  "platform-capabilities.json",
);
const RESULT_ORDER = ["PASS", "FAIL", "UNVERIFIED", "MANUAL"];
const READ_ONLY_PROBES = new Map([
  ["claude-code", ["claude", "plugin", "list", "--json"]],
  ["codewhale", ["codewhale", "doctor", "--json"]],
]);
const MANUAL_PROBES = new Map([
  ["opencode", ["opencode", "debug", "skill"]],
]);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function resolveFrom(root, relativePath) {
  return path.join(root, ...relativePath.split("/"));
}

function parseArgs(argv) {
  const options = {
    format: "text",
    homeDir: os.homedir(),
    registryPath: DEFAULT_REGISTRY,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--format") {
      options.format = argv[index + 1];
      index += 1;
    } else if (argument === "--home") {
      options.homeDir = argv[index + 1];
      index += 1;
    } else if (argument === "--platform") {
      options.platformId = argv[index + 1];
      if (!options.platformId) {
        throw new Error("--platform requires an id");
      }
      index += 1;
    } else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (!["json", "text"].includes(options.format)) {
    throw new Error("--format must be json or text");
  }
  if (!options.homeDir) {
    throw new Error("--home requires a path");
  }
  return options;
}

function expectedSource(registry, sourceRoot) {
  const versionManifest = readJson(
    resolveFrom(sourceRoot, registry.product.versionManifest),
  );
  const skillsRoot = resolveFrom(sourceRoot, registry.product.skillsRoot);
  const skillNames = fs
    .readdirSync(skillsRoot, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() &&
        fs.existsSync(path.join(skillsRoot, entry.name, "SKILL.md")),
    )
    .map((entry) => entry.name)
    .sort();

  if (versionManifest.name !== registry.product.name) {
    throw new Error(
      `${registry.product.versionManifest} must describe ${registry.product.name}`,
    );
  }
  if (typeof versionManifest.version !== "string" || !versionManifest.version) {
    throw new Error(`${registry.product.versionManifest} has no version`);
  }
  if (skillNames.length === 0) {
    throw new Error(`${registry.product.skillsRoot} contains no skills`);
  }

  return {
    name: versionManifest.name,
    version: versionManifest.version,
    sourceRoot,
    skillsRoot,
    skillNames,
  };
}

function validateRegistry(registry) {
  if (registry.schemaVersion !== 1) {
    throw new Error("Unsupported platform capability registry schema");
  }
  if (!registry.product?.name) {
    throw new Error("Registry product.name is required");
  }
  if (!Array.isArray(registry.platforms) || registry.platforms.length === 0) {
    throw new Error("Registry platforms must be a non-empty array");
  }

  const ids = new Set();
  for (const platform of registry.platforms) {
    if (!platform.id || ids.has(platform.id)) {
      throw new Error(`Platform id is missing or duplicated: ${platform.id}`);
    }
    ids.add(platform.id);
    if (!platform.displayName || !platform.installation || !platform.verification) {
      throw new Error(`Platform ${platform.id} is incomplete`);
    }
    if (!platform.installation.skillRoot) {
      throw new Error(`Platform ${platform.id} installation.skillRoot is required`);
    }
    if (!Array.isArray(platform.capabilities?.hooks)) {
      throw new Error(`Platform ${platform.id} capabilities.hooks must be an array`);
    }
    if (
      platform.capabilities.hooks.length > 0 &&
      !platform.capabilities.hookHandler
    ) {
      throw new Error(`Platform ${platform.id} capabilities.hookHandler is required`);
    }
    if (platform.verification.mode === "plugin-cli") {
      const allowed = READ_ONLY_PROBES.get(platform.id);
      if (
        !allowed ||
        JSON.stringify(platform.verification.command) !== JSON.stringify(allowed)
      ) {
        throw new Error(`Platform ${platform.id} has an unsafe read-only probe`);
      }
    } else if (platform.verification.command !== undefined) {
      throw new Error(`Platform ${platform.id} must not declare a command`);
    }
    const manualRuntime = platform.verification.manualRuntime;
    if (manualRuntime) {
      const allowed = MANUAL_PROBES.get(platform.id);
      if (
        !allowed ||
        manualRuntime.checkerEligible !== false ||
        JSON.stringify(manualRuntime.command) !== JSON.stringify(allowed)
      ) {
        throw new Error(`Platform ${platform.id} has an unsafe manual probe`);
      }
    }
    const runtimeDiscovery = platform.verification.runtimeDiscovery;
    if (runtimeDiscovery) {
      const allowed = READ_ONLY_PROBES.get(platform.id);
      if (
        platform.id !== "codewhale" ||
        !allowed ||
        runtimeDiscovery.checkerEligible !== true ||
        JSON.stringify(runtimeDiscovery.command) !== JSON.stringify(allowed)
      ) {
        throw new Error(`Platform ${platform.id} has an unsafe runtime probe`);
      }
    }
  }
}

function makeCheck(name, status, detail) {
  return { name, status, detail };
}

function resultStatus(checks) {
  if (checks.some((check) => check.status === "FAIL")) {
    return "FAIL";
  }
  if (checks.some((check) => check.status === "UNVERIFIED")) {
    return "UNVERIFIED";
  }
  if (checks.some((check) => check.status === "MANUAL")) {
    return "MANUAL";
  }
  return "PASS";
}

function platformResult(platform, checks) {
  return {
    id: platform.id,
    displayName: platform.displayName,
    status: resultStatus(checks),
    checks,
  };
}

function singleCheckResult(platform, name, status, detail) {
  return platformResult(platform, [makeCheck(name, status, detail)]);
}

function resolveSkillRoot(platform, homeDir, environment) {
  const override = platform.installation.skillRootOverride;
  const overrideRoot = override && environment[override.environment];
  if (typeof overrideRoot === "string" && overrideRoot.length > 0) {
    if (override.direct === true) {
      return path.resolve(overrideRoot);
    }
    return resolveFrom(path.resolve(overrideRoot), override.suffix);
  }
  return resolveFrom(homeDir, platform.installation.skillRoot);
}

function unexpectedSkillNames(skillRoot, expected) {
  try {
    const expectedNames = new Set(expected.skillNames);
    return fs
      .readdirSync(skillRoot, { withFileTypes: true })
      .filter((entry) => entry.name.startsWith("scd-"))
      .map((entry) => entry.name)
      .filter((name) => !expectedNames.has(name))
      .sort();
  } catch (error) {
    if (error?.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

function inspectSkillLinks(platform, expected, homeDir, environment) {
  const skillRoot = resolveSkillRoot(platform, homeDir, environment);
  const checks = [];
  const missing = [];
  const wrongTargets = [];
  const nonLinks = [];
  const inspectionErrors = [];

  for (const skillName of expected.skillNames) {
    const installedPath = path.join(skillRoot, skillName);
    let stat;
    try {
      stat = fs.lstatSync(installedPath);
    } catch (error) {
      if (error?.code === "ENOENT") {
        missing.push(skillName);
        continue;
      }
      inspectionErrors.push(`${skillName}: ${error.message}`);
      continue;
    }

    if (!stat.isSymbolicLink()) {
      nonLinks.push(skillName);
      continue;
    }

    try {
      const actualTarget = fs.realpathSync(installedPath);
      const expectedTarget = fs.realpathSync(
        path.join(expected.skillsRoot, skillName),
      );
      if (actualTarget !== expectedTarget) {
        wrongTargets.push(`${skillName} -> ${actualTarget}`);
      }
    } catch (error) {
      wrongTargets.push(`${skillName} -> ${error.message}`);
    }
  }

  let unexpected = [];
  try {
    unexpected = unexpectedSkillNames(skillRoot, expected);
  } catch (error) {
    inspectionErrors.push(error.message);
  }

  const problems = [
    ...(missing.length > 0 ? [`missing: ${missing.join(", ")}`] : []),
    ...(nonLinks.length > 0
      ? [`not source links: ${nonLinks.join(", ")}`]
      : []),
    ...(wrongTargets.length > 0
      ? [`wrong targets: ${wrongTargets.join(", ")}`]
      : []),
    ...(unexpected.length > 0
      ? [`unexpected scd skills: ${unexpected.join(", ")}`]
      : []),
  ];
  checks.push(
    makeCheck(
      "skills",
      problems.length > 0
        ? "FAIL"
        : inspectionErrors.length > 0
          ? "UNVERIFIED"
          : "PASS",
      problems.length > 0
        ? problems.join("; ")
        : inspectionErrors.length > 0
          ? inspectionErrors.join("; ")
          : `${expected.skillNames.length}/${expected.skillNames.length} source links in ${skillRoot} resolve to ${expected.skillsRoot}`,
    ),
  );
  checks.push(
    makeCheck(
      "version",
      problems.length === 0 && inspectionErrors.length === 0
        ? "PASS"
        : "UNVERIFIED",
      problems.length === 0 && inspectionErrors.length === 0
        ? `linked source version ${expected.version}`
        : "source version cannot be attributed until every link is valid",
    ),
  );
  checks.push(
    makeCheck(
      "hooks",
      "PASS",
      platform.capabilities.hooks.length === 0
        ? "not supported by this installation mode"
        : `${platform.capabilities.hooks.length} expected`,
    ),
  );

  return platformResult(platform, checks);
}

function defaultRunCommand(command, { homeDir, environment } = {}) {
  const [executable, ...args] = command;
  return spawnSync(executable, args, {
    encoding: "utf8",
    env: {
      ...process.env,
      ...environment,
      ...(homeDir ? { HOME: homeDir } : {}),
    },
    maxBuffer: 64 * 1024 * 1024,
    timeout: 10_000,
    windowsHide: true,
  });
}

function inspectCodeWhaleRuntime(platform, expected, runCommand, context) {
  const runtime = platform.verification.runtimeDiscovery;
  const commandResult = runCommand(runtime.command, context);
  if (commandResult.error || commandResult.status === null) {
    const detail =
      commandResult.error?.code === "ENOENT"
        ? "codewhale is unavailable"
        : commandResult.error?.message || "CodeWhale doctor did not complete";
    return makeCheck("runtime-discovery", "UNVERIFIED", detail);
  }
  if (commandResult.status !== 0) {
    return makeCheck(
      "runtime-discovery",
      "UNVERIFIED",
      `codewhale doctor exited ${commandResult.status}`,
    );
  }

  let report;
  try {
    report = JSON.parse(commandResult.stdout);
  } catch {
    return makeCheck(
      "runtime-discovery",
      "UNVERIFIED",
      "codewhale doctor returned invalid JSON",
    );
  }
  if (report?.status === "error") {
    return makeCheck(
      "runtime-discovery",
      "UNVERIFIED",
      `codewhale doctor reported ${report.error?.kind || "an error"}`,
    );
  }

  const reported = report?.skills?.global;
  const expectedRoot = resolveSkillRoot(
    platform,
    context.homeDir,
    context.environment,
  );
  const failures = [];
  if (typeof reported?.path !== "string") {
    failures.push("global Skill root missing");
  } else if (path.resolve(reported.path) !== expectedRoot) {
    failures.push(`global Skill root ${reported.path}; ${expectedRoot} expected`);
  }
  if (reported?.present !== true) {
    failures.push("global Skill root not present");
  }
  if (
    typeof reported?.count !== "number" ||
    reported.count < expected.skillNames.length
  ) {
    failures.push(
      `global Skill count ${reported?.count ?? "unknown"}; at least ${expected.skillNames.length} expected`,
    );
  }
  if (failures.length > 0) {
    return makeCheck("runtime-discovery", "FAIL", failures.join("; "));
  }
  if (
    typeof report.version !== "string" ||
    report.api_connectivity?.checked !== false
  ) {
    return makeCheck(
      "runtime-discovery",
      "UNVERIFIED",
      "CodeWhale version or network-free doctor evidence is missing",
    );
  }

  return makeCheck(
    "runtime-discovery",
    "PASS",
    `CodeWhale ${report.version} reports ${reported.path} with ${reported.count} skills; live API probe skipped`,
  );
}

function inspectInstalledSkills(installPath, platform, expected) {
  const skillRoot = resolveFrom(installPath, platform.installation.skillRoot);
  let installedNames;
  try {
    installedNames = fs
      .readdirSync(skillRoot, { withFileTypes: true })
      .filter((entry) => entry.name.startsWith("scd-"))
      .map((entry) => entry.name)
      .sort();
  } catch (error) {
    return makeCheck("skills", "FAIL", error.message);
  }
  const installedSet = new Set(installedNames);
  const expectedSet = new Set(expected.skillNames);
  const missing = expected.skillNames.filter(
    (skillName) =>
      !installedSet.has(skillName) ||
      !fs.existsSync(path.join(skillRoot, skillName, "SKILL.md")),
  );
  const unexpected = installedNames.filter(
    (skillName) => !expectedSet.has(skillName),
  );
  const problems = [
    ...(missing.length > 0 ? [`missing: ${missing.join(", ")}`] : []),
    ...(unexpected.length > 0
      ? [`unexpected scd skills: ${unexpected.join(", ")}`]
      : []),
  ];
  return makeCheck(
    "skills",
    problems.length === 0 ? "PASS" : "FAIL",
    problems.length === 0
      ? `${expected.skillNames.length}/${expected.skillNames.length} skills present`
      : problems.join("; "),
  );
}

function inspectInstalledHooks(installPath, platform, expected) {
  const mismatches = [];
  const sources = [
    ...new Set(platform.capabilities.hooks.map((hook) => hook.source)),
  ];
  for (const source of sources) {
    try {
      const installed = readJson(resolveFrom(installPath, source));
      const authoritative = readJson(resolveFrom(expected.sourceRoot, source));
      if (!isDeepStrictEqual(installed, authoritative)) {
        const changedEvents = platform.capabilities.hooks
          .filter((hook) => hook.source === source)
          .filter(
            (hook) =>
              !isDeepStrictEqual(
                installed.hooks?.[hook.event],
                authoritative.hooks?.[hook.event],
              ),
          )
          .map((hook) => hook.event);
        mismatches.push(
          `${source} differs from source${
            changedEvents.length > 0 ? `: ${changedEvents.join(", ")}` : ""
          }`,
        );
      }
    } catch (error) {
      mismatches.push(`${source}: ${error.message}`);
    }
  }

  const handler = platform.capabilities.hookHandler;
  try {
    const installed = fs.readFileSync(resolveFrom(installPath, handler));
    const authoritative = fs.readFileSync(
      resolveFrom(expected.sourceRoot, handler),
    );
    if (!installed.equals(authoritative)) {
      mismatches.push(`${handler} differs from source`);
    }
  } catch (error) {
    mismatches.push(`${handler}: ${error.message}`);
  }

  return makeCheck(
    "hooks",
    mismatches.length === 0 ? "PASS" : "FAIL",
    mismatches.length === 0
      ? `${platform.capabilities.hooks.length}/${platform.capabilities.hooks.length} hooks match source definitions`
      : mismatches.join("; "),
  );
}

function inspectPluginManifest(installPath, platform, expected, pluginVersion) {
  try {
    const installed = readJson(
      resolveFrom(installPath, platform.installation.manifest),
    );
    const authoritative = readJson(
      resolveFrom(expected.sourceRoot, platform.installation.manifest),
    );
    const mismatches = [];
    if (installed.name !== authoritative.name) {
      mismatches.push(
        `name ${installed.name ?? "unknown"}; ${authoritative.name} expected`,
      );
    }
    if (installed.version !== authoritative.version) {
      mismatches.push(
        `version ${installed.version ?? "unknown"}; ${authoritative.version} expected`,
      );
    }
    if (
      typeof pluginVersion === "string" &&
      installed.version !== pluginVersion
    ) {
      mismatches.push(
        `version ${installed.version ?? "unknown"}; ${pluginVersion} reported`,
      );
    }
    for (const field of ["skills", "hooks"]) {
      if (!isDeepStrictEqual(installed[field], authoritative[field])) {
        mismatches.push(`${field} wiring differs from source`);
      }
    }
    return makeCheck(
      "manifest",
      mismatches.length > 0 ? "FAIL" : "PASS",
      mismatches.length > 0
        ? mismatches.join("; ")
        : `${installed.name} ${installed.version} manifest and wiring match source`,
    );
  } catch (error) {
    return makeCheck("manifest", "FAIL", error.message);
  }
}

function inspectPlugin(platform, expected, runCommand, context) {
  const commandResult = runCommand(platform.verification.command, context);
  if (commandResult.error || commandResult.status === null) {
    const detail =
      commandResult.error?.code === "ENOENT"
        ? `${platform.verification.command[0]} is unavailable; ${platform.verification.manualFallback}`
        : commandResult.error?.message || "plugin command did not complete";
    return singleCheckResult(platform, "plugin", "UNVERIFIED", detail);
  }
  if (commandResult.status !== 0) {
    return singleCheckResult(
      platform,
      "plugin",
      "UNVERIFIED",
      `plugin command exited ${commandResult.status}; ${platform.verification.manualFallback}`,
    );
  }

  let plugins;
  try {
    plugins = JSON.parse(commandResult.stdout);
  } catch {
    return singleCheckResult(
      platform,
      "plugin",
      "UNVERIFIED",
      "plugin command returned invalid JSON",
    );
  }
  if (!Array.isArray(plugins)) {
    return singleCheckResult(
      platform,
      "plugin",
      "UNVERIFIED",
      "plugin command JSON must be an array",
    );
  }

  const plugin = plugins.find(
    (entry) => entry.id === platform.verification.pluginId,
  );
  if (!plugin) {
    return singleCheckResult(
      platform,
      "plugin",
      "FAIL",
      `${platform.verification.pluginId} is not installed`,
    );
  }

  const checks = [
    makeCheck(
      "enabled",
      plugin.enabled === true
        ? "PASS"
        : plugin.enabled === false
          ? "FAIL"
          : "UNVERIFIED",
      plugin.enabled === true
        ? "enabled"
        : plugin.enabled === false
          ? "disabled"
          : "plugin command did not report enabled state",
    ),
    makeCheck(
      "version",
      typeof plugin.version !== "string"
        ? "UNVERIFIED"
        : plugin.version === expected.version
          ? "PASS"
          : "FAIL",
      typeof plugin.version === "string"
        ? `${plugin.version} installed; ${expected.version} expected`
        : `${expected.version} expected; plugin command did not report a version`,
    ),
  ];

  if (typeof plugin.installPath !== "string") {
    checks.push(
      makeCheck(
        "install-path",
        "UNVERIFIED",
        "plugin command did not report an install path",
      ),
    );
  } else if (
    !fs.existsSync(plugin.installPath) ||
    !fs.statSync(plugin.installPath).isDirectory()
  ) {
    checks.push(
      makeCheck(
        "install-path",
        "FAIL",
        plugin.installPath,
      ),
    );
  } else {
    checks.push(makeCheck("install-path", "PASS", plugin.installPath));
    checks.push(inspectInstalledSkills(plugin.installPath, platform, expected));
    checks.push(inspectInstalledHooks(plugin.installPath, platform, expected));
    checks.push(
      inspectPluginManifest(
        plugin.installPath,
        platform,
        expected,
        plugin.version,
      ),
    );
  }

  return platformResult(platform, checks);
}

function inspectManual(platform) {
  return platformResult(platform, [
    makeCheck("plugin", "MANUAL", platform.verification.manualFallback),
    makeCheck("expected", "MANUAL", platform.verification.summary),
  ]);
}

export function inspectInstallations({
  registryPath = DEFAULT_REGISTRY,
  sourceRoot = SCRIPT_ROOT,
  homeDir = os.homedir(),
  environment = process.env,
  runCommand = defaultRunCommand,
  platformId,
} = {}) {
  const registry = readJson(path.resolve(registryPath));
  validateRegistry(registry);
  const expected = expectedSource(registry, path.resolve(sourceRoot));
  const platforms = platformId
    ? registry.platforms.filter((platform) => platform.id === platformId)
    : registry.platforms;
  if (platforms.length === 0) {
    throw new Error(`Unknown platform: ${platformId}`);
  }
  const context = {
    homeDir: path.resolve(homeDir),
    environment,
  };
  const results = platforms.map((platform) => {
    if (platform.verification.mode === "skill-links") {
      const result = inspectSkillLinks(
        platform,
        expected,
        context.homeDir,
        environment,
      );
      if (platform.verification.manualRuntime) {
        result.checks.push(
          makeCheck(
            "runtime-discovery",
            "MANUAL",
            platform.verification.manualRuntime.summary,
          ),
        );
        result.status = resultStatus(result.checks);
      }
      if (platform.verification.runtimeDiscovery) {
        result.checks.push(
          inspectCodeWhaleRuntime(platform, expected, runCommand, context),
        );
        result.status = resultStatus(result.checks);
      }
      return result;
    }
    if (platform.verification.mode === "plugin-cli") {
      return inspectPlugin(platform, expected, runCommand, context);
    }
    if (platform.verification.mode === "manual") {
      return inspectManual(platform);
    }
    throw new Error(
      `Unsupported verification mode for ${platform.id}: ${platform.verification.mode}`,
    );
  });

  const counts = Object.fromEntries(
    RESULT_ORDER.map((status) => [
      status,
      results.filter((result) => result.status === status).length,
    ]),
  );

  return {
    product: expected.name,
    expectedVersion: expected.version,
    expectedSkills: expected.skillNames,
    readOnly: true,
    results,
    counts,
    exitCode: counts.FAIL > 0 ? 1 : 0,
  };
}

export function formatText(report) {
  const lines = [
    `Thinloop installation check`,
    `Expected: ${report.expectedVersion}, ${report.expectedSkills.length} skills`,
    "Mode: read-only",
  ];

  for (const result of report.results) {
    lines.push(`[${result.status}] ${result.displayName}`);
    for (const check of result.checks) {
      lines.push(`  - ${check.name}: ${check.status} - ${check.detail}`);
    }
  }

  lines.push(
    `Summary: ${RESULT_ORDER.map(
      (status) => `${status} ${report.counts[status]}`,
    ).join(", ")}`,
  );
  return lines.join("\n");
}

function printHelp() {
  process.stdout.write(
    [
      "Usage: node scripts/verify-install.mjs [--format text|json] [--home <path>] [--platform <id>]",
      "",
      "Read platform capabilities from config/platform-capabilities.json and",
      "inspect Thinloop installations without changing files or client state.",
      "",
      "Exit 0: no confirmed failure (MANUAL/UNVERIFIED may remain)",
      "Exit 1: at least one confirmed installation failure",
      "Exit 2: invalid arguments, registry, or source checkout",
      "",
    ].join("\n"),
  );
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      printHelp();
      return;
    }

    const report = inspectInstallations({
      registryPath: options.registryPath,
      homeDir: options.homeDir,
      platformId: options.platformId,
    });
    process.stdout.write(
      options.format === "json"
        ? `${JSON.stringify(report, null, 2)}\n`
        : `${formatText(report)}\n`,
    );
    process.exitCode = report.exitCode;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 2;
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === path.resolve(fileURLToPath(import.meta.url))) {
  main();
}
