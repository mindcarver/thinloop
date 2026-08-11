import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("uiux is composable and keeps clear UI changes on the direct path", () => {
  const skill = read("skills/scd-uiux/SKILL.md");

  assert.match(skill, /\*\*直接实施：\*\*/);
  assert.match(skill, /\*\*聚焦设计：\*\*/);
  assert.match(skill, /\*\*产品体验：\*\*/);
  assert.match(skill, /\*\*体验验证：\*\*/);
  assert.match(skill, /不提 UX 问题、不创建产物，直接交给 `scd-quickdev`/);
  assert.match(skill, /小型 UI 变更也不会因此进入“产品体验”路径/);
});

test("uiux composes with discovery without adding a product approval", () => {
  const skill = read("skills/scd-uiux/SKILL.md");
  const discovery = read("skills/scd-discovery/SKILL.md");
  const contract = read(
    "skills/scd-uiux/references/experience-contract.md",
  );

  assert.match(skill, /产品核心必须已经明确/);
  assert.match(skill, /只把该变更返回 `scd-discovery`/);
  assert.match(skill, /一次合并确认/);
  assert.match(discovery, /组合 `scd-uiux`/);
  assert.match(discovery, /同一个合并契约中统一确认/);
  assert.match(contract, /不增加确认门/);
});

test("uiux covers experience behavior and risk-adaptive visual evidence", () => {
  const skill = read("skills/scd-uiux/SKILL.md");
  const visual = read("skills/scd-uiux/references/visual-evidence.md");

  assert.match(skill, /旅程到界面的覆盖闭合/);
  assert.match(skill, /响应式和无障碍要求可测试/);
  assert.match(skill, /不强制使用 Figma/);
  assert.match(visual, /根据决策风险选择保真度/);
  assert.match(visual, /明确的非生产位置/);
  assert.match(visual, /文件存在或渲染命令成功，不代表视觉已经审查/);
});

test("uiux keeps the shared frontend-backend contract jointly owned", () => {
  const skill = read("skills/scd-uiux/SKILL.md");
  const contract = read(
    "skills/scd-uiux/references/experience-contract.md",
  );

  assert.match(skill, /不得单方面定稿/);
  assert.match(skill, /一个共享的机器可读接口契约/);
  assert.match(skill, /不要在 UX 产物中复制共享接口契约/);
  assert.match(contract, /未解决项标记为“接口需求”/);
  assert.match(contract, /前后端字段、操作、权限和错误语义继续由共享接口契约统一负责/);
});

test("uiux durable artifacts stay minimal and distinguish readiness from approval", () => {
  const skill = read("skills/scd-uiux/SKILL.md");
  const contract = read(
    "skills/scd-uiux/references/experience-contract.md",
  );
  const template = read("skills/scd-uiux/assets/ux-contract.md");

  assert.match(skill, /\.scd\/ux\/<slug>\.md/);
  assert.match(skill, /使用 `status: draft`/);
  assert.match(skill, /`status: ready`/);
  assert.match(skill, /不是第二次产品确认/);
  assert.match(contract, /优先保留一份功能 UX 契约/);
  assert.match(template, /managed_by: scd-uiux/);
  assert.match(template, /### 共享契约引用/);
});

test("quickdev consumes a ready UX handoff without confusing it for architecture", () => {
  const quickdev = read("skills/scd-quickdev/SKILL.md");

  assert.match(quickdev, /\.scd\/ux\/<slug>\.md/);
  assert.match(quickdev, /要求 `status: ready`/);
  assert.match(quickdev, /不得把 UX 接口需求当成 API/);
  assert.match(quickdev, /尚未统一的共享接口决策/);
});

test("the approved uiux specification retains A1 through A9", () => {
  const specification = read(".scd/specs/scd-uiux.md");

  assert.match(specification, /status: approved/);
  for (let index = 1; index <= 9; index += 1) {
    assert.match(specification, new RegExp(`^- A${index}:`, "m"));
  }
});
