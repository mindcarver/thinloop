import fs from "node:fs/promises";
import path from "node:path";

import { RELATIVE_STATE_PATH, validateState } from "./validate-state.mjs";

function parsePlatformArg(argv = process.argv.slice(2)) {
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--platform") {
      return argv[index + 1] || null;
    }
    if (arg.startsWith("--platform=")) {
      return arg.slice("--platform=".length) || null;
    }
  }
  return null;
}

async function readStdin() {
  let input = "";
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) {
    input += chunk;
  }
  return input.trim() ? JSON.parse(input) : {};
}

function emit(payload) {
  process.stdout.write(`${JSON.stringify(payload)}\n`);
}

function allow(isAntigravity) {
  if (isAntigravity) {
    emit({});
  }
}

function block(eventName, managedBy, issues, { isAntigravity = false } = {}) {
  const issueList = issues.map((issue) => `- ${issue}`).join("\n");
  const message =
    `${managedBy} paused ${eventName} because .scd/tasks/current.md is not resumable:\n` +
    `${issueList}\nUpdate the note, then retry the lifecycle event.`;

  if (isAntigravity) {
    emit({
      decision: "continue",
      reason: message,
    });
    return;
  }

  if (
    process.env.ZCODE_PLUGIN_ROOT &&
    eventName === "SessionStart"
  ) {
    emit({
      hookSpecificOutput: {
        hookEventName: eventName,
        additionalContext: message,
      },
    });
    return;
  }

  if (process.env.CODEBUDDY_PLUGIN_ROOT) {
    emit({
      continue: false,
      reason: message,
    });
    return;
  }

  if (process.env.CLAUDE_PLUGIN_ROOT || process.env.ZCODE_PLUGIN_ROOT) {
    emit({
      decision: "block",
      reason: message,
    });
    return;
  }

  emit({
    continue: false,
    stopReason: "SCD continuity state is incomplete.",
    systemMessage: message,
  });
}

async function main() {
  const platformArg = parsePlatformArg();
  let isAntigravity = platformArg === "antigravity";

  try {
    const hookInput = await readStdin();
    const hasKnownPluginEnv = Boolean(
      process.env.CLAUDE_PLUGIN_ROOT ||
      process.env.ZCODE_PLUGIN_ROOT ||
      process.env.CODEBUDDY_PLUGIN_ROOT,
    );
    if (
      !platformArg &&
      !hasKnownPluginEnv &&
      typeof hookInput.hookEventName === "string" &&
      hookInput.hookEventName.trim().length > 0
    ) {
      isAntigravity = true;
    }

    const workspaceFallback =
      isAntigravity &&
      Array.isArray(hookInput.workspacePaths) &&
      typeof hookInput.workspacePaths[0] === "string" &&
      hookInput.workspacePaths[0].trim()
        ? hookInput.workspacePaths[0]
        : "";
    const cwd =
      typeof hookInput.cwd === "string" && hookInput.cwd.trim()
        ? hookInput.cwd
        : workspaceFallback || process.cwd();
    const statePath = path.resolve(cwd, RELATIVE_STATE_PATH);

    let markdown;
    try {
      markdown = await fs.readFile(statePath, "utf8");
    } catch (error) {
      if (error?.code === "ENOENT") {
        allow(isAntigravity);
        return;
      }
      throw error;
    }

    const result = validateState(markdown);
    if (!result.managed || result.issues.length === 0) {
      allow(isAntigravity);
      return;
    }

    const eventName =
      hookInput.hookEventName || hookInput.hook_event_name || "lifecycle event";
    if (isAntigravity && (eventName === "Stop" || eventName === "lifecycle event")) {
      const hasTerminationReason =
        hookInput.terminationReason !== undefined &&
        hookInput.terminationReason !== null &&
        hookInput.terminationReason !== "";
      if (
        (hasTerminationReason && hookInput.terminationReason !== "NO_TOOL_CALL") ||
        hookInput.continuationActive === true
      ) {
        allow(true);
        return;
      }
    }

    if (
      !isAntigravity &&
      process.env.CLAUDE_PLUGIN_ROOT &&
      !process.env.CODEBUDDY_PLUGIN_ROOT &&
      !process.env.ZCODE_PLUGIN_ROOT &&
      eventName === "Stop" &&
      hookInput.stop_hook_active === true
    ) {
      emit({
        continue: true,
        systemMessage:
          `${result.managedBy} unresolved continuity handoff: ` +
          `.scd/tasks/current.md is still not resumable after correction. ` +
          `Stopping automatic correction; this task is not complete. ` +
          `Resume by fixing the note before further delivery:\n` +
          result.issues.map((issue) => `- ${issue}`).join("\n"),
      });
      return;
    }
    block(eventName, result.managedBy, result.issues, { isAntigravity });
  } catch (error) {
    if (isAntigravity) {
      emit({});
      return;
    }
    emit({
      continue: true,
      systemMessage:
        `SCD could not inspect continuity state and failed open: ` +
        `${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

await main();
