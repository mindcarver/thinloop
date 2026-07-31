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
      /Investigate before asking/,
      /Establish the delivery slice/,
      /Interview through the decision tree/,
      /Review readiness and request approval/,
      /Persist the approved contract and hand off/,
    ],
    uiux: [
      /Start from product and repository truth/,
      /Establish the experience slice/,
      /Model behavior before polishing appearance/,
      /Use visual artifacts when seeing changes the decision/,
      /Review readiness and hand off/,
    ],
    architecture: [
      /Start from product and repository truth/,
      /Establish the design slice/,
      /Model domain and system responsibilities/,
      /Produce shared machine-readable contracts/,
      /Route changes and hand off/,
    ],
    project: [
      /Start from live project truth/,
      /Establish the project core/,
      /Decompose into delivery slices/,
      /Model the dependency DAG/,
      /Persist the Initiative and Delivery Issues/,
    ],
    execute: [
      /Start from live project truth/,
      /Select the current safe READY wave/,
      /Launch isolated QuickDev lanes/,
      /Merge and unlock serially/,
      /Prove project completion/,
    ],
    quickdev: [
      /Start from repository truth/,
      /Implement the smallest coherent change/,
      /Verify engineering acceptance/,
      /separate fresh-context subagent/,
      /Deliver through the pull request/,
    ],
    knowledge: [
      /Select the requested operation/,
      /Resolve the stores/,
      /Capture knowledge/,
      /Retrieve knowledge/,
      /Maintain knowledge/,
    ],
    maintenance: [
      /Select the operation/,
      /Start from repository truth/,
      /Audit activated surfaces/,
      /Produce evidence-backed findings/,
      /Repair selected findings/,
    ],
    evolve: [
      /Select the Mode/,
      /Diagnose and Propose/,
      /Assign a stable candidate ID/,
      /explicitly approves its candidate ID/,
      /Implement an Approved Candidate/,
    ],
    reengineering: [
      /Start from source and repository truth/,
      /Establish the compatibility envelope/,
      /Choose a direction with evidence/,
      /Materialize the reengineering project/,
      /Execute approved READY waves/,
    ],
    next: [
      /Select the scope/,
      /Inspect live project truth/,
      /Classify the current work/,
      /Recommend exactly one next action/,
      /Report the navigation snapshot/,
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
