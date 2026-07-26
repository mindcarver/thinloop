#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const TEXT_EXTENSIONS = new Set([
  ".adoc", ".c", ".cc", ".cfg", ".conf", ".cpp", ".cs", ".css", ".env",
  ".go", ".h", ".hpp", ".html", ".java", ".js", ".json", ".jsx", ".kt",
  ".kts", ".md", ".mdx", ".mjs", ".mts", ".php", ".properties", ".ps1",
  ".py", ".rb", ".rs", ".rst", ".sh", ".sql", ".svelte", ".toml", ".ts",
  ".tsx", ".vue", ".xml", ".yaml", ".yml",
]);
const DOC_EXTENSIONS = new Set([".adoc", ".md", ".mdx", ".rst"]);
const FALLBACK_IGNORES = new Set([
  ".git", ".next", ".nuxt", ".output", ".pytest_cache", ".venv", "build",
  "coverage", "dist", "node_modules", "out", "target", "vendor",
]);
const MAX_TEXT_BYTES = 1024 * 1024;
const MAX_MARKERS = 200;
const SUPPORT_PATH_SEGMENTS = new Set([
  "assets",
  "evals",
  "examples",
  "fixtures",
  "test",
  "tests",
]);
const SEVERITY_ORDER = new Map([
  ["critical", 0], ["high", 1], ["medium", 2], ["low", 3],
]);

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function parseArgs(argv) {
  const options = { root: process.cwd(), format: "text" };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--root") {
      options.root = argv[index + 1];
      index += 1;
    } else if (argument === "--format") {
      options.format = argv[index + 1];
      index += 1;
    } else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (!options.root) {
    throw new Error("--root requires a path");
  }
  if (!["json", "text"].includes(options.format)) {
    throw new Error("--format must be json or text");
  }

  return options;
}

function gitFiles(root) {
  const result = spawnSync(
    "git",
    ["-C", root, "ls-files", "-z", "--cached", "--others", "--exclude-standard"],
    { encoding: "utf8", windowsHide: true },
  );
  if (result.status !== 0) {
    return null;
  }
  return result.stdout
    .split("\0")
    .filter(Boolean)
    .map((relativePath) => toPosix(relativePath));
}

function fallbackFiles(root) {
  const results = [];
  const pending = [root];

  while (pending.length > 0) {
    const directory = pending.pop();
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) {
        continue;
      }
      if (entry.isDirectory() && FALLBACK_IGNORES.has(entry.name)) {
        continue;
      }

      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        pending.push(absolutePath);
      } else if (entry.isFile()) {
        results.push(toPosix(path.relative(root, absolutePath)));
      }
    }
  }

  return results;
}

function isTextFile(relativePath, absolutePath) {
  if (!TEXT_EXTENSIONS.has(path.extname(relativePath).toLowerCase())) {
    return false;
  }
  try {
    return fs.statSync(absolutePath).size <= MAX_TEXT_BYTES;
  } catch {
    return false;
  }
}

function isSupportPath(relativePath) {
  return toPosix(relativePath)
    .split("/")
    .some((segment) => SUPPORT_PATH_SEGMENTS.has(segment.toLowerCase()));
}

function lineNumberAt(content, index) {
  let line = 1;
  for (let cursor = 0; cursor < index; cursor += 1) {
    if (content.charCodeAt(cursor) === 10) {
      line += 1;
    }
  }
  return line;
}

function stableId(category, file, subject) {
  const digest = crypto
    .createHash("sha256")
    .update(`${category}\0${file}\0${subject}`)
    .digest("hex")
    .slice(0, 10)
    .toUpperCase();
  return `MAINT-${digest}`;
}

function makeFinding({
  category,
  severity,
  confidence,
  file,
  line,
  subject,
  message,
  evidence,
}) {
  return {
    id: stableId(category, file, subject),
    category,
    severity,
    confidence,
    file,
    line,
    message,
    evidence,
  };
}

function normalizeMarkdownTarget(rawTarget) {
  let target = rawTarget.trim();
  if (target.startsWith("<")) {
    const closing = target.indexOf(">");
    if (closing !== -1) {
      target = target.slice(1, closing);
    }
  } else {
    target = target.split(/\s+["'(]/, 1)[0];
  }

  try {
    target = decodeURIComponent(target);
  } catch {
    // Keep malformed URI text as-is so the missing path remains visible.
  }

  return target.replace(/#.*$/, "");
}

function maskFencedCode(content) {
  let inFence = false;
  let fenceMarker = "";
  return content.replace(/^.*(?:\r?\n|$)/gm, (line) => {
    const opening = line.match(/^\s*(`{3,}|~{3,})/);
    if (opening) {
      const marker = opening[1][0];
      if (!inFence) {
        inFence = true;
        fenceMarker = marker;
      } else if (marker === fenceMarker) {
        inFence = false;
        fenceMarker = "";
      }
      return line.replace(/[^\r\n]/g, " ");
    }
    return inFence ? line.replace(/[^\r\n]/g, " ") : line;
  });
}

function inspectMarkdownLinks(root, relativePath, content) {
  const findings = [];
  const linkPattern = /!?\[[^\]]*]\(([^)\r\n]+)\)/g;
  const searchableContent = maskFencedCode(content);

  for (const match of searchableContent.matchAll(linkPattern)) {
    const target = normalizeMarkdownTarget(match[1]);
    if (
      !target ||
      target.startsWith("#") ||
      target.startsWith("/") ||
      /^[a-z][a-z0-9+.-]*:/i.test(target) ||
      /^[A-Za-z]:[\\/]/.test(target) ||
      /[$*{}<>]/.test(target)
    ) {
      continue;
    }

    const absoluteTarget = path.resolve(
      root,
      path.dirname(relativePath),
      target.replaceAll("/", path.sep),
    );
    if (fs.existsSync(absoluteTarget)) {
      continue;
    }

    const line = lineNumberAt(content, match.index);
    findings.push(
      makeFinding({
        category: "documentation-drift",
        severity: "medium",
        confidence: "confirmed",
        file: relativePath,
        line,
        subject: `missing-link:${target}`,
        message: `Relative Markdown target does not exist: ${target}`,
        evidence: `${relativePath}:${line} -> ${target}`,
      }),
    );
  }

  return findings;
}

function collectPackageScripts(root, files) {
  const scripts = new Set();
  const manifests = [];

  for (const relativePath of files) {
    if (
      path.basename(relativePath) !== "package.json" ||
      isSupportPath(relativePath)
    ) {
      continue;
    }

    try {
      const manifest = JSON.parse(
        fs.readFileSync(path.join(root, relativePath), "utf8"),
      );
      manifests.push(relativePath);
      for (const name of Object.keys(manifest.scripts ?? {})) {
        scripts.add(name);
      }
    } catch {
      // Invalid manifests are left to repository-native package checks.
    }
  }

  return { scripts, manifests };
}

function documentedNpmCommands(relativePath, content) {
  const commands = [];
  const patterns = [
    /\b(?:npm|pnpm|bun)\s+run\s+([A-Za-z0-9:_-]+)\b/g,
    /\bnpm\s+(test|start|stop|restart)\b/g,
    /\byarn(?:\s+run)?\s+([A-Za-z0-9:_-]+)\b/g,
  ];
  const yarnBuiltins = new Set([
    "add", "cache", "config", "create", "dlx", "exec", "import", "info",
    "init", "install", "link", "node", "npm", "pack", "patch", "plugin",
    "publish", "remove", "set", "unlink", "up", "why", "workspace",
    "workspaces",
  ]);

  for (const [patternIndex, pattern] of patterns.entries()) {
    for (const match of content.matchAll(pattern)) {
      const command = match[1];
      if (patternIndex === 2 && yarnBuiltins.has(command)) {
        continue;
      }
      commands.push({
        command,
        line: lineNumberAt(content, match.index),
        file: relativePath,
      });
    }
  }

  return commands;
}

function inspectDebtMarkers(relativePath, content, remaining) {
  const findings = [];
  const markerPattern =
    /(?:^|[ \t])(?:\/\/|#|<!--|\/\*|\*|--)\s*(TODO|FIXME|HACK|XXX)\b(?:\s*[:=-]\s*|\s+)([^\r\n]{0,160})/gm;

  for (const match of content.matchAll(markerPattern)) {
    if (findings.length >= remaining) {
      break;
    }
    const marker = match[1];
    const detail = match[2].trim();
    const line = lineNumberAt(content, match.index);
    findings.push(
      makeFinding({
        category: "maintenance-risk",
        severity: "low",
        confidence: "lead",
        file: relativePath,
        line,
        subject: `${marker}:${detail}`,
        message: `${marker} marker requires intent and impact review${detail ? `: ${detail}` : ""}`,
        evidence: `${relativePath}:${line}`,
      }),
    );
  }

  return findings;
}

function deduplicateAndSort(findings) {
  const unique = new Map();
  for (const finding of findings) {
    if (!unique.has(finding.id)) {
      unique.set(finding.id, finding);
    }
  }

  return [...unique.values()].sort((left, right) => {
    return (
      SEVERITY_ORDER.get(left.severity) - SEVERITY_ORDER.get(right.severity) ||
      left.file.localeCompare(right.file) ||
      left.line - right.line
    );
  });
}

export function collectSignals(rootInput) {
  const root = path.resolve(rootInput);
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
    throw new Error(`Repository root is not a directory: ${root}`);
  }

  const fromGit = gitFiles(root);
  const files = (fromGit ?? fallbackFiles(root)).filter((relativePath) => {
    const absolutePath = path.join(root, relativePath);
    return fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile();
  });
  const docs = files.filter((relativePath) =>
    DOC_EXTENSIONS.has(path.extname(relativePath).toLowerCase()),
  );
  const { scripts, manifests } = collectPackageScripts(root, files);
  const findings = [];
  let markerCount = 0;

  for (const relativePath of files) {
    const absolutePath = path.join(root, relativePath);
    if (!isTextFile(relativePath, absolutePath)) {
      continue;
    }

    const content = fs.readFileSync(absolutePath, "utf8");
    if (
      DOC_EXTENSIONS.has(path.extname(relativePath).toLowerCase()) &&
      !isSupportPath(relativePath)
    ) {
      findings.push(...inspectMarkdownLinks(root, relativePath, content));

      if (manifests.length > 0) {
        for (const documented of documentedNpmCommands(relativePath, content)) {
          if (!scripts.has(documented.command)) {
            findings.push(
              makeFinding({
                category: "documentation-drift",
                severity: "medium",
                confidence: "high",
                file: relativePath,
                line: documented.line,
                subject: `missing-package-script:${documented.command}`,
                message: `Documented package script is absent from discovered package.json files: ${documented.command}`,
                evidence: `${relativePath}:${documented.line}`,
              }),
            );
          }
        }
      }
    }

    if (markerCount < MAX_MARKERS && !isSupportPath(relativePath)) {
      const markers = inspectDebtMarkers(
        relativePath,
        content,
        MAX_MARKERS - markerCount,
      );
      markerCount += markers.length;
      findings.push(...markers);
    }
  }

  return {
    root,
    generatedAt: new Date().toISOString(),
    inventory: {
      source: fromGit ? "git" : "filesystem",
      files: files.length,
      documentationFiles: docs.length,
      packageManifests: manifests,
    },
    findings: deduplicateAndSort(findings),
    limitations: [
      "Signals are lexical and deterministic; they do not prove semantic code-documentation consistency.",
      "TODO-like markers are investigation leads until impact and intent are confirmed.",
      "Documented package scripts are compared across discovered manifests to reduce monorepo false positives.",
      "Assets, examples, fixtures, evals, and test directories are skipped because they commonly contain intentional inconsistencies.",
      `Files larger than ${MAX_TEXT_BYTES} bytes and unrecognized text extensions are not inspected.`,
      ...(markerCount >= MAX_MARKERS
        ? [`Debt marker output was capped at ${MAX_MARKERS} findings.`]
        : []),
    ],
  };
}

export function formatText(report) {
  const lines = [
    "Repository maintenance signals",
    `Root: ${report.root}`,
    `Files: ${report.inventory.files}`,
    `Documentation files: ${report.inventory.documentationFiles}`,
    `Findings: ${report.findings.length}`,
  ];

  for (const finding of report.findings) {
    lines.push(
      `[${finding.severity}] ${finding.id} ${finding.category} ${finding.file}:${finding.line} - ${finding.message}`,
    );
  }

  lines.push("Limitations:");
  for (const limitation of report.limitations) {
    lines.push(`- ${limitation}`);
  }

  return lines.join("\n");
}

function printHelp() {
  process.stdout.write(
    [
      "Usage: node collect-signals.mjs [--root <repo>] [--format text|json]",
      "",
      "Collect read-only deterministic maintenance signals.",
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

    const report = collectSignals(options.root);
    process.stdout.write(
      options.format === "json"
        ? `${JSON.stringify(report, null, 2)}\n`
        : `${formatText(report)}\n`,
    );
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 2;
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === path.resolve(fileURLToPath(import.meta.url))) {
  main();
}
