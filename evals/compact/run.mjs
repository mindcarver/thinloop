import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createIsolatedHomes, cleanupIsolatedHomes, codexLoginStatus, runSubjectTurn } from "../discovery/runner/codex.mjs";
import { captureRepositoryEvidence } from "../discovery/runner/fixture.mjs";
import { createRedactor, scanTree } from "../discovery/runner/redact.mjs";
import { ensureDir, parseArgs, parseJsonLines, relativeFiles, sha256, writeJson } from "../discovery/runner/lib.mjs";
import { prepareFixture } from "../thinloop/runner/fixture.mjs";
import { observeRepository } from "../thinloop/runner/observe.mjs";
import { scoreObservation } from "../thinloop/runner/scoring.mjs";

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const definition = JSON.parse(fs.readFileSync(new URL("definition.json", import.meta.url)));
const currentCases = JSON.parse(fs.readFileSync(path.join(root, "evals/thinloop/manifest.json"))).cases;
export const cases = definition.caseIds.map(id => currentCases.find(testCase => testCase.id === id));

function git(args) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`git ${args[0]} failed: ${result.stderr}`);
  return result.stdout;
}

export function snapshot(ref, prefix = "skills/") {
  if (!/^[a-f0-9]{40}$/.test(ref)) throw new Error("payload must be frozen at a full commit SHA");
  const files = git(["ls-tree", "-r", "--name-only", ref, "--", prefix]).trim().split("\n").filter(Boolean);
  if (!files.length) throw new Error(`empty skill snapshot: ${ref} ${prefix}`);
  return Object.fromEntries(files.map(file => [file, git(["show", `${ref}:${file}`])]));
}

export function payloadIdentity(files) {
  const inventory = Object.keys(files).sort().map(file => ({ file, sha256: sha256(files[file]), bytes: Buffer.byteLength(files[file]), chars: [...files[file]].length }));
  return { sha256: sha256(JSON.stringify(inventory)), bytes: inventory.reduce((n, f) => n + f.bytes, 0), chars: inventory.reduce((n, f) => n + f.chars, 0), inventory };
}

export function schedule() {
  return Array.from({ length: definition.repeats }, (_, repeat) => cases.map((testCase, index) => ({
    pair: repeat * cases.length + index, repeat: repeat + 1, caseId: testCase.id,
    order: (repeat * cases.length + index) % 2 ? ["candidate", "baseline"] : ["baseline", "candidate"],
  }))).flat();
}

export function prompt(testCase) {
  return `${definition.promptPrefix}\n\n${testCase.prompt}`;
}

export function eventEvidence(events, quickdevFiles) {
  const commands = events.filter(event => event.type === "item.completed" && event.item?.type === "command_execution").map(event => event.item);
  const reads = Object.entries(quickdevFiles).map(([file, content]) => {
    const suffix = file.replace("skills/scd-quickdev/", "");
    const observed = commands.filter(item => item.exit_code === 0 && /\b(cat|sed|head|readFile)/.test(item.command ?? "") && (item.command ?? "").includes(suffix));
    return { file, matchingCommands: observed.map(item => ({ id: item.id, command: item.command, outputSha256: sha256(item.aggregated_output ?? "") })),
      fullContentObserved: observed.some(item => (item.aggregated_output ?? "").includes(content.trim())) };
  });
  const usageEvents = events.filter(event => event.type === "turn.completed").map(event => event.usage);
  const sum = key => usageEvents.length && usageEvents.every(value => Number.isFinite(value?.[key])) ? usageEvents.reduce((n, value) => n + value[key], 0) : null;
  const knownTools = new Set(["command_execution", "file_change", "web_search", "todo_list"]);
  const other = new Set(["agent_message", "reasoning", "plan"]);
  const items = events.filter(event => event.type === "item.completed" && event.item).map(event => event.item);
  const unknownItemTypes = [...new Set(items.filter(item => !knownTools.has(item.type) && !other.has(item.type)).map(item => item.type))];
  return {
    reads,
    entryFullyObserved: reads.find(read => read.file === "skills/scd-quickdev/SKILL.md")?.fullContentObserved === true,
    knownCompletedCommands: commands.length,
    knownCompletedToolItems: items.filter(item => knownTools.has(item.type)).length,
    unknownItemTypes,
    toolCountCoverage: unknownItemTypes.length ? "partial" : "known-completed-items",
    usage: { inputTokens: sum("input_tokens"), outputTokens: sum("output_tokens"), cachedInputTokens: sum("cached_input_tokens"),
      cacheWriteInputTokens: sum("cache_write_input_tokens"), reasoningOutputTokens: sum("reasoning_output_tokens") },
  };
}

function persisted(output, files, redactor) {
  for (const file of relativeFiles(output)) {
    if (file.startsWith("repositories/") && file.includes("/.git/")) continue;
    const absolute = path.join(output, file);
    const bytes = fs.readFileSync(absolute);
    if (!bytes.includes(0)) fs.writeFileSync(absolute, redactor(bytes.toString("utf8")).text);
  }
  const leaks = scanTree(output, redactor);
  if (leaks.length) throw new Error(`secret scan failed: ${JSON.stringify(leaks)}`);
  writeJson(path.join(output, "evidence.json"), { files: relativeFiles(output).filter(file => file !== "evidence.json" && !file.includes("/.git/")).map(file => ({ file, sha256: sha256(fs.readFileSync(path.join(output, file))) })), payloads: files });
}

async function runOne({ trial, condition, output, snapshots, authFile, redactor }) {
  const id = randomUUID(); // Subject-visible paths never reveal its condition.
  const testCase = cases.find(testCase => testCase.id === trial.caseId);
  const fixture = await prepareFixture({ workspaceRoot: output, runKey: id, testCase });
  const homes = createIsolatedHomes({ authFile, prefix: "thinloop-eval-" });
  const quickdev = snapshots[condition];
  const raw = ensureDir(path.join(output, "traces", id));
  let subject, evidence, infrastructure = { blocked: false }, login;
  try {
    const installed = { ...snapshots.shared, ...quickdev };
    for (const [file, content] of Object.entries(installed)) {
      const target = path.join(homes.subject.codexHome, file);
      ensureDir(path.dirname(target)); fs.writeFileSync(target, content);
    }
    const installedIdentity = payloadIdentity(Object.fromEntries(Object.keys(installed).map(file => [file, fs.readFileSync(path.join(homes.subject.codexHome, file), "utf8")])));
    writeJson(path.join(raw, "installed-payload.json"), installedIdentity);
    login = await codexLoginStatus({ home: homes.subject, redactor });
    if (login.code !== 0) throw new Error("isolated existing Codex authentication unavailable");
    subject = await runSubjectTurn({ home: homes.subject, cwd: fixture.repo, prompt: prompt(testCase), model: definition.model,
      reasoning: definition.reasoning, outputDir: raw, turn: 1, redactor, timeoutMs: 900_000,
      onProgress: message => process.stdout.write(`${new Date().toISOString()} ${id}: ${message}\n`) });
    const parsed = parseJsonLines(fs.readFileSync(path.join(raw, "turn-1.jsonl"), "utf8"));
    evidence = eventEvidence(parsed.events, quickdev);
    if (subject.code !== 0 || subject.timedOut || !subject.lastMessage || !evidence.entryFullyObserved ||
        evidence.usage.inputTokens === null || evidence.usage.outputTokens === null || parsed.invalid.length) {
      infrastructure = { blocked: true, reason: "subject completion, usage, or complete QuickDev read proof unavailable" };
    }
  } catch (error) {
    infrastructure = { blocked: true, reason: redactor(error.message).text };
  } finally { cleanupIsolatedHomes(homes.root); }
  await captureRepositoryEvidence({ repo: fixture.repo, outputDir: ensureDir(path.join(raw, "diff")), turn: 1, redactor });
  const final = await observeRepository({ testCase, condition, repo: fixture.repo, baseline: fixture.baseline, lastMessage: subject?.lastMessage ?? "" });
  const observation = {
    schemaVersion: 3, runKey: id, caseId: testCase.id, category: testCase.category, condition, repeat: trial.repeat,
    infrastructure, baseline: fixture.baseline, final, subject: subject ?? { metrics: {}, lastMessage: "" }, pricing: {},
  };
  const scored = scoreObservation(observation, testCase);
  const result = { ...trial, id, condition, payloadSha256: payloadIdentity(quickdev).sha256,
    evidence, scored, durationMs: subject?.durationMs ?? null, secretRedactions: (login?.secretRedactions ?? 0) + (subject?.secretRedactions ?? 0) };
  writeJson(path.join(output, "observations", `${id}.json`), JSON.parse(redactor(JSON.stringify(observation)).text));
  writeJson(path.join(output, "results", `${trial.pair}-${condition}.json`), JSON.parse(redactor(JSON.stringify(result)).text));
  return result;
}

export async function run({ output, candidateRef, pairs = 6, dry = false }) {
  if (!Number.isInteger(pairs) || pairs < 1 || pairs > 6) throw new Error("pairs must be 1..6");
  const candidate = snapshot(candidateRef, "skills/scd-quickdev/");
  const snapshots = { baseline: snapshot(definition.baselineQuickdevRef, "skills/scd-quickdev/"), candidate,
    shared: Object.fromEntries(Object.entries(snapshot(definition.sharedSkillsRef)).filter(([file]) => !file.startsWith("skills/scd-quickdev/"))) };
  const identities = Object.fromEntries(Object.entries(snapshots).map(([name, files]) => [name, payloadIdentity(files)]));
  const frozen = { definition, candidateRef, identities, cases, schedule: schedule() };
  if (dry) {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), "thinloop-compact-dry-"));
    try { for (const testCase of cases) await prepareFixture({ workspaceRoot: temp, runKey: randomUUID(), testCase }); }
    finally { fs.rmSync(temp, { recursive: true, force: true }); }
    return { status: "DRY_PASS", frozen };
  }
  const cli = spawnSync("codex", ["--version"], { encoding: "utf8" });
  if (cli.status !== 0 || cli.stdout.trim() !== definition.cliVersion) throw new Error(`expected ${definition.cliVersion}; observed ${cli.stdout.trim()}`);
  ensureDir(output);
  const manifestFile = path.join(output, "manifest.json");
  if (fs.existsSync(manifestFile)) {
    if (JSON.stringify(JSON.parse(fs.readFileSync(manifestFile)).frozen) !== JSON.stringify(frozen)) throw new Error("frozen definition or payload changed; use a new run directory");
  } else writeJson(manifestFile, { frozen, cli: cli.stdout.trim(), createdAt: new Date().toISOString(), costUsd: null });
  const authFile = path.join(process.env.CODEX_HOME || path.join(os.homedir(), ".codex"), "auth.json");
  const auth = JSON.parse(fs.readFileSync(authFile, "utf8"));
  const redactor = createRedactor({ auth, userProfile: os.homedir() });
  const completed = [];
  for (const trial of schedule().slice(0, pairs)) {
    const resultFiles = trial.order.map(condition => path.join(output, "results", `${trial.pair}-${condition}.json`));
    if (resultFiles.some(fs.existsSync) && !resultFiles.every(fs.existsSync)) throw new Error("partial pair exists; retain it and use a new run directory");
    const results = resultFiles.every(fs.existsSync)
      ? resultFiles.map(file => JSON.parse(fs.readFileSync(file)))
      : await Promise.all(trial.order.map(condition => runOne({ trial, condition, output, snapshots, authFile, redactor })));
    completed.push(...results);
    writeJson(path.join(output, "summary.json"), { complete: completed.length === 12, completed: completed.length, costUsd: null, results: completed });
    process.stdout.write(`pair ${trial.pair}: ${results.map(result => `${result.condition}=${result.scored.verdict}, read=${result.evidence?.entryFullyObserved}`).join("; ")}\n`);
    if (results.some(result => result.scored.verdict === "BLOCKED") ||
        results.find(result => result.condition === "baseline").scored.verdict === "PASS" &&
        results.find(result => result.condition === "candidate").scored.verdict !== "PASS") break;
  }
  persisted(output, identities, redactor);
  return { complete: completed.length === 12, results: completed, costUsd: null };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2));
  try {
    const result = await run({ output: path.resolve(args.output || "work/compact-eval"), candidateRef: args.candidate,
      pairs: Number(args.pairs || 6), dry: args.mode === "dry" });
    process.stdout.write(`${JSON.stringify({ status: result.status, complete: result.complete, subjects: result.results?.length })}\n`);
    if (result.results?.some(result => result.scored.verdict !== "PASS")) process.exitCode = 2;
  } catch (error) { process.stderr.write(`${error.stack}\n`); process.exitCode = 1; }
}
