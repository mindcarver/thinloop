// Shared, side-effect-free validator for the Thinloop resumability gate.
//
// Both the subprocess hooks (hooks/check-state.mjs, used by Claude Code /
// WorkBuddy / ZCode) and the DeepSeek Harness continuity plugin
// (.dsh-plugin/continuity.mjs) call validateState() so the ".scd/tasks/current.md"
// contract is enforced by one implementation. This module performs no I/O and
// is safe to import from a Cordis plugin.

import path from "node:path";

export const MANAGERS = new Set([
  "scd-quickdev",
  "scd-dev-loop",
  "scd-discovery",
]);

export const RELATIVE_STATE_PATH = path.join(".scd", "tasks", "current.md");

export const REQUIRED_SECTIONS = [
  "Outcome",
  "Boundaries",
  "Acceptance",
  "Decisions",
  "Evidence",
  "Next action",
];

const SECTION_ALIASES = {
  Outcome: "结果",
  Boundaries: "边界",
  Acceptance: "验收条件",
  Decisions: "决策",
  Evidence: "证据",
  "Next action": "下一步行动",
};

// Current Chinese and previous English current-task templates. Arbitrary angle
// brackets also occur in HTML, type parameters and Markdown autolinks.
const TEMPLATE_MARKERS = [
  "<GitHub Issue 地址>",
  "<GitHub Issue URL>",
  "<ISO-8601 timestamp with timezone>",
  "<Issue 验收 ID 与当前状态>",
  "<Issue acceptance ID and current state>",
  "<命令或可观察行动>",
  "<command or observable action>",
  "<唯一且具体的行动>",
  "<Exactly one concrete action>",
  "<One observable result>",
];

export function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\s*\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) {
    return {};
  }

  const values = {};
  for (const line of match[1].split(/\r?\n/)) {
    const entry = line.match(/^([A-Za-z0-9_-]+):\s*(.*?)\s*$/);
    if (entry) {
      values[entry[1]] = entry[2].replace(/^['"]|['"]$/g, "");
    }
  }
  return values;
}

export function sectionContent(markdown, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const headingPattern = new RegExp(`^##\\s+${escaped}\\s*$`, "im");
  const headingMatch = headingPattern.exec(markdown);
  if (!headingMatch) {
    return null;
  }

  const contentStart = headingMatch.index + headingMatch[0].length;
  const remaining = markdown.slice(contentStart).replace(/^\r?\n/, "");
  const nextHeadingIndex = remaining.search(/^##\s+/m);
  const content =
    nextHeadingIndex === -1
      ? remaining
      : remaining.slice(0, nextHeadingIndex);
  return content.trim();
}

export function hasPlaceholder(content) {
  return (
    TEMPLATE_MARKERS.some((marker) => content.includes(marker)) ||
    /\[(?:TODO|TBD)\b[^\]]*\]/i.test(content) ||
    /^\s*(?:[-*]\s+)?(?:TODO|TBD)(?:\s*[:：].*)?\s*$/im.test(content)
  );
}

export function validateState(markdown) {
  const issues = [];
  const metadata = parseFrontmatter(markdown);

  if (!MANAGERS.has(metadata.managed_by)) {
    return { managed: false, issues };
  }

  if (metadata.managed_by === "scd-dev-loop") {
    issues.push(
      "frontmatter managed_by scd-dev-loop is legacy; change it to scd-quickdev",
    );
  }

  if (
    metadata.managed_by === "scd-quickdev" &&
    !/(?:^#\d+$|\/issues\/\d+(?:$|[?#]))/.test(metadata.issue ?? "")
  ) {
    issues.push(
      "frontmatter issue must reference the governing GitHub Issue",
    );
  }

  if (!["active", "blocked"].includes(metadata.status)) {
    issues.push("frontmatter status must be active or blocked");
  }

  const timestamp = metadata.updated_at ?? "";
  const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(timestamp);
  if (!timestamp || !hasTimezone || Number.isNaN(Date.parse(timestamp))) {
    issues.push("frontmatter updated_at must be an ISO-8601 timestamp with timezone");
  }

  const sections = {};
  for (const heading of REQUIRED_SECTIONS) {
    const content =
      sectionContent(markdown, heading) ??
      sectionContent(markdown, SECTION_ALIASES[heading]);
    sections[heading] = content;
    if (content === null) {
      issues.push(`missing section: ${heading}`);
    } else if (!content) {
      issues.push(`empty section: ${heading}`);
    } else if (hasPlaceholder(content)) {
      issues.push(`unresolved placeholder in section: ${heading}`);
    }
  }

  if (
    sections.Boundaries &&
    (!/^\s*-\s*(?:In\s*:|范围内\s*[:：])/im.test(sections.Boundaries) ||
      !/^\s*-\s*(?:Out\s*:|范围外\s*[:：])/im.test(sections.Boundaries))
  ) {
    issues.push("Boundaries must include both In and Out entries");
  }

  if (
    sections.Acceptance &&
    !/^\s*-\s*\[[ xX]\]\s+\S+/m.test(sections.Acceptance)
  ) {
    issues.push("Acceptance must include at least one checklist item");
  }

  if (sections["Next action"]) {
    const listedActions = sections["Next action"]
      .split(/\r?\n/)
      .filter((line) => /^\s*(?:[-*]|\d+[.)])\s+\S+/.test(line));
    if (listedActions.length > 1) {
      issues.push("Next action must contain exactly one action");
    }
  }

  return { managed: true, managedBy: metadata.managed_by, issues };
}
