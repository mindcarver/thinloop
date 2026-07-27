#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

function fail(message) {
  throw new Error(message);
}

function readJson(filePath, label) {
  let source;
  try {
    source = fs.readFileSync(filePath, "utf8");
  } catch (error) {
    fail(`${label} cannot be read: ${error.message}`);
  }

  try {
    return JSON.parse(source);
  } catch (error) {
    fail(`${label} is invalid JSON: ${error.message}`);
  }
}

function hasCacheSegment(candidate) {
  const segments = path
    .normalize(candidate)
    .split(/[\\/]+/)
    .filter(Boolean)
    .map((segment) => segment.toLowerCase());

  return segments.some(
    (segment, index) =>
      segment === "plugins" && segments[index + 1] === "cache",
  );
}

export function resolveSourceRoot({
  override,
  configPath = path.join(os.homedir(), ".scd", "config.json"),
} = {}) {
  let configuredRoot = override;

  if (configuredRoot === undefined) {
    const config = readJson(path.resolve(configPath), "SCD config");
    if (
      config === null ||
      typeof config !== "object" ||
      Array.isArray(config) ||
      typeof config.thinloop_source_root !== "string" ||
      config.thinloop_source_root.trim() === ""
    ) {
      fail('SCD config must contain a non-empty "thinloop_source_root" string');
    }
    configuredRoot = config.thinloop_source_root;
  }

  if (typeof configuredRoot !== "string" || !path.isAbsolute(configuredRoot)) {
    fail("Thinloop source root must be an absolute path");
  }
  if (hasCacheSegment(configuredRoot)) {
    fail("Thinloop source root must not be inside a runtime plugins/cache path");
  }

  let resolvedRoot;
  try {
    resolvedRoot = fs.realpathSync(configuredRoot);
  } catch (error) {
    fail(`Thinloop source root cannot be resolved: ${error.message}`);
  }

  if (hasCacheSegment(resolvedRoot)) {
    fail("Resolved Thinloop source root must not be inside a runtime plugins/cache path");
  }
  if (!fs.existsSync(path.join(resolvedRoot, ".git"))) {
    fail("Thinloop source root is not a Git checkout");
  }

  const manifestPath = path.join(
    resolvedRoot,
    ".codex-plugin",
    "plugin.json",
  );
  const manifest = readJson(manifestPath, "Thinloop Codex manifest");
  if (manifest.name !== "thinloop") {
    fail('Thinloop Codex manifest must declare name "thinloop"');
  }
  if (
    !fs.existsSync(
      path.join(resolvedRoot, "skills", "scd-evolve", "SKILL.md"),
    )
  ) {
    fail("Thinloop source root does not contain skills/scd-evolve/SKILL.md");
  }

  return resolvedRoot;
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--root" || argument === "--config") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        fail(`${argument} requires a value`);
      }
      options[argument.slice(2)] = value;
      index += 1;
      continue;
    }
    fail(`Unknown argument: ${argument}`);
  }
  return options;
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  try {
    const options = parseArgs(process.argv.slice(2));
    const resolved = resolveSourceRoot({
      override: options.root,
      configPath: options.config,
    });
    process.stdout.write(`${resolved}\n`);
  } catch (error) {
    process.stderr.write(`scd-evolve: ${error.message}\n`);
    process.exitCode = 1;
  }
}
