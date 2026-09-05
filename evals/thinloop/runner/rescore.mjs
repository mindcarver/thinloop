import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { parseArgs, writeJson, writeText } from "../../discovery/runner/lib.mjs";
import { createRedactor, scanTree } from "../../discovery/runner/redact.mjs";
import { restoreBrowserEvidence } from "./browser-evidence.mjs";
import { reportMarkdown } from "./report.mjs";
import { aggregateResults, scoreObservation } from "./scoring.mjs";

const args = parseArgs(process.argv.slice(2));
if (!args.run) throw new Error("--run <saved-run-directory> is required");
const runRoot = path.resolve(args.run);
const runManifest = JSON.parse(fs.readFileSync(path.join(runRoot, "manifest.json"), "utf8"));
const observationsRoot = path.join(runRoot, "observations");
const observations = fs.readdirSync(observationsRoot)
  .filter((file) => file.endsWith(".json"))
  .sort()
  .map((file) => JSON.parse(fs.readFileSync(path.join(observationsRoot, file), "utf8")));
const cases = new Map(runManifest.definition.cases.map((testCase) => [testCase.id, testCase]));
const evidenceFile = args["browser-evidence"] ? path.resolve(args["browser-evidence"]) : undefined;
const evidence = evidenceFile ? JSON.parse(fs.readFileSync(evidenceFile, "utf8")) : undefined;
if (evidence && (evidence.schemaVersion !== 2 || evidence.runId !== runManifest.runId || !observations.some((observation) => observation.caseId === evidence.caseId) ||
  !Array.isArray(evidence.observations) || evidence.observations.length === 0 || evidence.observations.some((item) => !observations.some((observation) => observation.caseId === evidence.caseId && observation.condition === item?.condition)))) {
  throw new Error("browser evidence schema/run/case/condition binding is invalid");
}
const results = observations.map((observation) => {
  const testCase = cases.get(observation.caseId);
  const restored = restoreBrowserEvidence({ observation, testCase, runRoot, runId: runManifest.runId,
    evidence: evidence?.caseId === observation.caseId && evidence.observations.some((item) => item?.condition === observation.condition) ? evidence : undefined, evidenceRoot: evidenceFile && path.dirname(evidenceFile) });
  return scoreObservation(restored, testCase);
});
const leaks = scanTree(runRoot, createRedactor({ auth: {}, userProfile: os.homedir() }));
const summary = aggregateResults({ results, leaks });
writeJson(path.join(runRoot, "rescore.json"), { run: runManifest, summary, results });
writeText(path.join(runRoot, "rescore-report.md"), reportMarkdown({ runManifest, summary, results, rescore: true }));
process.stdout.write(`${summary.status} rescored ${results.length} observations: ${runRoot}\n`);
if (summary.status === "FAIL") process.exitCode = 1;
if (summary.status === "BLOCKED") process.exitCode = 2;
