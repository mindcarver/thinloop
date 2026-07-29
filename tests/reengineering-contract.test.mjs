import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("reengineering covers project refactor and cross-stack reimplementation", () => {
  const skill = read("skills/scd-reengineering/SKILL.md");

  assert.match(skill, /\*\*Refactor:\*\*/);
  assert.match(skill, /\*\*Reimplement:\*\*/);
  assert.match(skill, /replace the language, framework,\s+architecture, storage, deployment shape, or runtime/i);
  assert.match(skill, /Hybrid or strangler replacement is an execution strategy, not a third product\s+mode/i);
  assert.match(skill, /route a local refactor directly to `scd-quickdev`/i);
  assert.match(skill, /new-product work rather than Reengineering/i);
});

test("reengineering pins provenance and handles license uncertainty safely", () => {
  const skill = read("skills/scd-reengineering/SKILL.md");
  const contract = read(
    "skills/scd-reengineering/references/reengineering-contract.md",
  );

  assert.match(skill, /canonical URL and immutable commit SHA/i);
  assert.match(skill, /Treat an unfamiliar upstream repository as untrusted/i);
  assert.match(skill, /do not provide a legal conclusion/i);
  assert.match(skill, /Do not call work clean-room/i);
  assert.match(contract, /License conclusion: Not provided by Thinloop/i);
  assert.match(contract, /does not determine whether a license\s+permits/i);
  assert.match(contract, /information barriers/i);
});

test("reengineering defines selected compatibility from executable evidence", () => {
  const skill = read("skills/scd-reengineering/SKILL.md");
  const contract = read(
    "skills/scd-reengineering/references/reengineering-contract.md",
  );

  assert.match(skill, /Source inspection alone is not\s+an executable behavior baseline/i);
  assert.match(skill, /`keep`, `change`, `drop`, or `unverified`/i);
  assert.match(skill, /Do not default to full parity/i);
  assert.match(skill, /incidental implementation details and source defects/i);
  assert.match(contract, /\| CAP-001 \|/);
  assert.match(contract, /Every capability ends as `PASS`, `FAIL`,\s+`UNVERIFIED`, or `BLOCKED`/i);
});

test("reengineering composes existing Thinloop authority", () => {
  const skill = read("skills/scd-reengineering/SKILL.md");
  const project = read("skills/scd-project/SKILL.md");
  const quickdev = read("skills/scd-quickdev/SKILL.md");

  assert.match(skill, /use `scd-discovery` before\s+reengineering/i);
  assert.match(skill, /Use `scd-architecture` when/i);
  assert.match(skill, /Use `scd-project` after/i);
  assert.match(skill, /exactly one Delivery Issue through\s+`scd-quickdev`/i);
  assert.match(project, /external consumer/i);
  assert.match(quickdev, /approved Reengineering execution wave/i);
});

test("reengineering executes bounded READY waves without corrupting the DAG", () => {
  const skill = read("skills/scd-reengineering/SKILL.md");
  const execution = read(
    "skills/scd-reengineering/references/execution-contract.md",
  );

  assert.match(skill, /launch separate agents and isolated worktrees/i);
  assert.match(skill, /bounded by available concurrency/i);
  assert.match(skill, /keep dependent or coordination-conflicting nodes serial/i);
  assert.match(skill, /serialize merges/i);
  assert.match(execution, /must not be written into the Project DAG as fake\s+edges/i);
  assert.match(execution, /Merge them one at a time/i);
  assert.match(execution, /stop downstream nodes/i);
  assert.match(execution, /dedicated integration Delivery Issue/i);
});

test("reengineering preserves independent acceptance and high-risk gates", () => {
  const skill = read("skills/scd-reengineering/SKILL.md");
  const execution = read(
    "skills/scd-reengineering/references/execution-contract.md",
  );

  assert.match(skill, /fresh-context acceptance verifier/i);
  assert.match(skill, /does not\s+prove reengineering completion/i);
  assert.match(skill, /production traffic changes, destructive data migration/i);
  assert.match(skill, /Do not infer cutover authority from implementation\s+approval/i);
  assert.match(execution, /independently accepted\s+children do not prove the assembled outcome/i);
  assert.match(execution, /reconstruct execution state/i);
  assert.doesNotMatch(`${skill}\n${execution}`, /\.scd\/reengineering/);
});
