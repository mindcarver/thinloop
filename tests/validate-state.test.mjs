import assert from "node:assert/strict";
import test from "node:test";

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
