import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const uiuxDir = path.join(root, "skills", "scd-uiux");
const searchScript = path.join(uiuxDir, "scripts", "search.mjs");

const EXPECTED_WEB_STACKS = [
  "angular.csv",
  "astro.csv",
  "html-tailwind.csv",
  "laravel.csv",
  "nextjs.csv",
  "nuxt-ui.csv",
  "nuxtjs.csv",
  "react.csv",
  "shadcn.csv",
  "svelte.csv",
  "threejs.csv",
  "vue.csv",
];

const REMOVED_NON_WEB_STACKS = [
  "avalonia.csv",
  "flutter.csv",
  "javafx.csv",
  "jetpack-compose.csv",
  "react-native.csv",
  "swiftui.csv",
  "uno.csv",
  "uwp.csv",
  "winui.csv",
  "wpf.csv",
];

function dirByteSize(dir) {
  let total = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) total += dirByteSize(full);
    else total += fs.statSync(full).size;
  }
  return total;
}

function runSearch(args) {
  return spawnSync(process.execPath, [searchScript, ...args], {
    cwd: root,
    encoding: "utf8",
  });
}

test("scd-uiux removes dead vendor corpus and non-Web stacks, staying under 2 MB", () => {
  assert.equal(fs.existsSync(path.join(uiuxDir, "data", "vendor")), false);

  const stacks = fs
    .readdirSync(path.join(uiuxDir, "data", "stacks"))
    .filter((file) => file.endsWith(".csv"))
    .sort();
  assert.deepEqual(stacks, EXPECTED_WEB_STACKS);
  for (const removed of REMOVED_NON_WEB_STACKS) {
    assert.equal(stacks.includes(removed), false, removed);
  }

  const bytes = dirByteSize(uiuxDir);
  assert.ok(
    bytes <= 2 * 1024 * 1024,
    `skills/scd-uiux size ${bytes} bytes exceeds 2 MB cap`,
  );

  const notices = fs.readFileSync(
    path.join(uiuxDir, "data", "THIRD-PARTY-NOTICES.md"),
    "utf8",
  );
  assert.match(notices, /12 张 Web 技术栈 CSV/);
  assert.match(notices, /移除未接入检索的 `vendor\/design-systems\/`/);
});

test("search.mjs matches both English and Chinese design keywords and rejects unmatched queries", () => {
  const en = runSearch(["dark", "dashboard", "--json"]);
  assert.equal(en.status, 0, en.stderr);
  const enRows = JSON.parse(en.stdout);
  assert.ok(enRows.length > 0);

  const zhTable = runSearch(["暗色", "表格", "--json"]);
  assert.equal(zhTable.status, 0, zhTable.stderr);
  const zhTableRows = JSON.parse(zhTable.stdout);
  assert.ok(zhTableRows.length > 0);

  const zhTypo = runSearch(["字体", "排版", "--domain", "typography", "--json"]);
  assert.equal(zhTypo.status, 0, zhTypo.stderr);
  assert.ok(JSON.parse(zhTypo.stdout).length > 0);

  const zhCompound = runSearch(["后台管理系统", "暗色", "--json"]);
  assert.equal(zhCompound.status, 0, zhCompound.stderr);
  assert.ok(JSON.parse(zhCompound.stdout).length > 0);

  const miss = runSearch(["xyzzy不存在设计词条", "qwerty9999"]);
  assert.equal(miss.status, 1);
  assert.match(miss.stderr, /无验证匹配/);

  const stacks = runSearch(["react", "--domain", "stacks", "--json"]);
  assert.equal(stacks.status, 0, stacks.stderr);
  const stackRows = JSON.parse(stacks.stdout);
  assert.ok(stackRows.length > 0);
  for (const row of stackRows) {
    assert.equal(REMOVED_NON_WEB_STACKS.includes(row.source), false, row.source);
  }
});

test("scd-uiux SKILL.md documents English keyword preference and Chinese synonym fallback", () => {
  const skill = fs.readFileSync(path.join(uiuxDir, "SKILL.md"), "utf8");
  assert.match(skill, /优先传入英文设计关键词/);
  assert.match(skill, /高频中文设计词同义映射/);
});
