import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("project triggers only for multiple independently verifiable deliveries", () => {
  const skill = read("skills/scd-project/SKILL.md");

  assert.match(skill, /more than one independently\s+verifiable delivery/i);
  assert.match(skill, /Do not use Project when/i);
  assert.match(skill, /one Issue can express one coherent outcome/i);
  assert.match(skill, /large only in implementation effort/i);
  assert.match(skill, /use `scd-discovery` first/i);
});

test("project preserves Initiative, Delivery Issue, and evidence authority", () => {
  const skill = read("skills/scd-project/SKILL.md");
  const contract = read(
    "skills/scd-project/references/project-contract.md",
  );

  assert.match(skill, /Initiative Issue owns the project outcome/i);
  assert.match(skill, /each Delivery Issue is the sole requirement/i);
  assert.match(contract, /Validated graph snapshot.*derived readiness view/i);
  assert.match(contract, /Do not copy full child acceptance/i);
  assert.match(contract, /## Delivery graph/);
  assert.match(contract, /## Project coordination/);
  assert.match(contract, /stable acceptance identifiers/i);
});

test("project models an executable Issue DAG without an execution loop", () => {
  const skill = read("skills/scd-project/SKILL.md");
  const contract = read(
    "skills/scd-project/references/project-contract.md",
  );

  assert.match(skill, /Each executable node must be an explicitly approved GitHub Delivery Issue/i);
  assert.match(skill, /PLANNED placeholder may exist without an Issue/i);
  assert.match(skill, /hard causal prerequisite/i);
  assert.match(skill, /Do not encode shared-file contention/i);
  assert.match(contract, /`DONE`/);
  assert.match(contract, /`PLANNED`/);
  assert.match(contract, /`BLOCKED`/);
  assert.match(contract, /`READY`/);
  assert.match(contract, /integration or release Delivery Issue/i);
  assert.match(skill, /must not automatically\s+launch agents/i);
  assert.match(skill, /Do not add leases, retries, concurrency slots/i);
  assert.match(skill, /`scd-reengineering` is an external consumer/i);
  assert.match(skill, /does not give Project\s+execution authority/i);
  assert.match(contract, /Project itself remains\s+non-executing/i);
});

test("project uses rolling approval and deterministic graph validation", () => {
  const skill = read("skills/scd-project/SKILL.md");
  const contract = read(
    "skills/scd-project/references/project-contract.md",
  );

  assert.match(skill, /rolling decomposition/i);
  assert.match(skill, /explicit approval/i);
  assert.match(skill, /validate-project-graph\.mjs/);
  assert.match(skill, /duplicate IDs/);
  assert.match(skill, /cycles/);
  assert.match(contract, /schemaVersion/);
  assert.match(contract, /contract_revision|revision/i);
  assert.match(contract, /rebuild and validate the graph snapshot/i);
  assert.doesNotMatch(`${skill}\n${contract}`, /\.scd\/projects/);
});

test("discovery and quickdev route project work without widening implementation authority", () => {
  const discovery = read("skills/scd-discovery/SKILL.md");
  const quickdev = read("skills/scd-quickdev/SKILL.md");
  const workflow = read("docs/workflow-and-state.md");

  assert.match(discovery, /hand decomposition to\s+`scd-project`/i);
  assert.match(discovery, /must not create one oversized implementation Issue/i);
  assert.match(quickdev, /\*\*Project:\*\*/);
  assert.match(quickdev, /one explicitly selected, approved `READY` Delivery Issue/i);
  assert.match(quickdev, /approved Reengineering execution wave/i);
  assert.match(quickdev, /Refuse an\s+Initiative,\s+PLANNED placeholder, BLOCKED node/i);
  assert.match(workflow, /不启动 Agent、worktree 或长期 loop/);
});
