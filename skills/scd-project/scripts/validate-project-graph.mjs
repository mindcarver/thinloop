#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CONTRACTS = new Set(["planned", "approved"]);
const DELIVERIES = new Set(["open", "done"]);
const HUMAN_GATES = new Set(["clear", "waiting"]);
const SNAPSHOT_FIELDS = new Set(["schemaVersion", "revision", "nodes"]);
const NODE_FIELDS = new Set([
  "id",
  "issue",
  "contract",
  "delivery",
  "humanGate",
  "dependsOn",
  "blockers",
]);
const KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function fail(message) {
  throw new Error(message);
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function compareStrings(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function requirePositiveInteger(value, label) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    fail(`${label} must be a positive integer`);
  }
}

function requireEnum(value, allowed, label) {
  if (!allowed.has(value)) {
    fail(`${label} must be one of: ${[...allowed].join(", ")}`);
  }
}

function requireStringArray(value, label) {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    fail(`${label} must be an array of strings`);
  }
}

function rejectUnknownFields(value, allowed, label) {
  const unknown = Object.keys(value)
    .filter((key) => !allowed.has(key))
    .sort();
  if (unknown.length > 0) {
    fail(`${label} has unknown field: ${unknown[0]}`);
  }
}

function validateNodeShape(node, index) {
  const label = `nodes[${index}]`;
  if (!isObject(node)) {
    fail(`${label} must be an object`);
  }
  rejectUnknownFields(node, NODE_FIELDS, label);
  if (typeof node.id !== "string" || !KEBAB_CASE.test(node.id)) {
    fail(`${label}.id must be kebab-case`);
  }
  if (node.issue !== null) {
    requirePositiveInteger(node.issue, `${label}.issue`);
  }
  requireEnum(node.contract, CONTRACTS, `${label}.contract`);
  requireEnum(node.delivery, DELIVERIES, `${label}.delivery`);
  requireEnum(node.humanGate, HUMAN_GATES, `${label}.humanGate`);
  requireStringArray(node.dependsOn, `${label}.dependsOn`);
  requireStringArray(node.blockers, `${label}.blockers`);

  if (node.contract === "approved" && node.issue === null) {
    fail(`${label} (${node.id}) is approved and must have an issue`);
  }
  if (node.delivery === "done" && node.contract !== "approved") {
    fail(`${label} (${node.id}) is done and must be approved`);
  }
}

function validateDependencies(nodes, nodesById) {
  for (const [index, node] of nodes.entries()) {
    const seen = new Set();
    for (const dependencyId of node.dependsOn) {
      if (dependencyId === node.id) {
        fail(`nodes[${index}] (${node.id}) must not depend on itself`);
      }
      if (seen.has(dependencyId)) {
        fail(
          `nodes[${index}] (${node.id}) has duplicate dependency: ${dependencyId}`,
        );
      }
      seen.add(dependencyId);
      if (!nodesById.has(dependencyId)) {
        fail(
          `nodes[${index}] (${node.id}) has unknown dependency: ${dependencyId}`,
        );
      }
    }
  }
}

function validateAcyclic(nodes, nodesById) {
  const visiting = new Set();
  const visited = new Set();
  const stack = [];

  function visit(nodeId) {
    if (visited.has(nodeId)) {
      return;
    }
    if (visiting.has(nodeId)) {
      const cycleStart = stack.indexOf(nodeId);
      const cycle = [...stack.slice(cycleStart), nodeId];
      fail(`dependency cycle detected: ${cycle.join(" -> ")}`);
    }

    visiting.add(nodeId);
    stack.push(nodeId);
    const node = nodesById.get(nodeId);
    for (const dependencyId of [...node.dependsOn].sort()) {
      visit(dependencyId);
    }
    stack.pop();
    visiting.delete(nodeId);
    visited.add(nodeId);
  }

  for (const node of [...nodes].sort((left, right) =>
    compareStrings(left.id, right.id),
  )) {
    visit(node.id);
  }
}

function validateCompletionDependencies(nodes, nodesById) {
  for (const [index, node] of nodes.entries()) {
    if (node.delivery !== "done") {
      continue;
    }
    for (const dependencyId of [...node.dependsOn].sort()) {
      if (nodesById.get(dependencyId).delivery !== "done") {
        fail(
          `nodes[${index}] (${node.id}) is done but dependency is not done: ${dependencyId}`,
        );
      }
    }
  }
}

function deriveNode(node, nodesById) {
  if (node.delivery === "done") {
    return {
      id: node.id,
      issue: node.issue,
      state: "DONE",
      reasons: [],
    };
  }
  if (node.contract === "planned") {
    return {
      id: node.id,
      issue: node.issue,
      state: "PLANNED",
      reasons: [],
    };
  }

  const reasons = [];
  if (node.humanGate === "waiting") {
    reasons.push("human gate waiting");
  }
  for (const blocker of [...node.blockers].sort()) {
    reasons.push(`blocker: ${blocker}`);
  }
  for (const dependencyId of [...node.dependsOn].sort()) {
    if (nodesById.get(dependencyId).delivery !== "done") {
      reasons.push(`dependency not done: ${dependencyId}`);
    }
  }

  return {
    id: node.id,
    issue: node.issue,
    state: reasons.length === 0 ? "READY" : "BLOCKED",
    reasons,
  };
}

export function validateProjectGraph(snapshot) {
  if (!isObject(snapshot)) {
    fail("snapshot must be an object");
  }
  rejectUnknownFields(snapshot, SNAPSHOT_FIELDS, "snapshot");
  if (snapshot.schemaVersion !== 1) {
    fail("schemaVersion must be 1");
  }
  requirePositiveInteger(snapshot.revision, "revision");
  if (!Array.isArray(snapshot.nodes) || snapshot.nodes.length === 0) {
    fail("nodes must be a non-empty array");
  }

  const nodesById = new Map();
  for (const [index, node] of snapshot.nodes.entries()) {
    validateNodeShape(node, index);
    if (nodesById.has(node.id)) {
      fail(`duplicate node id: ${node.id}`);
    }
    nodesById.set(node.id, node);
  }

  validateDependencies(snapshot.nodes, nodesById);
  validateAcyclic(snapshot.nodes, nodesById);
  validateCompletionDependencies(snapshot.nodes, nodesById);

  const nodes = snapshot.nodes
    .map((node) => deriveNode(node, nodesById))
    .sort((left, right) => compareStrings(left.id, right.id));

  return {
    valid: true,
    revision: snapshot.revision,
    nodes,
    ready: nodes
      .filter((node) => node.state === "READY")
      .map((node) => node.id),
  };
}

export function parseProjectGraph(source) {
  if (typeof source !== "string") {
    fail("input must be a JSON string");
  }
  let snapshot;
  try {
    snapshot = JSON.parse(source);
  } catch {
    fail("input is not valid JSON");
  }
  return validateProjectGraph(snapshot);
}

function parseArgs(argv) {
  if (argv.length === 0) {
    return {};
  }
  if (
    argv.length === 2 &&
    argv[0] === "--file" &&
    argv[1] &&
    !argv[1].startsWith("--")
  ) {
    return { file: argv[1] };
  }
  if (argv[0] === "--file") {
    fail("--file requires exactly one path");
  }
  fail(`unknown argument: ${argv[0]}`);
}

function readInput(options) {
  if (!options.file) {
    return fs.readFileSync(0, "utf8");
  }
  const filePath = path.resolve(options.file);
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    fail(`cannot read file: ${filePath}`);
  }
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  try {
    const options = parseArgs(process.argv.slice(2));
    const result = parseProjectGraph(readInput(options));
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`scd-project: ${error.message}\n`);
    process.exitCode = 1;
  }
}
