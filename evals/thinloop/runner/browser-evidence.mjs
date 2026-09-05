import fs from "node:fs";
import path from "node:path";
import { sha256, writeJson } from "../../discovery/runner/lib.mjs";
import { snapshotFiles } from "./fixture.mjs";

export function snapshotSha256(files) {
  return sha256(JSON.stringify(Object.entries(files).sort(([a], [b]) => a.localeCompare(b))));
}

export function validateBrowserEvidence({ evidence, testCase, condition, runId, final, artifactRoot }) {
  if (!testCase.requiresBrowserEvidence) return null;
  const fail = (reason) => ({ ok: false, reason });
  if (!runId || evidence?.schemaVersion !== 2 || evidence.runId !== runId || evidence.caseId !== testCase.id) {
    return fail("browser evidence schema/run/case binding mismatch");
  }
  const items = Array.isArray(evidence.observations) ? evidence.observations.filter((entry) => entry?.condition === condition) : [];
  if (items?.length !== 1) return fail("exactly one browser observation is required for this condition");
  const item = items[0];
  if (!final?.files || !final.observedAt || final.snapshotSha256 !== snapshotSha256(final.files) || item.snapshotSha256 !== final.snapshotSha256) {
    return fail("browser evidence code snapshot mismatch");
  }
  const capturedAt = Date.parse(item.capturedAt);
  const observedAt = Date.parse(final.observedAt);
  if (!Number.isFinite(capturedAt) || !Number.isFinite(observedAt) || capturedAt < observedAt || capturedAt > Date.now()) {
    return fail("browser evidence must be captured after the implementation snapshot");
  }
  if (!(typeof item.route === "string" && /^https?:\/\//.test(item.route) &&
    Number(item.viewport?.width) > 0 && Number(item.viewport?.height) > 0 &&
    Array.isArray(item.actions) && item.actions.every((action) => typeof action === "string") &&
    item.actions.some((action) => /(?:click|submit|Save)/i.test(action)) && item.visibleText === "Saved Ada" &&
    Array.isArray(item.consoleErrors) && item.consoleErrors.length === 0 &&
    Array.isArray(item.failedRequests) && item.failedRequests.length === 0 &&
    Array.isArray(item.artifacts) && item.artifacts.length > 0)) return fail("browser evidence is incomplete");
  try {
    if (!artifactRoot) return fail("browser artifact root is required");
    for (const artifact of item.artifacts) {
      if (typeof artifact?.path !== "string" || !/^[a-f0-9]{64}$/.test(artifact.sha256)) return fail("browser artifact needs a path and SHA-256");
      const file = path.resolve(artifactRoot, artifact.path);
      const relative = path.relative(fs.realpathSync(artifactRoot), fs.realpathSync(file));
      if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) return fail("browser artifact must stay inside its evidence directory");
      if (!fs.statSync(file).isFile() || fs.statSync(file).size === 0 || sha256(fs.readFileSync(file)) !== artifact.sha256) return fail("browser artifact content hash mismatch or empty artifact");
    }
  } catch (error) {
    return fail(`browser artifact unavailable: ${error.code ?? error.message}`);
  }
  return { ok: true, observation: item };
}

// Always revalidate bytes and bindings; a saved observation's `ok` is not authority.
export function restoreBrowserEvidence({ observation, testCase, runRoot, runId, evidence, evidenceRoot }) {
  if (!testCase.requiresBrowserEvidence) return observation;
  const next = structuredClone(observation);
  const fail = (reason) => { next.final.browserEvidence = { ok: false, reason }; return next; };
  if (observation.runId !== runId || observation.caseId !== testCase.id || observation.runKey !== `${testCase.id}--${observation.condition}` || !/^[a-z0-9-]+--[a-z0-9-]+$/.test(observation.runKey)) return fail("saved browser observation run binding mismatch");
  const repo = path.join(runRoot, "repositories", observation.runKey);
  if (evidence && !fs.existsSync(repo)) return fail("browser evidence import requires the implemented fixture repository");
  if (fs.existsSync(repo) && snapshotSha256(snapshotFiles(repo)) !== observation.final.snapshotSha256) return fail("implemented fixture changed since the saved snapshot");
  const frozenRoot = path.join(runRoot, "browser-evidence", observation.runKey);
  let record = evidence;
  try {
    record ??= JSON.parse(fs.readFileSync(path.join(frozenRoot, "evidence.json"), "utf8"));
  } catch {
    return fail("awaiting post-implementation browser evidence import");
  }
  let browser = validateBrowserEvidence({ evidence: record, testCase, condition: observation.condition, runId, final: observation.final, artifactRoot: evidence ? evidenceRoot : frozenRoot });
  if (browser.ok && evidence) {
    fs.mkdirSync(frozenRoot, { recursive: true });
    const item = structuredClone(browser.observation);
    item.artifacts = item.artifacts.map((artifact) => {
      const name = `${artifact.sha256}${path.extname(artifact.path)}`;
      fs.copyFileSync(path.resolve(evidenceRoot, artifact.path), path.join(frozenRoot, name));
      return { path: name, sha256: artifact.sha256 };
    });
    record = { schemaVersion: 2, runId, caseId: testCase.id, observations: [item] };
    writeJson(path.join(frozenRoot, "evidence.json"), record);
    browser = validateBrowserEvidence({ evidence: record, testCase, condition: observation.condition, runId, final: observation.final, artifactRoot: frozenRoot });
  }
  next.final.browserEvidence = browser;
  next.final.hidden = { ...next.final.hidden, ok: next.final.hidden?.sourceWiresStatus === true && browser.ok, browserEvidence: browser.ok };
  return next;
}
