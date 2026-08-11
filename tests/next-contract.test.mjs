import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("Next activates for progress and continuation questions", () => {
  const skill = read("skills/scd-next/SKILL.md");

  assert.match(skill, /哪些工作已完成、进行中、未完成/);
  assert.match(skill, /Issue、拉取请求、Initiative 或里程碑状态/);
  assert.match(skill, /不知道如何继续或恢复/);
  assert.match(skill, /普通 Issue 管理的仓库/);
});

test("Next classifies live state without inventing progress", () => {
  const skill = read("skills/scd-next/SKILL.md");
  const contract = read("skills/scd-next/references/status-contract.md");

  for (const state of [
    "DONE",
    "IN_FLIGHT",
    "READY",
    "PLANNED",
    "BLOCKED",
    "UNVERIFIED",
  ]) {
    assert.match(skill, new RegExp(`\\\`${state}\\\``));
    assert.match(contract, new RegExp(`\\\`${state}\\\``));
  }
  assert.match(skill, /不得编造工作量、时间或完成百分比/);
  assert.match(contract, /只有完整实时范围才允许精确计数/);
  assert.match(contract, /分支、提交、本地任务文件或实施者摘要永远不足以单独证明完成/);
});

test("Next recommends one owning skill and separates user action", () => {
  const skill = read("skills/scd-next/SKILL.md");
  const contract = read("skills/scd-next/references/status-contract.md");

  assert.match(skill, /只建议一个下一行动/);
  assert.match(skill, /priority not established/i);
  assert.match(skill, /用户行动：<无，或精确决策/);
  assert.match(skill, /可复制的继续提示词：/);
  for (const owner of [
    "scd-execute",
    "scd-quickdev",
    "scd-project",
    "scd-discovery",
    "scd-architecture",
  ]) {
    assert.match(skill, new RegExp(`\\\`${owner}\\\``));
    assert.match(contract, new RegExp(`\\\`${owner}\\\``));
  }
});

test("Next remains a read-only inspection pass", () => {
  const skill = read("skills/scd-next/SKILL.md");
  const contract = read("skills/scd-next/references/status-contract.md");

  assert.match(skill, /主动、只读检查/);
  assert.match(skill, /不是后台通知器、守护进程、调度器/);
  assert.match(skill, /不得创建或更新 Issues、评论、标签/);
  assert.match(contract, /但不得：/);
  assert.match(contract, /启动 QuickDev 通道或 Execute 波次/);
  assert.match(contract, /不授予修改权限/);
});

test("Project and Execute route status-only requests to Next", () => {
  const project = read("skills/scd-project/SKILL.md");
  const execute = read("skills/scd-execute/SKILL.md");

  assert.match(project, /状态[\s\S]*`scd-next`|`scd-next`[\s\S]*状态/s);
  assert.match(execute, /只要求报告进度[\s\S]*`scd-next`/s);
});
