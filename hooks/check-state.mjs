import fs from "node:fs/promises";
import path from "node:path";

import { RELATIVE_STATE_PATH, validateState } from "./validate-state.mjs";

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

function block(eventName, managedBy, issues) {
  const issueList = issues.map((issue) => `- ${issue}`).join("\n");
  const message =
    `${managedBy} paused ${eventName} because .scd/tasks/current.md is not resumable:\n` +
    `${issueList}\nUpdate the note, then retry the lifecycle event.`;

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
  try {
    const hookInput = await readStdin();
    const cwd =
      typeof hookInput.cwd === "string" && hookInput.cwd.trim()
        ? hookInput.cwd
        : process.cwd();
    const statePath = path.resolve(cwd, RELATIVE_STATE_PATH);

    let markdown;
    try {
      markdown = await fs.readFile(statePath, "utf8");
    } catch (error) {
      if (error?.code === "ENOENT") {
        return;
      }
      throw error;
    }

    const result = validateState(markdown);
    if (!result.managed || result.issues.length === 0) {
      return;
    }

    const eventName = hookInput.hook_event_name || "lifecycle event";
    block(eventName, result.managedBy, result.issues);
  } catch (error) {
    emit({
      continue: true,
      systemMessage:
        `SCD could not inspect continuity state and failed open: ` +
        `${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

await main();
