import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("knowledge is explicit-only and supports capture, retrieval, and maintenance", () => {
  const skill = read("skills/scd-knowledge/SKILL.md");

  assert.match(skill, /只有用户明确请求时运行/);
  assert.match(skill, /普通开发期间不得自动调用/);
  assert.match(skill, /\*\*沉淀：\*\*/);
  assert.match(skill, /\*\*检索：\*\*/);
  assert.match(skill, /\*\*维护：\*\*/);
});

test("knowledge keeps project and personal Markdown stores separate", () => {
  const skill = read("skills/scd-knowledge/SKILL.md");
  const storage = read(
    "skills/scd-knowledge/references/storage-contract.md",
  );

  assert.match(skill, /\.scd\/knowledge\//);
  assert.match(skill, /<user-home>\/\.scd\/config\.json/);
  assert.match(storage, /"knowledge_root"/);
  assert.match(storage, /必须是绝对路径/);
  assert.match(storage, /保留全部无关配置键/);
  assert.match(storage, /不是有效 JSON[\s\S]*不得覆盖/);
  assert.match(storage, /仍在选中的项目或个人知识根目录内/);
  assert.match(storage, /不得把个人绝对路径提交到项目文件/);
});

test("capture requires evidence, classification, and approval", () => {
  const skill = read("skills/scd-knowledge/SKILL.md");
  const contract = read(
    "skills/scd-knowledge/references/knowledge-contract.md",
  );

  assert.match(skill, /必须有支持证据/);
  assert.match(skill, /用户明确陈述的实践本身可以作为有归属来源/);
  assert.match(skill, /可移植性不确定时优先项目范围/);
  assert.match(skill, /请求一次明确确认/);
  assert.match(contract, /一次有证据支持的发生就足够/);
});

test("knowledge stays concise and retrieval uses progressive disclosure", () => {
  const skill = read("skills/scd-knowledge/SKILL.md");
  const entry = read("skills/scd-knowledge/assets/knowledge-entry.md");
  const index = read("skills/scd-knowledge/assets/knowledge-index.md");

  assert.match(skill, /通常不超过三个条目/);
  assert.match(skill, /不读取 `archive\/`/);
  assert.match(skill, /优先更具体的项目指引/);
  assert.match(entry, /- 触发条件：/);
  assert.match(entry, /- 指引：/);
  assert.match(entry, /- 边界：/);
  assert.match(entry, /- 证据：/);
  assert.match(entry, /- 来源：/);
  assert.match(index, /\]\(entries\/slug\.md\)/);
});

test("knowledge lifecycle avoids silent duplication and conflict", () => {
  const skill = read("skills/scd-knowledge/SKILL.md");
  const contract = read(
    "skills/scd-knowledge/references/knowledge-contract.md",
  );

  assert.match(skill, /\*\*重复：\*\* 不写入/);
  assert.match(skill, /\*\*冲突：\*\*/);
  assert.match(skill, /每次更新、合并、替换或归档前都要确认/);
  assert.match(contract, /把旧文件移到 `archive\/`/);
  assert.match(contract, /归档条目不参与普通检索/);
});

test("knowledge admits only hard-to-discover behavior-relevant experience", () => {
  const skill = read("skills/scd-knowledge/SKILL.md");
  const contract = read(
    "skills/scd-knowledge/references/knowledge-contract.md",
  );

  for (const [skillBarrier, contractBarrier] of [
    ["语义障碍", "语义"],
    ["位置障碍", "位置"],
    ["行为障碍", "行为"],
  ]) {
    assert.match(skill, new RegExp(`\\*\\*${skillBarrier}：\\*\\*`));
    assert.match(contract, new RegExp(`\\*\\*${contractBarrier}：\\*\\*`));
  }
  assert.match(skill, /很可能改变后续 Agent 决策或行动/);
  assert.match(skill, /不是必需持久字段/);
  assert.match(contract, /通用建议/);
  assert.match(contract, /一次性指令/);
});

test("knowledge matches evidence to claims and validates repository facts", () => {
  const skill = read("skills/scd-knowledge/SKILL.md");
  const contract = read(
    "skills/scd-knowledge/references/knowledge-contract.md",
  );

  assert.match(skill, /证据必须与声明匹配/);
  assert.match(skill, /验证每个具名路径、符号、方法、命令、配置键和版本/);
  assert.match(skill, /不能单独证明运行时行为/);
  assert.match(contract, /聚焦测试或运行时结果/);
  assert.match(contract, /仅存在不能证明运行时或因果声明/);
  assert.match(contract, /陈旧或错误/);
});

test("knowledge protects boundaries during deduplication and updates", () => {
  const skill = read("skills/scd-knowledge/SKILL.md");
  const contract = read(
    "skills/scd-knowledge/references/knowledge-contract.md",
  );

  assert.match(skill, /不能仅因 A 与 B 重叠、B 与 C 重叠就桥接合并/);
  assert.match(skill, /必须存在唯一合适目标/);
  assert.match(contract, /不得因为候选 A 与 B 重叠、B 与 C 重叠而桥接合并/);
  assert.match(contract, /多个历史条目都可能是更新目标/);
  assert.match(contract, /保留最窄有效触发条件/);
});

test("post-delivery review stays explicit and behavior claims stay causal", () => {
  const skill = read("skills/scd-knowledge/SKILL.md");
  const contract = read(
    "skills/scd-knowledge/references/knowledge-contract.md",
  );

  assert.match(skill, /用户明确要求评审已完成交付/);
  assert.match(skill, /不得自动开始，也不授权写入/);
  assert.match(contract, /作为依据的 Issue 与验收边界/);
  assert.match(contract, /受控成对案例/);
  assert.match(contract, /不能单独证明因果/);
});

test("knowledge blocks secrets and honest write failures", () => {
  const skill = read("skills/scd-knowledge/SKILL.md");
  const storage = read(
    "skills/scd-knowledge/references/storage-contract.md",
  );

  assert.match(skill, /绝不写入凭据/);
  assert.match(skill, /不得声称已持久化/);
  assert.match(storage, /不得悄悄在跨项目知识和项目知识之间重新分类/);
  assert.match(storage, /条目和索引都能回读/);
  assert.doesNotMatch(skill, /C:\\Users\\/);
  assert.doesNotMatch(skill, /\/Users\/[^<]/);
});

test("the approved knowledge specification retains A1 through A11", () => {
  const specification = read(".scd/specs/scd-knowledge.md");

  assert.match(specification, /status: approved/);
  for (let index = 1; index <= 11; index += 1) {
    assert.match(specification, new RegExp(`^- A${index}:`, "m"));
  }
  for (let index = 12; index <= 15; index += 1) {
    assert.match(specification, new RegExp(`^- A${index}:`, "m"));
  }
});
