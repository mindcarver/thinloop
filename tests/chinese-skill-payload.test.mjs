import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skillsRoot = path.join(root, "skills");
const han = /\p{Script=Han}/u;

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function collectPayloadFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectPayloadFiles(absolutePath));
    } else if (/\.(?:md|yaml)$/.test(entry.name)) {
      files.push(path.relative(root, absolutePath));
    }
  }
  return files.sort();
}

test("全部 Thinloop Skill 文本载荷均包含中文", () => {
  const files = fs
    .readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("scd-"))
    .flatMap((entry) => collectPayloadFiles(path.join(skillsRoot, entry.name)))
    .sort();

  assert.equal(files.length, 74); // Shared visual and step communication references.
  for (const file of files) {
    assert.match(read(file), han, file);
  }
});

test("十三个 Skill 描述与十二份 Agent 提示词均使用中文", () => {
  const skillFiles = fs
    .readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("scd-"))
    .map((entry) => `skills/${entry.name}/SKILL.md`)
    .sort();
  const agentFiles = skillFiles
    .map((file) => file.replace("/SKILL.md", "/agents/openai.yaml"))
    .filter((file) => fs.existsSync(path.join(root, file)));

  assert.equal(skillFiles.length, 13);
  assert.equal(agentFiles.length, 12);
  for (const file of skillFiles) {
    const description = read(file).match(/^description:\s*"([^"]+)"/m)?.[1];
    assert.match(description ?? "", han, file);
  }
  for (const file of agentFiles) {
    const yaml = read(file);
    for (const key of ["display_name", "short_description", "default_prompt"]) {
      const value = yaml.match(new RegExp(`^\\s*${key}:\\s*"([^"]+)"`, "m"))?.[1];
      assert.match(value ?? "", han, `${file}: ${key}`);
    }
  }
});

test("Issue 模板保持中文结构和规范机器标识", () => {
  const issueTemplates = [
    "skills/scd-discovery/references/artifacts.md",
    "skills/scd-project/references/project-contract.md",
    "skills/scd-quickdev/references/issue-delivery-contract.md",
  ].map(read);
  const combined = issueTemplates.join("\n");

  for (const heading of [
    "## 结果",
    "## 范围内",
    "## 范围外",
    "## 验收条件",
    "## 实施任务",
    "## 验证",
  ]) {
    assert.match(combined, new RegExp(heading));
  }
  assert.match(combined, /`FR-001`/);
  assert.match(combined, /READY/);
  assert.match(combined, /BLOCKED/);
  assert.match(combined, /schemaVersion/);
  assert.doesNotMatch(combined, /^## (?:Outcome|Acceptance|Implementation tasks|Verification)$/m);
});

test("QuickDev 默认确认技术计划与开工授权", () => {
  const skill = read("skills/scd-quickdev/SKILL.md");
  const contract = read("skills/scd-quickdev/references/planning-contract.md");
  assert.match(skill, /默认先只读调查/);
  assert.match(skill, /精确Git版本批准与明确开工授权/);
  assert.match(contract, /漏答保持待定/);
  assert.match(contract, /此前已存在的提交与精确文件清单/);
});
