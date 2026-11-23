#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { pluginList } from "./plugin-list.mjs";
import { readDshPatch, hasDshInsertion } from "./dsh-patch.mjs";
import { loadRoutingKernel, renderMarkdownKernel } from "./sync-routing-kernel.mjs";

const SCRIPT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const DEFAULT_REGISTRY = path.join(
  SCRIPT_ROOT,
  "config",
  "platform-capabilities.json",
);
const RESULT_ORDER = ["PASS", "FAIL", "NOT_INSTALLED", "UNVERIFIED", "MANUAL", "SKIP"];
export const ANTIGRAVITY_MANIFEST_ALLOWED_KEYS = new Set([
  "name",
  "displayName",
  "version",
  "description",
  "author",
  "homepage",
  "repository",
  "suggestedPrompts",
  "logo",
  "disabled",
]);
const ANTIGRAVITY_DEFAULT_REPO_URL = "https://github.com/mindcarver/thinloop";
const ANTIGRAVITY_SUGGESTED_PROMPTS = [
  "检查当前项目的 Issue、PR 和推进状态，并给出唯一建议下一步",
  "把一个明确的单交付改动按计划确认、测试设计与独立验收完整交付",
  "把模糊的产品想法先做澄清并沉淀为可测试的产品契约与多 Issue 依赖图",
];
const ANTIGRAVITY_HOOK_NAME = "thinloop-continuity";
const READ_ONLY_PROBES = new Map([
  ["claude-code", ["claude", "plugin", "list", "--json"]],
  ["zcode", ["zcode", "plugins", "list", "--json"]],
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
    if (platform.verification.mode === "plugin-dir") {
      if (!platform.installation.configRoot || !platform.installation.pluginDir) {
        throw new Error(`Platform ${platform.id} plugin-dir installation paths are required`);
      }
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
    const hookMounts = hookMountDescriptors(platform);
    if (hookMounts.length > 0 && platform.id !== "dsh") {
      throw new Error(`Platform ${platform.id} must not declare a hook mount`);
    }
    for (const mount of hookMounts) {
      if (
        mount.row !== "thinloop-continuity" ||
        !Array.isArray(mount.patchFiles) ||
        JSON.stringify(mount.patchFiles) !==
          JSON.stringify(["cordis.patch.yml", "profiles/*/cordis.patch.yml"])
      ) {
        throw new Error(`Platform ${platform.id} has an unsafe hook mount`);
      }
    }
  }
}

/** Mount descriptors declared on a platform's cordis-plugin hooks, if any. */
function hookMountDescriptors(platform) {
  return platform.capabilities.hooks
    .map((hook) => hook.mount)
    .filter((mount) => mount !== undefined);
}

function makeCheck(name, status, detail) {
  return { name, status, detail };
}

function resultStatus(checks) {
  if (checks.some((check) => check.status === "FAIL")) {
    return "FAIL";
  }
  if (checks.some((check) => check.status === "NOT_INSTALLED")) {
    return "NOT_INSTALLED";
  }
  if (checks.some((check) => check.status === "UNVERIFIED")) {
    return "UNVERIFIED";
  }
  if (checks.some((check) => check.status === "MANUAL")) {
    return "MANUAL";
  }
  if (checks.some((check) => check.status === "SKIP")) {
    return "SKIP";
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
  if (hookMountDescriptors(platform).length > 0) {
    checks.push(
      inspectHookMount(platform, expected, { homeDir, environment }),
    );
  } else {
    checks.push(
      makeCheck(
        "hooks",
        platform.capabilities.hooks.length === 0 ? "PASS" : "MANUAL",
        platform.capabilities.hooks.length === 0
          ? "not supported by this installation mode"
          : `${platform.capabilities.hooks.length} continuity hook (Cordis plugin) — verify in a real session; no read-only CLI probe exists`,
      ),
    );
  }

  return platformResult(platform, checks);
}

/**
 * Read-only, static evidence of an unconditional root insert in DSH user patch
 * layers. Unsupported YAML/composition stays MANUAL. This cannot establish the
 * selected runtime profile, CLI overlays, successful boot or event execution.
 */
function inspectHookMount(platform, expected, context) {
  const mount = hookMountDescriptors(platform)[0];
  const dshHome = context.environment.DSH_HOME
    ? path.resolve(context.environment.DSH_HOME)
    : path.join(context.homeDir, ".dsh");
  const handlerPath = resolveFrom(
    expected.sourceRoot,
    platform.capabilities.hookHandler,
  );
  const handlerUrl = pathToFileURL(handlerPath).href;

  const candidates = [];
  for (const pattern of mount.patchFiles) {
    const segments = pattern.split("/");
    if (segments.includes("*")) {
      const wildcardIndex = segments.indexOf("*");
      const anchor = path.join(dshHome, ...segments.slice(0, wildcardIndex));
      let entries;
      try {
        entries = fs.readdirSync(anchor, { withFileTypes: true });
      } catch (error) {
        if (error?.code !== "ENOENT") throw error;
        continue;
      }
      for (const entry of entries) {
        // `node_modules` beside the profiles holds bundle patches owned by the
        // installation, not user mount rows.
        if (!entry.isDirectory() || entry.name === "node_modules") continue;
        candidates.push(
          path.join(anchor, entry.name, ...segments.slice(wildcardIndex + 1)),
        );
      }
    } else {
      candidates.push(path.join(dshHome, ...segments));
    }
  }

  const patches = new Map();
  const unknown = [];
  for (const candidate of candidates) {
    try {
      patches.set(candidate, readDshPatch(fs.readFileSync(candidate, "utf8")));
    } catch (error) {
      if (error?.code === "ENOENT") { patches.set(candidate, []); continue; }
      unknown.push(`${candidate}: ${error.message}`);
    }
  }

  // Profiles are alternatives, not sequential overlays. Each receives the home
  // patch after its own patch. A bare update/unsupported operation in either
  // layer prevents that combination from proving an unconditional insertion.
  const homePatch = path.join(dshHome, "cordis.patch.yml");
  const home = patches.get(homePatch) || [];
  const mountedIn = [];
  if (unknown.length === 0) {
    if (patches.size === 1 && hasDshInsertion([home], mount.row, [handlerPath, handlerUrl])) mountedIn.push(homePatch);
    for (const [candidate, patch] of patches) {
      if (candidate !== homePatch &&
          hasDshInsertion([patch, home], mount.row, [handlerPath, handlerUrl])) {
        mountedIn.push(home.length ? `${candidate} + ${homePatch}` : candidate);
      }
    }
  }
  if (mountedIn.length > 0) {
    return makeCheck(
      "hooks",
      "PASS",
      `${platform.capabilities.hooks.length}/${platform.capabilities.hooks.length} static Cordis root insert configured via ${mountedIn.join(", ")}; runtime composition, activation and events not verified`,
    );
  }
  return makeCheck(
    "hooks",
    "MANUAL",
    unknown.length > 0
      ? `plugin mount unknown (${unknown.join("; ")}); mount per .dsh-plugin/README.md`
      : `no unconditional root insert verified in ${mount.patchFiles.join(" or ")} under ${dshHome}; skills-only install remains supported; overrides or complex YAML require dsh --dump-config; see .dsh-plugin/README.md`,
  );
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

function inspectPayload(installPath, expected, relativeRoot) {
  if (!expected.trackedFiles) {
    const inventory = spawnSync("git", ["ls-files", "--cached", "-z"], {
      cwd: expected.sourceRoot,
      encoding: "utf8",
      timeout: 10_000,
    });
    if (inventory.error || inventory.status !== 0) {
      return [
        `source payload inventory unavailable: ${inventory.error?.message || inventory.stderr.trim()}`,
      ];
    }
    expected.trackedFiles = inventory.stdout.split("\0").filter(Boolean);
  }
  const prefix = `${relativeRoot}/`;
  const files = expected.trackedFiles.filter((file) => file.startsWith(prefix));
  if (files.length === 0) {
    return [`source payload inventory is empty: ${relativeRoot}`];
  }
  const problems = [];
  for (const relativePath of files) {
    try {
      const installed = fs.readFileSync(resolveFrom(installPath, relativePath));
      const authoritative = fs.readFileSync(
        resolveFrom(expected.sourceRoot, relativePath),
      );
      if (!installed.equals(authoritative)) {
        problems.push(`${relativePath} differs from source`);
      }
    } catch (error) {
      problems.push(`${relativePath}: ${error.message}`);
    }
  }
  return problems;
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
    ...inspectPayload(
      installPath,
      expected,
      path.relative(expected.sourceRoot, expected.skillsRoot).split(path.sep).join("/"),
    ),
    ...(missing.length > 0 ? [`missing: ${missing.join(", ")}`] : []),
    ...(unexpected.length > 0
      ? [`unexpected scd skills: ${unexpected.join(", ")}`]
      : []),
  ];
  return makeCheck(
    "skills",
    problems.length === 0 ? "PASS" : "FAIL",
    problems.length === 0
      ? `${expected.skillNames.length}/${expected.skillNames.length} skills and complete tracked payload match source`
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

  mismatches.push(
    ...inspectPayload(
      installPath,
      expected,
      path.posix.dirname(platform.capabilities.hookHandler),
    ),
  );

  return makeCheck(
    "hooks",
    mismatches.length === 0 ? "PASS" : "FAIL",
    mismatches.length === 0
      ? `${platform.capabilities.hooks.length}/${platform.capabilities.hooks.length} hooks and complete tracked payload match source definitions`
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
  let response;
  try {
    response = JSON.parse(commandResult.stdout);
    plugins = pluginList(platform.id, response);
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
    (entry) => entry?.id === platform.verification.pluginId,
  );
  if (!plugin) {
    return singleCheckResult(
      platform,
      "plugin",
      "FAIL",
      `${platform.verification.pluginId} is not installed`,
    );
  }

  if (platform.id === "zcode") {
    if (plugins.filter((entry) => entry?.id === platform.verification.pluginId).length !== 1) {
      return singleCheckResult(platform, "plugin", "FAIL", "ambiguous Thinloop plugin records");
    }
    if (Array.isArray(response.diagnostics) && response.diagnostics.some(entry =>
      entry?.pluginId === platform.verification.pluginId && entry.severity === "error")) {
      return singleCheckResult(platform, "plugin", "FAIL", "ZCode reported a Thinloop plugin error; inspect diagnostics locally");
    }
    plugin.installPath = plugin.rootPath;
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
    if (platform.id === "zcode") {
      const manifestPath = resolveFrom(plugin.installPath, platform.installation.manifest);
      checks.push(makeCheck("runtime-manifest",
        typeof plugin.manifestPath !== "string" ? "UNVERIFIED" :
          path.resolve(plugin.manifestPath) === manifestPath ? "PASS" : "FAIL",
        "reported manifest must select .zcode-plugin/plugin.json inside rootPath"));
      checks.push(makeCheck("runtime-skills",
        typeof plugin.skillCount !== "number" ? "UNVERIFIED" :
          plugin.skillCount === expected.skillNames.length ? "PASS" : "FAIL",
        `${plugin.skillCount ?? "unknown"} discovered; ${expected.skillNames.length} expected`));
      const details = plugin.hookDetails;
      const missing = platform.capabilities.hooks.filter((hook) =>
        !Array.isArray(details) || !details.some((entry) =>
          entry?.event === hook.event && entry.matcher === hook.matcher &&
          entry.runnable === true && typeof entry.sourcePath === "string" &&
          path.resolve(entry.sourcePath) === resolveFrom(plugin.installPath, hook.source)));
      checks.push(makeCheck("runtime-hooks",
        !Array.isArray(details) ? "UNVERIFIED" : missing.length ? "FAIL" : "PASS",
        missing.length ? `missing or non-runnable: ${missing.map(hook => hook.event).join(", ")}` :
          `${platform.capabilities.hooks.length} supported hooks discovered and runnable`));
    }
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

function inspectSkip(platform) {
  return platformResult(platform, [
    makeCheck("verification", "SKIP", platform.verification.summary),
  ]);
}

export function resolveAntigravityPaths(platform, homeDir, environment = {}) {
  const override = platform.installation.configRootOverride;
  const overrideRoot = override && environment[override.environment];
  const configRoot =
    typeof overrideRoot === "string" && overrideRoot.length > 0
      ? path.resolve(overrideRoot)
      : resolveFrom(homeDir, platform.installation.configRoot);
  const pluginDir = resolveFrom(configRoot, platform.installation.pluginDir);
  return { configRoot, pluginDir };
}

export function expectedAntigravityManifest(sourceRoot) {
  const codexManifest = readJson(
    resolveFrom(sourceRoot, ".codex-plugin/plugin.json"),
  );
  let repoUrls = {};
  const claudeManifestPath = resolveFrom(sourceRoot, ".claude-plugin/plugin.json");
  if (fs.existsSync(claudeManifestPath)) {
    try {
      repoUrls = readJson(claudeManifestPath);
    } catch {
      repoUrls = {};
    }
  }
  return {
    name: codexManifest.name,
    displayName: codexManifest.interface?.displayName || "Thinloop",
    version: codexManifest.version,
    description: codexManifest.description,
    author: codexManifest.author || { name: "mindcarver" },
    homepage: repoUrls.homepage || ANTIGRAVITY_DEFAULT_REPO_URL,
    repository: repoUrls.repository || ANTIGRAVITY_DEFAULT_REPO_URL,
    suggestedPrompts: [...ANTIGRAVITY_SUGGESTED_PROMPTS],
  };
}

export function expectedAntigravityHooks() {
  return {
    [ANTIGRAVITY_HOOK_NAME]: {
      Stop: [
        {
          type: "command",
          command: 'node "./hooks/check-state.mjs" --platform antigravity',
          timeout: 5,
        },
      ],
    },
  };
}

export function expectedAntigravityRules(sourceRoot) {
  const kernel = loadRoutingKernel(sourceRoot);
  return [
    "# Thinloop Routing Kernel",
    "",
    "Generated from `config/routing-kernel.json` for Antigravity global plugin installation.",
    "",
    renderMarkdownKernel(kernel),
    "",
  ].join("\n");
}

function extractAntigravityHookTarget(command, pluginDir) {
  if (typeof command !== "string" || !command.trim()) {
    return { error: "hook command is empty" };
  }
  const hasPlatformFlag = /(?:^|\s)--platform(?:=|\s+)antigravity(?:\s|$)/.test(
    command,
  );
  if (!hasPlatformFlag) {
    return { error: "hook command must pass --platform antigravity" };
  }
  const match =
    command.match(/"([^"]*check-state\.mjs)"/) ||
    command.match(/'([^']*check-state\.mjs)'/) ||
    command.match(/(?:^|\s)(\S*check-state\.mjs)(?:\s|$)/);
  if (!match) {
    return { error: "hook command does not target hooks/check-state.mjs" };
  }
  const rawTarget = match[1];
  const resolved = path.isAbsolute(rawTarget)
    ? rawTarget
    : path.resolve(pluginDir, rawTarget);
  return { rawTarget, resolved };
}

function inspectAntigravityManifest(pluginDir, expected) {
  const manifestPath = path.join(pluginDir, "plugin.json");
  const expectedManifest = expectedAntigravityManifest(expected.sourceRoot);
  try {
    const manifest = readJson(manifestPath);
    if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
      return [
        makeCheck("manifest", "FAIL", "plugin.json must be a JSON object"),
        makeCheck("version", "UNVERIFIED", "plugin.json is not a JSON object"),
      ];
    }
    const problems = [];
    const unknownKeys = Object.keys(manifest).filter(
      (key) => !ANTIGRAVITY_MANIFEST_ALLOWED_KEYS.has(key),
    );
    if (unknownKeys.length > 0) {
      problems.push(`unknown top-level fields: ${unknownKeys.join(", ")}`);
    }
    if (manifest.name !== expectedManifest.name) {
      problems.push(
        `name ${manifest.name ?? "missing"}; ${expectedManifest.name} expected`,
      );
    }
    if (manifest.displayName !== expectedManifest.displayName) {
      problems.push(
        `displayName ${manifest.displayName ?? "missing"}; ${expectedManifest.displayName} expected`,
      );
    }
    if (typeof manifest.description !== "string" || !manifest.description.trim()) {
      problems.push("description must be a non-empty string");
    }
    const validAuthor =
      (typeof manifest.author === "string" && manifest.author.trim().length > 0) ||
      (manifest.author &&
        typeof manifest.author === "object" &&
        !Array.isArray(manifest.author) &&
        typeof manifest.author.name === "string" &&
        manifest.author.name.trim().length > 0);
    if (!validAuthor) {
      problems.push("author must be a non-empty string or object with name");
    }
    if (
      typeof manifest.homepage !== "string" ||
      !manifest.homepage.startsWith("https://")
    ) {
      problems.push("homepage must be an https:// URL");
    }
    const validRepository =
      (typeof manifest.repository === "string" &&
        manifest.repository.startsWith("https://")) ||
      (manifest.repository &&
        typeof manifest.repository === "object" &&
        !Array.isArray(manifest.repository) &&
        typeof manifest.repository.url === "string" &&
        manifest.repository.url.startsWith("https://"));
    if (!validRepository) {
      problems.push("repository must be an https:// URL or { type, url } object");
    }
    const validPrompts =
      Array.isArray(manifest.suggestedPrompts) &&
      manifest.suggestedPrompts.length === 3 &&
      manifest.suggestedPrompts.every(
        (item) => typeof item === "string" && item.trim().length > 0,
      );
    if (!validPrompts) {
      problems.push("suggestedPrompts must contain exactly 3 non-empty strings");
    }
    if (manifest.disabled === true) {
      problems.push("plugin.json must not declare disabled: true");
    }

    return [
      makeCheck(
        "manifest",
        problems.length > 0 ? "FAIL" : "PASS",
        problems.length > 0
          ? problems.join("; ")
          : `${manifest.name} plugin.json satisfies Antigravity whitelist`,
      ),
      makeCheck(
        "version",
        typeof manifest.version !== "string" || !manifest.version
          ? "FAIL"
          : manifest.version === expected.version
            ? "PASS"
            : "FAIL",
        typeof manifest.version === "string" && manifest.version
          ? `${manifest.version} installed; ${expected.version} expected`
          : `version missing in plugin.json; ${expected.version} expected`,
      ),
    ];
  } catch (error) {
    return [
      makeCheck("manifest", "FAIL", `plugin.json: ${error.message}`),
      makeCheck(
        "version",
        "UNVERIFIED",
        "version cannot be verified without a readable plugin.json",
      ),
    ];
  }
}

function inspectAntigravityHooks(pluginDir, platform, expected) {
  const hooksJsonPath = path.join(pluginDir, "hooks.json");
  const expectedHandlerPath = resolveFrom(
    expected.sourceRoot,
    platform.capabilities.hookHandler,
  );
  const expectedHandlerReal = fs.realpathSync(expectedHandlerPath);
  let hooksConfig;
  try {
    hooksConfig = readJson(hooksJsonPath);
  } catch (error) {
    return makeCheck("hooks", "FAIL", `hooks.json: ${error.message}`);
  }
  if (!hooksConfig || typeof hooksConfig !== "object" || Array.isArray(hooksConfig)) {
    return makeCheck("hooks", "FAIL", "hooks.json must be a JSON object");
  }
  const entry = hooksConfig[ANTIGRAVITY_HOOK_NAME];
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    return makeCheck(
      "hooks",
      "FAIL",
      `hooks.json missing root flat hook "${ANTIGRAVITY_HOOK_NAME}"`,
    );
  }
  if (entry.enabled === false) {
    return makeCheck(
      "hooks",
      "FAIL",
      `hooks.json hook "${ANTIGRAVITY_HOOK_NAME}" is disabled`,
    );
  }
  if (!Array.isArray(entry.Stop) || entry.Stop.length === 0) {
    return makeCheck(
      "hooks",
      "FAIL",
      `hooks.json "${ANTIGRAVITY_HOOK_NAME}.Stop" must be a non-empty flat handler array`,
    );
  }

  const problems = [];
  let matchedValidHandler = false;
  for (const [index, handler] of entry.Stop.entries()) {
    if (!handler || typeof handler !== "object" || Array.isArray(handler)) {
      problems.push(`Stop[${index}] must be a handler object`);
      continue;
    }
    if ("hooks" in handler || "matcher" in handler) {
      problems.push(
        `Stop[${index}] must use Antigravity flat handler format (not grouped matcher/hooks)`,
      );
      continue;
    }
    if (handler.type !== undefined && handler.type !== "command") {
      problems.push(`Stop[${index}] unsupported type ${JSON.stringify(handler.type)}`);
      continue;
    }
    const extracted = extractAntigravityHookTarget(handler.command, pluginDir);
    if (extracted.error) {
      problems.push(`Stop[${index}] ${extracted.error}`);
      continue;
    }
    try {
      fs.accessSync(extracted.resolved, fs.constants.R_OK);
      const actualReal = fs.realpathSync(extracted.resolved);
      if (actualReal !== expectedHandlerReal) {
        problems.push(
          `Stop[${index}] resolves to ${actualReal}; ${expectedHandlerReal} expected`,
        );
        continue;
      }
      matchedValidHandler = true;
    } catch (error) {
      problems.push(
        `Stop[${index}] unreadable handler ${extracted.resolved}: ${error.message}`,
      );
    }
  }

  if (problems.length > 0 || !matchedValidHandler) {
    return makeCheck(
      "hooks",
      "FAIL",
      problems.length > 0
        ? problems.join("; ")
        : `hooks.json "${ANTIGRAVITY_HOOK_NAME}.Stop" has no valid check-state.mjs handler`,
    );
  }
  return makeCheck(
    "hooks",
    "PASS",
    `1/1 flat Stop hook (${ANTIGRAVITY_HOOK_NAME}) in hooks.json resolves to ${expectedHandlerPath}`,
  );
}

function inspectAntigravityRules(pluginDir, expected) {
  const rulesPath = path.join(pluginDir, "rules", "AGENTS.md");
  let content;
  try {
    content = fs.readFileSync(rulesPath, "utf8");
  } catch (error) {
    return makeCheck("rules", "FAIL", `rules/AGENTS.md: ${error.message}`);
  }
  const normalized = content.replace(/\r\n/g, "\n");
  const problems = [];
  if (/^---\s*\n/.test(normalized)) {
    problems.push("rules/AGENTS.md must not include YAML frontmatter");
  }
  if (normalized.includes("Thinloop Delivery Default")) {
    problems.push(
      "rules/AGENTS.md must not include repository-only Thinloop Delivery Default",
    );
  }
  const expectedBlock = renderMarkdownKernel(loadRoutingKernel(expected.sourceRoot));
  const blockIndex = normalized.indexOf(expectedBlock);
  if (blockIndex < 0) {
    problems.push("rules/AGENTS.md has drifted from config/routing-kernel.json");
  } else {
    const trailing = normalized.slice(blockIndex + expectedBlock.length).trim();
    if (trailing.length > 0) {
      problems.push(
        "rules/AGENTS.md contains unexpected content after routing kernel",
      );
    }
  }
  return makeCheck(
    "rules",
    problems.length > 0 ? "FAIL" : "PASS",
    problems.length > 0
      ? problems.join("; ")
      : "rules/AGENTS.md matches config/routing-kernel.json without repository-only delivery rules",
  );
}

function inspectAntigravitySkills(pluginDir, expected) {
  const skillRoot = path.join(pluginDir, "skills");
  let rootLstat;
  try {
    rootLstat = fs.lstatSync(skillRoot);
  } catch (error) {
    return makeCheck("skills", "FAIL", `skills: ${error.message}`);
  }
  let rootStat;
  try {
    rootStat = fs.statSync(skillRoot);
  } catch (error) {
    return makeCheck("skills", "FAIL", `skills: ${error.message}`);
  }
  if (!rootStat.isDirectory()) {
    return makeCheck(
      "skills",
      "FAIL",
      "skills must be a directory or symbolic link to source skills",
    );
  }

  const rootIsLink = rootLstat.isSymbolicLink();
  const missing = [];
  const nonLinks = [];
  const wrongTargets = [];
  const inspectionErrors = [];

  for (const skillName of expected.skillNames) {
    const installedDir = path.join(skillRoot, skillName);
    const installedSkillMd = path.join(installedDir, "SKILL.md");
    let entryLstat;
    try {
      entryLstat = fs.lstatSync(installedDir);
    } catch (error) {
      if (error?.code === "ENOENT") {
        missing.push(skillName);
        continue;
      }
      inspectionErrors.push(`${skillName}: ${error.message}`);
      continue;
    }
    if (!rootIsLink && !entryLstat.isSymbolicLink()) {
      nonLinks.push(skillName);
      continue;
    }
    if (!fs.existsSync(installedSkillMd)) {
      missing.push(`${skillName}/SKILL.md`);
      continue;
    }
    try {
      const actualSkillMd = fs.realpathSync(installedSkillMd);
      const expectedSkillMd = fs.realpathSync(
        path.join(expected.skillsRoot, skillName, "SKILL.md"),
      );
      if (actualSkillMd !== expectedSkillMd) {
        wrongTargets.push(`${skillName} -> ${actualSkillMd}`);
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
    ...(nonLinks.length > 0 ? [`not source links: ${nonLinks.join(", ")}`] : []),
    ...(wrongTargets.length > 0 ? [`wrong targets: ${wrongTargets.join(", ")}`] : []),
    ...(unexpected.length > 0
      ? [`unexpected scd skills: ${unexpected.join(", ")}`]
      : []),
  ];
  return makeCheck(
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
        : `${expected.skillNames.length}/${expected.skillNames.length} plugin skills in ${skillRoot} resolve to ${expected.skillsRoot}`,
  );
}

function matchesSkillPattern(name, pattern) {
  if (typeof pattern !== "string" || !pattern) {
    return false;
  }
  if (name === pattern) {
    return true;
  }
  try {
    return new RegExp(`^(?:${pattern})$`).test(name);
  } catch {
    return false;
  }
}

function resolveSkillsJsonEntryPath(rawPath, homeDir, configRoot) {
  if (rawPath === "~") {
    return path.resolve(homeDir);
  }
  if (rawPath.startsWith("~/") || rawPath.startsWith("~\\")) {
    return path.resolve(homeDir, rawPath.slice(2));
  }
  if (path.isAbsolute(rawPath)) {
    return path.resolve(rawPath);
  }
  return path.resolve(configRoot, rawPath);
}

function inspectAntigravityDuplication(configRoot, pluginDir, expected, homeDir) {
  const conflicts = [];
  const skillsJsonPath = path.join(configRoot, "skills.json");
  const globalSkillsDir = path.join(configRoot, "skills");
  const expectedSkillsReal = fs.realpathSync(expected.skillsRoot);
  const expectedSet = new Set(expected.skillNames);
  let pluginSkillsReal = null;
  try {
    pluginSkillsReal = fs.realpathSync(path.join(pluginDir, "skills"));
  } catch {
    pluginSkillsReal = null;
  }

  if (fs.existsSync(skillsJsonPath)) {
    let skillsConfig;
    try {
      skillsConfig = readJson(skillsJsonPath);
    } catch (error) {
      conflicts.push(
        `skills.json could not be parsed (${error.message}); inspect ${skillsJsonPath}`,
      );
    }
    if (Array.isArray(skillsConfig?.entries)) {
      for (const entry of skillsConfig.entries) {
        if (typeof entry?.path !== "string" || !entry.path.trim()) {
          continue;
        }
        const resolvedPath = resolveSkillsJsonEntryPath(
          entry.path.trim(),
          homeDir,
          configRoot,
        );
        let entryReal = null;
        try {
          entryReal = fs.realpathSync(resolvedPath);
        } catch {
          entryReal = null;
        }
        const pointsToThinloopRoot =
          entryReal === expectedSkillsReal ||
          (pluginSkillsReal !== null && entryReal === pluginSkillsReal) ||
          resolvedPath === path.resolve(expected.skillsRoot) ||
          resolvedPath === path.resolve(pluginDir, "skills");

        let exposedCandidates = [];
        if (pointsToThinloopRoot) {
          exposedCandidates = [...expected.skillNames];
        } else if (entryReal) {
          try {
            if (fs.statSync(entryReal).isDirectory()) {
              exposedCandidates = fs
                .readdirSync(entryReal, { withFileTypes: true })
                .map((item) => item.name)
                .filter(
                  (name) =>
                    (expectedSet.has(name) || name.startsWith("scd-")) &&
                    fs.existsSync(path.join(entryReal, name, "SKILL.md")),
                );
            }
          } catch {
            exposedCandidates = [];
          }
        }

        if (Array.isArray(entry.include_only) && entry.include_only.length > 0) {
          exposedCandidates = exposedCandidates.filter((name) =>
            entry.include_only.some((pattern) => matchesSkillPattern(name, pattern)),
          );
        }
        if (Array.isArray(entry.exclude) && entry.exclude.length > 0) {
          exposedCandidates = exposedCandidates.filter(
            (name) =>
              !entry.exclude.some((pattern) => matchesSkillPattern(name, pattern)),
          );
        }

        if (exposedCandidates.length > 0) {
          conflicts.push(
            `duplicate exposure: ${skillsJsonPath} entry "${entry.path}" also exposes ${exposedCandidates.length} Thinloop skill(s) alongside global plugin; remove this entry from ${skillsJsonPath}`,
          );
        }
      }
    }
  }

  try {
    const globalEntries = fs
      .readdirSync(globalSkillsDir, { withFileTypes: true })
      .map((entry) => entry.name)
      .filter((name) => expectedSet.has(name) || name.startsWith("scd-"))
      .sort();
    if (globalEntries.length > 0) {
      conflicts.push(
        `duplicate exposure: ${globalSkillsDir} contains ${globalEntries.join(", ")} alongside global plugin; remove these entries from ${globalSkillsDir}`,
      );
    }
  } catch (error) {
    if (error?.code !== "ENOENT") {
      conflicts.push(`could not inspect ${globalSkillsDir}: ${error.message}`);
    }
  }

  return makeCheck(
    "duplication",
    conflicts.length > 0 ? "FAIL" : "PASS",
    conflicts.length > 0
      ? conflicts.join("; ")
      : `no duplicate Thinloop skill exposure in ${skillsJsonPath} or ${globalSkillsDir}`,
  );
}

function inspectAntigravityPlugin(platform, expected, homeDir, environment) {
  const { configRoot, pluginDir } = resolveAntigravityPaths(
    platform,
    homeDir,
    environment,
  );
  let pluginDirStat;
  try {
    pluginDirStat = fs.statSync(pluginDir);
  } catch (error) {
    if (error?.code === "ENOENT") {
      try {
        fs.lstatSync(pluginDir);
        return singleCheckResult(
          platform,
          "plugin",
          "FAIL",
          `${pluginDir} is a broken symbolic link`,
        );
      } catch (lstatError) {
        if (lstatError?.code === "ENOENT") {
          return singleCheckResult(
            platform,
            "plugin",
            "NOT_INSTALLED",
            `${pluginDir} is not installed`,
          );
        }
        return singleCheckResult(platform, "plugin", "UNVERIFIED", lstatError.message);
      }
    }
    return singleCheckResult(platform, "plugin", "UNVERIFIED", error.message);
  }
  if (!pluginDirStat.isDirectory()) {
    return singleCheckResult(
      platform,
      "plugin",
      "FAIL",
      `${pluginDir} is not a directory`,
    );
  }

  const [manifestCheck, versionCheck] = inspectAntigravityManifest(
    pluginDir,
    expected,
  );
  const checks = [
    manifestCheck,
    versionCheck,
    inspectAntigravityHooks(pluginDir, platform, expected),
    inspectAntigravityRules(pluginDir, expected),
    inspectAntigravitySkills(pluginDir, expected),
    inspectAntigravityDuplication(configRoot, pluginDir, expected, homeDir),
  ];
  return platformResult(platform, checks);
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
    if (platform.verification.mode === "plugin-dir") {
      return inspectAntigravityPlugin(
        platform,
        expected,
        context.homeDir,
        environment,
      );
    }
    if (platform.verification.mode === "manual") {
      return inspectManual(platform);
    }
    if (platform.verification.mode === "skip") {
      return inspectSkip(platform);
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
