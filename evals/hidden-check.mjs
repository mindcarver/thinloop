import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const [caseId, repoArg] = process.argv.slice(2);
if (!caseId || !repoArg) {
  throw new Error("Usage: node hidden-check.mjs <case-id> <repo>");
}

const repo = path.resolve(repoArg);
const load = async (relative) =>
  import(`${pathToFileURL(path.join(repo, relative)).href}?eval=${Date.now()}`);

switch (caseId) {
  case "01-retry-boundary": {
    const { shouldRetry } = await load("src/retry.mjs");
    assert.equal(shouldRetry(500, 2, 3), true);
    assert.equal(shouldRetry(500, 3, 3), false);
    break;
  }
  case "02-page-size": {
    const { getConfig } = await load("src/config.mjs");
    assert.equal(getConfig().pageSize, 25);
    break;
  }
  case "03-html-escape": {
    const { renderIssueRow } = await load("src/render.mjs");
    const html = renderIssueRow({
      title: '<img src=x onerror="boom">',
      priority: "normal",
    });
    assert.doesNotMatch(html, /<img/);
    assert.match(html, /&lt;img/);
    assert.match(html, /^<li class="issue issue--normal">/);
    break;
  }
  case "04-documented-urgent": {
    const { createIssue, resetIssueIds } = await load("src/issues.mjs");
    const { renderIssueRow } = await load("src/render.mjs");
    resetIssueIds();
    const urgent = createIssue({
      title: "Outage",
      priority: "low",
      urgent: true,
    });
    assert.equal(urgent.priority, "critical");
    assert.match(
      renderIssueRow(urgent),
      /<span class="issue__badge">URGENT<\/span>.*Outage/,
    );
    break;
  }
  case "05-archive-flow": {
    const { IssueService } = await load("src/service.mjs");
    const { IssueStore } = await load("src/store.mjs");
    const service = new IssueService(new IssueStore());
    const issue = service.create({ title: "Archive me" });
    assert.equal(service.archiveIssue(issue.id).archived, true);
    assert.deepEqual(service.listIssues(), []);
    assert.equal(service.listIssues({ includeArchived: true }).length, 1);
    break;
  }
  case "06-dirty-tags": {
    const { createIssue, resetIssueIds } = await load("src/issues.mjs");
    resetIssueIds();
    const issue = createIssue({
      title: "Tags",
      tags: ["API", "api", "Ui", "UI"],
    });
    assert.deepEqual(issue.tags, ["API", "Ui"]);
    assert.match(
      fs.readFileSync(path.join(repo, "README.md"), "utf8"),
      /USER NOTE: Keep the import pipeline/,
    );
    break;
  }
  case "07-broken-check": {
    const { getConfig } = await load("src/config.mjs");
    assert.equal(getConfig().compactView, false);
    assert.equal(getConfig({ compactView: true }).compactView, true);
    break;
  }
  case "08-baseline-failure": {
    const { findIssue } = await load("src/issues.mjs");
    const issue = { id: 7, title: "Seven" };
    assert.equal(findIssue([issue], "7"), issue);
    const diff = spawnSync("git", ["diff", "--", "src/legacy.mjs"], {
      cwd: repo,
      encoding: "utf8",
    });
    assert.equal(diff.status, 0);
    assert.equal(diff.stdout, "", "src/legacy.mjs must remain unchanged");
    break;
  }
  case "09-accessible-critical": {
    const { renderIssueRow } = await load("src/render.mjs");
    const critical = renderIssueRow({ title: "Outage", priority: "critical" });
    const normal = renderIssueRow({ title: "Routine", priority: "normal" });
    assert.match(critical, /aria-label="Critical issue"/);
    assert.match(critical, /class="issue issue--critical"/);
    assert.doesNotMatch(normal, /aria-label=/);
    break;
  }
  case "10-resume-csv-export": {
    const { serializeIssuesCsv } = await load("src/export.mjs");
    assert.equal(
      serializeIssuesCsv([
        { id: 1, title: "Hello, world", priority: "normal" },
        { id: 2, title: 'Say "hi"', priority: "critical" },
      ]),
      'id,title,priority\n1,"Hello, world",normal\n2,"Say ""hi""",critical\n',
    );
    assert.equal(
      fs.existsSync(path.join(repo, ".ai", "tasks", "current.md")),
      false,
    );
    break;
  }
  case "11-pause-csv-import": {
    const { parseCsvLine } = await load("src/import.mjs");
    assert.deepEqual(parseCsvLine('1,"Hello, world",normal'), [
      "1",
      "Hello, world",
      "normal",
    ]);
    assert.equal(
      fs.existsSync(path.join(repo, ".ai", "tasks", "current.md")),
      true,
    );
    break;
  }
  case "12-safe-migration": {
    const { migrateRecord } = await load("src/migrations.mjs");
    assert.deepEqual(
      migrateRecord({ id: 1, schemaVersion: 1 }, 2),
      { id: 1, schemaVersion: 2, archived: false },
    );
    assert.deepEqual(
      migrateRecord({ id: 2, schemaVersion: 1, archived: true }, 2),
      { id: 2, schemaVersion: 2, archived: true },
    );
    break;
  }
  default:
    throw new Error(`Unknown case: ${caseId}`);
}

process.stdout.write(`PASS ${caseId}\n`);
