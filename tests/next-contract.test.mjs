import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("Next activates for progress and continuation questions", () => {
  const skill = read("skills/scd-next/SKILL.md");

  assert.match(skill, /what is done, in progress, unfinished/i);
  assert.match(skill, /Issue, pull-request, Initiative, or milestone status/i);
  assert.match(skill, /does not know how to continue or resume/i);
  assert.match(skill, /ordinary Issue-backed repositories/i);
});

test("Next classifies live state without inventing progress", () => {
  const skill = read("skills/scd-next/SKILL.md");
  const contract = read("skills/scd-next/references/status-contract.md");

  for (const state of [
    "DONE",
    "IN_FLIGHT",
    "READY",
    "PLANNED",
    "BLOCKED",
    "UNVERIFIED",
  ]) {
    assert.match(skill, new RegExp(`\\\`${state}\\\``));
    assert.match(contract, new RegExp(`\\\`${state}\\\``));
  }
  assert.match(skill, /Never fabricate effort, time, or\s+percentage completion/i);
  assert.match(contract, /Exact item counts require a complete live scope/i);
  assert.match(contract, /branch, commit, local task file, or implementer\s+summary is never sufficient completion evidence/i);
});

test("Next recommends one owning skill and separates user action", () => {
  const skill = read("skills/scd-next/SKILL.md");
  const contract = read("skills/scd-next/references/status-contract.md");

  assert.match(skill, /Recommend exactly one next action/i);
  assert.match(skill, /priority not established/i);
  assert.match(skill, /User action: <none, or exact decision/);
  assert.match(skill, /Copy-ready continuation:/);
  for (const owner of [
    "scd-execute",
    "scd-quickdev",
    "scd-project",
    "scd-discovery",
    "scd-architecture",
  ]) {
    assert.match(skill, new RegExp(`\\\`${owner}\\\``));
    assert.match(contract, new RegExp(`\\\`${owner}\\\``));
  }
});

test("Next remains a read-only inspection pass", () => {
  const skill = read("skills/scd-next/SKILL.md");
  const contract = read("skills/scd-next/references/status-contract.md");

  assert.match(skill, /proactive read-only inspection pass when invoked/i);
  assert.match(skill, /not a\s+background notifier, daemon, scheduler/i);
  assert.match(skill, /Do not create or update Issues, comments, labels/i);
  assert.match(contract, /must not:/i);
  assert.match(contract, /start a QuickDev lane or Execute wave/i);
  assert.match(contract, /does not grant mutation authority/i);
});

test("Project and Execute route status-only requests to Next", () => {
  const project = read("skills/scd-project/SKILL.md");
  const execute = read("skills/scd-execute/SKILL.md");

  assert.match(project, /status.*`scd-next`|`scd-next`.*status/is);
  assert.match(execute, /request is only to report.*`scd-next`/is);
});
