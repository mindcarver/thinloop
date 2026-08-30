import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  inspectRoutingKernel,
  loadRoutingKernel,
  renderDefaultPrompt,
} from "../scripts/sync-routing-kernel.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const surfacePaths = [
  "config/routing-kernel.json",
  "AGENTS.md",
  "README.md",
  "docs/workflow-and-state.md",
  ".codex-plugin/plugin.json",
];

function fixture() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "thinloop-routing-"));
  for (const relativePath of surfacePaths) {
    const target = path.join(directory, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(root, relativePath), target);
  }
  return directory;
}

test("routing kernel is compact and covers every Thinloop skill once", () => {
  const kernel = loadRoutingKernel(root);
  const source = fs.readFileSync(
    path.join(root, "config/routing-kernel.json"),
    "utf8",
  );
  const skills = kernel.routes.flatMap((route) => route.skills);

  assert.equal(source.trimEnd().split(/\r?\n/).length <= 20, true);
  assert.equal(kernel.routes.length, 8);
  assert.equal(new Set(skills).size, 12);
  assert.deepEqual(inspectRoutingKernel(root), []);
  assert.match(renderDefaultPrompt(kernel), /^Thinloop routing source: config\/routing-kernel\.json\./);
});

test("drift check fails when a README route is deliberately deleted", () => {
  const directory = fixture();
  const readmePath = path.join(directory, "README.md");
  const readme = fs.readFileSync(readmePath, "utf8");
  fs.writeFileSync(
    readmePath,
    readme.replace(/^4\. \*\*Project\*\*.*\n/m, ""),
  );

  assert.deepEqual(inspectRoutingKernel(directory), [
    "README.md has drifted from config/routing-kernel.json",
  ]);
});

test("drift check fails when the Project plugin route is deliberately rewritten", () => {
  const directory = fixture();
  const pluginPath = path.join(directory, ".codex-plugin/plugin.json");
  const plugin = JSON.parse(fs.readFileSync(pluginPath, "utf8"));
  plugin.interface.defaultPrompt = plugin.interface.defaultPrompt.replace(
    "does not run an implementation loop",
    "runs the implementation loop",
  );
  fs.writeFileSync(pluginPath, `${JSON.stringify(plugin, null, 2)}\n`);

  assert.deepEqual(inspectRoutingKernel(directory), [
    ".codex-plugin/plugin.json has drifted from config/routing-kernel.json",
  ]);
});
