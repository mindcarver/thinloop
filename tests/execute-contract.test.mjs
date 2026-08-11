import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("execute consumes approved Initiatives without replacing Project", () => {
  const skill = read("skills/scd-execute/SKILL.md");
  const contract = read("skills/scd-execute/references/execution-contract.md");

  assert.match(skill, /start, continue, resume, or finish an approved\s+Initiative/i);
  assert.match(skill, /`scd-project` owns the Initiative/i);
  assert.match(skill, /Execute owns live wave selection/i);
  assert.match(skill, /one Delivery Issue is selected; use `scd-quickdev`/i);
  assert.match(skill, /re-enter `scd-project`/i);
  assert.match(contract, /keeping Project non-executing/i);
  assert.doesNotMatch(`${skill}\n${contract}`, /\.scd\/execute/);
});

test("execute selects all safe READY nodes unless the user narrows the wave", () => {
  const skill = read("skills/scd-execute/SKILL.md");
  const contract = read("skills/scd-execute/references/execution-contract.md");
  const combined = `${skill}\n${contract}`;

  assert.match(combined, /all safely independent READY nodes up to available/i);
  assert.match(combined, /only Issue #N/i);
  assert.match(combined, /serial/i);
  assert.match(combined, /at most N in parallel/i);
  assert.match(combined, /Do not ask the user to manually select nodes/i);
  assert.match(combined, /must not be\s+written into the Project DAG as fake edges/i);
  assert.match(skill, /validate-project-graph\.mjs/i);
  assert.match(skill, /Refuse stale\s+revisions, invalid graphs/i);
});

test("execute launches one isolated QuickDev lane per selected Issue", () => {
  const skill = read("skills/scd-execute/SKILL.md");
  const contract = read("skills/scd-execute/references/execution-contract.md");
  const combined = `${skill}\n${contract}`;

  assert.match(combined, /isolated worktree/i);
  assert.match(combined, /exactly one Delivery Issue/i);
  assert.match(combined, /invoke `scd-quickdev`/i);
  assert.match(combined, /explicit file or module ownership/i);
  assert.match(combined, /sibling agents may be active/i);
  assert.match(combined, /must not implement sibling Issues/i);
  assert.match(combined, /Detached\s+background work/i);
  assert.match(combined, /independent behavioral\s+acceptance `PASS`/i);
  assert.doesNotMatch(combined, /REVIEW_PASS/);
});

test("execute develops concurrently but merges and unlocks serially", () => {
  const skill = read("skills/scd-execute/SKILL.md");
  const contract = read("skills/scd-execute/references/execution-contract.md");
  const combined = `${skill}\n${contract}`;

  assert.match(combined, /Development may run in parallel/i);
  assert.match(combined, /merge eligible pull requests one at a\s+time/i);
  assert.match(combined, /synchronize the base branch/i);
  assert.match(combined, /rebuild and validate the live Project graph/i);
  assert.match(combined, /Green checks against different base revisions/i);
  assert.match(combined, /integration or release Delivery Issue/i);
});

test("execute fails closed and resumes from authoritative evidence", () => {
  const skill = read("skills/scd-execute/SKILL.md");
  const contract = read("skills/scd-execute/references/execution-contract.md");
  const combined = `${skill}\n${contract}`;

  assert.match(combined, /`PASS`/);
  assert.match(combined, /`FAIL`/);
  assert.match(combined, /`BLOCKED`/);
  assert.match(combined, /stop downstream nodes/i);
  assert.match(combined, /return product changes to Discovery/i);
  assert.match(combined, /Reconstruct execution state from/i);
  assert.match(combined, /Do not infer `DONE` from a commit/i);
  assert.match(combined, /Do not add leases/i);
  assert.match(combined, /second state database/i);
});

test("execute turns an empty READY set into an actionable handoff", () => {
  const skill = read("skills/scd-execute/SKILL.md");
  const contract = read("skills/scd-execute/references/execution-contract.md");
  const combined = `${skill}\n${contract}`;

  assert.match(combined, /`ROLLING_REPLAN_REQUIRED`/);
  assert.match(combined, /remaining executable work is only `PLANNED` placeholders/i);
  assert.match(combined, /not.*redo Discovery/i);
  assert.match(combined, /copy-ready.*`scd-project` prompt/i);
  assert.match(combined, /`EXTERNAL_OR_HUMAN_BLOCK`/);
  assert.match(combined, /`INVALID_OR_STALE_GRAPH`/);
  assert.match(combined, /Never report only “no READY nodes”/);
  assert.match(combined, /must not materialize them/i);
});
