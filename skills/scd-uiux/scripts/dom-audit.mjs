#!/usr/bin/env node
// scd-uiux 浏览器 DOM 量化探测脚本：零依赖 ESM 模块。
// 既可在 Node 中通过 auditSnapshot(snapshot) 对结构化快照做确定性审计，
// 也可通过 --print-snippet 输出自包含浏览器片段，直接传入 page.evaluate(...) 或浏览器控制台。

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

export const AUDIT_RULES = Object.freeze([
  "horizontal_overflow",
  "small_body_text",
  "small_touch_target",
  "heading_hierarchy",
  "missing_accessible_name",
  "broken_image",
  "low_contrast",
]);

/**
 * 解析 CSS 颜色字符串，支持 #rgb / #rgba / #rrggbb / #rrggbbaa / rgb() / rgba() / transparent。
 * 返回归一化对象 { r, g, b, a }（r/g/b 为 0..255，a 为 0..1），无法解析时返回 null。
 */
export function parseColor(input) {
  if (input && typeof input === "object") {
    const { r, g, b, a = 1 } = input;
    if (
      Number.isFinite(r) &&
      Number.isFinite(g) &&
      Number.isFinite(b) &&
      Number.isFinite(a)
    ) {
      return {
        r: Math.min(255, Math.max(0, r)),
        g: Math.min(255, Math.max(0, g)),
        b: Math.min(255, Math.max(0, b)),
        a: Math.min(1, Math.max(0, a)),
      };
    }
    return null;
  }

  if (typeof input !== "string") return null;
  const raw = input.trim().toLowerCase();
  if (!raw) return null;
  if (raw === "transparent") return { r: 0, g: 0, b: 0, a: 0 };

  if (raw.startsWith("#")) {
    const hex = raw.slice(1);
    if (!/^[0-9a-f]+$/.test(hex)) return null;
    if (hex.length === 3 || hex.length === 4) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      const a = hex.length === 4 ? parseInt(hex[3] + hex[3], 16) / 255 : 1;
      return { r, g, b, a };
    }
    if (hex.length === 6 || hex.length === 8) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
      return { r, g, b, a };
    }
    return null;
  }

  const fnMatch = raw.match(/^rgba?\(\s*([^)]+)\s*\)$/);
  if (!fnMatch) return null;

  const body = fnMatch[1].trim();
  let rgbParts;
  let alphaRaw = null;

  if (body.includes(",")) {
    const parts = body.split(",").map((part) => part.trim());
    if (parts.length !== 3 && parts.length !== 4) return null;
    rgbParts = parts.slice(0, 3);
    if (parts.length === 4) alphaRaw = parts[3];
  } else {
    const slashParts = body.split("/").map((part) => part.trim());
    if (slashParts.length > 2) return null;
    rgbParts = slashParts[0].split(/\s+/).filter(Boolean);
    if (rgbParts.length !== 3) return null;
    if (slashParts.length === 2) alphaRaw = slashParts[1];
  }

  const numPattern = /^[+-]?(?:\d+\.?\d*|\.\d+)%?$/;
  const channels = [];
  for (const token of rgbParts) {
    if (!numPattern.test(token)) return null;
    const isPercent = token.endsWith("%");
    const value = Number.parseFloat(token);
    if (!Number.isFinite(value)) return null;
    const scaled = isPercent ? (value / 100) * 255 : value;
    channels.push(Math.min(255, Math.max(0, scaled)));
  }

  let alpha = 1;
  if (alphaRaw !== null) {
    if (!numPattern.test(alphaRaw)) return null;
    const isPercent = alphaRaw.endsWith("%");
    const value = Number.parseFloat(alphaRaw);
    if (!Number.isFinite(value)) return null;
    alpha = Math.min(1, Math.max(0, isPercent ? value / 100 : value));
  }

  return { r: channels[0], g: channels[1], b: channels[2], a: alpha };
}

/**
 * Porter-Duff source-over 合成：将半透明前景叠加在背景之上。
 */
export function compositeOver(foreground, background) {
  const fg = parseColor(foreground);
  const bg = parseColor(background);
  if (!fg || !bg) return null;
  const outA = fg.a + bg.a * (1 - fg.a);
  if (outA <= 0) return { r: 0, g: 0, b: 0, a: 0 };
  return {
    r: (fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / outA,
    g: (fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / outA,
    b: (fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / outA,
    a: outA,
  };
}

/**
 * 按 WCAG 2.1 sRGB 定义计算相对亮度 L ∈ [0, 1]。
 */
export function relativeLuminance(input) {
  const color = parseColor(input);
  if (!color) return null;
  const linearize = (channel) => {
    const s = channel / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return (
    0.2126 * linearize(color.r) +
    0.7152 * linearize(color.g) +
    0.0722 * linearize(color.b)
  );
}

/**
 * 按 WCAG 2.1 计算前景色与有效背景色的对比度（1..21）。
 * 若前景色或背景色含透明度，按白色画布基准先合成再计算。
 */
export function contrastRatio(foreground, background) {
  const fg = parseColor(foreground);
  const bg = parseColor(background);
  if (!fg || !bg) return null;
  const canvas = { r: 255, g: 255, b: 255, a: 1 };
  const effectiveBg = bg.a < 1 ? compositeOver(bg, canvas) : bg;
  const effectiveFg = fg.a < 1 ? compositeOver(fg, effectiveBg) : fg;
  const l1 = relativeLuminance(effectiveFg);
  const l2 = relativeLuminance(effectiveBg);
  if (l1 === null || l2 === null) return null;
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function parsePx(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function isBoldWeight(weight) {
  if (typeof weight === "number") return Number.isFinite(weight) && weight >= 700;
  if (typeof weight === "string") {
    const normalized = weight.trim().toLowerCase();
    if (normalized === "bold" || normalized === "bolder") return true;
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) && parsed >= 700;
  }
  return false;
}

/**
 * 对结构化 DOM 快照执行确定性硬底线审计，检测 7 类客观缺陷。
 */
export function auditSnapshot(snapshot, options = {}) {
  const {
    minFontSizePx = 12,
    minTouchTargetPx = 44,
    minNormalContrast = 4.5,
    minLargeContrast = 3.0,
  } = options;

  const data = snapshot && typeof snapshot === "object" ? snapshot : {};
  const counts = {
    horizontal_overflow: 0,
    small_body_text: 0,
    small_touch_target: 0,
    heading_hierarchy: 0,
    missing_accessible_name: 0,
    broken_image: 0,
    low_contrast: 0,
  };
  const issues = [];

  const pushIssue = (issue) => {
    counts[issue.rule] += 1;
    issues.push(issue);
  };

  // 1. horizontal_overflow：页面水平溢出（scrollWidth > clientWidth）
  const viewport = data.viewport && typeof data.viewport === "object" ? data.viewport : null;
  if (viewport) {
    const clientWidth = parsePx(viewport.clientWidth);
    const scrollWidth = parsePx(viewport.scrollWidth);
    if (
      clientWidth !== null &&
      scrollWidth !== null &&
      clientWidth > 0 &&
      scrollWidth > clientWidth
    ) {
      const overflowPx = Math.round((scrollWidth - clientWidth) * 100) / 100;
      pushIssue({
        rule: "horizontal_overflow",
        dimension: "responsive",
        severity: "error",
        selector: "document.documentElement",
        message: `页面存在水平溢出：scrollWidth (${scrollWidth}px) > clientWidth (${clientWidth}px)，超出 ${overflowPx}px`,
        actual: { scrollWidth, clientWidth, overflowPx },
        expected: { maxScrollWidth: clientWidth },
      });
    }
  }

  // 2. small_body_text & 7. low_contrast：可见文本字号与 WCAG 对比度
  const textNodes = Array.isArray(data.textNodes) ? data.textNodes : [];
  for (const node of textNodes) {
    if (!node || node.visible === false) continue;
    const text = typeof node.text === "string" ? node.text.trim() : "";
    if (!text) continue;
    const selector = node.selector || "(unknown-text)";
    const textPreview = text.length > 48 ? `${text.slice(0, 48)}…` : text;
    const fontSize = parsePx(node.fontSize);

    if (fontSize !== null && fontSize > 0 && fontSize < minFontSizePx) {
      pushIssue({
        rule: "small_body_text",
        dimension: "typography",
        severity: "error",
        selector,
        message: `可见文本字号过小：${fontSize}px < ${minFontSizePx}px（“${textPreview}”）`,
        actual: { fontSize, textPreview },
        expected: { minFontSize: minFontSizePx },
      });
    }

    const ratio = contrastRatio(node.color, node.backgroundColor);
    if (ratio !== null) {
      const bold = isBoldWeight(node.fontWeight);
      const isLargeText =
        fontSize !== null &&
        (fontSize >= 24 || (bold && fontSize >= (14 * 96) / 72 - 0.01));
      const minRatio = isLargeText ? minLargeContrast : minNormalContrast;
      if (ratio < minRatio) {
        const roundedRatio = Math.round(ratio * 100) / 100;
        pushIssue({
          rule: "low_contrast",
          dimension: "color",
          severity: "error",
          selector,
          message: `文本对比度不足：${roundedRatio}:1 < ${minRatio}:1（${isLargeText ? "大字" : "正文"}，“${textPreview}”）`,
          actual: {
            ratio: roundedRatio,
            color: node.color,
            backgroundColor: node.backgroundColor,
            fontSize,
            fontWeight: node.fontWeight ?? null,
            isLargeText,
            textPreview,
          },
          expected: { minRatio },
        });
      }
    }
  }

  // 3. small_touch_target & 5b. missing_accessible_name（交互控件）
  const interactiveElements = Array.isArray(data.interactiveElements)
    ? data.interactiveElements
    : [];
  for (const el of interactiveElements) {
    if (!el || el.visible === false) continue;
    const selector = el.selector || el.tag || "(unknown-control)";
    const width = parsePx(el.width);
    const height = parsePx(el.height);

    if (
      width !== null &&
      height !== null &&
      (width < minTouchTargetPx || height < minTouchTargetPx)
    ) {
      pushIssue({
        rule: "small_touch_target",
        dimension: "micro_interaction",
        severity: "error",
        selector,
        message: `交互控件触控目标过小：${width}×${height}px（要求至少 ${minTouchTargetPx}×${minTouchTargetPx}px）`,
        actual: { width, height },
        expected: { minWidth: minTouchTargetPx, minHeight: minTouchTargetPx },
      });
    }

    const tag = String(el.tag || "").toLowerCase();
    const inputType = String(el.type || "").toLowerCase();
    const valueAsName =
      tag === "input" &&
      (inputType === "submit" || inputType === "button" || inputType === "reset")
        ? el.value
        : "";
    const nameCandidates = [
      el.ariaLabelledByText,
      el.ariaLabel,
      el.labelText,
      el.text,
      valueAsName,
      el.title,
    ];
    const hasAccessibleName = nameCandidates.some(
      (candidate) => typeof candidate === "string" && candidate.trim().length > 0,
    );
    if (!hasAccessibleName) {
      pushIssue({
        rule: "missing_accessible_name",
        kind: "interactive_missing_name",
        dimension: "micro_interaction",
        severity: "error",
        selector,
        message: `交互控件缺少可访问名称（无可见文本、aria-label、aria-labelledby 或关联 label）`,
        actual: { tag: tag || null, role: el.role || null },
        expected: { accessibleNameRequired: true },
      });
    }
  }

  // 4. heading_hierarchy：多个 h1 或标题层级跳级（如 h1 直接跳到 h3）
  const headings = Array.isArray(data.headings)
    ? data.headings.filter(
        (h) =>
          h &&
          h.visible !== false &&
          Number.isInteger(h.level) &&
          h.level >= 1 &&
          h.level <= 6,
      )
    : [];
  const h1Headings = headings.filter((h) => h.level === 1);
  if (h1Headings.length > 1) {
    pushIssue({
      rule: "heading_hierarchy",
      kind: "multiple_h1",
      dimension: "typography",
      severity: "error",
      selector: h1Headings.map((h) => h.selector || "h1").join(", "),
      message: `页面存在 ${h1Headings.length} 个 h1 标题，每页应至多保留一个主 h1`,
      actual: {
        h1Count: h1Headings.length,
        selectors: h1Headings.map((h) => h.selector || "h1"),
      },
      expected: { maxH1Count: 1 },
    });
  }

  let prevLevel = null;
  for (const heading of headings) {
    if (prevLevel !== null && heading.level > prevLevel + 1) {
      pushIssue({
        rule: "heading_hierarchy",
        kind: "skipped_level",
        dimension: "typography",
        severity: "error",
        selector: heading.selector || `h${heading.level}`,
        message: `标题层级跳级：从 h${prevLevel} 直接跳到 h${heading.level}`,
        actual: { previousLevel: prevLevel, level: heading.level },
        expected: { maxNextLevel: prevLevel + 1 },
      });
    }
    prevLevel = heading.level;
  }

  // 5a. missing_accessible_name（信息性图片）& 6. broken_image（断链图片）
  const images = Array.isArray(data.images) ? data.images : [];
  for (const img of images) {
    if (!img || img.visible === false) continue;
    const selector = img.selector || "img";
    const role = String(img.role || "").trim().toLowerCase();
    const isDecorative =
      img.ariaHidden === true ||
      img.ariaHidden === "true" ||
      role === "presentation" ||
      role === "none";

    if (!isDecorative) {
      const altText = typeof img.alt === "string" ? img.alt.trim() : "";
      const ariaLabel = typeof img.ariaLabel === "string" ? img.ariaLabel.trim() : "";
      const labelledBy =
        typeof img.ariaLabelledByText === "string" ? img.ariaLabelledByText.trim() : "";
      if (!altText && !ariaLabel && !labelledBy) {
        pushIssue({
          rule: "missing_accessible_name",
          kind: "image_missing_alt",
          dimension: "micro_interaction",
          severity: "error",
          selector,
          message: `信息性图片缺少有效 alt 文本或可访问名称（装饰性图片请显式标记 aria-hidden="true" 或 role="presentation"）`,
          actual: { src: img.src ?? null, alt: img.alt ?? null },
          expected: { altOrDecorativeMarker: true },
        });
      }
    }

    if (
      img.complete === true &&
      typeof img.naturalWidth === "number" &&
      img.naturalWidth === 0
    ) {
      pushIssue({
        rule: "broken_image",
        dimension: "visual_hierarchy",
        severity: "error",
        selector,
        message: `检测到断链图片：complete 为 true 且 naturalWidth 为 0（src: ${img.src || "(空)"}）`,
        actual: {
          src: img.src ?? null,
          complete: true,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight ?? null,
        },
        expected: { minNaturalWidth: 1 },
      });
    }
  }

  const rulesTriggered = Object.keys(counts).filter((rule) => counts[rule] > 0);
  return {
    ok: issues.length === 0,
    url: data.url ?? null,
    viewport,
    summary: {
      status: issues.length === 0 ? "PASS" : "FAIL",
      totalIssues: issues.length,
      rulesTriggered,
    },
    counts,
    issues,
  };
}

function stripExport(fn) {
  return fn.toString().replace(/^export\s+/, "");
}

/**
 * 完整自包含的浏览器可执行函数源码字符串：
 * 可直接传入 Playwright/Puppeteer page.evaluate(BROWSER_AUDIT_SNIPPET) 或粘贴至浏览器控制台运行。
 */
export const BROWSER_AUDIT_SNIPPET = `(() => {
  ${stripExport(parseColor)}
  ${stripExport(compositeOver)}
  ${stripExport(relativeLuminance)}
  ${stripExport(contrastRatio)}
  ${stripExport(parsePx)}
  ${stripExport(isBoldWeight)}
  ${stripExport(auditSnapshot)}

  const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "SVG", "HEAD", "META", "LINK", "TITLE"]);

  function selectorOf(el) {
    if (!el || !el.tagName) return "(unknown)";
    let sel = el.tagName.toLowerCase();
    if (el.id) sel += "#" + el.id;
    const rawClass = typeof el.className === "string" ? el.className : "";
    const classes = rawClass.trim().split(/\\s+/).filter(Boolean).slice(0, 2);
    if (classes.length) sel += "." + classes.join(".");
    return sel;
  }

  function isStyleVisible(el, win) {
    let current = el;
    while (current && current.nodeType === 1) {
      const style = win.getComputedStyle(current);
      if (!style) return false;
      if (style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse") return false;
      const opacity = Number.parseFloat(style.opacity);
      if (Number.isFinite(opacity) && opacity <= 0) return false;
      current = current.parentElement;
    }
    return true;
  }

  function isElementVisible(el, win) {
    if (!el || !el.getBoundingClientRect) return false;
    if (!isStyleVisible(el, win)) return false;
    const style = win.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return false;
    if (rect.width <= 1 && rect.height <= 1 && style.overflow === "hidden") return false;
    return true;
  }

  function resolveEffectiveBackground(el, win) {
    const layers = [];
    let current = el;
    while (current && current.nodeType === 1) {
      const style = win.getComputedStyle(current);
      const parsed = style ? parseColor(style.backgroundColor) : null;
      if (parsed && parsed.a > 0) {
        layers.push(parsed);
        if (parsed.a >= 0.999) break;
      }
      current = current.parentElement;
    }
    let resolved = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = layers.length - 1; i >= 0; i -= 1) {
      resolved = compositeOver(layers[i], resolved) || resolved;
    }
    return \`rgb(\${Math.round(resolved.r)}, \${Math.round(resolved.g)}, \${Math.round(resolved.b)})\`;
  }

  function resolveAriaLabelledBy(el, doc) {
    const raw = el.getAttribute && el.getAttribute("aria-labelledby");
    if (!raw || !doc.getElementById) return "";
    return raw
      .trim()
      .split(/\\s+/)
      .map((id) => {
        const ref = doc.getElementById(id);
        return ref && ref.textContent ? ref.textContent.trim() : "";
      })
      .filter(Boolean)
      .join(" ");
  }

  function resolveFormLabel(el, doc) {
    if (el.labels && el.labels.length > 0) {
      const joined = Array.from(el.labels)
        .map((label) => (label.textContent || "").trim())
        .filter(Boolean)
        .join(" ");
      if (joined) return joined;
    }
    if (el.id && doc.querySelector) {
      const escaped = el.id.replace(/["\\\\]/g, "\\\\$&");
      const matched = doc.querySelector(\`label[for="\${escaped}"]\`);
      if (matched && matched.textContent && matched.textContent.trim()) {
        return matched.textContent.trim();
      }
    }
    const parentLabel = el.closest ? el.closest("label") : null;
    return parentLabel && parentLabel.textContent ? parentLabel.textContent.trim() : "";
  }

  function collectAccessibleText(el) {
    const ownText = (el.innerText ?? el.textContent ?? "").trim();
    if (ownText) return ownText;
    if (el.querySelectorAll) {
      const imgs = Array.from(el.querySelectorAll("img[alt]"));
      const alts = imgs.map((img) => (img.getAttribute("alt") || "").trim()).filter(Boolean);
      if (alts.length) return alts.join(" ");
    }
    return "";
  }

  function collectSnapshot(doc, win) {
    const docEl = doc.documentElement;
    const body = doc.body;
    const viewport = {
      clientWidth: docEl ? docEl.clientWidth : 0,
      scrollWidth: Math.max(docEl ? docEl.scrollWidth : 0, body ? body.scrollWidth : 0),
      clientHeight: docEl ? docEl.clientHeight : 0,
      scrollHeight: Math.max(docEl ? docEl.scrollHeight : 0, body ? body.scrollHeight : 0),
    };

    const textNodes = [];
    const allElements = doc.querySelectorAll ? Array.from(doc.querySelectorAll("*")) : [];
    for (const el of allElements) {
      if (!el.tagName || SKIP_TAGS.has(el.tagName.toUpperCase())) continue;
      if (!isElementVisible(el, win)) continue;
      const directText = Array.from(el.childNodes || [])
        .filter((node) => node.nodeType === 3)
        .map((node) => node.nodeValue || "")
        .join(" ")
        .trim();
      if (!directText) continue;
      const style = win.getComputedStyle(el);
      textNodes.push({
        selector: selectorOf(el),
        text: directText,
        fontSize: parsePx(style.fontSize),
        fontWeight: style.fontWeight,
        color: style.color,
        backgroundColor: resolveEffectiveBackground(el, win),
        visible: true,
      });
    }

    const interactiveSelector = [
      "button",
      "a[href]",
      'input:not([type="hidden"])',
      "select",
      "textarea",
      "summary",
      '[role="button"]',
      '[role="link"]',
      '[role="checkbox"]',
      '[role="radio"]',
      '[role="switch"]',
      '[role="tab"]',
      '[role="menuitem"]',
    ].join(", ");
    const interactiveElements = [];
    const interactiveList = doc.querySelectorAll ? Array.from(doc.querySelectorAll(interactiveSelector)) : [];
    for (const el of interactiveList) {
      if (!isElementVisible(el, win)) continue;
      const rect = el.getBoundingClientRect();
      interactiveElements.push({
        selector: selectorOf(el),
        tag: el.tagName ? el.tagName.toLowerCase() : "",
        role: (el.getAttribute && el.getAttribute("role")) || null,
        type: (el.getAttribute && el.getAttribute("type")) || "",
        width: Math.round(rect.width * 100) / 100,
        height: Math.round(rect.height * 100) / 100,
        text: collectAccessibleText(el),
        ariaLabel: (el.getAttribute && el.getAttribute("aria-label")) || "",
        ariaLabelledByText: resolveAriaLabelledBy(el, doc),
        labelText: resolveFormLabel(el, doc),
        value: typeof el.value === "string" ? el.value : "",
        title: (el.getAttribute && el.getAttribute("title")) || "",
        visible: true,
      });
    }

    const headings = [];
    const headingList = doc.querySelectorAll
      ? Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"]'))
      : [];
    for (const el of headingList) {
      if (!isElementVisible(el, win)) continue;
      const tag = el.tagName ? el.tagName.toLowerCase() : "";
      let level = /^h[1-6]$/.test(tag)
        ? Number.parseInt(tag.slice(1), 10)
        : Number.parseInt((el.getAttribute && el.getAttribute("aria-level")) || "", 10);
      if (!Number.isInteger(level) || level < 1 || level > 6) continue;
      headings.push({
        selector: selectorOf(el),
        level,
        text: (el.textContent || "").trim(),
        visible: true,
      });
    }

    const images = [];
    const imageList = doc.querySelectorAll ? Array.from(doc.querySelectorAll('img, [role="img"]')) : [];
    for (const el of imageList) {
      const isImgTag = el.tagName && el.tagName.toLowerCase() === "img";
      const isBrokenImg = isImgTag && Boolean(el.complete) && typeof el.naturalWidth === "number" && el.naturalWidth === 0;
      if (!(isElementVisible(el, win) || (isBrokenImg && isStyleVisible(el, win)))) continue;
      const hiddenAttr = el.getAttribute && el.getAttribute("aria-hidden") === "true";
      const hiddenAncestor = Boolean(el.closest && el.closest('[aria-hidden="true"]'));
      images.push({
        selector: selectorOf(el),
        tag: el.tagName ? el.tagName.toLowerCase() : "img",
        src: (el.getAttribute && el.getAttribute("src")) || el.currentSrc || null,
        hasAltAttr: Boolean(el.hasAttribute && el.hasAttribute("alt")),
        alt: el.getAttribute ? el.getAttribute("alt") : null,
        ariaLabel: (el.getAttribute && el.getAttribute("aria-label")) || "",
        ariaLabelledByText: resolveAriaLabelledBy(el, doc),
        ariaHidden: hiddenAttr || hiddenAncestor,
        role: (el.getAttribute && el.getAttribute("role")) || "",
        complete: isImgTag ? Boolean(el.complete) : false,
        naturalWidth: isImgTag && typeof el.naturalWidth === "number" ? el.naturalWidth : null,
        naturalHeight: isImgTag && typeof el.naturalHeight === "number" ? el.naturalHeight : null,
        visible: true,
      });
    }

    return {
      url: win.location && win.location.href ? win.location.href : null,
      viewport,
      textNodes,
      interactiveElements,
      headings,
      images,
    };
  }

  return auditSnapshot(collectSnapshot(document, window));
})()`;

function usage() {
  return [
    "用法:",
    "  node dom-audit.mjs --print-snippet           输出自包含浏览器 DOM 探测代码片段",
    "  node dom-audit.mjs --snapshot <file.json|->  对结构化 DOM 快照 JSON 运行量化审计",
  ].join("\n");
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(usage());
    process.exit(0);
  }

  if (argv.includes("--print-snippet")) {
    console.log(BROWSER_AUDIT_SNIPPET);
    process.exit(0);
  }

  const snapshotIndex = argv.indexOf("--snapshot");
  if (snapshotIndex !== -1) {
    const target = argv[snapshotIndex + 1];
    if (!target) {
      console.error("缺少 --snapshot 文件路径\n" + usage());
      process.exit(2);
    }
    const raw =
      target === "-"
        ? fs.readFileSync(0, "utf8")
        : fs.readFileSync(path.resolve(target), "utf8");
    const snapshot = JSON.parse(raw);
    const result = auditSnapshot(snapshot);
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.ok ? 0 : 1);
  }

  console.error(usage());
  process.exit(2);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  main();
}
