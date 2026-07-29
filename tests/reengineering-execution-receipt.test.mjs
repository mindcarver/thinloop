import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  parseExecutionReceipt,
  validateExecutionReceipt,
} from "../skills/scd-reengineering/scripts/validate-execution-receipt.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const validatorPath = path.join(
  root,
  "skills",
  "scd-reengineering",
  "scripts",
  "validate-execution-receipt.mjs",
);

function receipt(overrides = {}) {
  return {
    schemaVersion: 1,
    phase: "GRAPH_APPROVED",
    initiative: {
      issue: 100,
      url: "https://github.com/example/repo/issues/100",
    },
    graphRevision: 3,
    trackerVerified: true,
    graphValidated: true,
    directionApproval: "User approved reimplement and CAP-001 through CAP-004.",
    graphApproval: {
      revision: 3,
      evidence: "User approved graph revision 3 and READY wave.",
    },
    requiredSkills: {
      scdProject: "available",
      scdQuickdev: "available",
    },
    deliveryIssues: [
      {
        nodeId: "baseline-harness",
        issue: 101,
        url: "https://github.com/example/repo/issues/101",
        state: "READY",
      },
      {
        nodeId: "target-cli",
        issue: 102,
        url: "https://github.com/example/repo/issues/102",
        state: "READY",
      },
    ],
    readyWave: ["target-cli", "baseline-harness"],
    blockers: [],
    ...overrides,
  };
}

test("validates an executable receipt and returns deterministic READY nodes", () => {
  assert.deepEqual(validateExecutionReceipt(receipt()), {
    valid: true,
    phase: "GRAPH_APPROVED",
    initiative: 100,
    graphRevision: 3,
    readyWave: ["baseline-harness", "target-cli"],
  });
});

test("fails closed when authority, tracker, graph, or required skills are missing", () => {
  const cases = [
    [receipt({ phase: "DIRECTION_APPROVED" }), /phase must be GRAPH_APPROVED/],
    [receipt({ trackerVerified: false }), /trackerVerified must be true/],
    [receipt({ graphValidated: false }), /graphValidated must be true/],
    [
      receipt({
        graphApproval: {
          revision: 4,
          evidence: "User approved graph revision 4.",
        },
      }),
      /graphApproval\.revision must match graphRevision/,
    ],
    [
      receipt({
        requiredSkills: {
          scdProject: "available",
          scdQuickdev: "missing",
        },
      }),
      /requiredSkills\.scdQuickdev must be available/,
    ],
    [
      receipt({ blockers: ["license review"] }),
      /receipt has blockers: license review/,
    ],
  ];

  for (const [candidate, expected] of cases) {
    assert.throws(() => validateExecutionReceipt(candidate), expected);
  }
});

test("requires every READY node to map to one real Delivery Issue", () => {
  assert.throws(
    () => validateExecutionReceipt(receipt({ readyWave: ["missing-node"] })),
    /READY node has no delivery Issue: missing-node/,
  );
  assert.throws(
    () =>
      validateExecutionReceipt(
        receipt({
          deliveryIssues: [
            {
              nodeId: "baseline-harness",
              issue: 101,
              url: "https://github.com/example/repo/issues/101",
              state: "PLANNED",
            },
          ],
          readyWave: ["baseline-harness"],
        }),
      ),
    /deliveryIssues\[0\]\.state must be READY/,
  );
  assert.throws(
    () =>
      validateExecutionReceipt(
        receipt({
          deliveryIssues: [
            {
              nodeId: "baseline-harness",
              issue: 101,
              url: "https://github.com/example/repo/issues/999",
              state: "READY",
            },
          ],
          readyWave: ["baseline-harness"],
        }),
      ),
    /deliveryIssues\[0\]\.url must identify issue 101/,
  );
  assert.throws(
    () =>
      validateExecutionReceipt(
        receipt({
          deliveryIssues: [
            {
              nodeId: "baseline-harness",
              issue: 101,
              url: "https://github.com/other/repo/issues/101",
              state: "READY",
            },
          ],
          readyWave: ["baseline-harness"],
        }),
      ),
    /deliveryIssues\[0\]\.url must use the Initiative repository/,
  );
});

test("rejects malformed receipts and unknown fields", () => {
  assert.throws(() => parseExecutionReceipt("{"), /input is not valid JSON/);
  assert.throws(
    () => validateExecutionReceipt({ ...receipt(), localPlan: "tasks" }),
    /receipt has unknown field: localPlan/,
  );
  assert.throws(
    () =>
      validateExecutionReceipt(
        receipt({
          deliveryIssues: [
            receipt().deliveryIssues[0],
            { ...receipt().deliveryIssues[1], issue: 101 },
          ],
        }),
      ),
    /duplicate delivery issue: 101/,
  );
});

test("CLI supports stdin and --file with stable fail-closed errors", () => {
  const stdin = spawnSync(process.execPath, [validatorPath], {
    input: JSON.stringify(receipt()),
    encoding: "utf8",
  });
  assert.equal(stdin.status, 0, stdin.stderr);
  assert.equal(JSON.parse(stdin.stdout).valid, true);

  const fixture = fs.mkdtempSync(
    path.join(os.tmpdir(), "scd-reengineering-receipt-"),
  );
  const receiptPath = path.join(fixture, "receipt.json");
  try {
    fs.writeFileSync(receiptPath, JSON.stringify(receipt()), "utf8");
    const file = spawnSync(
      process.execPath,
      [validatorPath, "--file", receiptPath],
      { encoding: "utf8" },
    );
    assert.equal(file.status, 0, file.stderr);
    assert.equal(JSON.parse(file.stdout).graphRevision, 3);

    const invalid = spawnSync(process.execPath, [validatorPath], {
      input: JSON.stringify(receipt({ trackerVerified: false })),
      encoding: "utf8",
    });
    assert.equal(invalid.status, 1);
    assert.equal(invalid.stdout, "");
    assert.equal(
      invalid.stderr,
      "scd-reengineering: trackerVerified must be true\n",
    );
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});
