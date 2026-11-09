#!/usr/bin/env node
// scd-uiux 设计知识检索：零依赖，检索 data/knowledge 与 data/stacks 的 CSV。
// 用法：node search.mjs <2-5 个关键词> [--domain <域>] [--limit N] [--json] [--list-domains]
// 无命中时退出码 1 并如实报告；不得把一般性建议当作检索结果。

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const knowledgeDir = path.resolve(here, "../data/knowledge");
const stacksDir = path.resolve(here, "../data/stacks");

const domains = {
  styles: ["knowledge/styles.csv"],
  typography: ["knowledge/typography.csv"],
  products: ["knowledge/products.csv"],
  reasoning: ["knowledge/ui-reasoning.csv"],
  ux: ["knowledge/ux-guidelines.csv"],
  icons: ["knowledge/icons.csv"],
  charts: ["knowledge/charts.csv"],
  motion: ["knowledge/motion.csv"],
  landing: ["knowledge/landing.csv"],
  stacks: null, // 聚合 data/stacks/*.csv
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

function loadDomain(name) {
  const files = domains[name] === null
    ? fs.readdirSync(stacksDir).filter((f) => f.endsWith(".csv")).map((f) => `stacks/${f}`)
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

function score(record, terms) {
  let hits = 0;
  let occurrences = 0;
  let bestField = "";
  for (const [k, v] of Object.entries(record)) {
    const hay = `${k} ${v}`.toLowerCase();
    let fieldHit = false;
    for (const t of terms) {
      const n = hay.split(t).length - 1;
      if (n > 0) { fieldHit = true; occurrences += n; }
    }
    if (fieldHit && !bestField) bestField = k;
    if (fieldHit) hits += 1;
  }
  return { hits, occurrences, bestField };
}

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
if (!flags.domain) flags.domain = null;

const domainsToSearch = flags.domain
  ? (domains[flags.domain] !== undefined || flags.domain === "stacks" ? [flags.domain] : null)
  : Object.keys(domains);
if (!domainsToSearch) {
  console.error(`未知域 "${flags.domain}"；可用域用 --list-domains 查看`);
  process.exit(2);
}

const results = [];
for (const d of domainsToSearch) {
  for (const item of loadDomain(d)) {
    const s = score(item.record, terms);
    if (s.hits >= Math.ceil(terms.length / 2)) {
      results.push({ domain: d, ...item, ...s });
    }
  }
}
results.sort((a, b) => b.hits - a.hits || b.occurrences - a.occurrences);

if (results.length === 0) {
  console.error(`无验证匹配（域: ${domainsToSearch.join(", ")}；词: ${terms.join(" ")}）。收窄或换域重试一次；仍无命中时如实报告，不输出一般性建议。`);
  process.exit(1);
}

const top = results.slice(0, flags.limit);
if (flags.json) {
  console.log(JSON.stringify(top.map(({ domain, source, row, record }) => ({ domain, source, row, record })), null, 2));
} else {
  for (const r of top) {
    const preview = Object.entries(r.record)
      .filter(([, v]) => v)
      .slice(0, 4)
      .map(([k, v]) => `${k}: ${String(v).slice(0, 90)}`)
      .join(" | ");
    console.log(`[${r.domain}] ${r.source}#L${r.row}（命中 ${r.hits}/${terms.length} 词）\n  ${preview}\n`);
  }
}
