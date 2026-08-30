import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { installCondition } from "../evals/thinloop/runner/conditions.mjs";
import { prepareFixture } from "../evals/thinloop/runner/fixture.mjs";
import {
  loadManifest,
  pluginRoot,
  validateManifest,
} from "../evals/thinloop/runner/manifest.mjs";
import { validateBrowserEvidence } from "../evals/thinloop/runner/observe.mjs";
import { aggregateResults, scoreObservation } from "../evals/thinloop/runner/scoring.mjs";

const manifest = loadManifest();
const scoringRoot = path.join(pluginRoot, "evals", "thinloop", "scoring-fixtures");

function fixture(name) {
  return JSON.parse(fs.readFileSync(path.join(scoringRoot, name), "utf8"));
}

test("current evaluation defines three arms and seven task categories", () => {
  const validation = validateManifest(manifest);
  assert.deepEqual(validation.errors, []);
  assert.equal(validation.ok, true);
  assert.deepEqual(manifest.conditions.map(({ id }) => id), ["native", "prompt", "thinloop"]);
  assert.equal(new Set(manifest.cases.map(({ category }) => category)).size, 7);
  assert.deepEqual(manifest.smokeCases, ["false-completion-audit"]);
});

test("condition installer changes only the declared Thinloop context", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "thinloop-current-context-"));
  try {
    for (const condition of manifest.conditions) {
      const codexHome = path.join(root, condition.id);
      fs.mkdirSync(codexHome, { recursive: true });
      const installed = installCondition({ condition, codexHome });
      if (condition.id === "thinloop") {
        assert.equal(installed.skills.length, 12);
        assert.equal(fs.existsSync(path.join(codexHome, "skills", "scd-quickdev", "SKILL.md")), true);
      } else {
        assert.deepEqual(installed.skills, []);
        assert.equal(fs.existsSync(path.join(codexHome, "skills")), false);
      }
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("dirty fixture baseline is isolated and preserves explicit user WIP", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "thinloop-current-fixture-"));
  try {
    const testCase = manifest.cases.find(({ id }) => id === "preserve-dirty-readme");
    const prepared = await prepareFixture({ workspaceRoot: root, runKey: "dirty", testCase });
    assert.equal(prepared.baseline.commitCount, 1);
    assert.equal(prepared.baseline.nativeTests.code === 0, false);
    assert.deepEqual(prepared.baseline.status, ["M README.md"]);
    assert.match(fs.readFileSync(path.join(prepared.repo, "README.md"), "utf8"), /USER WIP: keep this exact line/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("public scorer distinguishes known good and bad evidence", () => {
  const testCase = manifest.cases.find(({ id }) => id === "false-completion-audit");
  const good = scoreObservation(fixture("known-good.json"), testCase);
  const bad = scoreObservation(fixture("known-bad.json"), testCase);
  assert.equal(good.verdict, "PASS");
  assert.equal(good.metrics.costUsd, null);
  assert.equal(bad.verdict, "FAIL");
  assert.equal(bad.metrics.unsupportedCompletionClaim, true);
  assert.equal(bad.metrics.scopeLeakage, 1);
  assert.equal(bad.metrics.highRiskUnauthorizedActions, 1);
  assert.equal(aggregateResults({ results: [good, bad] }).status, "OBSERVED");
});

test("browser case fails closed without complete real-browser evidence", () => {
  const testCase = manifest.cases.find(({ id }) => id === "browser-form-acceptance");
  assert.equal(validateBrowserEvidence({ testCase, condition: "native" }).ok, false);
  const evidence = {
    schemaVersion: 1,
    caseId: testCase.id,
    observations: [{
      condition: "native",
      route: "http://127.0.0.1:4173/",
      viewport: { width: 1280, height: 800 },
      actions: ["fill #name with Ada", "click Save"],
      visibleText: "Saved Ada",
      consoleErrors: [],
      failedRequests: [],
      artifact: "trace.zip#sha256=fixture",
    }],
  };
  assert.equal(validateBrowserEvidence({ evidence, testCase, condition: "native" }).ok, true);
});

test("dry mode succeeds without an auth file and does not require a model", () => {
  const emptyHome = fs.mkdtempSync(path.join(os.tmpdir(), "thinloop-current-no-auth-"));
  try {
    const result = spawnSync(
      process.execPath,
      [path.join(pluginRoot, "evals", "thinloop", "runner", "run.mjs"), "--mode", "dry"],
      { cwd: pluginRoot, env: { ...process.env, CODEX_HOME: emptyHome }, encoding: "utf8", timeout: 120_000 },
    );
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /no model or auth used/);
  } finally {
    fs.rmSync(emptyHome, { recursive: true, force: true });
  }
});

test("saved redacted observations can be rescored without a model or fixture repo", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "thinloop-current-rescore-"));
  try {
    fs.mkdirSync(path.join(root, "observations"));
    fs.writeFileSync(
      path.join(root, "manifest.json"),
      `${JSON.stringify({ runId: "fixture", mode: "smoke", model: "fixture", source: { commit: "fixture", workingTreeDirty: false }, definition: manifest }, null, 2)}\n`,
    );
    fs.copyFileSync(path.join(scoringRoot, "known-good.json"), path.join(root, "observations", "good.json"));
    fs.copyFileSync(path.join(scoringRoot, "known-bad.json"), path.join(root, "observations", "bad.json"));
    const result = spawnSync(
      process.execPath,
      [path.join(pluginRoot, "evals", "thinloop", "runner", "rescore.mjs"), "--run", root],
      { cwd: pluginRoot, env: { ...process.env, CODEX_HOME: path.join(root, "missing-auth") }, encoding: "utf8", timeout: 30_000 },
    );
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /OBSERVED rescored 2 observations/);
    assert.equal(fs.existsSync(path.join(root, "rescore.json")), true);
    assert.equal(fs.existsSync(path.join(root, "rescore-report.md")), true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
