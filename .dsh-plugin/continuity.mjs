// DeepSeek Harness (DSH) continuity plugin.
//
// DSH has no declarative subprocess hook manifest of the kind Claude Code,
// WorkBuddy, and ZCode ship (a JSON hook file + a subprocess handler). A DSH
// "hook" is a Cordis plugin that registers lifecycle-event listeners. This
// plugin ports the Thinloop resumability gate from `hooks/check-state.mjs` to
// that system.
//
// The closest equivalent of Claude Code's `Stop` gate is `agent/turn-stopping`
// (serial): it fires when a turn is about to close. If `.scd/tasks/current.md`
// is SCD-managed but not resumable, we steer a corrective user message into the
// next-step inbox so the agent keeps working instead of stopping on an
// unresumable note. DSH exposes no third-party pre-compaction veto, so the
// `PreCompact` half of the subprocess hook is not replicated; DSH's own
// `AGENTS.md` baseline re-injection restores instructions after compaction.
//
// This module performs the same validation as the subprocess hook via the
// shared `../hooks/validate-state.mjs`, and must stay inside the Thinloop
// checkout so that relative import resolves.

import { readFile } from "node:fs/promises";
import path from "node:path";

import { RELATIVE_STATE_PATH, validateState } from "../hooks/validate-state.mjs";

export const name = "thinloop-continuity";
export const inject = [];

// A minimal user message matching the runtime `UserMessage` shape
// ({ id, role: 'user', content: [{ type: 'text', text }], source: { kind: 'user' } }).
function correctiveMessage(text) {
  return {
    id: `thinloop-continuity-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2)}`,
    role: "user",
    content: [{ type: "text", text }],
    source: { kind: "user" },
  };
}

export function apply(ctx) {
  ctx.on("agent/turn-stopping", async ({ agent, signal }) => {
    if (signal?.aborted) return;

    const cwd = agent?.session?.header?.cwd ?? process.cwd();
    const statePath = path.resolve(cwd, RELATIVE_STATE_PATH);

    let markdown;
    try {
      markdown = await readFile(statePath, "utf8");
    } catch (error) {
      if (error?.code === "ENOENT") return; // no fallback state → nothing to protect
      ctx.logger.warn(
        `thinloop continuity check failed open: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return;
    }

    const result = validateState(markdown);
    if (!result.managed || result.issues.length === 0) return;

    const issueList = result.issues.map((issue) => `- ${issue}`).join("\n");
    agent.steer(
      correctiveMessage(
        `${result.managedBy} paused before stopping because ` +
          `.scd/tasks/current.md is not resumable:\n${issueList}\n` +
          `Update the note, then continue.`,
      ),
    );
  });
}
