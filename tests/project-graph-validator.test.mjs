import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  parseProjectGraph,
  validateProjectGraph,
} from "../skills/scd-project/scripts/validate-project-graph.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const validatorPath = path.join(
  root,
  "skills",
  "scd-project",
  "scripts",
  "validate-project-graph.mjs",
);

function node(id, overrides = {}) {
  return {
    id,
    issue: null,
    contract: "planned",
    delivery: "open",
    humanGate: "clear",
    dependsOn: [],
    blockers: [],
    ...overrides,
  };
}

function graph(nodes, overrides = {}) {
  return {
    schemaVersion: 1,
    revision: 7,
    nodes,
    ...overrides,
  };
}

test("derives stable DONE, PLANNED, BLOCKED, and READY output", () => {
  const snapshot = graph([
    node("release", {
      issue: 104,
      contract: "approved",
      dependsOn: ["api", "foundation"],
      blockers: ["resolve rollout owner", "confirm budget"],
      humanGate: "waiting",
    }),
    node("later-slice"),
    node("foundation", {
      issue: 101,
      contract: "approved",
      delivery: "done",
      humanGate: "waiting",
      blockers: ["ignored because DONE has priority"],
    }),
    node("api", {
      issue: 102,
      contract: "approved",
    }),
    node("ui", {
      issue: 103,
      contract: "approved",
      dependsOn: ["foundation"],
    }),
  ]);

  assert.deepEqual(validateProjectGraph(snapshot), {
    valid: true,
    revision: 7,
    nodes: [
      { id: "api", issue: 102, state: "READY", reasons: [] },
      { id: "foundation", issue: 101, state: "DONE", reasons: [] },
      { id: "later-slice", issue: null, state: "PLANNED", reasons: [] },
      {
        id: "release",
        issue: 104,
        state: "BLOCKED",
        reasons: [
          "human gate waiting",
          "blocker: confirm budget",
          "blocker: resolve rollout owner",
          "dependency not done: api",
        ],
      },
      { id: "ui", issue: 103, state: "READY", reasons: [] },
    ],
    ready: ["api", "ui"],
  });

  const reordered = graph([
    snapshot.nodes[4],
    snapshot.nodes[1],
    {
      ...snapshot.nodes[0],
      dependsOn: [...snapshot.nodes[0].dependsOn].reverse(),
      blockers: [...snapshot.nodes[0].blockers].reverse(),
    },
    snapshot.nodes[3],
    snapshot.nodes[2],
  ]);
  assert.deepEqual(validateProjectGraph(reordered), validateProjectGraph(snapshot));
});

test("parses JSON and rejects malformed JSON with a stable error", () => {
  const snapshot = graph([
    node("delivery", { issue: 1, contract: "approved" }),
  ]);

  assert.deepEqual(
    parseProjectGraph(JSON.stringify(snapshot)),
    validateProjectGraph(snapshot),
  );
  assert.throws(() => parseProjectGraph("{"), /input is not valid JSON/);
});

test("rejects invalid snapshot and node field types", () => {
  const cases = [
    [null, /snapshot must be an object/],
    [graph([node("delivery")], { scheduler: {} }), /snapshot has unknown field: scheduler/],
    [graph([node("delivery")], { schemaVersion: 2 }), /schemaVersion must be 1/],
    [graph([node("delivery")], { revision: 0 }), /revision must be a positive integer/],
    [graph([]), /nodes must be a non-empty array/],
    [graph([node("delivery", { branch: "feat/1-delivery" })]), /nodes\[0\] has unknown field: branch/],
    [graph([node("Not-Kebab")]), /id must be kebab-case/],
    [graph([node("delivery", { issue: 1.5 })]), /issue must be a positive integer/],
    [graph([node("delivery", { contract: "draft" })]), /contract must be one of/],
    [graph([node("delivery", { delivery: "closed" })]), /delivery must be one of/],
    [graph([node("delivery", { humanGate: "paused" })]), /humanGate must be one of/],
    [graph([node("delivery", { dependsOn: "other" })]), /dependsOn must be an array of strings/],
    [graph([node("delivery", { blockers: [1] })]), /blockers must be an array of strings/],
  ];

  for (const [snapshot, expected] of cases) {
    assert.throws(() => validateProjectGraph(snapshot), expected);
  }
});

test("enforces approval and completion invariants", () => {
  assert.throws(
    () =>
      validateProjectGraph(
        graph([node("approved-without-issue", { contract: "approved" })]),
      ),
    /approved and must have an issue/,
  );
  assert.throws(
    () =>
      validateProjectGraph(
        graph([node("planned-but-done", { delivery: "done" })]),
      ),
    /done and must be approved/,
  );
  assert.throws(
    () =>
      validateProjectGraph(
        graph([
          node("foundation", { issue: 1, contract: "approved" }),
          node("release", {
            issue: 2,
            contract: "approved",
            delivery: "done",
            dependsOn: ["foundation"],
          }),
        ]),
      ),
    /release.*done but dependency is not done: foundation/,
  );
});

test("rejects duplicate node IDs and invalid dependency references", () => {
  assert.throws(
    () => validateProjectGraph(graph([node("same"), node("same")])),
    /duplicate node id: same/,
  );
  assert.throws(
    () =>
      validateProjectGraph(
        graph([node("self", { dependsOn: ["self"] })]),
      ),
    /must not depend on itself/,
  );
  assert.throws(
    () =>
      validateProjectGraph(
        graph([node("delivery", { dependsOn: ["missing"] })]),
      ),
    /unknown dependency: missing/,
  );
  assert.throws(
    () =>
      validateProjectGraph(
        graph([
          node("foundation"),
          node("delivery", { dependsOn: ["foundation", "foundation"] }),
        ]),
      ),
    /duplicate dependency: foundation/,
  );
});

test("rejects dependency cycles with a deterministic path", () => {
  const snapshot = graph([
    node("third", { dependsOn: ["first"] }),
    node("first", { dependsOn: ["second"] }),
    node("second", { dependsOn: ["third"] }),
  ]);

  assert.throws(
    () => validateProjectGraph(snapshot),
    /dependency cycle detected: first -> second -> third -> first/,
  );
});

test("CLI reads stdin and emits derived JSON", () => {
  const snapshot = graph([
    node("delivery", { issue: 21, contract: "approved" }),
  ]);
  const result = spawnSync(process.execPath, [validatorPath], {
    input: JSON.stringify(snapshot),
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), validateProjectGraph(snapshot));
  assert.equal(result.stderr, "");
});

test("CLI supports --file and reports reproducible errors", () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "scd-project-graph-"));
  const graphPath = path.join(fixture, "graph.json");
  const snapshot = graph([
    node("delivery", { issue: 21, contract: "approved" }),
  ]);

  try {
    fs.writeFileSync(graphPath, JSON.stringify(snapshot), "utf8");
    const valid = spawnSync(
      process.execPath,
      [validatorPath, "--file", graphPath],
      { encoding: "utf8" },
    );
    assert.equal(valid.status, 0, valid.stderr);
    assert.deepEqual(JSON.parse(valid.stdout), validateProjectGraph(snapshot));

    const invalid = spawnSync(process.execPath, [validatorPath], {
      input: "{",
      encoding: "utf8",
    });
    assert.equal(invalid.status, 1);
    assert.equal(invalid.stdout, "");
    assert.equal(invalid.stderr, "scd-project: input is not valid JSON\n");

    const badArgs = spawnSync(
      process.execPath,
      [validatorPath, "--file"],
      { encoding: "utf8" },
    );
    assert.equal(badArgs.status, 1);
    assert.equal(
      badArgs.stderr,
      "scd-project: --file requires exactly one path\n",
    );
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});
