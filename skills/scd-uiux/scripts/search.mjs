#!/usr/bin/env node
// scd-uiux 设计知识检索：零依赖，检索 data/knowledge 与 data/stacks 的 Web 语料 CSV。
// 用法：node search.mjs <2-5 个关键词> [--domain <域>] [--limit N] [--json] [--list-domains]
// 推荐优先传入英文设计关键词；内置高频中英设计词同义映射以兼容中文查询。
// 无命中时退出码 1 并如实报告；不得把一般性建议当作检索结果。

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const knowledgeDir = path.resolve(here, "../data/knowledge");
const stacksDir = path.resolve(here, "../data/stacks");

export const domains = {
  styles: ["knowledge/styles.csv"],
  typography: ["knowledge/typography.csv"],
  products: ["knowledge/products.csv"],
  reasoning: ["knowledge/ui-reasoning.csv"],
  ux: ["knowledge/ux-guidelines.csv"],
  icons: ["knowledge/icons.csv"],
  charts: ["knowledge/charts.csv"],
  motion: ["knowledge/motion.csv"],
  landing: ["knowledge/landing.csv"],
  stacks: null, // 聚合 data/stacks/*.csv（仅 Web 技术栈）
};

// 高频中英设计词同义映射：仅在中文关键词检索英文语料时扩展候选词，
// 未知词不做猜测扩展，保持无命中即退出码 1 的诚实语义。
export const ZH_SYNONYMS = {
  暗色: ["dark"],
  深色: ["dark"],
  亮色: ["light"],
  浅色: ["light"],
  表格: ["table", "grid", "data"],
  数据表: ["table", "data", "grid"],
  后台: ["dashboard", "admin", "saas"],
  工作台: ["dashboard", "workspace", "saas"],
  看板: ["dashboard", "analytics"],
  仪表盘: ["dashboard", "analytics"],
  排版: ["typography", "font"],
  字体: ["typography", "font"],
  衬线: ["serif"],
  无衬线: ["sans"],
  等宽: ["mono", "monospace"],
  配色: ["color", "palette"],
  色彩: ["color", "palette"],
  卡片: ["card"],
  导航: ["navigation", "nav", "sidebar"],
  侧边栏: ["sidebar", "navigation"],
  表单: ["form", "input"],
  输入: ["input", "form"],
  弹窗: ["modal", "dialog"],
  抽屉: ["drawer", "sheet"],
  按钮: ["button"],
  图标: ["icon"],
  图表: ["chart", "graph", "visualization"],
  动效: ["motion", "animation", "transition"],
  动画: ["motion", "animation"],
  过渡: ["transition", "motion"],
  微交互: ["micro", "interaction", "hover"],
  响应式: ["responsive", "mobile"],
  移动端: ["mobile", "responsive"],
  无障碍: ["accessibility", "a11y", "aria"],
  极简: ["minimal", "minimalism", "clean"],
  复古: ["retro", "vintage"],
  现代: ["modern"],
  落地页: ["landing", "hero"],
  首屏: ["hero", "landing"],
  定价: ["pricing"],
  电商: ["ecommerce", "commerce", "shop"],
  金融: ["fintech", "finance"],
  医疗: ["healthcare", "medical"],
  文档: ["documentation", "docs", "editorial"],
  博客: ["editorial", "blog"],
  编辑: ["editorial", "content"],
  留白: ["whitespace", "spacing"],
  间距: ["spacing", "whitespace"],
  层级: ["hierarchy"],
  阴影: ["shadow", "elevation"],
  渐变: ["gradient"],
  玻璃: ["glass", "glassmorphism"],
  圆角: ["radius", "rounded"],
  对比度: ["contrast"],
  加载: ["loading", "skeleton"],
  空态: ["empty"],
  错误: ["error"],
  搜索: ["search"],
  筛选: ["filter"],
  标签: ["tag", "badge", "tab"],
  分页: ["pagination"],
  通知: ["toast", "notification", "alert"],
  反馈: ["feedback", "toast"],
  设计系统: ["design system", "token"],
  令牌: ["token"],
  企业: ["enterprise", "b2b", "saas"],
  工具: ["tool", "productivity", "saas"],
  代码: ["code", "developer", "mono"],
};

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i += 1; } else quoted = false;
      } else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i += 1;
      row.push(cell); cell = "";
      if (row.some((v) => v !== "")) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((v) => v !== "")) rows.push(row);
  return rows;
}

export function expandTerm(rawTerm) {
  const normalized = rawTerm.toLowerCase().trim();
  const candidates = new Set([normalized]);
  if (ZH_SYNONYMS[normalized]) {
    for (const mapped of ZH_SYNONYMS[normalized]) candidates.add(mapped);
  } else if (/[\u4e00-\u9fff]/.test(normalized)) {
    for (const [zh, enList] of Object.entries(ZH_SYNONYMS)) {
      if (normalized.includes(zh)) {
        for (const mapped of enList) candidates.add(mapped);
      }
    }
  }
  return [...candidates];
}

function loadDomain(name) {
  const files = domains[name] === null
    ? fs.readdirSync(stacksDir).filter((f) => f.endsWith(".csv")).sort().map((f) => `stacks/${f}`)
    : domains[name];
  const out = [];
  for (const rel of files) {
    const full = rel.startsWith("stacks/")
      ? path.join(stacksDir, path.basename(rel))
      : path.join(knowledgeDir, path.basename(rel));
    if (!fs.existsSync(full)) continue;
    const rows = parseCsv(fs.readFileSync(full, "utf8"));
    if (rows.length < 2) continue;
    const header = rows[0];
    for (let r = 1; r < rows.length; r += 1) {
      const record = {};
      header.forEach((h, i) => { record[h] = rows[r][i] ?? ""; });
      out.push({ source: path.basename(rel), row: r + 1, record });
    }
  }
  return out;
}

export function score(record, termGroups) {
  const combined = Object.entries(record)
    .map(([k, v]) => `${k} ${v}`)
    .join(" ")
    .toLowerCase();
  let matchedTerms = 0;
  let occurrences = 0;
  for (const group of termGroups) {
    let groupMatched = false;
    for (const candidate of group) {
      if (!candidate) continue;
      const n = combined.split(candidate).length - 1;
      if (n > 0) {
        groupMatched = true;
        occurrences += n;
      }
    }
    if (groupMatched) matchedTerms += 1;
  }
  return { hits: matchedTerms, occurrences };
}

export function searchCatalog(rawTerms, { domain = null, limit = 5 } = {}) {
  const domainsToSearch = domain
    ? (domains[domain] !== undefined || domain === "stacks" ? [domain] : null)
    : Object.keys(domains);
  if (!domainsToSearch) {
    throw new Error(`未知域 "${domain}"；可用域用 --list-domains 查看`);
  }
  const termGroups = rawTerms.map(expandTerm);
  const threshold = Math.ceil(termGroups.length / 2);
  const results = [];
  for (const d of domainsToSearch) {
    for (const item of loadDomain(d)) {
      const s = score(item.record, termGroups);
      if (s.hits >= threshold) {
        results.push({ domain: d, ...item, ...s });
      }
    }
  }
  results.sort((a, b) => b.hits - a.hits || b.occurrences - a.occurrences);
  return { domainsToSearch, results: results.slice(0, limit), total: results.length };
}

function main() {
  const argv = process.argv.slice(2);
  const flags = { domain: null, limit: 5, json: false, list: false };
  const terms = [];
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--domain") flags.domain = argv[++i];
    else if (a === "--limit") flags.limit = Number(argv[++i]);
    else if (a === "--json") flags.json = true;
    else if (a === "--list-domains") flags.list = true;
    else terms.push(a.toLowerCase());
  }

  if (flags.list) {
    console.log(Object.keys(domains).join("\n"));
    process.exit(0);
  }
  if (terms.length < 1) {
    console.error("用法: node search.mjs <关键词...> [--domain <域>] [--limit N] [--json] [--list-domains]");
    process.exit(2);
  }

  let output;
  try {
    output = searchCatalog(terms, flags);
  } catch (error) {
    console.error(error.message);
    process.exit(2);
  }

  if (output.results.length === 0) {
    console.error(`无验证匹配（域: ${output.domainsToSearch.join(", ")}；词: ${terms.join(" ")}）。收窄或换域重试一次；仍无命中时如实报告，不输出一般性建议。`);
    process.exit(1);
  }

  if (flags.json) {
    console.log(JSON.stringify(output.results.map(({ domain, source, row, record }) => ({ domain, source, row, record })), null, 2));
  } else {
    for (const r of output.results) {
      const preview = Object.entries(r.record)
        .filter(([, v]) => v)
        .slice(0, 4)
        .map(([k, v]) => `${k}: ${String(v).slice(0, 90)}`)
        .join(" | ");
      console.log(`[${r.domain}] ${r.source}#L${r.row}（命中 ${r.hits}/${terms.length} 词）\n  ${preview}\n`);
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main();
}
