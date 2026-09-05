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

test("uiux composes with discovery without duplicating product approval", () => {
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
  assert.match(contract, /重大新页面、整体改版或高成本视觉方向还需要一次视觉交付确认/);
  assert.match(contract, /与 Discovery 的合并确认同时完成/);
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

test("uiux requires project-owned visual delivery for consequential interface design", () => {
  const skill = read("skills/scd-uiux/SKILL.md");
  const contract = read(
    "skills/scd-uiux/references/experience-contract.md",
  );
  const visual = read("skills/scd-uiux/references/visual-evidence.md");
  const template = read("skills/scd-uiux/assets/ux-contract.md");
  const combined = `${skill}\n${contract}\n${visual}\n${template}`;

  assert.match(skill, /显式 UIUX 设计、重要新页面、重要用户流程或整体改版必须生成项目内可渲染的视觉产物/);
  assert.match(combined, /稳定视觉 ID/);
  assert.match(combined, /界面或组件族/);
  assert.match(combined, /旅程或验收/);
  assert.match(combined, /目标视口|视口/);
  assert.match(combined, /保真度/);
  assert.match(combined, /项目文件|仓库相对文件/);
  assert.match(combined, /代表性桌面和窄屏视口/);
  assert.match(combined, /可点击或可运行的.*非生产原型|可点击或可运行的轻量原型/);
  assert.match(combined, /外部.*链接[\s\S]*不能.*唯一视觉交付/);
  assert.match(template, /\.scd\/ux\/<slug>\/visuals/);
  assert.match(template, /## 实现对照验收/);
});

test("uiux blocks readiness on visual conflict or missing required confirmation", () => {
  const skill = read("skills/scd-uiux/SKILL.md");
  const contract = read(
    "skills/scd-uiux/references/experience-contract.md",
  );
  const visual = read("skills/scd-uiux/references/visual-evidence.md");
  const combined = `${skill}\n${contract}\n${visual}`;

  assert.match(combined, /重大新页面、整体改版或高成本视觉方向/);
  assert.match(combined, /一次明确确认/);
  assert.match(combined, /确认前保持 `draft`|取得一次明确确认后才能设为 `ready`/);
  assert.match(combined, /冲突时保持 `status: draft`|冲突时保持 `draft`/);
  assert.match(combined, /不得静默选择一方|不得静默指定一方优先/);
  assert.match(skill, /不恢复 QuickDev 的默认方案确认门/);
});

test("uiux keeps trivial local UI changes on the direct path without mandatory mockups", () => {
  const skill = read("skills/scd-uiux/SKILL.md");

  assert.match(skill, /文案、颜色、间距或局部组件变更[\s\S]*不强制扩大成设计项目/);
  assert.match(skill, /不提 UX 问题、不创建产物，直接交给 `scd-quickdev`/);
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
  assert.match(template, /## 视觉交付清单/);
  assert.match(template, /### 设计确认/);
  assert.match(template, /### 实现后最终视觉确认/);
});

test("uiux distinguishes design approval from post-implementation visual confirmation", () => {
  const skill = read("skills/scd-uiux/SKILL.md");
  const contract = read(
    "skills/scd-uiux/references/experience-contract.md",
  );
  const visual = read("skills/scd-uiux/references/visual-evidence.md");
  const template = read("skills/scd-uiux/assets/ux-contract.md");
  const combined = `${skill}\n${contract}\n${visual}\n${template}`;

  assert.match(combined, /设计确认和实现后确认是两个不同事实|单独决定是否需要“实现后最终视觉确认”/);
  assert.match(combined, /整体改版、高保真品牌表达/);
  assert.match(combined, /普通页面.*不需要|普通页面和明确局部变更默认“不需要”/);
  assert.match(skill, /不阻止设计契约先进入 `ready`/);
  assert.match(skill, /确认完成前阻止最终交付和关闭 Issue/);
  assert.match(template, /状态：<待实现\/待确认\/已确认\/不需要>/);
});

test("quickdev consumes a ready UX handoff without confusing it for architecture", () => {
  const quickdev = read("skills/scd-quickdev/SKILL.md") + "\n" +
    read("skills/scd-quickdev/references/scope-contract.md");

  assert.match(quickdev, /\.scd\/ux\/<slug>\.md/);
  assert.match(quickdev, /要求 `status: ready`/);
  assert.match(quickdev, /不得把 UX 接口需求当成 API/);
  assert.match(quickdev, /尚未统一的共享接口决策/);
  assert.match(quickdev, /视觉交付清单/);
  assert.match(quickdev, /每个视觉 ID/);
});

test("the approved uiux specification retains A1 through A9", () => {
  const specification = read(".scd/specs/scd-uiux.md");

  assert.match(specification, /status: approved/);
  for (let index = 1; index <= 9; index += 1) {
    assert.match(specification, new RegExp(`^- A${index}:`, "m"));
  }
});
