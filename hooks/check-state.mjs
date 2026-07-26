import fs from "node:fs/promises";
import path from "node:path";

const MANAGERS = new Set(["scd-dev-loop", "scd-discovery"]);
const RELATIVE_STATE_PATH = path.join(".scd", "tasks", "current.md");
const REQUIRED_SECTIONS = [
  "Outcome",
  "Boundaries",
  "Acceptance",
  "Decisions",
  "Evidence",
  "Next action",
];

async function readStdin() {
  let input = "";
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) {
    input += chunk;
  }
  return input.trim() ? JSON.parse(input) : {};
}

function emit(payload) {
  process.stdout.write(`${JSON.stringify(payload)}\n`);
}

function parseFrontmatter(markdown) {
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

function sectionContent(markdown, heading) {
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

function hasPlaceholder(content) {
  return (
    /<[^>\r\n]+>/.test(content) ||
    /\[(?:TODO|TBD)\b[^\]]*\]/i.test(content) ||
    /^\s*(?:TODO|TBD)\s*$/im.test(content)
  );
}

function validateState(markdown) {
  const issues = [];
  const metadata = parseFrontmatter(markdown);

  if (!MANAGERS.has(metadata.managed_by)) {
    return { managed: false, issues };
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
    const content = sectionContent(markdown, heading);
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
    (!/^\s*-\s*In\s*:/im.test(sections.Boundaries) ||
      !/^\s*-\s*Out\s*:/im.test(sections.Boundaries))
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

async function main() {
  try {
    const hookInput = await readStdin();
    const cwd =
      typeof hookInput.cwd === "string" && hookInput.cwd.trim()
        ? hookInput.cwd
        : process.cwd();
    const statePath = path.resolve(cwd, RELATIVE_STATE_PATH);

    let markdown;
    try {
      markdown = await fs.readFile(statePath, "utf8");
    } catch (error) {
      if (error?.code === "ENOENT") {
        return;
      }
      throw error;
    }

    const result = validateState(markdown);
    if (!result.managed || result.issues.length === 0) {
      return;
    }

    const eventName = hookInput.hook_event_name || "lifecycle event";
    const issueList = result.issues.map((issue) => `- ${issue}`).join("\n");
    emit({
      continue: false,
      stopReason: "SCD continuity state is incomplete.",
      systemMessage:
        `${result.managedBy} paused ${eventName} because .scd/tasks/current.md is not resumable:\n` +
        `${issueList}\nUpdate the note, then retry the lifecycle event.`,
    });
  } catch (error) {
    emit({
      continue: true,
      systemMessage:
        `SCD could not inspect continuity state and failed open: ` +
        `${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

await main();
