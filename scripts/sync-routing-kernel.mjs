import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const sourcePath = "config/routing-kernel.json";
const markdownPaths = ["AGENTS.md", "README.md", "docs/workflow-and-state.md"];
const pluginPath = ".codex-plugin/plugin.json";
const routeIds = [
  "next",
  "quickdev",
  "discovery",
  "project",
  "execute",
  "reengineering",
  "conditional-design",
  "explicit-governance",
];
const startMarker = `<!-- thinloop-routing-kernel:start source=${sourcePath} -->`;
const endMarker = "<!-- thinloop-routing-kernel:end -->";
const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(root, relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

export function loadRoutingKernel(root = defaultRoot) {
  const raw = read(root, sourcePath);
  if (raw.trimEnd().split(/\r?\n/).length > 20) {
    throw new Error(`${sourcePath} must stay within 20 lines`);
  }

  const kernel = JSON.parse(raw);
  if (kernel.schemaVersion !== 1 || !Array.isArray(kernel.routes)) {
    throw new Error(`${sourcePath} must use schemaVersion 1 and routes[]`);
  }
  if (kernel.routes.map(({ id }) => id).join() !== routeIds.join()) {
    throw new Error(`${sourcePath} must define the eight canonical routes in order`);
  }

  const skills = [];
  for (const route of kernel.routes) {
    if (
      !route.label ||
      !route.markdown ||
      !route.prompt ||
      !Array.isArray(route.skills) ||
      route.skills.length === 0
    ) {
      throw new Error(`route ${route.id} has an invalid contract`);
    }
    for (const skill of route.skills) {
      if (!route.markdown.includes(`\`${skill}\``)) {
        throw new Error(`route ${route.id} markdown must name ${skill}`);
      }
      skills.push(skill);
    }
  }
  if (skills.length !== 12 || new Set(skills).size !== 12) {
    throw new Error(`${sourcePath} must cover 12 Thinloop skills exactly once`);
  }

  const project = kernel.routes.find(({ id }) => id === "project");
  const quickdev = kernel.routes.find(({ id }) => id === "quickdev");
  if (!project.markdown.includes("不执行实现") || !project.prompt.includes("does not run an implementation loop")) {
    throw new Error("Project must remain non-executing on every generated surface");
  }
  for (const invariant of ["独立验收", "高风险"]) {
    if (!quickdev.markdown.includes(invariant)) {
      throw new Error(`QuickDev markdown must retain ${invariant}`);
    }
  }
  if (!quickdev.prompt.includes("independent acceptance") || !quickdev.prompt.includes("high-risk")) {
    throw new Error("QuickDev prompt must retain independent acceptance and high-risk approval gates");
  }
  return kernel;
}

export function renderMarkdownKernel(kernel) {
  return [
    startMarker,
    ...kernel.routes.map(
      (route, index) => `${index + 1}. **${route.label}**：${route.markdown}`,
    ),
    endMarker,
  ].join("\n");
}

export function renderDefaultPrompt(kernel) {
  return [
    `Thinloop routing source: ${sourcePath}.`,
    ...kernel.routes.map(({ prompt }) => prompt),
  ].join(" ");
}

function replaceBlock(content, block, relativePath) {
  const start = content.indexOf(startMarker);
  const end = content.indexOf(endMarker);
  if (start < 0 || end < start) {
    throw new Error(`${relativePath} is missing the routing-kernel markers`);
  }
  return `${content.slice(0, start)}${block}${content.slice(end + endMarker.length)}`;
}

function surfaces(root, kernel) {
  const block = renderMarkdownKernel(kernel);
  const result = markdownPaths.map((relativePath) => {
    const current = read(root, relativePath);
    return { relativePath, current, expected: replaceBlock(current, block, relativePath) };
  });
  const current = read(root, pluginPath);
  const plugin = JSON.parse(current);
  plugin.interface.defaultPrompt = renderDefaultPrompt(kernel);
  result.push({
    relativePath: pluginPath,
    current,
    expected: `${JSON.stringify(plugin, null, 2)}\n`,
  });
  return result;
}

export function inspectRoutingKernel(root = defaultRoot) {
  try {
    return surfaces(root, loadRoutingKernel(root))
      .filter(({ current, expected }) => current !== expected)
      .map(({ relativePath }) => `${relativePath} has drifted from ${sourcePath}`);
  } catch (error) {
    return [error.message];
  }
}

export function syncRoutingKernel(root = defaultRoot) {
  const changed = [];
  for (const surface of surfaces(root, loadRoutingKernel(root))) {
    if (surface.current === surface.expected) continue;
    fs.writeFileSync(path.join(root, surface.relativePath), surface.expected);
    changed.push(surface.relativePath);
  }
  return changed;
}

function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== "--check")) {
    console.error(`unknown arguments: ${args.join(" ")}`);
    process.exitCode = 2;
  } else if (args.includes("--check")) {
    const errors = inspectRoutingKernel();
    if (errors.length > 0) {
      errors.forEach((error) => console.error(error));
      process.exitCode = 1;
    } else {
      console.log("routing kernel check passed (8 routes, 4 generated surfaces)");
    }
  } else {
    const changed = syncRoutingKernel();
    console.log(changed.length ? `updated: ${changed.join(", ")}` : "routing kernel surfaces already current");
  }
}

if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) main();
