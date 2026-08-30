import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
const evaluation = fs.readFileSync(path.join(root, "EVALUATION.md"), "utf8");

function between(content, start, end) {
  const startIndex = content.indexOf(start);
  const endIndex = content.indexOf(end, startIndex + start.length);
  assert.ok(startIndex >= 0, `missing ${start}`);
  assert.ok(endIndex > startIndex, `missing ${end} after ${start}`);
  return content.slice(startIndex, endIndex);
}

function skillLinks(content) {
  return [...content.matchAll(/\.\/skills\/(scd-[^/]+)\/SKILL\.md/g)].map(
    ([, skill]) => skill,
  );
}

test("README presents three layers, evidence cases, and generated routes before the full catalog", () => {
  const layers = "## 三层能力 / THREE LAYERS";
  const cases = "## 三个可追溯对照 / BEFORE & AFTER";
  const quickStart = "## 30 秒开始 / QUICK START";
  const catalog = "## 完整十二 Skill 目录 / FULL CATALOG";
  const routeStart = "<!-- thinloop-routing-kernel:start source=config/routing-kernel.json -->";
  const routeEnd = "<!-- thinloop-routing-kernel:end -->";

  assert.ok(readme.indexOf(layers) < readme.indexOf(cases));
  assert.ok(readme.indexOf(cases) < readme.indexOf(quickStart));
  assert.ok(readme.indexOf(quickStart) < readme.indexOf(routeStart));
  assert.ok(readme.indexOf(routeStart) < readme.indexOf(routeEnd));
  assert.ok(readme.indexOf(routeEnd) < readme.indexOf(catalog));

  const layerSection = between(readme, layers, cases);
  assert.match(layerSection, /\*\*核心交付\*\*/);
  assert.match(layerSection, /\*\*条件设计与再工程\*\*/);
  assert.match(layerSection, /\*\*主动治理与个人能力\*\*/);
  assert.deepEqual(skillLinks(layerSection), [
    "scd-next",
    "scd-discovery",
    "scd-project",
    "scd-execute",
    "scd-quickdev",
    "scd-uiux",
    "scd-architecture",
    "scd-reengineering",
    "scd-maintenance",
    "scd-knowledge",
    "scd-evolve",
    "scd-interview",
  ]);
});

test("README keeps all three Before/After examples traceable and bounded by evidence", () => {
  const cases = between(
    readme,
    "## 三个可追溯对照 / BEFORE & AFTER",
    "## 30 秒开始 / QUICK START",
  );

  for (const heading of [
    "### 01 · 修一个 Bug",
    "### 02 · 从模糊想法到多 Issue 项目",
    "### 03 · 长任务失败后恢复",
  ]) {
    assert.match(cases, new RegExp(heading));
  }
  for (const source of [
    "./skills/scd-quickdev/references/issue-delivery-contract.md",
    "./skills/scd-quickdev/references/evidence-contract.md",
    "./skills/scd-discovery/SKILL.md",
    "./skills/scd-project/SKILL.md",
    "./skills/scd-execute/SKILL.md",
    "./skills/scd-quickdev/references/continuity-contract.md",
    "./EVALUATION.md#当前真实-smoke",
    "./EVALUATION.md#scd-dev-loop-010-历史报告",
  ]) {
    assert.ok(cases.includes(source), source);
  }
  assert.match(cases, /三个条件均为 `PASS`/);
  assert.match(cases, /没有观察到 Thinloop 的相对增益/);
  assert.match(cases, /契约路径和已冻结评测定义/);
  assert.match(cases, /历史两臂结果[\s\S]*不等于当前十二 Skill/);
});

test("README retains twelve complete Skill entries, every flow, and the documentation index", () => {
  const catalog = between(
    readme,
    "## 完整十二 Skill 目录 / FULL CATALOG",
    "## 工作闭环 / WORKFLOW",
  );
  const expectedSkills = fs
    .readdirSync(path.join(root, "skills"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  assert.equal(expectedSkills.length, 12);
  assert.deepEqual(skillLinks(catalog).sort(), expectedSkills);

  for (const skill of expectedSkills) {
    const flow = path.join(root, "assets", "flows", `${skill}.svg`);
    assert.ok(fs.existsSync(flow), flow);
    assert.ok(readme.includes(`./assets/flows/${skill}.svg`), skill);
  }
  assert.ok(readme.includes("./assets/flows/thinloop-overview.svg"));

  for (const document of [
    "docs/workflow-and-state.md",
    "docs/installation.md",
    "docs/verification.md",
    "EVALUATION.md",
  ]) {
    assert.ok(fs.existsSync(path.join(root, document)), document);
    assert.ok(readme.includes(`./${document}`), document);
  }
});

test("every local Markdown link in README resolves inside the repository", () => {
  const links = [...readme.matchAll(/\]\((\.\/[^)]+)\)/g)].map(([, link]) => link);
  assert.ok(links.length > 0);
  for (const link of links) {
    const relativePath = link.split("#", 1)[0].slice(2);
    assert.ok(fs.existsSync(path.join(root, relativePath)), link);
  }
});

test("evaluation separates current smoke facts from historical six-Skill snapshots", () => {
  assert.match(
    evaluation,
    /三个条件[\s\S]{0,1200}没有观察到 Thinloop 的相对增益/,
  );
  const historicalStart = evaluation.indexOf("## 历史平台兼容性快照（2026-07-27）");
  const historicalEnd = evaluation.indexOf("## scd-maintenance 0.1.0 评测计划");
  assert.ok(historicalStart >= 0);
  assert.ok(historicalEnd > historicalStart);
  const historical = evaluation.slice(historicalStart, historicalEnd);
  assert.match(historical, /六 Skill 仓库快照[\s\S]*不是当前十二 Skill/);
  assert.match(historical, /当时被测仓库/);
  assert.match(historical, /当日观察到的限制/);

  for (const match of evaluation.matchAll(/(?:六个|6 个) (?:Agent )?Skill/g)) {
    assert.ok(
      match.index >= historicalStart && match.index < historicalEnd,
      `unscoped historical Skill count at ${match.index}`,
    );
  }
  assert.match(evaluation, /## scd-dev-loop 0\.1\.0 历史报告/);
  assert.match(evaluation, /该轮模型本身已经很强/);
});
