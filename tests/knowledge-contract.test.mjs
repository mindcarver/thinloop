import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("knowledge is explicit-only and supports capture, retrieval, and maintenance", () => {
  const skill = read("skills/scd-knowledge/SKILL.md");

  assert.match(skill, /Use only when the user explicitly asks/i);
  assert.match(skill, /Do not invoke automatically during ordinary development/i);
  assert.match(skill, /\*\*Capture:\*\*/);
  assert.match(skill, /\*\*Retrieve:\*\*/);
  assert.match(skill, /\*\*Maintain:\*\*/);
});

test("knowledge keeps project and personal Markdown stores separate", () => {
  const skill = read("skills/scd-knowledge/SKILL.md");
  const storage = read(
    "skills/scd-knowledge/references/storage-contract.md",
  );

  assert.match(skill, /\.scd\/knowledge\//);
  assert.match(skill, /<user-home>\/\.scd\/config\.json/);
  assert.match(storage, /"knowledge_root"/);
  assert.match(storage, /Require an absolute path/);
  assert.match(storage, /preserve every unrelated config key/);
  assert.match(storage, /invalid JSON.*do not overwrite/i);
  assert.match(storage, /remains inside the selected project or personal knowledge root/);
  assert.match(storage, /Do not commit a personal absolute path/);
});

test("capture requires evidence, classification, and approval", () => {
  const skill = read("skills/scd-knowledge/SKILL.md");
  const contract = read(
    "skills/scd-knowledge/references/knowledge-contract.md",
  );

  assert.match(skill, /must have supporting evidence/i);
  assert.match(skill, /Explicit human practice is itself an attributable source/);
  assert.match(skill, /Prefer project scope when portability is uncertain/);
  assert.match(skill, /Request one explicit confirmation/);
  assert.match(contract, /One evidence-backed occurrence is sufficient/);
});

test("knowledge stays concise and retrieval uses progressive disclosure", () => {
  const skill = read("skills/scd-knowledge/SKILL.md");
  const entry = read("skills/scd-knowledge/assets/knowledge-entry.md");
  const index = read("skills/scd-knowledge/assets/knowledge-index.md");

  assert.match(skill, /normally no more than three entries/);
  assert.match(skill, /Do not read `archive\/`/);
  assert.match(skill, /prefer the more specific project guidance/);
  assert.match(entry, /- Trigger:/);
  assert.match(entry, /- Guidance:/);
  assert.match(entry, /- Boundary:/);
  assert.match(entry, /- Evidence:/);
  assert.match(entry, /- Source:/);
  assert.match(index, /\]\(entries\/slug\.md\)/);
});

test("knowledge lifecycle avoids silent duplication and conflict", () => {
  const skill = read("skills/scd-knowledge/SKILL.md");
  const contract = read(
    "skills/scd-knowledge/references/knowledge-contract.md",
  );

  assert.match(skill, /\*\*Duplicate:\*\* make no write/);
  assert.match(skill, /\*\*Conflict:\*\*/);
  assert.match(skill, /Require confirmation before every update/);
  assert.match(contract, /move the old file to `archive\/`/);
  assert.match(contract, /Archived entries never participate/);
});

test("knowledge admits only hard-to-discover behavior-relevant experience", () => {
  const skill = read("skills/scd-knowledge/SKILL.md");
  const contract = read(
    "skills/scd-knowledge/references/knowledge-contract.md",
  );

  for (const barrier of ["Semantic", "Location", "Behavioral"]) {
    assert.match(skill, new RegExp(`\\*\\*${barrier}:\\*\\*`));
    assert.match(contract, new RegExp(`\\*\\*${barrier}:\\*\\*`));
  }
  assert.match(skill, /plausibly changes a later agent decision or action/i);
  assert.match(skill, /do not add it as a required persisted field/i);
  assert.match(contract, /generic advice/);
  assert.match(contract, /one-off instructions/);
});

test("knowledge matches evidence to claims and validates repository facts", () => {
  const skill = read("skills/scd-knowledge/SKILL.md");
  const contract = read(
    "skills/scd-knowledge/references/knowledge-contract.md",
  );

  assert.match(skill, /Match evidence to the claim/);
  assert.match(skill, /Verify every named path, symbol, method, command, configuration key, and version/);
  assert.match(skill, /does not by itself prove runtime behavior/);
  assert.match(contract, /focused test or runtime result/);
  assert.match(contract, /existence alone does not prove a runtime or causal claim/);
  assert.match(contract, /stale or false/);
});

test("knowledge protects boundaries during deduplication and updates", () => {
  const skill = read("skills/scd-knowledge/SKILL.md");
  const contract = read(
    "skills/scd-knowledge/references/knowledge-contract.md",
  );

  assert.match(skill, /Never bridge-merge/);
  assert.match(skill, /one uniquely appropriate target/);
  assert.match(contract, /Do not bridge-merge/);
  assert.match(contract, /several historical entries are plausible update targets/);
  assert.match(contract, /preserves the narrowest valid trigger/);
});

test("post-delivery review stays explicit and behavior claims stay causal", () => {
  const skill = read("skills/scd-knowledge/SKILL.md");
  const contract = read(
    "skills/scd-knowledge/references/knowledge-contract.md",
  );

  assert.match(skill, /user explicitly asks to review a completed delivery/);
  assert.match(skill, /never starts automatically and never authorizes a write/);
  assert.match(contract, /governing Issue and acceptance boundary/);
  assert.match(contract, /controlled paired cases/);
  assert.match(contract, /do not by themselves establish causation/);
});

test("knowledge blocks secrets and honest write failures", () => {
  const skill = read("skills/scd-knowledge/SKILL.md");
  const storage = read(
    "skills/scd-knowledge/references/storage-contract.md",
  );

  assert.match(skill, /Never write a credential/);
  assert.match(skill, /must not claim persistence/);
  assert.match(storage, /Do not silently reclassify/);
  assert.match(storage, /entry and index can both be read back/);
  assert.doesNotMatch(skill, /C:\\Users\\/);
  assert.doesNotMatch(skill, /\/Users\/[^<]/);
});

test("the approved knowledge specification retains A1 through A11", () => {
  const specification = read(".scd/specs/scd-knowledge.md");

  assert.match(specification, /status: approved/);
  for (let index = 1; index <= 11; index += 1) {
    assert.match(specification, new RegExp(`^- A${index}:`, "m"));
  }
  for (let index = 12; index <= 15; index += 1) {
    assert.match(specification, new RegExp(`^- A${index}:`, "m"));
  }
});
