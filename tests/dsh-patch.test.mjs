import assert from "node:assert/strict";
import test from "node:test";
import { readDshPatch, hasDshInsertion } from "../scripts/dsh-patch.mjs";

const handler = "file:///tmp/thinloop/.dsh-plugin/continuity.mjs";
const mount = `- insert:\n    - id: thinloop-continuity\n      name: ${handler}\n`;
const recognizes = text => hasDshInsertion([readDshPatch(text)], "thinloop-continuity", [handler]);

test("DSH bounded reader handles documented block structure and quoted scalars", () => {
  assert.deepEqual(readDshPatch(`# comment\n---\n${mount}      disabled: false\n      config:\n        note: 'it''s # a value' # comment\n        items:\n          - one\n          - "two"\n        empty: {}\n...\n`), [{ insert: [{
    id: "thinloop-continuity", name: handler, disabled: false,
    config: { note: "it's # a value", items: ["one", "two"], empty: {} },
  }] }]);
  for (const text of ["[]", "---\n[]\n..."]) assert.deepEqual(readDshPatch(text), []);
});

for (const [label, text] of [
  ["empty file", ""],
  ["comment-only file", "# comment\n"],
  ["empty document", "---\n...\n"],
  ["flow-style maps", `- insert: [{ id: thinloop-continuity, name: ${handler} }]`],
  ["block scalar", `${mount}      config: |\n        arbitrary text\n`],
  ["alias", `${mount}      config: *settings\n`],
  ["anchor", `${mount}      config: &settings false\n`],
  ["tag", `${mount}      disabled: !!js false\n`],
  ["broken quote", `${mount}      config: "broken\n`],
  ["duplicate key", `${mount}      name: other\n`],
  ["wrong indentation", `${mount}     disabled: true\n`],
  ["plain scalar trailing colon", `${mount}      config: value:\n`],
  ["non-ASCII indentation", mount.replaceAll("    ", "\u00a0\u00a0\u00a0\u00a0")],
  ["invalid control character", `${mount}      config: \u007f\n`],
  ["invalid Unicode noncharacter", `${mount}      config: bad\ufffevalue\n`],
  ["tabs", mount.replace("    -", "\t-")],
  ["second document", `${mount}---\n[]\n`],
  ["leading empty document", `---\n---\n${mount}`],
  ["content after end", `${mount}...\n[]\n`],
  ["multiple spaces after dash", mount.replace("- insert", "-   insert")],
  ["expression object", `${mount}      config:\n        __jsExpr: does.not.exist()\n`],
  ["prototype key", `${mount}      __proto__:\n        disabled: false\n`],
  ["non-list root", `insert:\n  - id: thinloop-continuity\n    name: ${handler}\n`],
]) {
  test(`DSH bounded reader rejects ${label}`, () => {
    assert.throws(() => readDshPatch(text), /unsupported or malformed patch YAML/);
  });
}

for (const value of ["false", "False", "FALSE", "null", "~", "0"]) {
  test(`DSH disabled ${value} permits a static insertion`, () => {
    assert.equal(recognizes(`${mount}      disabled: ${value}\n`), true);
  });
}
for (const value of ["true", '"false"', "FaLsE", "yes", "1", "false\u00a0"]) {
  test(`DSH disabled ${value} cannot prove a mount`, () => {
    assert.equal(recognizes(`${mount}      disabled: ${value}\n`), false);
  });
}

test("DSH config does not act as a host-level enabled flag", () => {
  assert.equal(recognizes(`${mount}      config: false\n`), true);
  assert.equal(recognizes(`${mount}      config:\n        enabled: false\n`), true);
});

test("DSH unknown entry semantics, nested groups, duplicate ids and overrides fail closed", () => {
  for (const suffix of ["      group: true\n", "      inject: {}\n", "      isolate: {}\n", "      intercept: {}\n", "      unknown: false\n"]) {
    assert.equal(recognizes(mount + suffix), false);
  }
  assert.equal(recognizes(mount + mount), false);
  assert.equal(recognizes(`${mount}- id: thinloop-continuity\n  disabled: true\n`), false);
  assert.equal(recognizes(`- id: group\n  insert:\n    - id: thinloop-continuity\n      name: ${handler}\n`), false);
});
