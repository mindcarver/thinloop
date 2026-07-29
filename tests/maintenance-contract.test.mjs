import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  collectSignals,
  formatText,
} from "../skills/scd-maintenance/scripts/collect-signals.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("maintenance is explicitly invoked and supports audit and repair", () => {
  const skill = read("skills/scd-maintenance/SKILL.md");

  assert.match(skill, /Use when the user explicitly asks/i);
  assert.match(skill, /Do not invoke automatically during ordinary feature work/i);
  assert.match(skill, /\*\*Audit:\*\*/);
  assert.match(skill, /\*\*Repair:\*\*/);
  assert.match(skill, /\*\*Focused:\*\*/);
  assert.match(skill, /first batch of no more\s+than three findings/i);
  assert.match(skill, /Use `scd-reengineering` instead/i);
  assert.match(skill, /does not own\s+the reengineering direction or execution graph/i);
});

test("maintenance resolves authority instead of assuming code is correct", () => {
  const skill = read("skills/scd-maintenance/SKILL.md");
  const audit = read("skills/scd-maintenance/references/audit-contract.md");

  assert.match(skill, /Never infer that code is automatically correct/i);
  assert.match(audit, /\*\*Normative contract:\*\*/);
  assert.match(audit, /\*\*Executable behavior:\*\*/);
  assert.match(audit, /\*\*Descriptive material:\*\*/);
  assert.match(audit, /newer or executable artifact is not automatically authoritative/i);
});

test("maintenance findings require evidence and avoid speculative cleanup", () => {
  const skill = read("skills/scd-maintenance/SKILL.md");
  const audit = read("skills/scd-maintenance/references/audit-contract.md");

  assert.match(skill, /exact file, line, symbol, command, or runtime evidence/);
  assert.match(skill, /Separate confirmed debt from investigation leads/);
  assert.match(skill, /Do not report style\s+preferences/);
  assert.match(audit, /File age, commit age, model opinion/);
  assert.match(audit, /Never hide a partial scan/);
});

test("maintenance repairs are bounded, coupled, and verified", () => {
  const skill = read("skills/scd-maintenance/SKILL.md");
  const repair = read("skills/scd-maintenance/references/repair-contract.md");

  assert.match(skill, /hand the bounded change to `scd-quickdev`/);
  assert.match(skill, /Do not stage, commit, push, publish, deploy/);
  assert.match(repair, /repair at most three/);
  assert.match(repair, /Text search alone does not prove/);
  assert.match(repair, /update every directly coupled surface/);
  assert.match(repair, /Map each finding identifier to observed evidence/);
});

test("maintenance report template preserves evidence and blind spots", () => {
  const report = read("skills/scd-maintenance/assets/maintenance-report.md");

  assert.match(report, /managed_by: scd-maintenance/);
  assert.match(report, /## Checks run/);
  assert.match(report, /## Confirmed findings/);
  assert.match(report, /## Investigation leads/);
  assert.match(report, /## Blind spots/);
});

test("collector finds deterministic drift and keeps valid references quiet", () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "scd-maintenance-"));

  try {
    fs.mkdirSync(path.join(fixture, "docs"), { recursive: true });
    fs.mkdirSync(path.join(fixture, "src"), { recursive: true });
    fs.writeFileSync(
      path.join(fixture, "package.json"),
      JSON.stringify({ scripts: { build: "node build.mjs" } }),
    );
    fs.writeFileSync(path.join(fixture, "docs", "existing.md"), "# Existing\n");
    fs.writeFileSync(
      path.join(fixture, "README.md"),
      [
        "[valid](./docs/existing.md)",
        "[missing](./docs/removed.md)",
        "```markdown",
        "[template](./docs/template-placeholder.md)",
        "```",
        "```bash",
        "npm run build",
        "npm run vanished",
        "```",
        "",
      ].join("\n"),
    );
    fs.writeFileSync(
      path.join(fixture, "src", "index.js"),
      "// TODO: remove compatibility shim after v2\n",
    );

    const result = collectSignals(fixture);
    const messages = result.findings.map((finding) => finding.message);

    assert.ok(messages.some((message) => message.includes("removed.md")));
    assert.ok(messages.some((message) => message.includes("vanished")));
    assert.ok(messages.some((message) => message.includes("compatibility shim")));
    assert.ok(!messages.some((message) => message.includes("existing.md")));
    assert.ok(!messages.some((message) => message.includes("template-placeholder.md")));
    assert.ok(!messages.some((message) => message.endsWith(": build")));
    assert.match(formatText(result), /Repository maintenance signals/);
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});
