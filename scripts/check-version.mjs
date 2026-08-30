#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const sourceRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const semverPattern = /^\d+\.\d+\.\d+$/;

function read(root, relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson(root, relativePath) {
  return JSON.parse(read(root, relativePath));
}

function readVersionSurfaces(root) {
  const codex = readJson(root, ".codex-plugin/plugin.json");
  const claude = readJson(root, ".claude-plugin/plugin.json");
  const claudeMarketplace = readJson(
    root,
    ".claude-plugin/marketplace.json",
  );
  const codebuddy = readJson(root, ".codebuddy-plugin/plugin.json");
  const codebuddyMarketplace = readJson(
    root,
    ".codebuddy-plugin/marketplace.json",
  );
  const zcode = readJson(root, ".zcode-plugin/plugin.json");
  const marketplace = readJson(root, "marketplace.json");
  const readme = read(root, "README.md");
  const installation = read(root, "docs/installation.md");
  const readmeMatch = readme.match(/<kbd>v(\d+\.\d+\.\d+)<\/kbd>/);
  const installationMatches = [
    ...installation.matchAll(/^- 升级到 v(\d+\.\d+\.\d+)：/gm),
  ];

  return {
    authoritative: codex.version,
    surfaces: [
      [".codex-plugin/plugin.json version", codex.version],
      [".claude-plugin/plugin.json version", claude.version],
      [
        ".claude-plugin/marketplace.json metadata.version",
        claudeMarketplace.metadata?.version,
      ],
      [
        ".claude-plugin/marketplace.json plugins[0].version",
        claudeMarketplace.plugins?.[0]?.version,
      ],
      [".codebuddy-plugin/plugin.json version", codebuddy.version],
      [
        ".codebuddy-plugin/marketplace.json metadata.version",
        codebuddyMarketplace.metadata?.version,
      ],
      [
        ".codebuddy-plugin/marketplace.json plugins[0].version",
        codebuddyMarketplace.plugins?.[0]?.version,
      ],
      [".zcode-plugin/plugin.json version", zcode.version],
      ["marketplace.json plugins[0].version", marketplace.plugins?.[0]?.version],
      ["README.md release badge", readmeMatch?.[1]],
      [
        "docs/installation.md latest upgrade entry",
        installationMatches.at(-1)?.[1],
      ],
    ],
  };
}

export function checkVersion({
  root = sourceRoot,
  tag,
  requireReleaseNotes = false,
} = {}) {
  const resolvedRoot = path.resolve(root);
  const { authoritative, surfaces } = readVersionSurfaces(resolvedRoot);
  const errors = [];

  if (!semverPattern.test(authoritative ?? "")) {
    errors.push(
      `.codex-plugin/plugin.json version must be SemVer, received ${JSON.stringify(authoritative)}`,
    );
  }

  for (const [label, version] of surfaces) {
    if (version !== authoritative) {
      errors.push(
        `${label} is ${JSON.stringify(version)}; expected ${authoritative}`,
      );
    }
  }

  if (tag !== undefined) {
    if (!/^v\d+\.\d+\.\d+$/.test(tag)) {
      errors.push(`tag must match vX.Y.Z, received ${JSON.stringify(tag)}`);
    } else if (tag !== `v${authoritative}`) {
      errors.push(`tag ${tag} does not match manifest version ${authoritative}`);
    }
  }

  let releaseNotes;
  if (requireReleaseNotes) {
    if (tag === undefined) {
      errors.push("--require-release-notes requires --tag");
    } else if (/^v\d+\.\d+\.\d+$/.test(tag)) {
      releaseNotes = path.join("docs", "releases", `${tag}.md`);
      const releaseNotesPath = path.join(resolvedRoot, releaseNotes);
      if (!fs.existsSync(releaseNotesPath)) {
        errors.push(`missing release notes: ${releaseNotes}`);
      } else {
        const notes = fs.readFileSync(releaseNotesPath, "utf8");
        if (!notes.startsWith(`# Thinloop ${tag}\n`)) {
          errors.push(`${releaseNotes} must start with # Thinloop ${tag}`);
        }
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }

  return {
    version: authoritative,
    tag: tag ?? null,
    releaseNotes: releaseNotes ?? null,
    surfaceCount: surfaces.length,
  };
}

function parseArgs(argv, env = process.env) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--root") {
      options.root = argv[++index];
      if (!options.root) throw new Error("--root requires a path");
    } else if (argument === "--tag") {
      options.tag = argv[++index];
      if (!options.tag) throw new Error("--tag requires a value");
    } else if (argument === "--require-release-notes") {
      options.requireReleaseNotes = true;
    } else {
      throw new Error(`unknown argument: ${argument}`);
    }
  }
  if (options.tag === undefined && env.GITHUB_REF_NAME?.startsWith("v")) {
    options.tag = env.GITHUB_REF_NAME;
  }
  return options;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  try {
    const result = checkVersion(parseArgs(process.argv.slice(2)));
    const tagEvidence = result.tag ? `; tag ${result.tag}` : "";
    const notesEvidence = result.releaseNotes
      ? `; notes ${result.releaseNotes}`
      : "";
    process.stdout.write(
      `PASS version ${result.version}: ${result.surfaceCount} surfaces${tagEvidence}${notesEvidence}\n`,
    );
  } catch (error) {
    process.stderr.write(`FAIL version check\n${error.message}\n`);
    process.exitCode = 1;
  }
}
