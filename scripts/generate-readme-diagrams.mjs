import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const outputDirectory = path.join(root, "assets", "flows");
const checkOnly = process.argv.includes("--check");
const fontFamily =
  "'PingFang SC', 'Microsoft YaHei', 'Noto Sans CJK SC', ui-monospace, monospace";

const palette = {
  paper: "#f2e4bd",
  paperLight: "#f8edcf",
  navy: "#17313b",
  teal: "#4f7773",
  orange: "#c55c2f",
  olive: "#6f7453",
};

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

const skillFlows = [
  {
    slug: "discovery",
    index: "01",
    title: "SCD 需求澄清",
    subtitle: "从 0 到 1 → 已批准产品契约",
    stages: [
      ["用户", "问题"],
      ["MVP", "边界"],
      ["需求", "与指标"],
      ["批准", "PRD"],
      ["任务单", "或项目图"],
    ],
  },
  {
    slug: "uiux",
    index: "02",
    title: "SCD 体验设计",
    subtitle: "产品意图 → 可交付体验",
    stages: [
      ["产品", "核心"],
      ["用户旅程", "与状态"],
      ["视觉", "证据"],
      ["界面", "衔接"],
      ["就绪", "交付"],
    ],
  },
  {
    slug: "architecture",
    index: "03",
    title: "SCD 架构设计",
    subtitle: "产品规则 → 机器契约",
    stages: [
      ["仓库", "事实"],
      ["设计", "切片"],
      ["领域", "边界"],
      ["机器", "契约"],
      ["就绪", "交付"],
    ],
  },
  {
    slug: "project",
    index: "04",
    title: "SCD 项目拆解",
    subtitle: "批准产品契约 → 可执行任务图",
    stages: [
      ["PRD", "基线"],
      ["交付", "切片"],
      ["依赖", "图"],
      ["就绪", "校验"],
      ["任务单", "集合"],
    ],
  },
  {
    slug: "execute",
    index: "05",
    title: "SCD 项目执行",
    subtitle: "已批准任务图 → 安全交付波次",
    stages: [
      ["项目图", "复核"],
      ["就绪波次", "选择"],
      ["隔离任务", "并行"],
      ["逐个合并", "重算"],
      ["集成", "验收"],
    ],
  },
  {
    slug: "quickdev",
    index: "06",
    title: "SCD 快速开发",
    subtitle: "任务单 → 验证并合并的代码",
    stages: [
      ["GITHUB", "任务单"],
      ["诊断", "与实现"],
      ["工程", "检查"],
      ["独立审查", "与验收"],
      ["合并主分支", "关闭任务单"],
    ],
  },
  {
    slug: "knowledge",
    index: "07",
    title: "SCD 知识沉淀",
    subtitle: "已证实经验 → 可用知识",
    stages: [
      ["显式", "请求"],
      ["定位", "存储"],
      ["证据", "与范围"],
      ["确认", "变更"],
      ["写入", "或检索"],
    ],
  },
  {
    slug: "maintenance",
    index: "08",
    title: "SCD 仓库维护",
    subtitle: "仓库信号 → 有边界的修复",
    stages: [
      ["选择", "范围"],
      ["收集", "信号"],
      ["核实", "问题"],
      ["有界", "修复"],
      ["复核", "证据"],
    ],
  },
  {
    slug: "evolve",
    index: "09",
    title: "SCD 技能演进",
    subtitle: "已观察失败 → 可回滚试验",
    stages: [
      ["可见", "证据"],
      ["原因", "归因"],
      ["识别", "候选"],
      ["人工", "批准"],
      ["试验", "或回滚"],
    ],
  },
  {
    slug: "reengineering",
    index: "10",
    title: "SCD 项目再工程",
    subtitle: "旧系统 → 可验证的新实现",
    stages: [
      ["固定", "上游"],
      ["行为", "基线"],
      ["兼容", "边界"],
      ["任务图", "执行"],
      ["集成", "验收"],
    ],
  },
];

function svgFrame({ title, subtitle, index, body, height = 280 }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="${height}" viewBox="0 0 1200 ${height}" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(title)}</title>
  <desc id="desc">${escapeXml(subtitle)}</desc>
  <defs>
    <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
      <path d="M 24 0 L 0 0 0 24" fill="none" stroke="${palette.navy}" stroke-width="0.55" opacity="0.1"/>
    </pattern>
    <filter id="paperNoise" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="3" seed="11"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="table" tableValues="0 0.08"/></feComponentTransfer>
    </filter>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="${palette.orange}"/>
    </marker>
  </defs>
  <rect width="1200" height="${height}" rx="18" fill="${palette.paper}"/>
  <rect width="1200" height="${height}" rx="18" fill="url(#grid)"/>
  <rect width="1200" height="${height}" rx="18" filter="url(#paperNoise)" opacity="0.8"/>
  <rect x="12" y="12" width="1176" height="${height - 24}" rx="12" fill="none" stroke="${palette.navy}" stroke-width="2"/>
  <path d="M 18 44 H 30 M 24 38 V 50 M 1170 44 H 1182 M 1176 38 V 50" stroke="${palette.orange}" stroke-width="2"/>
  <rect x="34" y="30" width="82" height="30" rx="15" fill="${palette.navy}"/>
  <text x="75" y="51" fill="${palette.paperLight}" text-anchor="middle" font-family="${fontFamily}" font-size="14" font-weight="700">${escapeXml(index)}</text>
  <text x="132" y="49" fill="${palette.navy}" font-family="${fontFamily}" font-size="25" font-weight="800" letter-spacing="1.2">${escapeXml(title)}</text>
  <text x="1166" y="48" fill="${palette.teal}" text-anchor="end" font-family="${fontFamily}" font-size="13" font-weight="700" letter-spacing="1.4">${escapeXml(subtitle)}</text>
  <line x1="34" y1="76" x2="1166" y2="76" stroke="${palette.navy}" stroke-width="1.5" opacity="0.55"/>
  ${body}
</svg>
`;
}

function renderSkillFlow(flow) {
  const nodeWidth = 172;
  const nodeHeight = 82;
  const gap = 57;
  const startX = 54;
  const y = 126;
  const nodes = flow.stages
    .map((stage, stageIndex) => {
      const x = startX + stageIndex * (nodeWidth + gap);
      const number = String(stageIndex + 1).padStart(2, "0");
      const fill =
        stageIndex === flow.stages.length - 1
          ? palette.orange
          : stageIndex % 2 === 0
            ? palette.navy
            : palette.teal;
      const labelColor =
        stageIndex === flow.stages.length - 1
          ? palette.paperLight
          : palette.paperLight;
      const connector =
        stageIndex === flow.stages.length - 1
          ? ""
          : `<path d="M ${x + nodeWidth + 10} ${y + nodeHeight / 2} H ${x + nodeWidth + gap - 10}" fill="none" stroke="${palette.orange}" stroke-width="3" marker-end="url(#arrow)"/>`;
      return `${connector}
    <g>
      <rect x="${x}" y="${y}" width="${nodeWidth}" height="${nodeHeight}" rx="8" fill="${fill}" stroke="${palette.navy}" stroke-width="2"/>
      <circle cx="${x + 24}" cy="${y + 22}" r="13" fill="${palette.paperLight}" stroke="${palette.orange}" stroke-width="2"/>
      <text x="${x + 24}" y="${y + 27}" fill="${palette.navy}" text-anchor="middle" font-family="${fontFamily}" font-size="11" font-weight="800">${number}</text>
      <text x="${x + nodeWidth / 2}" y="${y + 42}" fill="${labelColor}" text-anchor="middle" font-family="${fontFamily}" font-size="15" font-weight="800" letter-spacing="0.8">
        <tspan x="${x + nodeWidth / 2}" dy="0">${escapeXml(stage[0])}</tspan>
        <tspan x="${x + nodeWidth / 2}" dy="20">${escapeXml(stage[1])}</tspan>
      </text>
    </g>`;
    })
    .join("\n");

  return svgFrame({
    title: flow.title,
    subtitle: flow.subtitle,
    index: `流程 ${flow.index}`,
    body: `${nodes}
  <path d="M 54 236 H 1146" stroke="${palette.olive}" stroke-width="2" stroke-dasharray="4 8" opacity="0.7"/>
  <circle cx="54" cy="236" r="5" fill="${palette.orange}"/>
  <circle cx="1146" cy="236" r="5" fill="${palette.orange}"/>`,
  });
}

function overviewNode({ x, y, width, label, accent = false }) {
  const [first, second] = label;
  return `<g>
    <rect x="${x}" y="${y}" width="${width}" height="74" rx="8" fill="${accent ? palette.orange : palette.navy}" stroke="${palette.navy}" stroke-width="2"/>
    <text x="${x + width / 2}" y="${y + 31}" fill="${palette.paperLight}" text-anchor="middle" font-family="${fontFamily}" font-size="15" font-weight="800" letter-spacing="0.8">
      <tspan x="${x + width / 2}">${escapeXml(first)}</tspan>
      <tspan x="${x + width / 2}" dy="20">${escapeXml(second)}</tspan>
    </text>
  </g>`;
}

function renderOverview() {
  const mainY = 125;
  const nodes = [
    { x: 24, width: 98, label: ["请求", "到达"] },
    { x: 146, width: 112, label: ["澄清", "或 PRD"] },
    { x: 282, width: 138, label: ["按需体验", "或架构设计"] },
    { x: 444, width: 106, label: ["按需项目", "拆解"] },
    { x: 574, width: 106, label: ["就绪波次", "执行"] },
    { x: 704, width: 106, label: ["QUICKDEV", "交付"] },
    { x: 834, width: 106, label: ["独立", "验收"] },
    {
      x: 964,
      width: 202,
      label: ["合并主分支", "关闭任务单"],
      accent: true,
    },
  ];
  const body = nodes
    .map((node, nodeIndex) => {
      const connector =
        nodeIndex === nodes.length - 1
          ? ""
          : `<path d="M ${node.x + node.width + 10} ${mainY + 37} H ${nodes[nodeIndex + 1].x - 10}" fill="none" stroke="${palette.orange}" stroke-width="3" marker-end="url(#arrow)"/>`;
      return `${connector}${overviewNode({ ...node, y: mainY })}`;
    })
    .join("\n");

  return svgFrame({
    title: "THINLOOP 开发闭环",
    subtitle: "深入理解 → 验证交付",
    index: "闭环",
    height: 410,
    body: `${body}
  <path d="M 86 220 V 266 H 1080 V 220" fill="none" stroke="${palette.teal}" stroke-width="2.5" stroke-dasharray="7 7"/>
  <text x="599" y="252" fill="${palette.teal}" text-anchor="middle" font-family="${fontFamily}" font-size="12" font-weight="800" letter-spacing="1.2">证据回流闭环</text>
  <g>
    <rect x="154" y="292" width="240" height="70" rx="35" fill="${palette.paperLight}" stroke="${palette.olive}" stroke-width="2"/>
    <circle cx="189" cy="327" r="19" fill="${palette.olive}"/>
    <text x="218" y="322" fill="${palette.navy}" font-family="${fontFamily}" font-size="14" font-weight="800">知识沉淀</text>
    <text x="218" y="342" fill="${palette.teal}" font-family="${fontFamily}" font-size="11" font-weight="700">明确写入 / 按需检索</text>
  </g>
  <g>
    <rect x="480" y="292" width="240" height="70" rx="35" fill="${palette.paperLight}" stroke="${palette.olive}" stroke-width="2"/>
    <circle cx="515" cy="327" r="19" fill="${palette.orange}"/>
    <text x="544" y="322" fill="${palette.navy}" font-family="${fontFamily}" font-size="14" font-weight="800">仓库维护</text>
    <text x="544" y="342" fill="${palette.teal}" font-family="${fontFamily}" font-size="11" font-weight="700">审计 / 有界修复</text>
  </g>
  <g>
    <rect x="806" y="292" width="240" height="70" rx="35" fill="${palette.paperLight}" stroke="${palette.olive}" stroke-width="2"/>
    <circle cx="841" cy="327" r="19" fill="${palette.navy}"/>
    <text x="870" y="322" fill="${palette.navy}" font-family="${fontFamily}" font-size="14" font-weight="800">技能演进</text>
    <text x="870" y="342" fill="${palette.teal}" font-family="${fontFamily}" font-size="11" font-weight="700">批准后进行可回滚试验</text>
  </g>`,
  });
}

const outputs = new Map([
  ["thinloop-overview.svg", renderOverview()],
  ...skillFlows.map((flow) => [
    `scd-${flow.slug}.svg`,
    renderSkillFlow(flow),
  ]),
]);

if (!checkOnly) {
  fs.mkdirSync(outputDirectory, { recursive: true });
}

const mismatches = [];
for (const [fileName, expected] of outputs) {
  const target = path.join(outputDirectory, fileName);
  if (checkOnly) {
    const actual = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : "";
    if (actual !== expected) {
      mismatches.push(path.relative(root, target));
    }
  } else {
    fs.writeFileSync(target, expected);
    process.stdout.write(`${path.relative(root, target)}\n`);
  }
}

if (mismatches.length > 0) {
  process.stderr.write(
    `README diagrams are missing or stale:\n${mismatches.map((file) => `- ${file}`).join("\n")}\n`,
  );
  process.exitCode = 1;
}
