import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  appendHistory,
  readHistory,
  validateHistory,
} from "../skills/scd-evolve/scripts/evolution-history.mjs";
import { resolveSourceRoot } from "../skills/scd-evolve/scripts/resolve-source-root.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function event({
  eventId,
  candidateId = "EVO-routing-test",
  runId = "RUN-routing-test",
  status = "proposed",
  previousStatus = null,
  targetSkills = ["scd-discovery"],
  changeKinds = ["trigger"],
  validationKind = "unavailable",
  checks = [],
  before = "0.6.0",
  after = null,
  selfEvolution = false,
  sourceRunId = null,
  evidenceSummary = "Observed trigger guidance did not route the explicit request.",
} = {}) {
  return {
    schema_version: "1.0",
    event_id: eventId,
    candidate_id: candidateId,
    run_id: runId,
    recorded_at: "2026-07-27T15:30:00+08:00",
    status,
    previous_status: previousStatus,
    target_skills: targetSkills,
    candidate_level: "supported",
    coverage: "visible-context",
    root_cause: "Trigger wording does not name the observed explicit request.",
    coupling_rationale: targetSkills.length > 1 ? "Both instructions define one route." : null,
    change_kinds: changeKinds,
    attribution: {
      primary: "thinloop-skill",
      rationale: "The documented trigger excludes the observed request wording.",
      possible_misattribution: "The agent may have ignored otherwise sufficient routing guidance.",
    },
    matched_signals: ["The documented trigger matched but the skill was not invoked."],
    unmatched_signals: ["No isolated replay was available during diagnosis."],
    evidence: {
      types: ["conversation", "user-correction"],
      summary: evidenceSummary,
      fingerprint: `sha256:${"a".repeat(64)}`,
      evidence_redacted: true,
    },
    operations: [
      {
        action: "replace",
        path: "skills/scd-discovery/SKILL.md",
        summary: "Name the explicit request in the trigger description.",
      },
    ],
    validation: {
      kind: validationKind,
      checks,
    },
    versions: {
      before,
      after,
    },
    self_evolution: {
      is_self_evolution: selfEvolution,
      source_run_id: sourceRunId,
    },
  };
}

test("evolve is explicit-only and diagnosis is read-only before candidate-ID approval", () => {
  const skill = read("skills/scd-evolve/SKILL.md");
  const diagnosis = read("skills/scd-evolve/references/diagnosis-contract.md");
  const trial = read("skills/scd-evolve/references/trial-contract.md");

  assert.match(skill, /Use only when the user explicitly invokes/i);
  assert.match(skill, /Do not invoke automatically during ordinary development/i);
  assert.match(skill, /Do not search platform session stores or logs/i);
  assert.match(skill, /Make no repository write, including history, before approval/i);
  assert.match(trial, /user explicitly approves its stable candidate ID/i);
  assert.match(trial, /Generic agreement without the candidate ID is insufficient/i);
  assert.match(diagnosis, /full-transcript/);
  assert.match(diagnosis, /visible-context/);
  assert.match(diagnosis, /partial/);
});

test("evolve limits attribution and one candidate to Thinloop skills actually used", () => {
  const skill = read("skills/scd-evolve/SKILL.md");
  const diagnosis = read("skills/scd-evolve/references/diagnosis-contract.md");
  const candidate = read("skills/scd-evolve/assets/evolution-candidate.md");

  assert.match(skill, /skills demonstrably used in the interaction/i);
  assert.match(skill, /at most one same-root-cause batch/i);
  assert.match(skill, /Multiple Thinloop targets require an explicit coupling rationale/i);
  assert.match(diagnosis, /A Thinloop skill is editable only when/i);
  assert.match(diagnosis, /One signal may support a candidate/i);
  assert.match(diagnosis, /exploratory/);
  assert.match(diagnosis, /supported/);
  assert.match(diagnosis, /confirmed/);
  assert.match(candidate, /Matched signals/);
  assert.match(candidate, /Unmatched signals/);
  assert.match(candidate, /Possible misattribution/);
  assert.match(candidate, /`add`/);
  assert.match(candidate, /`delete`/);
  assert.match(candidate, /`replace`/);
});

test("source resolver accepts only configured Thinloop Git source and rejects caches", () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "scd-evolve-source-"));
  const source = path.join(fixture, "thinloop-source");
  const config = path.join(fixture, "config.json");

  try {
    fs.mkdirSync(path.join(source, ".git"), { recursive: true });
    fs.mkdirSync(path.join(source, ".codex-plugin"), { recursive: true });
    fs.mkdirSync(path.join(source, "skills", "scd-evolve"), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(source, ".codex-plugin", "plugin.json"),
      JSON.stringify({ name: "thinloop" }),
    );
    fs.writeFileSync(path.join(source, "skills", "scd-evolve", "SKILL.md"), "# Skill\n");
    fs.writeFileSync(
      config,
      JSON.stringify({ unrelated: true, thinloop_source_root: source }),
    );

    assert.equal(resolveSourceRoot({ configPath: config }), fs.realpathSync(source));
    assert.equal(resolveSourceRoot({ override: source }), fs.realpathSync(source));
    assert.throws(
      () => resolveSourceRoot({ override: "relative/thinloop" }),
      /absolute path/,
    );
    assert.throws(
      () =>
        resolveSourceRoot({
          override: path.join(fixture, "plugins", "cache", "thinloop"),
        }),
      /plugins\/cache/,
    );

    const recordPath = path.join(fixture, "sanitized-record.json");
    fs.writeFileSync(
      recordPath,
      JSON.stringify(event({ eventId: "EVE-cli-proposed" })),
    );
    const appendResult = spawnSync(
      process.execPath,
      [
        path.join(
          root,
          "skills",
          "scd-evolve",
          "scripts",
          "evolution-history.mjs",
        ),
        "append",
        "--root",
        source,
        "--record",
        recordPath,
      ],
      { encoding: "utf8" },
    );
    assert.equal(appendResult.status, 0, appendResult.stderr);
    assert.match(appendResult.stdout, /1 total/);
    assert.equal(
      readHistory(
        path.join(source, ".scd", "evolution", "history.jsonl"),
      ).length,
      1,
    );
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});

test("history CLI refuses an arbitrary append destination", () => {
  const result = spawnSync(
    process.execPath,
    [
      path.join(
        root,
        "skills",
        "scd-evolve",
        "scripts",
        "evolution-history.mjs",
      ),
      "append",
      "--history",
      path.join(os.tmpdir(), "not-authoritative-history.jsonl"),
      "--record",
      path.join(os.tmpdir(), "not-used-record.json"),
    ],
    { encoding: "utf8" },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    result.stderr,
    /derives history from authoritative --root or SCD config/,
  );
});

test("history appends a valid lifecycle and enforces accepted behavior evidence", () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "scd-evolve-history-"));
  const history = path.join(fixture, ".scd", "evolution", "history.jsonl");
  const proposed = event({ eventId: "EVE-routing-proposed" });
  const trial = event({
    eventId: "EVE-routing-trial",
    status: "trial",
    previousStatus: "proposed",
    validationKind: "mixed",
  });
  const accepted = event({
    eventId: "EVE-routing-accepted",
    status: "accepted",
    previousStatus: "trial",
    validationKind: "mixed",
    checks: [
      {
        name: "fresh isolated routing case",
        result: "pass",
        evidence: "Fresh session selected the intended skill and stopped at proposal.",
      },
    ],
    after: "0.6.1",
  });

  try {
    assert.equal(appendHistory(history, proposed), 1);
    assert.equal(appendHistory(history, trial), 2);
    assert.equal(appendHistory(history, accepted), 3);
    assert.deepEqual(
      readHistory(history).map((entry) => entry.status),
      ["proposed", "trial", "accepted"],
    );

    const invalid = event({
      eventId: "EVE-invalid-accepted",
      candidateId: "EVO-invalid",
      status: "accepted",
      previousStatus: "trial",
      validationKind: "deterministic",
      checks: [
        {
          name: "static test",
          result: "pass",
          evidence: "Only a static test ran.",
        },
      ],
      after: "0.6.1",
    });
    assert.throws(
      () => validateHistory([invalid]),
      /candidate must start at proposed|independent-session/,
    );

    const mixedOutcome = {
      ...accepted,
      event_id: "EVE-routing-mixed-outcome",
      validation: {
        kind: "mixed",
        checks: [
          ...accepted.validation.checks,
          {
            name: "regression case",
            result: "fail",
            evidence: "A coupled routing case regressed.",
          },
        ],
      },
    };
    assert.throws(
      () => validateHistory([proposed, trial, mixedOutcome]),
      /every recorded validation check to pass/,
    );
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});

test("history rejects prohibited evidence without changing the existing stream", () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "scd-evolve-privacy-"));
  const history = path.join(fixture, "history.jsonl");
  const proposed = event({ eventId: "EVE-privacy-proposed" });

  try {
    appendHistory(history, proposed);
    const before = fs.readFileSync(history, "utf8");
    const leaked = event({
      eventId: "EVE-leaked-proposed",
      candidateId: "EVO-leaked",
      runId: "RUN-leaked",
      evidenceSummary: "Evidence came from /private/consumer/repository.",
    });

    assert.throws(
      () => appendHistory(history, leaked),
      /prohibited absolute path/,
    );
    assert.equal(fs.readFileSync(history, "utf8"), before);
    assert.equal(fs.existsSync(`${history}.lock`), false);
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});

test("self-evolution requires a prior independent terminal run", () => {
  const priorProposed = event({
    eventId: "EVE-prior-proposed",
    candidateId: "EVO-prior",
    runId: "RUN-prior",
    changeKinds: ["script"],
  });
  const priorTrial = event({
    eventId: "EVE-prior-trial",
    candidateId: "EVO-prior",
    runId: "RUN-prior",
    status: "trial",
    previousStatus: "proposed",
    changeKinds: ["script"],
    validationKind: "deterministic",
  });
  const priorAccepted = event({
    eventId: "EVE-prior-accepted",
    candidateId: "EVO-prior",
    runId: "RUN-prior",
    status: "accepted",
    previousStatus: "trial",
    changeKinds: ["script"],
    validationKind: "deterministic",
    checks: [
      {
        name: "history script test",
        result: "pass",
        evidence: "Deterministic lifecycle checks passed.",
      },
    ],
    after: "0.6.1",
  });
  const selfProposed = event({
    eventId: "EVE-self-proposed",
    candidateId: "EVO-self",
    runId: "RUN-self",
    targetSkills: ["scd-evolve"],
    selfEvolution: true,
    sourceRunId: "RUN-prior",
  });

  assert.doesNotThrow(() =>
    validateHistory([priorProposed, priorTrial, priorAccepted, selfProposed]),
  );
  assert.throws(
    () =>
      validateHistory([
        event({
          eventId: "EVE-self-invalid",
          candidateId: "EVO-self-invalid",
          runId: "RUN-self-invalid",
          targetSkills: ["scd-evolve"],
          selfEvolution: true,
          sourceRunId: "RUN-self-invalid",
        }),
      ]),
    /prior independent terminal run/,
  );
});

test("approved evolve specification retains A1 through A13 and shared schema fields", () => {
  const specification = read(".scd/specs/scd-evolve.md");
  const design = read(".scd/designs/scd-evolve.md");
  const schema = JSON.parse(read("contracts/evolution-history.schema.json"));

  assert.match(specification, /status: approved/);
  assert.match(design, /status: ready/);
  for (let index = 1; index <= 13; index += 1) {
    assert.match(specification, new RegExp(`^- A${index}:`, "m"));
  }
  assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
  for (const field of [
    "coverage",
    "candidate_level",
    "change_kinds",
    "operations",
    "validation",
    "self_evolution",
  ]) {
    assert.ok(schema.required.includes(field));
  }
});
