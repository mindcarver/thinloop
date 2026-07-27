#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { resolveSourceRoot } from "./resolve-source-root.mjs";

const statuses = new Set([
  "proposed",
  "trial",
  "accepted",
  "rejected",
  "reverted",
  "trial-unverified",
]);
const terminalStatuses = new Set([
  "accepted",
  "rejected",
  "reverted",
  "trial-unverified",
]);
const levels = new Set(["exploratory", "supported", "confirmed"]);
const coverageLabels = new Set([
  "full-transcript",
  "visible-context",
  "partial",
]);
const attributionClasses = new Set([
  "thinloop-skill",
  "agent",
  "requirements",
  "tool-environment",
  "model-limit",
  "third-party-skill",
  "insufficient-evidence",
]);
const changeKinds = new Set([
  "instruction",
  "trigger",
  "workflow",
  "script",
  "format",
  "packaging",
  "documentation",
]);
const evidenceTypes = new Set([
  "conversation",
  "tool-output",
  "git",
  "test",
  "user-correction",
  "isolated-replay",
]);
const validationKinds = new Set([
  "independent-session",
  "deterministic",
  "mixed",
  "unavailable",
]);
const validationResults = new Set(["pass", "fail", "unverified"]);
const operationActions = new Set(["add", "delete", "replace"]);
const transitions = new Map([
  ["proposed", new Set(["trial", "rejected"])],
  [
    "trial",
    new Set(["accepted", "rejected", "reverted", "trial-unverified"]),
  ],
]);

function fail(message) {
  throw new Error(message);
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requireObject(value, label) {
  if (!isObject(value)) {
    fail(`${label} must be an object`);
  }
}

function requireExactKeys(value, required, label) {
  requireObject(value, label);
  const actual = Object.keys(value).sort();
  const expected = [...required].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    fail(`${label} must contain exactly: ${expected.join(", ")}`);
  }
}

function requireString(value, label, { max = 500, pattern } = {}) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > max ||
    value.includes("\n") ||
    (pattern && !pattern.test(value))
  ) {
    fail(`${label} is invalid`);
  }
}

function requireEnum(value, allowed, label) {
  if (!allowed.has(value)) {
    fail(`${label} is invalid`);
  }
}

function requireStringArray(
  value,
  label,
  { min = 0, max = Number.POSITIVE_INFINITY, allowed, pattern } = {},
) {
  if (!Array.isArray(value) || value.length < min || value.length > max) {
    fail(`${label} is invalid`);
  }
  const seen = new Set();
  for (const [index, entry] of value.entries()) {
    requireString(entry, `${label}[${index}]`, { max: 300, pattern });
    if (allowed) {
      requireEnum(entry, allowed, `${label}[${index}]`);
    }
    if (seen.has(entry)) {
      fail(`${label} must not contain duplicates`);
    }
    seen.add(entry);
  }
}

function scanPrivacy(value, keyPath = "$") {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => scanPrivacy(entry, `${keyPath}[${index}]`));
    return;
  }
  if (isObject(value)) {
    for (const [key, entry] of Object.entries(value)) {
      if (
        /^(?:project|project_name|consumer_project|repository|branch|source_root|absolute_path|transcript|raw(?:_.*)?|prompt|log|code|snippet|user_data|personal_data)$/i.test(
          key,
        )
      ) {
        fail(`${keyPath}.${key} is a prohibited persisted field`);
      }
      scanPrivacy(entry, `${keyPath}.${key}`);
    }
    return;
  }
  if (typeof value !== "string") {
    return;
  }

  const forbidden = [
    { pattern: /```/, name: "code fence" },
    {
      pattern: /(?:^|[\s("'`])\/[A-Za-z0-9._-]+(?:\/[^\s"'`]*)?/,
      name: "absolute path",
    },
    { pattern: /(?:^|[\s("'`])[A-Za-z]:[\\/]/, name: "absolute path" },
    { pattern: /(?:^|[\s("'`])\\\\[^\\\s]+\\/, name: "UNC path" },
    {
      pattern:
        /(?:sk-[A-Za-z0-9_-]{10,}|ghp_[A-Za-z0-9]{10,}|AKIA[A-Z0-9]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|Bearer\s+[A-Za-z0-9._-]{10,})/,
      name: "credential-like value",
    },
  ];
  for (const rule of forbidden) {
    if (rule.pattern.test(value)) {
      fail(`${keyPath} contains a prohibited ${rule.name}`);
    }
  }
}

function parseSemver(value, label) {
  requireString(value, label, {
    max: 40,
    pattern: /^[0-9]+\.[0-9]+\.[0-9]+$/,
  });
  return value.split(".").map(Number);
}

function validateRecord(record) {
  const required = [
    "schema_version",
    "event_id",
    "candidate_id",
    "run_id",
    "recorded_at",
    "status",
    "previous_status",
    "target_skills",
    "candidate_level",
    "coverage",
    "root_cause",
    "coupling_rationale",
    "change_kinds",
    "attribution",
    "matched_signals",
    "unmatched_signals",
    "evidence",
    "operations",
    "validation",
    "versions",
    "self_evolution",
  ];
  requireExactKeys(record, required, "record");
  scanPrivacy(record);

  if (record.schema_version !== "1.0") {
    fail('schema_version must be "1.0"');
  }
  requireString(record.event_id, "event_id", {
    max: 68,
    pattern: /^EVE-[A-Za-z0-9][A-Za-z0-9._-]{2,63}$/,
  });
  requireString(record.candidate_id, "candidate_id", {
    max: 68,
    pattern: /^EVO-[A-Za-z0-9][A-Za-z0-9._-]{2,63}$/,
  });
  requireString(record.run_id, "run_id", {
    max: 68,
    pattern: /^RUN-[A-Za-z0-9][A-Za-z0-9._-]{2,63}$/,
  });
  requireString(record.recorded_at, "recorded_at", { max: 40 });
  if (
    !/T/.test(record.recorded_at) ||
    !/(?:Z|[+-][0-9]{2}:[0-9]{2})$/.test(record.recorded_at) ||
    Number.isNaN(Date.parse(record.recorded_at))
  ) {
    fail("recorded_at must be an ISO-8601 date-time with timezone");
  }
  requireEnum(record.status, statuses, "status");
  if (record.previous_status !== null) {
    requireEnum(record.previous_status, statuses, "previous_status");
  }
  requireStringArray(record.target_skills, "target_skills", {
    min: 1,
    pattern: /^scd-[a-z0-9]+(?:-[a-z0-9]+)*$/,
  });
  requireEnum(record.candidate_level, levels, "candidate_level");
  requireEnum(record.coverage, coverageLabels, "coverage");
  requireString(record.root_cause, "root_cause", { max: 300 });
  if (record.coupling_rationale !== null) {
    requireString(record.coupling_rationale, "coupling_rationale", { max: 300 });
  }
  if (record.target_skills.length > 1 && record.coupling_rationale === null) {
    fail("multiple target skills require coupling_rationale");
  }
  requireStringArray(record.change_kinds, "change_kinds", {
    min: 1,
    allowed: changeKinds,
  });

  requireExactKeys(
    record.attribution,
    ["primary", "rationale", "possible_misattribution"],
    "attribution",
  );
  requireEnum(
    record.attribution.primary,
    attributionClasses,
    "attribution.primary",
  );
  requireString(record.attribution.rationale, "attribution.rationale");
  requireString(
    record.attribution.possible_misattribution,
    "attribution.possible_misattribution",
  );
  requireStringArray(record.matched_signals, "matched_signals", { min: 1 });
  requireStringArray(record.unmatched_signals, "unmatched_signals");

  requireExactKeys(
    record.evidence,
    ["types", "summary", "fingerprint", "evidence_redacted"],
    "evidence",
  );
  requireStringArray(record.evidence.types, "evidence.types", {
    min: 1,
    allowed: evidenceTypes,
  });
  requireString(record.evidence.summary, "evidence.summary");
  requireString(record.evidence.fingerprint, "evidence.fingerprint", {
    max: 71,
    pattern: /^sha256:[a-f0-9]{64}$/,
  });
  if (typeof record.evidence.evidence_redacted !== "boolean") {
    fail("evidence.evidence_redacted must be boolean");
  }

  if (
    !Array.isArray(record.operations) ||
    record.operations.length === 0 ||
    record.operations.length > 20
  ) {
    fail("operations must contain 1 to 20 entries");
  }
  for (const [index, operation] of record.operations.entries()) {
    const label = `operations[${index}]`;
    requireExactKeys(operation, ["action", "path", "summary"], label);
    requireEnum(operation.action, operationActions, `${label}.action`);
    requireString(operation.path, `${label}.path`, { max: 240 });
    if (
      path.isAbsolute(operation.path) ||
      /^[A-Za-z]:[\\/]/.test(operation.path) ||
      operation.path.split(/[\\/]+/).includes("..")
    ) {
      fail(`${label}.path must be repository-relative without traversal`);
    }
    requireString(operation.summary, `${label}.summary`, { max: 300 });
  }

  requireExactKeys(record.validation, ["kind", "checks"], "validation");
  requireEnum(record.validation.kind, validationKinds, "validation.kind");
  if (!Array.isArray(record.validation.checks)) {
    fail("validation.checks must be an array");
  }
  for (const [index, check] of record.validation.checks.entries()) {
    const label = `validation.checks[${index}]`;
    requireExactKeys(check, ["name", "result", "evidence"], label);
    requireString(check.name, `${label}.name`, { max: 200 });
    requireEnum(check.result, validationResults, `${label}.result`);
    requireString(check.evidence, `${label}.evidence`, { max: 300 });
  }

  requireExactKeys(record.versions, ["before", "after"], "versions");
  if (record.versions.before !== null) {
    parseSemver(record.versions.before, "versions.before");
  }
  if (record.versions.after !== null) {
    parseSemver(record.versions.after, "versions.after");
  }

  requireExactKeys(
    record.self_evolution,
    ["is_self_evolution", "source_run_id"],
    "self_evolution",
  );
  if (typeof record.self_evolution.is_self_evolution !== "boolean") {
    fail("self_evolution.is_self_evolution must be boolean");
  }
  if (record.self_evolution.source_run_id !== null) {
    requireString(
      record.self_evolution.source_run_id,
      "self_evolution.source_run_id",
      {
        max: 68,
        pattern: /^RUN-[A-Za-z0-9][A-Za-z0-9._-]{2,63}$/,
      },
    );
  }
  if (
    record.self_evolution.is_self_evolution &&
    record.self_evolution.source_run_id === null
  ) {
    fail("self-evolution requires source_run_id");
  }
  if (
    !record.self_evolution.is_self_evolution &&
    record.self_evolution.source_run_id !== null
  ) {
    fail("non-self-evolution must not declare source_run_id");
  }

  if (record.status === "proposed" && record.previous_status !== null) {
    fail("proposed must have previous_status null");
  }
  if (record.status !== "proposed" && record.previous_status === null) {
    fail(`${record.status} must declare previous_status`);
  }

  if (record.status === "accepted") {
    if (record.attribution.primary !== "thinloop-skill") {
      fail("accepted candidate must attribute the cause to a Thinloop skill");
    }
    if (
      !["independent-session", "deterministic", "mixed"].includes(
        record.validation.kind,
      ) ||
      record.validation.checks.length === 0 ||
      record.validation.checks.some((check) => check.result !== "pass")
    ) {
      fail("accepted candidate requires every recorded validation check to pass");
    }
    const behaviorChange = record.change_kinds.some((kind) =>
      ["instruction", "trigger", "workflow"].includes(kind),
    );
    if (
      behaviorChange &&
      !["independent-session", "mixed"].includes(record.validation.kind)
    ) {
      fail("accepted behavior change requires independent-session validation");
    }
    const before = parseSemver(record.versions.before, "versions.before");
    const after = parseSemver(record.versions.after, "versions.after");
    if (
      before[0] !== after[0] ||
      before[1] !== after[1] ||
      before[2] + 1 !== after[2]
    ) {
      fail("accepted candidate must increment exactly one patch version");
    }
  }
}

export function parseHistory(source) {
  if (source.trim() === "") {
    return [];
  }
  return source
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "")
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        fail(`history line ${index + 1} is invalid JSON: ${error.message}`);
      }
    });
}

export function validateHistory(records) {
  const eventIds = new Set();
  const latestByCandidate = new Map();
  const terminalRuns = new Set();

  for (const [index, record] of records.entries()) {
    try {
      validateRecord(record);
    } catch (error) {
      fail(`history line ${index + 1}: ${error.message}`);
    }
    if (eventIds.has(record.event_id)) {
      fail(`history line ${index + 1}: duplicate event_id ${record.event_id}`);
    }
    eventIds.add(record.event_id);

    const previous = latestByCandidate.get(record.candidate_id);
    if (!previous) {
      if (record.status !== "proposed" || record.previous_status !== null) {
        fail(`history line ${index + 1}: candidate must start at proposed`);
      }
    } else {
      if (terminalStatuses.has(previous.status)) {
        fail(`history line ${index + 1}: terminal candidate cannot transition`);
      }
      if (
        record.run_id !== previous.run_id ||
        JSON.stringify(record.target_skills) !==
          JSON.stringify(previous.target_skills) ||
        JSON.stringify(record.operations) !== JSON.stringify(previous.operations)
      ) {
        fail(`history line ${index + 1}: candidate identity changed`);
      }
      if (
        record.previous_status !== previous.status ||
        !transitions.get(previous.status)?.has(record.status)
      ) {
        fail(
          `history line ${index + 1}: invalid transition ${previous.status} -> ${record.status}`,
        );
      }
    }

    if (record.self_evolution.is_self_evolution) {
      const sourceRun = record.self_evolution.source_run_id;
      if (sourceRun === record.run_id || !terminalRuns.has(sourceRun)) {
        fail(
          `history line ${index + 1}: self-evolution requires a prior independent terminal run`,
        );
      }
    }

    latestByCandidate.set(record.candidate_id, record);
    if (terminalStatuses.has(record.status)) {
      terminalRuns.add(record.run_id);
    }
  }

  return records;
}

export function readHistory(historyPath) {
  if (!fs.existsSync(historyPath)) {
    return [];
  }
  return validateHistory(parseHistory(fs.readFileSync(historyPath, "utf8")));
}

export function appendHistory(historyPath, record) {
  const absoluteHistory = path.resolve(historyPath);
  const directory = path.dirname(absoluteHistory);
  fs.mkdirSync(directory, { recursive: true });
  const lockPath = `${absoluteHistory}.lock`;
  const temporaryPath = `${absoluteHistory}.${process.pid}.tmp`;
  let lock;
  let ownsLock = false;

  try {
    lock = fs.openSync(lockPath, "wx");
    ownsLock = true;
    const records = readHistory(absoluteHistory);
    validateHistory([...records, record]);
    const serialized = `${[...records, record]
      .map((entry) => JSON.stringify(entry))
      .join("\n")}\n`;
    const output = fs.openSync(temporaryPath, "wx");
    try {
      fs.writeFileSync(output, serialized, "utf8");
      fs.fsyncSync(output);
    } finally {
      fs.closeSync(output);
    }
    fs.renameSync(temporaryPath, absoluteHistory);
    return records.length + 1;
  } finally {
    if (lock !== undefined) {
      fs.closeSync(lock);
    }
    if (fs.existsSync(temporaryPath)) {
      fs.unlinkSync(temporaryPath);
    }
    if (ownsLock && fs.existsSync(lockPath)) {
      fs.unlinkSync(lockPath);
    }
  }
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  if (!["validate", "append"].includes(command)) {
    fail(
      "usage: evolution-history.mjs validate --history <path> | append [--root <path> | --config <path>] --record <path>",
    );
  }
  const options = { command };
  for (let index = 0; index < rest.length; index += 1) {
    const argument = rest[index];
    if (
      argument === "--history" ||
      argument === "--record" ||
      argument === "--root" ||
      argument === "--config"
    ) {
      const value = rest[index + 1];
      if (!value || value.startsWith("--")) {
        fail(`${argument} requires a value`);
      }
      options[argument.slice(2)] = value;
      index += 1;
      continue;
    }
    fail(`unknown argument: ${argument}`);
  }
  if (command === "validate" && !options.history) {
    fail("--history is required for validate");
  }
  if (command === "append" && !options.record) {
    fail("--record is required for append");
  }
  if (command === "append" && options.history) {
    fail("append derives history from authoritative --root or SCD config");
  }
  return options;
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.command === "validate") {
      const records = readHistory(path.resolve(options.history));
      process.stdout.write(`valid evolution history: ${records.length} event(s)\n`);
    } else {
      const source = fs.readFileSync(path.resolve(options.record), "utf8");
      const record = JSON.parse(source);
      const sourceRoot = resolveSourceRoot({
        override: options.root,
        configPath: options.config,
      });
      const count = appendHistory(
        path.join(sourceRoot, ".scd", "evolution", "history.jsonl"),
        record,
      );
      process.stdout.write(`appended evolution event: ${count} total\n`);
    }
  } catch (error) {
    process.stderr.write(`scd-evolve: ${error.message}\n`);
    process.exitCode = 1;
  }
}
