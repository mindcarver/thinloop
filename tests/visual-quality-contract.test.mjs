import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const canonical = "scd-uiux/references/visual-quality.md";
const consumers = [
  "scd-uiux/SKILL.md",
  "scd-uiux/references/visual-evidence.md",
  "scd-quickdev/references/page-acceptance.md",
  "scd-ui-polish/SKILL.md",
];

function localLinks(file) {
  return [...fs.readFileSync(file, "utf8").matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)]
    .map(([, target]) => target)
    .filter(target => !target.includes("://"));
}

function sharedReference(skillsRoot, consumer) {
  const source = path.join(skillsRoot, consumer);
  const targets = localLinks(source).filter(target => target.endsWith("visual-quality.md"));
  assert.equal(targets.length, 1, `${consumer} must load one shared standard`);
  return fs.realpathSync(path.resolve(path.dirname(source), targets[0]));
}

test("design, page acceptance and standalone polishing resolve one shared visual contract", () => {
  const skillsRoot = path.join(root, "skills");
  const expected = fs.realpathSync(path.join(skillsRoot, canonical));
  for (const consumer of consumers) {
    assert.equal(sharedReference(skillsRoot, consumer), expected);
  }
  const guidance = fs.readFileSync(expected, "utf8");
  const dimensions = [...guidance.matchAll(/^\| ([a-z_]+) \/ /gm)].map(([, id]) => id);
  assert.deepEqual(dimensions, [
    "typography", "whitespace", "visual_hierarchy", "color",
    "motion", "micro_interaction", "responsive", "originality",
  ]);
});

test("new skill and shared references remain readable in supported installation layouts", () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "thinloop-visual-links-"));
  try {
    const registry = JSON.parse(fs.readFileSync(path.join(root, "config/platform-capabilities.json"), "utf8"));
    const sourceSkills = path.join(root, "skills");
    const names = fs.readdirSync(sourceSkills);
    for (const platform of registry.platforms) {
      const destination = path.join(temporary, platform.id, platform.installation.skillRoot);
      fs.mkdirSync(destination, { recursive: true });
      if (platform.installation.mode === "skill-links") {
        for (const name of names) {
          fs.symlinkSync(path.join(sourceSkills, name), path.join(destination, name), process.platform === "win32" ? "junction" : "dir");
        }
      } else {
        fs.cpSync(sourceSkills, destination, { recursive: true });
      }
      const expected = fs.realpathSync(path.join(destination, canonical));
      for (const consumer of consumers) {
        assert.equal(sharedReference(destination, consumer), expected, platform.id);
      }
      for (const target of localLinks(path.join(destination, "scd-ui-polish/SKILL.md"))) {
        assert.ok(fs.existsSync(path.resolve(destination, "scd-ui-polish", target)), `${platform.id}: ${target}`);
      }
      assert.ok(
        fs.existsSync(path.join(destination, "scd-uiux/scripts/dom-audit.mjs")),
        `${platform.id}: dom-audit.mjs must be present`,
      );
    }
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test("visual quality and page acceptance integrate dual-track thresholds and dom-audit norm review", () => {
  const quality = fs.readFileSync(path.join(root, "skills", canonical), "utf8");
  const pageAcceptance = fs.readFileSync(
    path.join(root, "skills/scd-quickdev/references/page-acceptance.md"),
    "utf8",
  );

  assert.match(quality, /展示\/营销\/内容型 Web/);
  assert.match(quality, /高密度工具\/工作台型 Web App/);
  assert.match(quality, /1\.35x–1\.75x/);
  assert.match(quality, /KPI 指标卡/);
  assert.match(quality, /桌面优先/);
  assert.match(quality, /窄屏可用或优雅降级/);

  for (const doc of [quality, pageAcceptance]) {
    assert.match(doc, /dom-audit\.mjs/);
    assert.match(doc, /--print-snippet/);
    assert.match(doc, /规范审/);
    assert.match(doc, /工作室主审/);
    for (const rule of [
      "horizontal_overflow",
      "small_body_text",
      "small_touch_target",
      "heading_hierarchy",
      "missing_accessible_name",
      "broken_image",
      "low_contrast",
    ]) {
      assert.match(doc, new RegExp(rule));
    }
  }
});
