import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";

export function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function writeText(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, value, "utf8");
}

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function assertWithin(root, target) {
  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(target);
  if (
    resolvedTarget === resolvedRoot ||
    !resolvedTarget.startsWith(`${resolvedRoot}${path.sep}`)
  ) {
    throw new Error(`Unsafe target outside managed root: ${resolvedTarget}`);
  }
  return resolvedTarget;
}

export function removeWithin(root, target) {
  const safeTarget = assertWithin(root, target);
  fs.rmSync(safeTarget, {
    recursive: true,
    force: true,
    maxRetries: 4,
    retryDelay: 200,
  });
}

export function copyTree(source, target) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, { recursive: true, force: false });
}

export function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function isoRunId(mode, now = new Date()) {
  return `${now.toISOString().replace(/[:.]/g, "-")}-${mode}`;
}

export function parseJsonLines(text) {
  const events = [];
  const invalid = [];
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    try {
      events.push(JSON.parse(line));
    } catch (error) {
      invalid.push({ line: index + 1, error: error.message, text: line });
    }
  }
  return { events, invalid };
}

// Store only event coordinates and names, never tool arguments or user answers.
export function summarizeUserInputEvents(events, { invalidJsonLines = 0, processCompleted = false } = {}) {
  const requests = new Map();
  const unknownTypes = new Set();
  const lifecycleErrors = new Set();
  const activeTools = new Map();
  const completedTools = new Set();
  let inTurn = false;
  let completedTurns = 0;
  const knownItems = new Set(["agent_message", "reasoning", "plan", "command_execution", "file_change", "web_search", "todo_list"]);
  const knownEvents = new Set(["thread.started", "turn.started", "turn.completed", "item.started", "item.updated", "item.completed"]);
  for (const [index, event] of events.entries()) {
    if (!knownEvents.has(event?.type)) unknownTypes.add(event?.type ?? "missing-event-type");
    if (event?.type === "thread.started" && index !== 0) lifecycleErrors.add("unexpected-thread-start");
    if (event?.type === "turn.started") {
      if (inTurn) lifecycleErrors.add("overlapping-turn");
      inTurn = true;
    }
    if (event?.type === "turn.completed") {
      if (!inTurn) lifecycleErrors.add("turn-ended-without-start");
      if (activeTools.size) lifecycleErrors.add("turn-ended-with-active-tools");
      completedTurns += 1;
      inTurn = false;
    }
    if (!event?.type?.startsWith("item.")) continue;
    if (!inTurn) lifecycleErrors.add("item-outside-turn");
    const item = event.item ?? {};
    const tool = item.tool ?? item.name;
    if (!["agent_message", "reasoning", "plan"].includes(item.type)) {
      const key = item.id;
      if (!key) lifecycleErrors.add("tool-missing-id");
      else if (event.type === "item.started") {
        if (activeTools.has(key) || completedTools.has(key)) lifecycleErrors.add("tool-start-reuses-id");
        activeTools.set(key, item.type);
      } else if (event.type === "item.completed") {
        // Repeated completion records are harmless; a completion without any
        // observed start cannot establish complete tool telemetry.
        if (!activeTools.has(key) && !completedTools.has(key)) lifecycleErrors.add("tool-ended-without-start");
        if (activeTools.has(key) && activeTools.get(key) !== item.type) lifecycleErrors.add("tool-type-changed");
        activeTools.delete(key);
        completedTools.add(key);
      } else if (!activeTools.has(key)) lifecycleErrors.add("tool-update-without-start");
    }
    if (["mcp_tool_call", "function_call", "tool_call"].includes(item.type)) {
      if (typeof tool !== "string") unknownTypes.add(`${item.type}:missing-tool-name`);
      else if (/(?:^|[.__])request_user_input(?:_async)?$/.test(tool)) {
        if (!item.id) unknownTypes.add("user-input:missing-id");
        else if (!requests.has(item.id)) requests.set(item.id, { eventIndex: index, itemId: item.id, tool });
      } else unknownTypes.add(`${item.type}:unobserved-nested-tools`);
    } else if (item.type === "request_user_input") {
      if (!item.id) unknownTypes.add("user-input:missing-id");
      else if (!requests.has(item.id)) requests.set(item.id, { eventIndex: index, itemId: item.id, tool: item.type });
    } else if (!knownItems.has(item.type)) unknownTypes.add(item.type ?? "missing-item-type");
  }
  const complete = processCompleted && invalidJsonLines === 0 && unknownTypes.size === 0
    && lifecycleErrors.size === 0 && completedTurns > 0 && !inTurn && activeTools.size === 0
    && events[0]?.type === "thread.started" && events.at(-1)?.type === "turn.completed";
  return {
    schemaVersion: 1,
    coverage: complete ? "complete" : "unknown",
    count: complete ? requests.size : null,
    observedRequests: [...requests.values()],
    unknownTypes: [...unknownTypes].sort(),
    lifecycleErrors: [...lifecycleErrors].sort(),
    completedTurns,
    invalidJsonLines,
    processCompleted,
  };
}

export function summarizeCodexEvents(events, options) {
  const usage = {
    inputTokens: 0,
    cachedInputTokens: 0,
    cacheWriteInputTokens: 0,
    outputTokens: 0,
    reasoningOutputTokens: 0,
  };
  const itemCounts = {};
  let toolCalls = 0;

  for (const event of events) {
    if (event?.type === "turn.completed" && event.usage) {
      usage.inputTokens += Number(event.usage.input_tokens ?? 0);
      usage.cachedInputTokens += Number(
        event.usage.cached_input_tokens ?? 0,
      );
      usage.cacheWriteInputTokens += Number(
        event.usage.cache_write_input_tokens ?? 0,
      );
      usage.outputTokens += Number(event.usage.output_tokens ?? 0);
      usage.reasoningOutputTokens += Number(
        event.usage.reasoning_output_tokens ?? 0,
      );
    }
    if (event?.type !== "item.completed" || !event.item?.type) continue;
    const type = event.item.type;
    itemCounts[type] = (itemCounts[type] ?? 0) + 1;
    if (
      type !== "agent_message" &&
      type !== "reasoning" &&
      type !== "plan"
    ) {
      toolCalls += 1;
    }
  }

  return {
    usage: {
      ...usage,
      totalTokens: usage.inputTokens + usage.outputTokens,
    },
    toolCalls,
    itemCounts,
    userInputEvents: summarizeUserInputEvents(events, options),
  };
}

export function findThreadId(events) {
  const direct = events.find(
    (event) =>
      typeof event?.thread_id === "string" ||
      typeof event?.session_id === "string",
  );
  if (direct?.thread_id) return direct.thread_id;
  if (direct?.session_id) return direct.session_id;

  const serialized = JSON.stringify(events);
  return serialized.match(
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i,
  )?.[0];
}

export function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      throw new Error(`Unexpected argument: ${token}`);
    }
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      result[key] = true;
    } else {
      result[key] = next;
      index += 1;
    }
  }
  return result;
}

function terminateProcessTree(child) {
  if (!child.pid) return;
  if (process.platform === "win32") {
    spawnSync("taskkill.exe", ["/pid", String(child.pid), "/t", "/f"], {
      windowsHide: true,
      stdio: "ignore",
    });
  } else {
    child.kill("SIGKILL");
  }
}

export function runProcess(
  command,
  args,
  {
    cwd,
    env = process.env,
    input,
    timeoutMs = 900_000,
    onStdout,
    onStderr,
  } = {},
) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const child = spawn(command, args, {
      cwd,
      env,
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let timedOut = false;

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      onStdout?.(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
      onStderr?.(chunk);
    });
    child.once("error", reject);

    const timer = setTimeout(() => {
      timedOut = true;
      terminateProcessTree(child);
    }, timeoutMs);

    child.once("close", (code, signal) => {
      clearTimeout(timer);
      resolve({
        command,
        args,
        code,
        signal,
        stdout,
        stderr,
        timedOut,
        durationMs: Date.now() - startedAt,
      });
    });

    if (input !== undefined) child.stdin.end(input);
    else child.stdin.end();
  });
}

export function commandName(name) {
  if (process.platform !== "win32") return name;
  if (name === "codex") {
    const bundled = path.join(
      process.env.APPDATA ?? "",
      "npm",
      "node_modules",
      "@openai",
      "codex",
      "node_modules",
      "@openai",
      "codex-win32-x64",
      "vendor",
      "x86_64-pc-windows-msvc",
      "bin",
      "codex.exe",
    );
    if (fs.existsSync(bundled)) return bundled;

    const located = spawnSync("where.exe", ["codex.exe"], {
      encoding: "utf8",
      windowsHide: true,
    });
    const candidate = located.stdout
      ?.split(/\r?\n/)
      .find((line) => line.toLowerCase().endsWith("codex.exe"));
    if (candidate) return candidate;
    throw new Error("Unable to locate native codex.exe on Windows");
  }
  return name;
}

export function relativeFiles(root) {
  const files = [];
  function visit(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(full);
      else files.push(path.relative(root, full).replaceAll(path.sep, "/"));
    }
  }
  if (fs.existsSync(root)) visit(root);
  return files.sort();
}
