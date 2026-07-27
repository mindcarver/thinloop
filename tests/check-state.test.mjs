import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const hookPath = path.resolve(testDir, "..", "hooks", "check-state.mjs");

function validState(overrides = {}) {
  const values = {
    managedBy: "scd-dev-loop",
    status: "active",
    updatedAt: "2026-07-26T12:34:56+08:00",
    outcome: "The requested behavior is observable.",
    boundaries: "- In: requested behavior\n- Out: unrelated cleanup",
    acceptance: "- [ ] Focused behavior check passes",
    decisions: "- None yet",
    evidence: "- Not run yet; planned check: npm test -- focused",
    nextAction: "Run the focused regression test.",
    lineEnding: "\n",
    ...overrides,
  };
  const eol = values.lineEnding;

  return [
    "---",
    `managed_by: ${values.managedBy}`,
    `status: ${values.status}`,
    `updated_at: ${values.updatedAt}`,
    "---",
    "",
    "# Current task",
    "",
    "## Outcome",
    "",
    values.outcome,
    "",
    "## Boundaries",
    "",
    values.boundaries,
    "",
    "## Acceptance",
    "",
    values.acceptance,
    "",
    "## Decisions",
    "",
    values.decisions,
    "",
    "## Evidence",
    "",
    values.evidence,
    "",
    "## Next action",
    "",
    values.nextAction,
    "",
  ].join(eol);
}

function makeWorkspace() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "scd-dev-loop-hook-"));
}

function writeState(cwd, content) {
  const stateDir = path.join(cwd, ".scd", "tasks");
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(path.join(stateDir, "current.md"), content, "utf8");
}

function runHook(cwd, input = {}, env = {}) {
  return spawnSync(process.execPath, [hookPath], {
    cwd,
    input: JSON.stringify({
      cwd,
      hook_event_name: "Stop",
      ...input,
    }),
    encoding: "utf8",
    env: {
      ...process.env,
      CLAUDE_PLUGIN_ROOT: "",
      ZCODE_PLUGIN_ROOT: "",
      ...env,
    },
  });
}

function parseOutput(result) {
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim() ? JSON.parse(result.stdout) : null;
}

test("allows a workspace with no fallback state", () => {
  const cwd = makeWorkspace();
  try {
    assert.equal(parseOutput(runHook(cwd)), null);
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test("ignores a current file managed by another tool", () => {
  const cwd = makeWorkspace();
  try {
    writeState(cwd, validState({ managedBy: "another-tool" }));
    assert.equal(parseOutput(runHook(cwd)), null);
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test("allows complete active state", () => {
  const cwd = makeWorkspace();
  try {
    writeState(cwd, validState());
    assert.equal(parseOutput(runHook(cwd)), null);
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test("allows complete discovery state", () => {
  const cwd = makeWorkspace();
  try {
    writeState(cwd, validState({ managedBy: "scd-discovery" }));
    assert.equal(parseOutput(runHook(cwd)), null);
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test("allows complete blocked state", () => {
  const cwd = makeWorkspace();
  try {
    writeState(
      cwd,
      validState({
        status: "blocked",
        evidence: "- Build cannot run; blocker: SDK is unavailable.",
        nextAction: "Wait for the required SDK to become available.",
      }),
    );
    assert.equal(parseOutput(runHook(cwd)), null);
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test("allows CRLF state", () => {
  const cwd = makeWorkspace();
  try {
    writeState(cwd, validState({ lineEnding: "\r\n" }));
    assert.equal(parseOutput(runHook(cwd)), null);
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test("blocks an invalid status", () => {
  const cwd = makeWorkspace();
  try {
    writeState(cwd, validState({ status: "complete" }));
    const output = parseOutput(runHook(cwd));
    assert.equal(output.continue, false);
    assert.match(output.systemMessage, /status must be active or blocked/);
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test("uses Claude Code decision output when loaded as a Claude plugin", () => {
  const cwd = makeWorkspace();
  try {
    writeState(cwd, validState({ status: "complete" }));
    const output = parseOutput(
      runHook(cwd, {}, { CLAUDE_PLUGIN_ROOT: path.resolve(testDir, "..") }),
    );
    assert.equal(output.decision, "block");
    assert.match(output.reason, /status must be active or blocked/);
    assert.equal("continue" in output, false);
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test("uses ZCode decision output for Stop", () => {
  const cwd = makeWorkspace();
  try {
    writeState(cwd, validState({ status: "complete" }));
    const output = parseOutput(
      runHook(cwd, {}, { ZCODE_PLUGIN_ROOT: path.resolve(testDir, "..") }),
    );
    assert.equal(output.decision, "block");
    assert.match(output.reason, /status must be active or blocked/);
    assert.equal("continue" in output, false);
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test("restores ZCode continuity context after compaction", () => {
  const cwd = makeWorkspace();
  try {
    writeState(cwd, validState({ status: "complete" }));
    const output = parseOutput(
      runHook(
        cwd,
        { hook_event_name: "SessionStart", source: "compact" },
        { ZCODE_PLUGIN_ROOT: path.resolve(testDir, "..") },
      ),
    );
    assert.equal(
      output.hookSpecificOutput.hookEventName,
      "SessionStart",
    );
    assert.match(
      output.hookSpecificOutput.additionalContext,
      /status must be active or blocked/,
    );
    assert.equal("decision" in output, false);
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test("blocks unresolved placeholders", () => {
  const cwd = makeWorkspace();
  try {
    writeState(cwd, validState({ outcome: "<One observable result>" }));
    const output = parseOutput(runHook(cwd));
    assert.equal(output.continue, false);
    assert.match(output.systemMessage, /unresolved placeholder/);
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test("blocks missing evidence", () => {
  const cwd = makeWorkspace();
  try {
    writeState(cwd, validState({ evidence: "" }));
    const output = parseOutput(runHook(cwd));
    assert.equal(output.continue, false);
    assert.match(output.systemMessage, /empty section: Evidence/);
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test("blocks incomplete discovery state", () => {
  const cwd = makeWorkspace();
  try {
    writeState(
      cwd,
      validState({ managedBy: "scd-discovery", acceptance: "" }),
    );
    const output = parseOutput(runHook(cwd));
    assert.equal(output.continue, false);
    assert.match(output.systemMessage, /^scd-discovery paused Stop/);
    assert.match(output.systemMessage, /empty section: Acceptance/);
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test("blocks multiple next actions", () => {
  const cwd = makeWorkspace();
  try {
    writeState(
      cwd,
      validState({
        nextAction: "- Run the test.\n- Update the implementation.",
      }),
    );
    const output = parseOutput(runHook(cwd));
    assert.equal(output.continue, false);
    assert.match(output.systemMessage, /exactly one action/);
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test("fails open with a warning on invalid hook input", () => {
  const cwd = makeWorkspace();
  try {
    const result = spawnSync(process.execPath, [hookPath], {
      cwd,
      input: "{not-json",
      encoding: "utf8",
      env: {
        ...process.env,
        CLAUDE_PLUGIN_ROOT: "",
        ZCODE_PLUGIN_ROOT: "",
      },
    });
    const output = parseOutput(result);
    assert.equal(output.continue, true);
    assert.match(output.systemMessage, /failed open/);
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});
