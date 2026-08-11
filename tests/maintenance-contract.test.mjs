import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  collectSignals,
  formatText,
} from "../skills/scd-maintenance/scripts/collect-signals.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("maintenance is explicitly invoked and supports audit and repair", () => {
  const skill = read("skills/scd-maintenance/SKILL.md");

  assert.match(skill, /适用于用户明确要求检查、清理、统一、现代化或减少/);
  assert.match(skill, /普通功能开发[\s\S]*不得自动调用/);
  assert.match(skill, /\*\*审计：\*\*/);
  assert.match(skill, /\*\*修复：\*\*/);
  assert.match(skill, /\*\*聚焦：\*\*/);
  assert.match(skill, /第一批不超过三个发现/);
  assert.match(skill, /改用 `scd-reengineering`/);
  assert.match(skill, /不负责再工程方向或执行图/);
});

test("maintenance resolves authority instead of assuming code is correct", () => {
  const skill = read("skills/scd-maintenance/SKILL.md");
  const audit = read("skills/scd-maintenance/references/audit-contract.md");

  assert.match(skill, /代码可以执行不代表代码自动正确/);
  assert.match(audit, /\*\*规范契约：\*\*/);
  assert.match(audit, /\*\*可执行行为：\*\*/);
  assert.match(audit, /\*\*说明性材料：\*\*/);
  assert.match(audit, /更新或可执行的产物不会自动成为权威/);
});

test("maintenance findings require evidence and avoid speculative cleanup", () => {
  const skill = read("skills/scd-maintenance/SKILL.md");
  const audit = read("skills/scd-maintenance/references/audit-contract.md");

  assert.match(skill, /精确文件、行号、符号、命令或运行时证据/);
  assert.match(skill, /区分已确认债务和调查线索/);
  assert.match(skill, /不得把风格偏好/);
  assert.match(audit, /文件年龄、提交年龄、模型意见/);
  assert.match(audit, /不得用“全仓库”掩盖部分扫描/);
});

test("maintenance repairs are bounded, coupled, and verified", () => {
  const skill = read("skills/scd-maintenance/SKILL.md");
  const repair = read("skills/scd-maintenance/references/repair-contract.md");

  assert.match(skill, /把有边界的变更交给 `scd-quickdev`/);
  assert.match(skill, /不得自行暂存、提交、推送、发布、部署/);
  assert.match(repair, /修复最多三个/);
  assert.match(repair, /仅文本搜索不能证明/);
  assert.match(repair, /更新每个直接耦合表面/);
  assert.match(repair, /把每个发现标识映射到观察证据/);
});

test("maintenance report template preserves evidence and blind spots", () => {
  const report = read("skills/scd-maintenance/assets/maintenance-report.md");

  assert.match(report, /managed_by: scd-maintenance/);
  assert.match(report, /## 已执行检查/);
  assert.match(report, /## 已确认发现/);
  assert.match(report, /## 调查线索/);
  assert.match(report, /## 检查盲区/);
});

test("collector finds deterministic drift and keeps valid references quiet", () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "scd-maintenance-"));

  try {
    fs.mkdirSync(path.join(fixture, "docs"), { recursive: true });
    fs.mkdirSync(path.join(fixture, "src"), { recursive: true });
    fs.writeFileSync(
      path.join(fixture, "package.json"),
      JSON.stringify({ scripts: { build: "node build.mjs" } }),
    );
    fs.writeFileSync(path.join(fixture, "docs", "existing.md"), "# Existing\n");
    fs.writeFileSync(
      path.join(fixture, "README.md"),
      [
        "[valid](./docs/existing.md)",
        "[missing](./docs/removed.md)",
        "```markdown",
        "[template](./docs/template-placeholder.md)",
        "```",
        "```bash",
        "npm run build",
        "npm run vanished",
        "```",
        "",
      ].join("\n"),
    );
    fs.writeFileSync(
      path.join(fixture, "src", "index.js"),
      "// TODO: remove compatibility shim after v2\n",
    );

    const result = collectSignals(fixture);
    const messages = result.findings.map((finding) => finding.message);

    assert.ok(messages.some((message) => message.includes("removed.md")));
    assert.ok(messages.some((message) => message.includes("vanished")));
    assert.ok(messages.some((message) => message.includes("compatibility shim")));
    assert.ok(!messages.some((message) => message.includes("existing.md")));
    assert.ok(!messages.some((message) => message.includes("template-placeholder.md")));
    assert.ok(!messages.some((message) => message.endsWith(": build")));
    assert.match(formatText(result), /Repository maintenance signals/);
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});
