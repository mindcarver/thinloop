import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

import {
  AUDIT_RULES,
  BROWSER_AUDIT_SNIPPET,
  auditSnapshot,
  compositeOver,
  contrastRatio,
  parseColor,
} from "../skills/scd-uiux/scripts/dom-audit.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scriptPath = path.join(root, "skills", "scd-uiux", "scripts", "dom-audit.mjs");

function makeCleanSnapshot() {
  return {
    url: "http://localhost:3000/workspace",
    viewport: {
      clientWidth: 1440,
      scrollWidth: 1440,
      clientHeight: 900,
      scrollHeight: 1600,
    },
    textNodes: [
      {
        selector: "h1.page-title",
        text: "运营工作台",
        fontSize: 24,
        fontWeight: 600,
        color: "#0f172a",
        backgroundColor: "#ffffff",
      },
      {
        selector: "p.body-copy",
        text: "正文内容清晰易读，对比度达标。",
        fontSize: 14,
        fontWeight: 400,
        color: "#1e293b",
        backgroundColor: "#ffffff",
      },
      {
        selector: "p.large-muted",
        text: "24px 大号标题适用 3.0:1 阈值",
        fontSize: 24,
        fontWeight: 400,
        color: "#949494",
        backgroundColor: "#ffffff",
      },
      {
        selector: "p.large-bold-muted",
        text: "14pt 粗体同样适用 3.0:1 阈值",
        fontSize: 18.67,
        fontWeight: 700,
        color: "#949494",
        backgroundColor: "#ffffff",
      },
    ],
    interactiveElements: [
      {
        selector: "button.primary-submit",
        tag: "button",
        width: 120,
        height: 44,
        text: "保存配置",
      },
      {
        selector: "button.icon-close",
        tag: "button",
        width: 44,
        height: 44,
        text: "",
        ariaLabel: "关闭抽屉",
      },
      {
        selector: "button.icon-delete",
        tag: "button",
        width: 44,
        height: 44,
        text: "",
        ariaLabelledByText: "删除当前条目",
      },
      {
        selector: "input#email",
        tag: "input",
        type: "email",
        width: 260,
        height: 44,
        labelText: "工作邮箱",
      },
      {
        selector: "input.submit-btn",
        tag: "input",
        type: "submit",
        width: 96,
        height: 44,
        value: "立即提交",
      },
    ],
    headings: [
      { selector: "h1.page-title", level: 1, text: "运营工作台" },
      { selector: "h2.kpi-section", level: 2, text: "核心指标" },
      { selector: "h3.kpi-sub", level: 3, text: "近七日趋势" },
      { selector: "h2.table-section", level: 2, text: "任务列表" },
    ],
    images: [
      {
        selector: "img.hero-diagram",
        src: "/assets/architecture.png",
        alt: "系统数据流架构图",
        complete: true,
        naturalWidth: 800,
        naturalHeight: 450,
      },
      {
        selector: "img.decor-dots",
        src: "/assets/dots.svg",
        alt: "",
        ariaHidden: true,
        complete: true,
        naturalWidth: 24,
        naturalHeight: 24,
      },
      {
        selector: "img.decor-divider",
        src: "/assets/divider.svg",
        alt: "",
        role: "presentation",
        complete: true,
        naturalWidth: 120,
        naturalHeight: 2,
      },
    ],
  };
}

test("parseColor and contrastRatio implement WCAG 2.1 across hex, rgb and rgba formats", () => {
  assert.deepEqual(parseColor("#000"), { r: 0, g: 0, b: 0, a: 1 });
  assert.deepEqual(parseColor("#fff"), { r: 255, g: 255, b: 255, a: 1 });
  assert.deepEqual(parseColor("#2563EB"), { r: 37, g: 99, b: 235, a: 1 });
  assert.deepEqual(parseColor("rgb(15, 23, 42)"), { r: 15, g: 23, b: 42, a: 1 });
  assert.deepEqual(parseColor("rgba(15, 23, 42, 0.5)"), {
    r: 15,
    g: 23,
    b: 42,
    a: 0.5,
  });
  assert.deepEqual(parseColor("rgb(15 23 42 / 50%)"), {
    r: 15,
    g: 23,
    b: 42,
    a: 0.5,
  });
  assert.deepEqual(parseColor("transparent"), { r: 0, g: 0, b: 0, a: 0 });
  assert.equal(parseColor("not-a-color"), null);
  assert.equal(parseColor("#12"), null);

  assert.equal(Math.round(contrastRatio("#000", "#fff") * 100) / 100, 21);
  assert.equal(Math.round(contrastRatio("#fff", "#fff") * 100) / 100, 1);

  const passNormal = contrastRatio("#767676", "#ffffff");
  const failNormal = contrastRatio("#777777", "#ffffff");
  assert.ok(passNormal >= 4.5, `expected #767676 on #fff >= 4.5, got ${passNormal}`);
  assert.ok(failNormal < 4.5, `expected #777777 on #fff < 4.5, got ${failNormal}`);

  const semiOverWhite = contrastRatio("rgba(0, 0, 0, 0.5)", "#ffffff");
  assert.ok(semiOverWhite > 3.9 && semiOverWhite < 4.0, `got ${semiOverWhite}`);

  const blended = compositeOver("rgba(0, 0, 0, 0.5)", "#ffffff");
  assert.equal(Math.round(blended.r), 128);
});

test("auditSnapshot returns ok: true with zero alerts on a clean compliant snapshot", () => {
  const result = auditSnapshot(makeCleanSnapshot());
  assert.equal(result.ok, true);
  assert.equal(result.summary.status, "PASS");
  assert.equal(result.summary.totalIssues, 0);
  assert.deepEqual(result.summary.rulesTriggered, []);
  assert.deepEqual(result.issues, []);
  for (const rule of AUDIT_RULES) {
    assert.equal(result.counts[rule], 0, rule);
  }
});

test("auditSnapshot detects rule 1: horizontal_overflow (positive and negative)", () => {
  const snap = makeCleanSnapshot();
  snap.viewport = { clientWidth: 390, scrollWidth: 428 };
  const result = auditSnapshot(snap);
  assert.equal(result.ok, false);
  assert.equal(result.counts.horizontal_overflow, 1);
  assert.equal(result.issues[0].rule, "horizontal_overflow");
  assert.equal(result.issues[0].actual.overflowPx, 38);

  snap.viewport = { clientWidth: 390, scrollWidth: 390 };
  assert.equal(auditSnapshot(snap).ok, true);
});

test("auditSnapshot detects rule 2: small_body_text (positive and negative)", () => {
  const snap = makeCleanSnapshot();
  snap.textNodes.push(
    {
      selector: "span.tiny-caption",
      text: "超小辅助说明",
      fontSize: 10.5,
      fontWeight: 400,
      color: "#1e293b",
      backgroundColor: "#ffffff",
    },
    {
      selector: "span.hidden-tiny",
      text: "不可见元素不误报",
      fontSize: 9,
      fontWeight: 400,
      color: "#1e293b",
      backgroundColor: "#ffffff",
      visible: false,
    },
    {
      selector: "span.boundary-ok",
      text: "12px 合法下限",
      fontSize: 12,
      fontWeight: 400,
      color: "#1e293b",
      backgroundColor: "#ffffff",
    },
  );
  const result = auditSnapshot(snap);
  assert.equal(result.ok, false);
  assert.equal(result.counts.small_body_text, 1);
  assert.equal(result.issues[0].selector, "span.tiny-caption");
});

test("auditSnapshot detects rule 3: small_touch_target (positive and negative)", () => {
  const snap = makeCleanSnapshot();
  snap.interactiveElements.push(
    {
      selector: "button.too-short",
      tag: "button",
      width: 60,
      height: 32,
      text: "筛选",
    },
    {
      selector: "a.too-narrow",
      tag: "a",
      width: 28,
      height: 44,
      text: "详情",
    },
    {
      selector: "button.exact-44",
      tag: "button",
      width: 44,
      height: 44,
      text: "确定",
    },
  );
  const result = auditSnapshot(snap);
  assert.equal(result.ok, false);
  assert.equal(result.counts.small_touch_target, 2);
  assert.deepEqual(
    result.issues.map((i) => i.selector),
    ["button.too-short", "a.too-narrow"],
  );
});

test("auditSnapshot detects rule 4: heading_hierarchy (multiple h1 and skipped levels)", () => {
  const multiH1 = makeCleanSnapshot();
  multiH1.headings = [
    { selector: "h1.first", level: 1, text: "主标题一" },
    { selector: "h2.sub", level: 2, text: "分节" },
    { selector: "h1.second", level: 1, text: "主标题二" },
  ];
  const r1 = auditSnapshot(multiH1);
  assert.equal(r1.ok, false);
  assert.equal(r1.counts.heading_hierarchy, 1);
  assert.equal(r1.issues[0].kind, "multiple_h1");

  const skipped = makeCleanSnapshot();
  skipped.headings = [
    { selector: "h1.main", level: 1, text: "主标题" },
    { selector: "h3.jumped", level: 3, text: "跳级三级标题" },
  ];
  const r2 = auditSnapshot(skipped);
  assert.equal(r2.ok, false);
  assert.equal(r2.counts.heading_hierarchy, 1);
  assert.equal(r2.issues[0].kind, "skipped_level");
  assert.equal(r2.issues[0].selector, "h3.jumped");
});

test("auditSnapshot detects rule 5: missing_accessible_name for informative images and controls while skipping decorative images", () => {
  const snap = makeCleanSnapshot();
  snap.images.push(
    {
      selector: "img.no-alt",
      src: "/chart.png",
      alt: null,
      complete: true,
      naturalWidth: 400,
      naturalHeight: 200,
    },
    {
      selector: "img.blank-alt-non-decor",
      src: "/chart-2.png",
      alt: "",
      complete: true,
      naturalWidth: 400,
      naturalHeight: 200,
    },
    {
      selector: "img.role-none-decor",
      src: "/bg.svg",
      alt: null,
      role: "none",
      complete: true,
      naturalWidth: 16,
      naturalHeight: 16,
    },
  );
  snap.interactiveElements.push(
    {
      selector: "button.nameless-icon",
      tag: "button",
      width: 44,
      height: 44,
      text: "",
      ariaLabel: "",
    },
    {
      selector: "input.unlabelled-text",
      tag: "input",
      type: "text",
      width: 200,
      height: 44,
      value: "已有输入值不等于可访问名称",
    },
  );

  const result = auditSnapshot(snap);
  assert.equal(result.ok, false);
  assert.equal(result.counts.missing_accessible_name, 4);
  assert.deepEqual(
    result.issues.map((i) => i.selector).sort(),
    [
      "button.nameless-icon",
      "img.blank-alt-non-decor",
      "img.no-alt",
      "input.unlabelled-text",
    ],
  );
});

test("auditSnapshot detects rule 6: broken_image (complete && naturalWidth === 0)", () => {
  const snap = makeCleanSnapshot();
  snap.images.push(
    {
      selector: "img.broken-banner",
      src: "/missing.png",
      alt: "产品横幅",
      complete: true,
      naturalWidth: 0,
      naturalHeight: 0,
    },
    {
      selector: "img.still-loading",
      src: "/loading.png",
      alt: "加载中图片",
      complete: false,
      naturalWidth: 0,
      naturalHeight: 0,
    },
  );

  const result = auditSnapshot(snap);
  assert.equal(result.ok, false);
  assert.equal(result.counts.broken_image, 1);
  assert.equal(result.issues[0].selector, "img.broken-banner");
});

test("auditSnapshot detects rule 7: low_contrast for normal and large text thresholds", () => {
  const snap = makeCleanSnapshot();
  snap.textNodes.push(
    {
      selector: "p.weak-body",
      text: "低对比正文",
      fontSize: 14,
      fontWeight: 400,
      color: "#777777",
      backgroundColor: "#ffffff",
    },
    {
      selector: "p.non-bold-19",
      text: "19px 非粗体仍需 4.5:1",
      fontSize: 19,
      fontWeight: 400,
      color: "#949494",
      backgroundColor: "#ffffff",
    },
    {
      selector: "h2.weak-large",
      text: "24px 大字低于 3.0:1",
      fontSize: 24,
      fontWeight: 600,
      color: "#969696",
      backgroundColor: "#ffffff",
    },
  );

  const result = auditSnapshot(snap);
  assert.equal(result.ok, false);
  assert.equal(result.counts.low_contrast, 3);
  assert.deepEqual(
    result.issues.map((i) => i.selector),
    ["p.weak-body", "p.non-bold-19", "h2.weak-large"],
  );
});

test("BROWSER_AUDIT_SNIPPET has valid syntax and runs end-to-end against a mock browser DOM", () => {
  // 语法合法性校验
  assert.doesNotThrow(() => new Function(BROWSER_AUDIT_SNIPPET));
  assert.doesNotThrow(() => new Function(`return (${BROWSER_AUDIT_SNIPPET});`));

  function createMockEl({
    tagName,
    id = "",
    className = "",
    attrs = {},
    text = "",
    style = {},
    rect = { width: 120, height: 48 },
    parentElement = null,
    complete = false,
    naturalWidth = undefined,
    naturalHeight = undefined,
    value = "",
  }) {
    const computed = {
      display: "block",
      visibility: "visible",
      opacity: "1",
      overflow: "visible",
      fontSize: "14px",
      fontWeight: "400",
      color: "rgb(30, 41, 59)",
      backgroundColor: "rgba(0, 0, 0, 0)",
      ...style,
    };
    const el = {
      nodeType: 1,
      tagName: tagName.toUpperCase(),
      id,
      className,
      parentElement,
      complete,
      naturalWidth,
      naturalHeight,
      value,
      innerText: text,
      textContent: text,
      childNodes: text ? [{ nodeType: 3, nodeValue: text }] : [],
      _computed: computed,
      getAttribute: (name) => (Object.hasOwn(attrs, name) ? attrs[name] : null),
      hasAttribute: (name) => Object.hasOwn(attrs, name),
      getBoundingClientRect: () => rect,
      closest: () => null,
      querySelectorAll: () => [],
    };
    return el;
  }

  const bodyEl = createMockEl({
    tagName: "body",
    style: { backgroundColor: "rgb(255, 255, 255)" },
  });
  const h1El = createMockEl({
    tagName: "h1",
    className: "title",
    text: "主标题",
    style: { fontSize: "24px", fontWeight: "700", color: "rgb(15, 23, 42)" },
    parentElement: bodyEl,
  });
  const h3El = createMockEl({
    tagName: "h3",
    className: "skipped",
    text: "跳级小标题",
    style: { fontSize: "11px", color: "rgb(150, 150, 150)" },
    parentElement: bodyEl,
  });
  const badButton = createMockEl({
    tagName: "button",
    className: "icon-only",
    text: "",
    rect: { width: 32, height: 32 },
    parentElement: bodyEl,
  });
  const brokenImg = createMockEl({
    tagName: "img",
    className: "broken",
    attrs: { src: "/404.png" },
    rect: { width: 0, height: 0 },
    complete: true,
    naturalWidth: 0,
    naturalHeight: 0,
    parentElement: bodyEl,
  });

  const mockDocument = {
    documentElement: { clientWidth: 390, scrollWidth: 440, clientHeight: 844, scrollHeight: 900 },
    body: { scrollWidth: 440, scrollHeight: 900 },
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: (selector) => {
      if (selector === "*") return [bodyEl, h1El, h3El, badButton, brokenImg];
      if (selector.includes("button")) return [badButton];
      if (selector.includes("h1")) return [h1El, h3El];
      if (selector.includes("img")) return [brokenImg];
      return [];
    },
  };
  const mockWindow = {
    location: { href: "http://localhost:4173/demo" },
    getComputedStyle: (el) => el._computed,
  };

  const audited = vm.runInNewContext(BROWSER_AUDIT_SNIPPET, {
    document: mockDocument,
    window: mockWindow,
  });

  assert.equal(audited.ok, false);
  for (const rule of AUDIT_RULES) {
    assert.ok(audited.counts[rule] >= 1, `expected browser snippet to detect ${rule}`);
  }
});

test("CLI supports --print-snippet and --snapshot stdin evaluation", () => {
  const printed = spawnSync(process.execPath, [scriptPath, "--print-snippet"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(printed.status, 0, printed.stderr);
  assert.equal(printed.stdout.trim(), BROWSER_AUDIT_SNIPPET.trim());
  assert.doesNotThrow(() => new Function(printed.stdout));

  const cleanRun = spawnSync(process.execPath, [scriptPath, "--snapshot", "-"], {
    cwd: root,
    input: JSON.stringify(makeCleanSnapshot()),
    encoding: "utf8",
  });
  assert.equal(cleanRun.status, 0, cleanRun.stderr);
  assert.equal(JSON.parse(cleanRun.stdout).ok, true);

  const badSnap = makeCleanSnapshot();
  badSnap.viewport = { clientWidth: 390, scrollWidth: 450 };
  const badRun = spawnSync(process.execPath, [scriptPath, "--snapshot", "-"], {
    cwd: root,
    input: JSON.stringify(badSnap),
    encoding: "utf8",
  });
  assert.equal(badRun.status, 1);
  const badReport = JSON.parse(badRun.stdout);
  assert.equal(badReport.ok, false);
  assert.equal(badReport.counts.horizontal_overflow, 1);
});
