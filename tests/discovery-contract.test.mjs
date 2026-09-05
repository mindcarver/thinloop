import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("discovery routes greenfield work without burdening clear changes", () => {
  const skill = read("skills/scd-discovery/SKILL.md");

  assert.match(skill, /全新产品[\s\S]*默认走完整 Discovery/);
  assert.match(skill, /\*\*直接实施：\*\*/);
  assert.match(skill, /\*\*单点澄清：\*\*/);
  assert.match(skill, /不创建 Discovery 产物、不追加问题/);
  assert.match(skill, /就绪快速路径/);
});

test("discovery requires one-decision interviewing and explicit approval", () => {
  const skill = read("skills/scd-discovery/SKILL.md");
  const interviewing = read(
    "skills/scd-discovery/references/interviewing.md",
  );
  const readiness = read(
    "skills/scd-discovery/references/readiness-review.md",
  );

  assert.match(skill, /一次只询问一个决策/);
  assert.match(skill, /必须明确确认/);
  assert.match(interviewing, /先问上游问题，再问其后果/);
  assert.match(readiness, /静默对抗式审查/);
  assert.match(readiness, /A1：/);
});

test("discovery persists approved greenfield PRD without burdening clear changes", () => {
  const skill = read("skills/scd-discovery/SKILL.md");
  const artifacts = read("skills/scd-discovery/references/artifacts.md");
  const prd = read("skills/scd-discovery/assets/product-prd.md");

  assert.match(artifacts, /\.scd\/tasks\/current\.md/);
  assert.match(artifacts, /managed_by: scd-discovery/);
  assert.match(skill, /已确认的全新产品/);
  assert.match(skill, /\.scd\/product\/prd\.md/);
  assert.match(skill, /现有产品的清晰变更/);
  assert.match(artifacts, /确认前不得创建永久草稿/);
  assert.match(artifacts, /默认分支访问/);
  assert.match(prd, /status: draft/);
  assert.match(prd, /version: 1/);
  assert.match(prd, /## 产品愿景/);
  assert.match(prd, /## 主要用户/);
  assert.match(prd, /## 用户问题与当前替代方案/);
  assert.match(prd, /## MVP 目标/);
  assert.match(prd, /## 非目标/);
  assert.match(prd, /## 核心用户旅程/);
  assert.match(prd, /FR-001:/);
  assert.match(prd, /## 规则与失败场景/);
  assert.match(prd, /## 数据、权限与集成/);
  assert.match(prd, /## 成功指标/);
  assert.match(prd, /## 假设与风险/);
  assert.match(prd, /## 待确认问题/);
  assert.match(prd, /## 确认/);
  assert.match(artifacts, /GitHub Issue/);
  assert.match(
    artifacts,
    /现有产品的一项清晰变更只保留一个 GitHub Issue/,
  );
  assert.doesNotMatch(artifacts, /\.scd\/specs\/<slug>\.md/);
  assert.match(artifacts, /## 验收条件/);
  assert.match(artifacts, /A1：/);
  assert.match(artifacts, /\.scd\/architecture\.md/);
  assert.match(artifacts, /不要创建永久 `implementation-plan\.md`/);
});

test("downstream skills consume PRD authority and delivery evidence", () => {
  const skill = read("skills/scd-quickdev/SKILL.md") + "\n" +
    read("skills/scd-quickdev/references/scope-contract.md");
  const uiux = read("skills/scd-uiux/SKILL.md");
  const architecture = read("skills/scd-architecture/SKILL.md");
  const evidence = read(
    "skills/scd-quickdev/references/evidence-contract.md",
  );

  assert.match(skill, /GitHub Delivery Issue 作为交付边界和验收事实来源/);
  assert.match(skill, /已确认的全新产品 PRD 继续负责产品级/);
  assert.match(skill, /确认每个具名 `FR-\*` 标识存在/);
  assert.match(uiux, /已确认 `.scd\/product\/prd\.md` 精确版本/);
  assert.match(architecture, /已确认 `.scd\/product\/prd\.md` 精确版本/);
  assert.match(skill, /把每个验收项映射到已观察证据、`UNVERIFIED`/);
  assert.match(evidence, /A1 PASS/);
  assert.match(evidence, /把决策返回 Discovery/);
});
