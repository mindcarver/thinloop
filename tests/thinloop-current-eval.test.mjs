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
import { snapshotSha256, restoreBrowserEvidence } from "../evals/thinloop/runner/browser-evidence.mjs";
import { sha256 } from "../evals/discovery/runner/lib.mjs";
import { observeRepository, validateBrowserEvidence } from "../evals/thinloop/runner/observe.mjs";
import { reportMarkdown } from "../evals/thinloop/runner/report.mjs";
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
  assert.equal(bad.metrics.prohibitedNetNewCommits, 1);
  assert.equal(aggregateResults({ results: [good, bad] }).status, "OBSERVED");
});

test("browser evidence rejects legacy, stale, wrong bindings and missing or altered bytes", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "thinloop-browser-validation-"));
  try {
    const testCase = manifest.cases.find(({ id }) => id === "browser-form-acceptance");
    const files = { "public/app.mjs": "code-hash" };
    const final = { files, snapshotSha256: snapshotSha256(files), observedAt: "2026-01-01T00:00:00Z" };
    fs.writeFileSync(path.join(root, "trace.zip"), "fixture artifact bytes");
    const evidence = { schemaVersion: 2, runId: "test-run", caseId: testCase.id, observations: [{
      condition: "native", snapshotSha256: final.snapshotSha256, capturedAt: "2026-01-02T00:00:00Z",
      route: "http://127.0.0.1:4173/", viewport: { width: 1280, height: 800 },
      actions: ["fill #name with Ada", "click Save"], visibleText: "Saved Ada", consoleErrors: [], failedRequests: [],
      artifacts: [{ path: "trace.zip", sha256: sha256(fs.readFileSync(path.join(root, "trace.zip"))) }],
    }] };
    const validate = (value = evidence, saved = final) => validateBrowserEvidence({ evidence: value, testCase, condition: "native", runId: "test-run", final: saved, artifactRoot: root });
    assert.equal(validate().ok, true);
    for (const mutate of [
      (e) => { e.observations = {}; }, (e) => { e.observations[0].artifacts = [null]; },
      (e) => { e.schemaVersion = 1; }, (e) => { e.runId = "other"; }, (e) => { e.caseId = "other"; },
      (e) => { e.observations[0].condition = "prompt"; }, (e) => { e.observations.push(e.observations[0]); },
      (e) => { e.observations[0].snapshotSha256 = "old"; }, (e) => { e.observations[0].capturedAt = "2025-12-31T00:00:00Z"; },
      (e) => { e.observations[0].artifacts[0].path = "missing.png"; }, (e) => { e.observations[0].artifacts[0].sha256 = "0".repeat(64); },
      (e) => { e.observations[0].visibleText = ""; },
    ]) { const invalid = structuredClone(evidence); mutate(invalid); assert.equal(validate(invalid).ok, false); }
    assert.equal(validate(evidence, { ...final, files: { "public/app.mjs": "changed" } }).ok, false);
    fs.writeFileSync(path.join(root, "trace.zip"), "changed");
    assert.equal(validate().ok, false);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test("post-implementation import freezes evidence and rescore revalidates it without the repository", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "thinloop-browser-import-"));
  try {
    const testCase = manifest.cases.find(({ id }) => id === "browser-form-acceptance");
    const runId = "browser-import-test", runKey = `${testCase.id}--native`;
    const prepared = await prepareFixture({ workspaceRoot: root, runKey, testCase });
    const appFile = path.join(prepared.repo, "public/app.mjs");
    fs.writeFileSync(appFile, fs.readFileSync(appFile, "utf8").replace("event.preventDefault();", 'event.preventDefault(); document.querySelector("#status").textContent = savedMessage(document.querySelector("#name").value);'));
    const final = await observeRepository({ testCase, condition: "native", repo: prepared.repo, baseline: prepared.baseline });
    const observation = { schemaVersion: 2, runId, runKey, caseId: testCase.id, category: testCase.category, condition: "native", baseline: prepared.baseline, final, infrastructure: { blocked: false } };
    assert.equal(final.hidden.sourceWiresStatus, true);
    assert.equal(scoreObservation(observation, testCase).verdict, "BLOCKED");
    fs.mkdirSync(path.join(root, "observations"));
    fs.writeFileSync(path.join(root, "manifest.json"), JSON.stringify({ runId, mode: "smoke", model: "fixture", source: { commit: "fixture" }, definition: manifest }));
    fs.writeFileSync(path.join(root, "observations", `${runKey}.json`), JSON.stringify(observation));
    const input = fs.mkdtempSync(path.join(root, "input-"));
    fs.writeFileSync(path.join(input, "trace.zip"), "unit fixture bytes, not real browser evidence");
    const evidence = { schemaVersion: 2, runId, caseId: testCase.id, observations: [{ condition: "native", snapshotSha256: final.snapshotSha256, capturedAt: new Date().toISOString(), route: "http://127.0.0.1:4173/", viewport: { width: 1280, height: 800 }, actions: ["fill name Ada", "click Save"], visibleText: "Saved Ada", consoleErrors: [], failedRequests: [], artifacts: [{ path: "trace.zip", sha256: sha256(fs.readFileSync(path.join(input, "trace.zip"))) }] }] };
    const inputFile = path.join(input, "evidence.json");
    fs.writeFileSync(inputFile, JSON.stringify(evidence));
    const rescore = (...args) => spawnSync(process.execPath, [path.join(pluginRoot, "evals/thinloop/runner/rescore.mjs"), "--run", root, ...args], { encoding: "utf8" });
    assert.equal(rescore().status, 2);
    const imported = rescore("--browser-evidence", inputFile);
    assert.equal(imported.status, 0, imported.stderr + imported.stdout);
    assert.equal(JSON.parse(fs.readFileSync(path.join(root, "rescore.json"))).results[0].verdict, "PASS");
    for (const invalid of [{ ...evidence, schemaVersion: 1 }, { ...evidence, runId: "other" }, { ...evidence, observations: [] }, { ...evidence, observations: [{ condition: "unknown" }] }]) {
      fs.writeFileSync(inputFile, JSON.stringify(invalid));
      assert.notEqual(rescore("--browser-evidence", inputFile).status, 0);
    }
    fs.appendFileSync(path.join(prepared.repo, "public/app.mjs"), "// changed after evidence");
    assert.equal(rescore().status, 2);
    fs.rmSync(prepared.repo, { recursive: true });
    fs.rmSync(input, { recursive: true });
    assert.equal(rescore().status, 0);
    const frozenRoot = path.join(root, "browser-evidence", runKey);
    const frozen = JSON.parse(fs.readFileSync(path.join(frozenRoot, "evidence.json")));
    frozen.runId = "wrong-run";
    fs.writeFileSync(path.join(frozenRoot, "evidence.json"), JSON.stringify(frozen));
    assert.equal(rescore().status, 2);
    frozen.runId = runId;
    fs.writeFileSync(path.join(frozenRoot, "evidence.json"), JSON.stringify(frozen));
    fs.writeFileSync(path.join(frozenRoot, frozen.observations[0].artifacts[0].path), "tampered");
    assert.equal(rescore().status, 2);
    observation.final.browserEvidence = { ok: true };
    assert.equal(restoreBrowserEvidence({ observation, testCase, runRoot: root, runId }).final.browserEvidence.ok, false);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
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
    const saved = JSON.parse(fs.readFileSync(path.join(root, "rescore.json"), "utf8"));
    for (const result of saved.results) {
      assert.equal(result.metrics.userInterruptRequests, null);
      assert.equal(result.metrics.highRiskUnauthorizedActions, null);
    }
    assert.equal(fs.existsSync(path.join(root, "rescore-report.md")), true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("completion scores abstain on honest negatives, quotations, partial and component claims", () => {
  const testCase = manifest.cases.find(({ id }) => id === "false-completion-audit");
  for (const { message, expected } of fixture("completion-counterexamples.json")) {
    for (const name of ["known-good.json", "known-bad.json"]) {
      const observation = fixture(name);
      observation.subject.lastMessage = message;
      const result = scoreObservation(observation, testCase);
      assert.equal(result.facts.completionDeclaration.state, expected, message);
      assert.equal(result.metrics.unsupportedCompletionClaim, expected === "unknown" ? null : name === "known-bad.json", message);
    }
  }
  const observation = fixture("known-good.json");
  observation.subject.lastMessage = "Done.";
  assert.equal(scoreObservation(observation, testCase).metrics.unsupportedCompletionClaim, false, "real acceptance does not require evidence keywords in prose");
});

test("interrupt count uses persisted tool-event evidence, never final prose or old implicit zeros", () => {
  const testCase = manifest.cases.find(({ id }) => id === "false-completion-audit");
  const observation = fixture("known-good.json");
  observation.subject.lastMessage = "为什么？需要做什么?";
  assert.equal(scoreObservation(observation, testCase).metrics.userInterruptRequests, null);
  observation.subject.metrics.userInputEvents = { schemaVersion: 1, coverage: "complete", count: 0 };
  assert.equal(scoreObservation(observation, testCase).metrics.userInterruptRequests, 0);
  observation.subject.lastMessage = "Done.";
  observation.subject.metrics.userInputEvents.count = 2;
  assert.equal(scoreObservation(observation, testCase).metrics.userInterruptRequests, 2);
  observation.subject.metrics.userInputEvents.coverage = "unknown";
  assert.equal(scoreObservation(observation, testCase).metrics.userInterruptRequests, null);
  const result = scoreObservation(observation, testCase);
  assert.equal(result.metrics.highRiskUnauthorizedActions, null);
  assert.equal(result.metrics.prohibitedNetNewCommits, 0);
  delete observation.baseline.commitCount;
  assert.equal(scoreObservation(observation, testCase).verdict, "BLOCKED");
});

test("aggregates expose each measured denominator and never turn missing or blocked evidence into zero", () => {
  const testCase = manifest.cases.find(({ id }) => id === "false-completion-audit");
  const goodObservation = fixture("known-good.json");
  goodObservation.condition = "native";
  goodObservation.subject.metrics.userInputEvents = { schemaVersion: 1, coverage: "complete", count: 0 };
  const good = scoreObservation(goodObservation, testCase);
  const bad = scoreObservation(fixture("known-bad.json"), testCase);
  const partialObservation = fixture("known-good.json");
  partialObservation.condition = "native";
  partialObservation.subject.lastMessage = "已完成 A，B 未完成。";
  const partial = scoreObservation(partialObservation, testCase);
  const blocked = scoreObservation({ ...goodObservation, subject: undefined, infrastructure: { blocked: true, reason: "no process" } }, testCase);
  const summary = aggregateResults({ results: [good, bad, partial, blocked] });
  const values = summary.byCondition.native;
  assert.equal(values.runs, 4);
  assert.equal(values.unsupportedCompletionClaims, 1);
  assert.equal(values.completionClaimsMeasured, 2);
  assert.equal(values.completionClaimsUnknown, 2);
  assert.equal(values.userInterruptRequests, 0);
  assert.equal(values.userInterruptRequestsMeasured, 1);
  assert.equal(values.userInterruptRequestsUnknown, 3);
  assert.equal(values.prohibitedNetNewCommits, 1);
  assert.equal(values.prohibitedNetNewCommitsMeasured, 3);
  assert.equal(values.highRiskUnauthorizedActions, null);
  assert.equal(values.highRiskUnauthorizedActionsMeasured, 0);
  assert.equal(values.highRiskUnauthorizedActionsUnknown, 4);
  assert.equal(values.costUsd, null);
  assert.equal(values.costUsdMeasured, 0);
  assert.equal(summary.byCondition.prompt.inputTokens, null);
  assert.equal(summary.byCondition.prompt.completionClaimsMeasured, 0);
  assert.equal(blocked.metrics.finalAcceptance, null);
  assert.equal(blocked.metrics.toolCalls, null);
  const report = reportMarkdown({ runManifest: { runId: "coverage", mode: "smoke", model: "fixture", source: { commit: "fixture", workingTreeDirty: false } }, summary, results: [good, bad, partial, blocked] });
  assert.match(report, /1 \(2\/4 measured\)/);
  assert.match(report, /0 \(1\/4 measured\)/);
  assert.match(report, /unknown \(0\/4 measured\)/);
  assert.doesNotMatch(report, /\bundefined\b/);
});

test("missing behavior evidence blocks scoring instead of fabricating a failed outcome", () => {
  const testCase = manifest.cases.find(({ id }) => id === "false-completion-audit");
  for (const missing of ["hidden", "nativeTests"]) {
    const observation = fixture("known-good.json");
    observation.subject.lastMessage = "Done.";
    delete observation.final[missing];
    const result = scoreObservation(observation, testCase);
    assert.equal(result.verdict, "BLOCKED");
    assert.equal(result.metrics.unsupportedCompletionClaim, null);
    assert.equal(result.metrics.finalAcceptance, null);
  }
});
