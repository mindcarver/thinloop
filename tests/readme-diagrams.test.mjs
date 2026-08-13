import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const flowDirectory = path.join(root, "assets", "flows");
const slugs = [
  "discovery",
  "uiux",
  "architecture",
  "project",
  "execute",
  "quickdev",
  "knowledge",
  "maintenance",
  "evolve",
  "reengineering",
  "next",
];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("README flow diagrams are reproducible", () => {
  const result = spawnSync(
    process.execPath,
    ["scripts/generate-readme-diagrams.mjs", "--check"],
    { cwd: root, encoding: "utf8" },
  );

  assert.equal(result.status, 0, result.stderr);
});

test("README references the overview and all eleven skill diagrams with alt text", () => {
  const readme = read("README.md");
  const expectedFiles = [
    "thinloop-overview.svg",
    ...slugs.map((slug) => `scd-${slug}.svg`),
  ];

  for (const fileName of expectedFiles) {
    const reference = `./assets/flows/${fileName}`;
    assert.match(readme, new RegExp(`<img src="${reference.replaceAll(".", "\\.")}" alt="[^"]{12,}"`));
    assert.ok(fs.existsSync(path.join(flowDirectory, fileName)), reference);
  }
});

test("diagram stage summaries remain traceable to authoritative skill workflows", () => {
  const diagramTitles = {
    discovery: "SCD 需求澄清",
    uiux: "SCD 体验设计",
    architecture: "SCD 架构设计",
    project: "SCD 项目拆解",
    execute: "SCD 项目执行",
    quickdev: "SCD 快速开发",
    knowledge: "SCD 知识沉淀",
    maintenance: "SCD 仓库维护",
    evolve: "SCD 技能演进",
    reengineering: "SCD 项目再工程",
    next: "SCD 下一步导航",
  };
  const evidence = {
    discovery: [
      /先调查，再提问/,
      /确定交付切片/,
      /沿决策树访谈/,
      /审查就绪度并请求确认/,
      /持久化已确认契约并交接/,
    ],
    uiux: [
      /从产品事实和仓库事实出发/,
      /确定体验切片/,
      /先建模行为，再打磨外观/,
      /形成可实施的视觉交付/,
      /审查就绪度并交接/,
    ],
    architecture: [
      /从产品事实和仓库事实出发/,
      /确定设计切片/,
      /建模领域与系统职责/,
      /生成共享的机器可读契约/,
      /路由变更并交接/,
    ],
    project: [
      /从实时项目事实出发/,
      /确定项目核心/,
      /拆解交付切片/,
      /建模依赖 DAG/,
      /持久化 Initiative 与 Delivery Issues/,
    ],
    execute: [
      /从实时项目事实出发/,
      /选择当前安全 READY 波次/,
      /启动隔离的 QuickDev 通道/,
      /串行合并并解锁/,
      /证明项目完成/,
    ],
    quickdev: [
      /从仓库事实出发/,
      /实施最小且连贯的变更/,
      /验证工程验收/,
      /审计整个 Issue 是否完成/,
      /独立的新上下文子 Agent/,
    ],
    knowledge: [
      /选择请求的操作/,
      /解析知识库/,
      /沉淀知识/,
      /检索知识/,
      /维护知识/,
    ],
    maintenance: [
      /选择操作/,
      /从仓库事实出发/,
      /审计已触发表面/,
      /生成有证据支持的发现/,
      /修复选中发现/,
    ],
    evolve: [
      /选择模式/,
      /诊断并建议/,
      /分配稳定候选 ID/,
      /明确确认其候选 ID/,
      /实施已确认候选项/,
    ],
    reengineering: [
      /从来源和仓库事实出发/,
      /建立兼容性边界/,
      /用证据选择方向/,
      /实例化再工程项目/,
      /执行已确认 READY 波次/,
    ],
    next: [
      /选择范围/,
      /检查实时项目事实/,
      /分类当前工作/,
      /只建议一个下一行动/,
      /报告导航快照/,
    ],
  };

  for (const [slug, patterns] of Object.entries(evidence)) {
    const skill = read(`skills/scd-${slug}/SKILL.md`);
    const diagram = read(`assets/flows/scd-${slug}.svg`);
    for (const pattern of patterns) {
      assert.match(skill, pattern, `scd-${slug}: ${pattern}`);
    }
    assert.match(diagram, new RegExp(diagramTitles[slug]));
  }
});
