import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("project triggers only for multiple independently verifiable deliveries", () => {
  const skill = read("skills/scd-project/SKILL.md");

  assert.match(skill, /多个可独立验证的交付/);
  assert.match(skill, /以下情况不要使用 Project/);
  assert.match(skill, /一个 Issue 可以表达一项连贯结果/);
  assert.match(skill, /只是实施工作量大/);
  assert.match(skill, /先使用 `scd-discovery`/);
});

test("project preserves Initiative, Delivery Issue, and evidence authority", () => {
  const skill = read("skills/scd-project/SKILL.md");
  const contract = read(
    "skills/scd-project/references/project-contract.md",
  );

  assert.match(skill, /已确认的全新产品 PRD 负责产品级/);
  assert.match(skill, /Initiative Issue 负责交付拓扑/);
  assert.match(skill, /每个 Delivery Issue 负责一个可独立验证切片的边界/);
  assert.match(contract, /已确认的全新产品 PRD.*产品愿景/s);
  assert.match(contract, /已验证依赖图快照.*派生的就绪视图/s);
  assert.match(contract, /不要把 PRD 复制到 Initiative/);
  assert.match(contract, /## 交付图/);
  assert.match(contract, /## 项目协调/);
  assert.match(contract, /## 产品追溯/);
  assert.match(contract, /稳定验收标识/);
});

test("project requires versioned PRD traceability before READY handoff", () => {
  const skill = read("skills/scd-project/SKILL.md");
  const contract = read(
    "skills/scd-project/references/project-contract.md",
  );

  assert.match(skill, /列出已确认 PRD 版本和它实施的每个 `FR-\*`/);
  assert.match(skill, /不能进入 READY/);
  assert.match(skill, /默认分支访问/);
  assert.match(skill, /在该版本中不存在/);
  assert.match(contract, /已确认版本：/);
  assert.match(contract, /需求：`FR-001`/);
  assert.match(contract, /Issue 缺少产品追溯/);
  assert.match(contract, /将这些缺口返回 Discovery/);
});

test("project models an executable Issue DAG without an execution loop", () => {
  const skill = read("skills/scd-project/SKILL.md");
  const contract = read(
    "skills/scd-project/references/project-contract.md",
  );

  assert.match(skill, /每个可执行节点必须是一个经过明确确认的中文 GitHub Delivery Issue/);
  assert.match(skill, /可以存在没有 Issue 的 PLANNED 占位节点/);
  assert.match(skill, /硬因果前置条件/);
  assert.match(skill, /不要把共享文件冲突/);
  assert.match(contract, /`DONE`/);
  assert.match(contract, /`PLANNED`/);
  assert.match(contract, /`BLOCKED`/);
  assert.match(contract, /`READY`/);
  assert.match(contract, /集成或发布 Delivery Issue/);
  assert.match(skill, /不得自动启动 Agent/);
  assert.match(skill, /不要添加租约、重试、并发槽/);
  assert.match(skill, /`scd-execute` 是已确认 Initiative 的通用外部消费者/);
  assert.match(skill, /`scd-reengineering`.*组合该执行器/s);
  assert.match(skill, /二者都不会授予 Project 执行权限/);
  assert.match(contract, /Project 本身始终不执行/);
});

test("project uses rolling approval and deterministic graph validation", () => {
  const skill = read("skills/scd-project/SKILL.md");
  const contract = read(
    "skills/scd-project/references/project-contract.md",
  );

  assert.match(skill, /滚动拆解/);
  assert.match(skill, /明确确认/);
  assert.match(skill, /validate-project-graph\.mjs/);
  assert.match(skill, /重复 ID/);
  assert.match(skill, /循环/);
  assert.match(contract, /schemaVersion/);
  assert.match(contract, /contract_revision|revision/i);
  assert.match(contract, /重建并验证依赖图快照/);
  assert.doesNotMatch(`${skill}\n${contract}`, /\.scd\/projects/);
});

test("discovery and quickdev route project work without widening implementation authority", () => {
  const discovery = read("skills/scd-discovery/SKILL.md");
  const execute = read("skills/scd-execute/SKILL.md");
  const quickdev = read("skills/scd-quickdev/SKILL.md") + "\n" +
    read("skills/scd-quickdev/references/scope-contract.md");
  const workflow = read("docs/workflow-and-state.md");

  assert.match(discovery, /交给 `scd-project` 拆解/);
  assert.match(discovery, /不得先创建一个过大的实施 Issue/);
  assert.match(quickdev, /一个明确选中、已确认的 `READY` Delivery Issue/);
  assert.match(quickdev, /已确认 `scd-execute` 波次/);
  assert.match(quickdev, /拒绝 Initiative、PLANNED 占位节点、BLOCKED 节点/);
  assert.match(execute, /所有可安全独立执行的 READY 节点/);
  assert.match(workflow, /不启动 Agent、worktree 或长期 loop/);
});
