#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { inspectInstallations } from "./verify-install.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pluginId = "thinloop@thinloop";

function run(command, context) {
  const result = spawnSync(command[0], command.slice(1), {
    cwd: context.sourceRoot, env: context.environment, encoding: "utf8",
    timeout: 60_000, maxBuffer: 8 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    throw new Error(`${command.slice(0, 3).join(" ")} failed; inspect client diagnostics locally`);
  }
  return result.stdout;
}

// ZCode 0.16.5 app-server uses newline-delimited {id, method, params}, without
// the JSON-RPC jsonrpc field. Only plugin management requests are sent here.
export function zcodeRequest(method, params, context) {
  return new Promise((resolve, reject) => {
    const child = spawn("zcode", ["app-server"], {
      cwd: context.sourceRoot, env: context.environment, stdio: ["pipe", "pipe", "pipe"],
    });
    let buffer = "";
    let settled = false;
    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.kill();
      if (error) reject(error); else resolve(result);
    };
    const timer = setTimeout(() => finish(new Error(`ZCode ${method} timed out; recheck installation before retrying`)), 60_000);
    child.on("error", () => finish(new Error("ZCode app-server unavailable")));
    child.on("exit", () => finish(new Error("ZCode app-server ended without a response")));
    child.stderr.resume(); // Do not echo client logs that may contain credentials.
    child.stdout.on("data", (chunk) => {
      buffer += chunk;
      if (buffer.length > 8 * 1024 * 1024) return finish(new Error("ZCode response exceeded limit"));
      let newline;
      while ((newline = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newline);
        buffer = buffer.slice(newline + 1);
        let message;
        try { message = JSON.parse(line); }
        catch { return finish(new Error("Invalid ZCode protocol response")); }
        if (message.id !== 1) continue;
        if (message.error) return finish(new Error(`ZCode ${method} failed (${message.error.code})`));
        finish(null, message.result);
      }
    });
    child.stdin.on("error", () => finish(new Error("ZCode request could not be sent")));
    child.stdin.write(`${JSON.stringify({ id: 1, method, params })}\n`);
  });
}

export async function refreshInstallation({
  platformId, sourceRoot = root, homeDir = os.homedir(), environment = process.env,
  runCommand = run, request = zcodeRequest,
} = {}) {
  if (!["codex", "claude-code", "zcode"].includes(platformId)) {
    throw new Error("--platform must be codex, claude-code or zcode");
  }
  const context = { sourceRoot: path.resolve(sourceRoot), environment: { ...environment, HOME: homeDir } };
  const registry = JSON.parse(fs.readFileSync(path.join(sourceRoot, "config/platform-capabilities.json"), "utf8"));
  const platform = registry.platforms.find(entry => entry.id === platformId);
  if (platformId === "codex") {
    const skillsRoot = path.join(environment.CODEX_HOME || path.join(homeDir, ".codex"), "skills");
    const names = fs.readdirSync(path.join(sourceRoot, "skills"))
      .filter(name => fs.existsSync(path.join(sourceRoot, "skills", name, "SKILL.md")));
    const links = names.map(name => ({ name, destination: path.join(skillsRoot, name), target: path.join(context.sourceRoot, "skills", name) }));
    let present = false;
    for (const link of links) {
      let stat;
      try { stat = fs.lstatSync(link.destination); }
      catch (error) { if (error.code === "ENOENT") continue; throw error; }
      present = true;
      if (!stat.isSymbolicLink()) throw new Error(`Refusing to replace non-link: ${link.destination}`);
      const old = fs.realpathSync(link.destination);
      const manifest = path.resolve(old, "..", "..", ".codex-plugin/plugin.json");
      if (JSON.parse(fs.readFileSync(manifest, "utf8")).name !== "thinloop" || path.basename(old) !== link.name) {
        throw new Error(`Not an owned Thinloop link: ${link.destination}`);
      }
    }
    if (!present) throw new Error("No installed Codex Thinloop links; do not install a missing client implicitly");
    for (const link of links) {
      const temporary = `${link.destination}.thinloop-${process.pid}`;
      fs.symlinkSync(link.target, temporary, process.platform === "win32" ? "junction" : "dir");
      try { fs.renameSync(temporary, link.destination); }
      finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
    }
  } else {
    const response = JSON.parse(runCommand(platform.verification.command, context));
    const plugins = platformId === "zcode" ? response.plugins : response;
    const matches = Array.isArray(plugins) ? plugins.filter(entry => entry.id === pluginId) : [];
    if (matches.length !== 1 || matches[0].enabled !== true) {
      throw new Error("Thinloop must already be installed and enabled; no installation or enablement was attempted");
    }
    if (platformId === "claude-code") {
      if (matches[0].scope !== "user") throw new Error("Claude refresh requires an existing user-scope Thinloop installation");
      const marketplaces = JSON.parse(runCommand(["claude", "plugin", "marketplace", "list", "--json"], context));
      const marketplace = marketplaces.find(entry => entry.name === "thinloop");
      if (marketplace?.source !== "directory" ||
          fs.realpathSync(marketplace.path) !== fs.realpathSync(context.sourceRoot)) {
        throw new Error("Claude Thinloop marketplace must point to this accepted local source");
      }
      runCommand(["claude", "plugin", "marketplace", "update", "thinloop"], context);
      runCommand(["claude", "plugin", "update", pluginId, "--scope", "user"], context);
    } else {
      const workspace = { workspacePath: context.sourceRoot, workspaceKey: context.sourceRoot };
      const overview = await request("plugins/overview", { workspace }, context);
      const marketplace = overview?.marketplaces?.find(entry => entry.id === "thinloop");
      if (marketplace?.source?.source !== "directory" ||
          fs.realpathSync(marketplace.source.path) !== fs.realpathSync(context.sourceRoot)) {
        throw new Error("ZCode Thinloop marketplace must point to this accepted local source; keep other market settings unchanged");
      }
      for (const [method, params] of [
        ["plugins/marketplace/update", { workspace, marketplace: "thinloop" }],
        ["plugins/update", { workspace, pluginId }],
      ]) {
        const result = await request(method, params, context);
        if (result?.diagnostics?.some(entry => entry.severity === "error" &&
          (!entry.pluginId || entry.pluginId === pluginId))) {
          throw new Error(`ZCode ${method} reported an error; recheck before retrying`);
        }
      }
    }
  }
  const report = inspectInstallations({
    sourceRoot, homeDir, environment, platformId,
    registryPath: path.join(sourceRoot, "config/platform-capabilities.json"),
    runCommand: command => ({ status: 0, stdout: runCommand(command, context) }),
  });
  if (report.results[0].status !== "PASS") throw new Error(`Refresh did not verify PASS; run verify-install.mjs --platform ${platformId}`);
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  try {
    if (args.length !== 2 || args[0] !== "--platform") throw new Error("Usage: node scripts/refresh-install.mjs --platform codex|claude-code|zcode");
    const report = await refreshInstallation({ platformId: args[1] });
    process.stdout.write(`PASS ${args[1]} Thinloop ${report.expectedVersion}; new task/session required for loaded instructions\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
