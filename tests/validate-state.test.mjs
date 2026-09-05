import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  parseFrontmatter,
  validateState,
} from "../hooks/validate-state.mjs";

function state(overrides = {}) {
  const values = {
    managedBy: "scd-quickdev",
    issue: "https://github.com/example/project/issues/123",
    status: "active",
    updatedAt: "2026-07-26T12:34:56+08:00",
    evidence: "- planned: npm test -- focused",
    ...overrides,
  };
  return [
    "---",
    `managed_by: ${values.managedBy}`,
    ...(values.issue === null ? [] : [`issue: ${values.issue}`]),
    `status: ${values.status}`,
    `updated_at: ${values.updatedAt}`,
    "---",
    "",
    "## Outcome",
    "",
    "observable behavior",
    "",
    "## Boundaries",
    "",
    "- In: requested behavior\n- Out: unrelated cleanup",
    "",
    "## Acceptance",
    "",
    "- [ ] focused check passes",
    "",
    "## Decisions",
    "",
    "- none yet",
    "",
    "## Evidence",
    "",
    values.evidence,
    "",
    "## Next action",
    "",
    "- run the focused regression test",
    "",
  ].join("\n");
}

test("validateState reports managed complete state without issues", () => {
  const result = validateState(state());
  assert.equal(result.managed, true);
  assert.equal(result.managedBy, "scd-quickdev");
  assert.deepEqual(result.issues, []);
});

test("validateState ignores state files managed by another tool", () => {
  const result = validateState(state({ managedBy: "another-tool" }));
  assert.equal(result.managed, false);
});

test("validateState flags legacy dev-loop and unresolved placeholders", () => {
  const result = validateState(
    state({ managedBy: "scd-dev-loop", issue: null }).replace(
      "## Evidence",
      "## Evidence\n\n- [TODO] capture result",
    ),
  );
  assert.equal(result.managed, true);
  assert.ok(result.issues.some((issue) => /legacy/.test(issue)));
  assert.ok(result.issues.some((issue) => /unresolved placeholder/.test(issue)));
});

test("validateState requires a governing issue for scd-quickdev", () => {
  const result = validateState(state({ issue: null }));
  assert.equal(result.managed, true);
  assert.ok(result.issues.some((issue) => /governing GitHub Issue/.test(issue)));
});

test("parseFrontmatter reads scalar fields", () => {
  const metadata = parseFrontmatter(state());
  assert.equal(metadata.managed_by, "scd-quickdev");
  assert.equal(metadata.status, "active");
  assert.equal(metadata.updated_at, "2026-07-26T12:34:56+08:00");
});

// Static shape of the DeepSeek Harness continuity plugin.
const plugin = await import("../.dsh-plugin/continuity.mjs");

test("DSH continuity plugin exports a Cordis plugin shape", () => {
  assert.equal(plugin.name, "thinloop-continuity");
  assert.ok(Array.isArray(plugin.inject));
  assert.equal(typeof plugin.apply, "function");
});


test("valid technical content is not a template placeholder", () => {
  for (const evidence of [
    '- observed `<button>Save</button>` responds to a click',
    '- compiled `Promise<string>` and `Map<K, V>`',
    '- verified <https://example.com/result> and <dev@example.com>',
  ]) assert.deepEqual(validateState(state({ evidence })).issues, [], evidence);
});

test("current Chinese template must be filled and remains resumable", async () => {
  const template = await fs.readFile(new URL("../skills/scd-quickdev/assets/current-task.md", import.meta.url), "utf8");
  const filled = template
    .replace("<GitHub Issue 地址>", "https://github.com/example/project/issues/123")
    .replace("<ISO-8601 timestamp with timezone>", "2026-09-05T12:00:00+08:00")
    .replace("<Issue 验收 ID 与当前状态>", "A1：检查通过")
    .replace("<命令或可观察行动>", "node --test：通过")
    .replace("<唯一且具体的行动>", "提交验收记录。");
  assert.deepEqual(validateState(filled).issues, []);
  for (const marker of ["<Issue 验收 ID 与当前状态>", "<命令或可观察行动>", "<唯一且具体的行动>"]) {
    const replacement = marker.includes("Issue") ? "A1：检查通过" : marker.includes("命令") ? "node --test：通过" : "提交验收记录。";
    assert.ok(validateState(filled.replace(replacement, marker)).issues.some(issue => /unresolved placeholder/.test(issue)), marker);
  }
  assert.ok(validateState(template).issues.length > 0);
  assert.ok(validateState(filled.replace("node --test：通过", "").replace("- 尚未执行；计划检查：", "")).issues.some(issue => /empty section: Evidence/.test(issue)));
});

test("known template markers and explicit TODO or TBD still fail", () => {
  for (const evidence of [
    "<command or observable action>", "<Issue acceptance ID and current state>",
    "<Exactly one concrete action>", "<One observable result>",
    "[TODO] capture result", "[TBD evidence]", "TODO", "TBD", "- TODO: capture result",
  ]) assert.ok(validateState(state({ evidence })).issues.some(issue => /unresolved placeholder/.test(issue)), evidence);
});

test("DSH bounds unchanged invalid-state steering per agent and rearms after recovery", async () => {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), "thinloop-dsh-hook-"));
  const statePath = path.join(cwd, ".scd", "tasks", "current.md");
  const messages = [], warnings = [];
  const agent = { session: { header: { cwd } }, steer: message => messages.push(message) };
  let listener;
  plugin.apply({ on(event, callback) { assert.equal(event, "agent/turn-stopping"); listener = callback; }, logger: { warn: message => warnings.push(message) } });
  try {
    await fs.mkdir(path.dirname(statePath), { recursive: true });
    const invalid = state({ evidence: "" });
    await fs.writeFile(statePath, invalid);
    await listener({ agent, signal: { aborted: true } });
    assert.equal(messages.length, 0);
    await listener({ agent });
    assert.equal(messages.length, 1);
    assert.match(messages[0].content[0].text, /empty section: Evidence/);
    await listener({ agent });
    await listener({ agent });
    assert.equal(messages.length, 1);
    assert.match(warnings[0], /unresolved.*handoff/i);
    const another = { session: { header: { cwd } }, steer: message => messages.push(message) };
    await listener({ agent: another });
    assert.equal(messages.length, 2);
    await fs.writeFile(statePath, state({ evidence: "[TODO] new failure" }));
    await listener({ agent });
    assert.equal(messages.length, 3);
    for (const recovered of [state(), state({ managedBy: "another-tool" }), null]) {
      if (recovered === null) await fs.unlink(statePath);
      else await fs.writeFile(statePath, recovered);
      await listener({ agent });
      const before = messages.length;
      await fs.writeFile(statePath, invalid);
      await listener({ agent });
      await listener({ agent });
      assert.equal(messages.length, before + 1);
    }
  } finally { await fs.rm(cwd, { recursive: true, force: true }); }
});
