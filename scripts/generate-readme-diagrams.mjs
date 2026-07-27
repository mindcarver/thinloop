import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const outputDirectory = path.join(root, "assets", "flows");
const checkOnly = process.argv.includes("--check");

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
    title: "SCD DISCOVERY",
    subtitle: "UNDERDEFINED IDEA → APPROVED ISSUE",
    stages: [
      ["REPO", "TRUTH"],
      ["DELIVERY", "SLICE"],
      ["DECISION", "TREE"],
      ["READINESS", "REVIEW"],
      ["APPROVED", "ISSUE"],
    ],
  },
  {
    slug: "uiux",
    index: "02",
    title: "SCD UIUX",
    subtitle: "PRODUCT INTENT → READY EXPERIENCE",
    stages: [
      ["PRODUCT", "CORE"],
      ["JOURNEYS", "& STATES"],
      ["VISUAL", "EVIDENCE"],
      ["INTERFACE", "SEAM"],
      ["READY", "HANDOFF"],
    ],
  },
  {
    slug: "architecture",
    index: "03",
    title: "SCD ARCHITECTURE",
    subtitle: "PRODUCT RULES → MACHINE CONTRACTS",
    stages: [
      ["REPO", "TRUTH"],
      ["DESIGN", "SLICE"],
      ["DOMAIN &", "BOUNDARIES"],
      ["MACHINE", "CONTRACTS"],
      ["READY", "HANDOFF"],
    ],
  },
  {
    slug: "quickdev",
    index: "04",
    title: "SCD QUICKDEV",
    subtitle: "ISSUE → VERIFIED MERGED CODE",
    stages: [
      ["GITHUB", "ISSUE"],
      ["DIAGNOSE", "& BUILD"],
      ["ENGINEERING", "CHECKS"],
      ["INDEPENDENT", "ACCEPT"],
      ["MAIN", "& CLOSE"],
    ],
  },
  {
    slug: "knowledge",
    index: "05",
    title: "SCD KNOWLEDGE",
    subtitle: "PROVEN EXPERIENCE → USEFUL MEMORY",
    stages: [
      ["EXPLICIT", "REQUEST"],
      ["RESOLVE", "STORES"],
      ["EVIDENCE", "& SCOPE"],
      ["CONFIRM", "CHANGE"],
      ["WRITE OR", "RETRIEVE"],
    ],
  },
  {
    slug: "maintenance",
    index: "06",
    title: "SCD MAINTENANCE",
    subtitle: "REPOSITORY SIGNALS → BOUNDED REPAIR",
    stages: [
      ["SELECT", "SCOPE"],
      ["COLLECT", "SIGNALS"],
      ["VERIFY", "FINDINGS"],
      ["BOUNDED", "REPAIR"],
      ["RECHECK", "EVIDENCE"],
    ],
  },
  {
    slug: "evolve",
    index: "07",
    title: "SCD EVOLVE",
    subtitle: "OBSERVED FAILURE → REVERSIBLE TRIAL",
    stages: [
      ["VISIBLE", "EVIDENCE"],
      ["CAUSE", "ATTRIBUTION"],
      ["CANDIDATE", "ID"],
      ["HUMAN", "APPROVAL"],
      ["TRIAL OR", "REVERT"],
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
  <text x="75" y="51" fill="${palette.paperLight}" text-anchor="middle" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="14" font-weight="700">${escapeXml(index)}</text>
  <text x="132" y="49" fill="${palette.navy}" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="25" font-weight="800" letter-spacing="1.2">${escapeXml(title)}</text>
  <text x="1166" y="48" fill="${palette.teal}" text-anchor="end" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="700" letter-spacing="1.4">${escapeXml(subtitle)}</text>
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
      <text x="${x + 24}" y="${y + 27}" fill="${palette.navy}" text-anchor="middle" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="11" font-weight="800">${number}</text>
      <text x="${x + nodeWidth / 2}" y="${y + 42}" fill="${labelColor}" text-anchor="middle" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="15" font-weight="800" letter-spacing="0.8">
        <tspan x="${x + nodeWidth / 2}" dy="0">${escapeXml(stage[0])}</tspan>
        <tspan x="${x + nodeWidth / 2}" dy="20">${escapeXml(stage[1])}</tspan>
      </text>
    </g>`;
    })
    .join("\n");

  return svgFrame({
    title: flow.title,
    subtitle: flow.subtitle,
    index: `FLOW ${flow.index}`,
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
    <text x="${x + width / 2}" y="${y + 31}" fill="${palette.paperLight}" text-anchor="middle" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="15" font-weight="800" letter-spacing="0.8">
      <tspan x="${x + width / 2}">${escapeXml(first)}</tspan>
      <tspan x="${x + width / 2}" dy="20">${escapeXml(second)}</tspan>
    </text>
  </g>`;
}

function renderOverview() {
  const mainY = 125;
  const nodes = [
    { x: 38, width: 138, label: ["REQUEST", "ARRIVES"] },
    { x: 225, width: 148, label: ["DISCOVER", "IF NEEDED"] },
    { x: 422, width: 158, label: ["UIUX / ARCH", "WHEN NEEDED"] },
    { x: 629, width: 148, label: ["QUICKDEV", "DELIVERS"] },
    { x: 826, width: 154, label: ["INDEPENDENT", "ACCEPTANCE"] },
    {
      x: 1029,
      width: 133,
      label: ["MAIN", "& CLOSE"],
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
    title: "THINLOOP SYSTEM MAP",
    subtitle: "DEEPER UNDERSTANDING → VERIFIED DELIVERY",
    index: "SYSTEM",
    height: 410,
    body: `${body}
  <path d="M 95 220 V 266 H 1102 V 220" fill="none" stroke="${palette.teal}" stroke-width="2.5" stroke-dasharray="7 7"/>
  <text x="599" y="252" fill="${palette.teal}" text-anchor="middle" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="12" font-weight="800" letter-spacing="1.2">EVIDENCE RETURNS TO THE LOOP</text>
  <g>
    <rect x="154" y="292" width="240" height="70" rx="35" fill="${palette.paperLight}" stroke="${palette.olive}" stroke-width="2"/>
    <circle cx="189" cy="327" r="19" fill="${palette.olive}"/>
    <text x="218" y="322" fill="${palette.navy}" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="14" font-weight="800">KNOWLEDGE</text>
    <text x="218" y="342" fill="${palette.teal}" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="11" font-weight="700">EXPLICIT CAPTURE / RETRIEVE</text>
  </g>
  <g>
    <rect x="480" y="292" width="240" height="70" rx="35" fill="${palette.paperLight}" stroke="${palette.olive}" stroke-width="2"/>
    <circle cx="515" cy="327" r="19" fill="${palette.orange}"/>
    <text x="544" y="322" fill="${palette.navy}" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="14" font-weight="800">MAINTENANCE</text>
    <text x="544" y="342" fill="${palette.teal}" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="11" font-weight="700">AUDIT / BOUNDED REPAIR</text>
  </g>
  <g>
    <rect x="806" y="292" width="240" height="70" rx="35" fill="${palette.paperLight}" stroke="${palette.olive}" stroke-width="2"/>
    <circle cx="841" cy="327" r="19" fill="${palette.navy}"/>
    <text x="870" y="322" fill="${palette.navy}" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="14" font-weight="800">EVOLVE</text>
    <text x="870" y="342" fill="${palette.teal}" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="11" font-weight="700">APPROVED REVERSIBLE TRIAL</text>
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
