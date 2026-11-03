import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skills = fs.readdirSync(path.join(root, "skills")).filter(name => name.startsWith("scd-"));
const canonical = path.join(root, "skills/scd-quickdev/references/step-communication.md");

test("全部直接技能入口在工作流前加载唯一的步骤沟通规则", () => {
  assert.equal(skills.length, 13);
  for (const name of skills) {
    const entry = path.join(root, "skills", name, "SKILL.md");
    const source = fs.readFileSync(entry, "utf8");
    const links = [...source.matchAll(/\[步骤沟通\]\(([^)]+)\)/g)];
    assert.equal(links.length, 1, name);
    assert.equal(fs.realpathSync(path.resolve(path.dirname(entry), links[0][1])), fs.realpathSync(canonical), name);
    assert.match(source, /开始执行前必须先读取并遵守/);
    assert.ok(source.indexOf("[步骤沟通]") < source.indexOf("\n## "), name);
  }
});

test("模板醒目且每步说明具体行动与原因", () => {
  const source = fs.readFileSync(canonical, "utf8");
  assert.match(source, /```text\n======= 🧪 第 3 步：[\s\S]*\n🎯 做什么：[\s\S]*\n💡 为什么：[\s\S]*\n={7,}\n```/);
  assert.match(source, /直接调用任何子技能/);
  assert.match(source, /具体中文任务名/);
  assert.match(source, /步骤标题必须带与当前行动相符的图标/);
  assert.match(source, /图标不能代替文字/);
  assert.match(source, /必须注明当前第几步/);
  assert.match(source, /切换子技能不重置/);
  assert.match(source, /同一步进度更新沿用原编号/);
  assert.match(source, /目的、要消除的不确定性或要避免的风险/);
});

test("阶段切换和阻塞可见，同步操作不刷屏且不虚构进度", () => {
  const source = fs.readFileSync(canonical, "utf8");
  assert.match(source, /阶段切换、方向变化、等待用户或遇到阻塞/);
  assert.match(source, /同一步内连续的工具调用不重复/);
  assert.match(source, /总步数未知时只显示「第 N 步」，不编造总数/);
  assert.match(source, /缺失什么、为什么影响推进/);
  assert.match(source, /不替代原有确认、权限、验收或交付门/);
});
