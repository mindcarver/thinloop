#!/usr/bin/env node

import fs from "node:fs";
import { pathToFileURL } from "node:url";

const RECEIPT_FIELDS = new Set([
  "schemaVersion",
  "phase",
  "initiative",
  "graphRevision",
  "trackerVerified",
  "graphValidated",
  "directionApproval",
  "graphApproval",
  "requiredSkills",
  "deliveryIssues",
  "readyWave",
  "blockers",
]);
const INITIATIVE_FIELDS = new Set(["issue", "url"]);
const GRAPH_APPROVAL_FIELDS = new Set(["revision", "evidence"]);
const REQUIRED_SKILL_FIELDS = new Set(["scdProject", "scdQuickdev"]);
const DELIVERY_FIELDS = new Set(["nodeId", "issue", "url", "state"]);
const NODE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function assertObject(value, name) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${name} must be an object`);
  }
}

function assertExactFields(value, allowed, name) {
  for (const field of Object.keys(value)) {
    if (!allowed.has(field)) {
      throw new Error(`${name} has unknown field: ${field}`);
    }
  }
  for (const field of allowed) {
    if (!(field in value)) {
      throw new Error(`${name} is missing field: ${field}`);
    }
  }
}

function assertPositiveInteger(value, name) {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer`);
  }
}

function assertNonEmptyString(value, name) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${name} must be a non-empty string`);
  }
}

function assertUrl(value, name) {
  assertNonEmptyString(value, name);
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be an absolute http(s) URL`);
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error(`${name} must be an absolute http(s) URL`);
  }
}

function assertIssueUrl(value, issue, name) {
  assertUrl(value, name);
  const url = new URL(value);
  const suffix = `/issues/${issue}`;
  if (!url.pathname.endsWith(suffix)) {
    throw new Error(`${name} must identify issue ${issue}`);
  }
  return `${url.origin}${url.pathname.slice(0, -suffix.length)}`;
}

export function validateExecutionReceipt(receipt) {
  assertObject(receipt, "receipt");
  assertExactFields(receipt, RECEIPT_FIELDS, "receipt");

  if (receipt.schemaVersion !== 1) {
    throw new Error("schemaVersion must be 1");
  }
  if (receipt.phase !== "GRAPH_APPROVED") {
    throw new Error("phase must be GRAPH_APPROVED");
  }

  assertObject(receipt.initiative, "initiative");
  assertExactFields(receipt.initiative, INITIATIVE_FIELDS, "initiative");
  assertPositiveInteger(receipt.initiative.issue, "initiative.issue");
  const initiativeRepository = assertIssueUrl(
    receipt.initiative.url,
    receipt.initiative.issue,
    "initiative.url",
  );
  assertPositiveInteger(receipt.graphRevision, "graphRevision");

  if (receipt.trackerVerified !== true) {
    throw new Error("trackerVerified must be true");
  }
  if (receipt.graphValidated !== true) {
    throw new Error("graphValidated must be true");
  }
  assertNonEmptyString(receipt.directionApproval, "directionApproval");
  assertObject(receipt.graphApproval, "graphApproval");
  assertExactFields(
    receipt.graphApproval,
    GRAPH_APPROVAL_FIELDS,
    "graphApproval",
  );
  assertPositiveInteger(receipt.graphApproval.revision, "graphApproval.revision");
  if (receipt.graphApproval.revision !== receipt.graphRevision) {
    throw new Error("graphApproval.revision must match graphRevision");
  }
  assertNonEmptyString(receipt.graphApproval.evidence, "graphApproval.evidence");

  assertObject(receipt.requiredSkills, "requiredSkills");
  assertExactFields(
    receipt.requiredSkills,
    REQUIRED_SKILL_FIELDS,
    "requiredSkills",
  );
  for (const skill of REQUIRED_SKILL_FIELDS) {
    if (receipt.requiredSkills[skill] !== "available") {
      throw new Error(`requiredSkills.${skill} must be available`);
    }
  }

  if (
    !Array.isArray(receipt.deliveryIssues) ||
    receipt.deliveryIssues.length === 0
  ) {
    throw new Error("deliveryIssues must be a non-empty array");
  }

  const issuesByNode = new Map();
  const issueNumbers = new Set();
  for (const [index, delivery] of receipt.deliveryIssues.entries()) {
    const name = `deliveryIssues[${index}]`;
    assertObject(delivery, name);
    assertExactFields(delivery, DELIVERY_FIELDS, name);
    if (typeof delivery.nodeId !== "string" || !NODE_ID.test(delivery.nodeId)) {
      throw new Error(`${name}.nodeId must be kebab-case`);
    }
    if (issuesByNode.has(delivery.nodeId)) {
      throw new Error(`duplicate delivery node: ${delivery.nodeId}`);
    }
    assertPositiveInteger(delivery.issue, `${name}.issue`);
    if (issueNumbers.has(delivery.issue)) {
      throw new Error(`duplicate delivery issue: ${delivery.issue}`);
    }
    const deliveryRepository = assertIssueUrl(
      delivery.url,
      delivery.issue,
      `${name}.url`,
    );
    if (deliveryRepository !== initiativeRepository) {
      throw new Error(`${name}.url must use the Initiative repository`);
    }
    if (delivery.state !== "READY") {
      throw new Error(`${name}.state must be READY`);
    }
    issuesByNode.set(delivery.nodeId, delivery);
    issueNumbers.add(delivery.issue);
  }

  if (!Array.isArray(receipt.readyWave) || receipt.readyWave.length === 0) {
    throw new Error("readyWave must be a non-empty array");
  }
  const readyNodes = new Set();
  for (const [index, nodeId] of receipt.readyWave.entries()) {
    if (typeof nodeId !== "string" || !NODE_ID.test(nodeId)) {
      throw new Error(`readyWave[${index}] must be a kebab-case node ID`);
    }
    if (readyNodes.has(nodeId)) {
      throw new Error(`duplicate READY node: ${nodeId}`);
    }
    if (!issuesByNode.has(nodeId)) {
      throw new Error(`READY node has no delivery Issue: ${nodeId}`);
    }
    readyNodes.add(nodeId);
  }

  if (!Array.isArray(receipt.blockers)) {
    throw new Error("blockers must be an array");
  }
  if (receipt.blockers.some((blocker) => typeof blocker !== "string")) {
    throw new Error("blockers must be an array of strings");
  }
  if (receipt.blockers.length > 0) {
    throw new Error(`receipt has blockers: ${receipt.blockers.join("; ")}`);
  }

  return {
    valid: true,
    phase: receipt.phase,
    initiative: receipt.initiative.issue,
    graphRevision: receipt.graphRevision,
    readyWave: [...readyNodes].sort(),
  };
}

export function parseExecutionReceipt(input) {
  let receipt;
  try {
    receipt = JSON.parse(input);
  } catch {
    throw new Error("input is not valid JSON");
  }
  return validateExecutionReceipt(receipt);
}

function parseArgs(argv) {
  if (argv.length === 0) {
    return { file: null };
  }
  if (argv.length === 2 && argv[0] === "--file") {
    return { file: argv[1] };
  }
  throw new Error("usage: validate-execution-receipt.mjs [--file <path>]");
}

function readInput(file) {
  return file ? fs.readFileSync(file, "utf8") : fs.readFileSync(0, "utf8");
}

function main() {
  try {
    const { file } = parseArgs(process.argv.slice(2));
    const result = parseExecutionReceipt(readInput(file));
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`scd-reengineering: ${error.message}\n`);
    process.exitCode = 1;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
