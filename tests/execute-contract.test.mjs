import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("execute consumes approved Initiatives without replacing Project", () => {
  const skill = read("skills/scd-execute/SKILL.md");
  const contract = read("skills/scd-execute/references/execution-contract.md");

  assert.match(skill, /开始、继续、恢复或完成已确认 Initiative/);
  assert.match(skill, /`scd-project` 负责 Initiative/);
  assert.match(skill, /Execute 负责实时波次选择/);
  assert.match(skill, /已选中一个 Delivery Issue：使用 `scd-quickdev`/);
  assert.match(skill, /返回 `scd-project`/);
  assert.match(contract, /保持 Project 不执行/);
  assert.doesNotMatch(`${skill}\n${contract}`, /\.scd\/execute/);
});

test("execute selects all safe READY nodes unless the user narrows the wave", () => {
  const skill = read("skills/scd-execute/SKILL.md");
  const contract = read("skills/scd-execute/references/execution-contract.md");
  const combined = `${skill}\n${contract}`;

  assert.match(combined, /所有可安全独立执行的 READY 节点/);
  assert.match(combined, /只执行 Issue #N/);
  assert.match(combined, /串行/);
  assert.match(combined, /最多并行 N 个/);
  assert.match(combined, /不要要求用户手工选择节点/);
  assert.match(combined, /不得作为伪造边写入 Project DAG/);
  assert.match(skill, /validate-project-graph\.mjs/i);
  assert.match(skill, /拒绝陈旧版本、无效依赖图/);
});

test("execute launches one isolated QuickDev lane per selected Issue", () => {
  const skill = read("skills/scd-execute/SKILL.md");
  const contract = read("skills/scd-execute/references/execution-contract.md");
  const combined = `${skill}\n${contract}`;

  assert.match(combined, /隔离工作树/);
  assert.match(combined, /一个 Delivery Issue/);
  assert.match(combined, /调用 `scd-quickdev`/);
  assert.match(combined, /明确文件或模块所有权/);
  assert.match(combined, /有其他 Agent 同时工作/);
  assert.match(combined, /不得实施兄弟 Issues/);
  assert.match(combined, /脱离后台工作/);
  assert.match(combined, /独立行为验收 `PASS`/);
  assert.doesNotMatch(combined, /REVIEW_PASS/);
});

test("execute develops concurrently but merges and unlocks serially", () => {
  const skill = read("skills/scd-execute/SKILL.md");
  const contract = read("skills/scd-execute/references/execution-contract.md");
  const combined = `${skill}\n${contract}`;

  assert.match(combined, /开发可以并行/);
  assert.match(combined, /符合条件的拉取请求必须逐个合并/);
  assert.match(combined, /同步基准分支/);
  assert.match(combined, /重建并验证实时 Project 依赖图/);
  assert.match(combined, /针对不同基准版本的绿色检查/);
  assert.match(combined, /集成或发布 Delivery Issue/);
});

test("execute fails closed and resumes from authoritative evidence", () => {
  const skill = read("skills/scd-execute/SKILL.md");
  const contract = read("skills/scd-execute/references/execution-contract.md");
  const combined = `${skill}\n${contract}`;

  assert.match(combined, /`PASS`/);
  assert.match(combined, /`FAIL`/);
  assert.match(combined, /`BLOCKED`/);
  assert.match(combined, /停止下游节点/);
  assert.match(combined, /产品变化返回 Discovery/);
  assert.match(combined, /重建执行状态/);
  assert.match(combined, /不得从[\s\S]*提交[\s\S]*单独推断 `DONE`/);
  assert.match(combined, /不要添加租约/);
  assert.match(combined, /第二状态数据库/);
});

test("execute turns an empty READY set into an actionable handoff", () => {
  const skill = read("skills/scd-execute/SKILL.md");
  const contract = read("skills/scd-execute/references/execution-contract.md");
  const combined = `${skill}\n${contract}`;

  assert.match(combined, /`ROLLING_REPLAN_REQUIRED`/);
  assert.match(combined, /剩余可执行工作只有 `PLANNED` 占位节点/);
  assert.match(combined, /不要求重做 Discovery/);
  assert.match(combined, /可直接复制的继续提示词[\s\S]*`scd-project`/);
  assert.match(combined, /`EXTERNAL_OR_HUMAN_BLOCK`/);
  assert.match(combined, /`INVALID_OR_STALE_GRAPH`/);
  assert.match(combined, /不得只报告“没有 READY 节点”/);
  assert.match(combined, /不得将其实例化/);
});
