import assert from "node:assert/strict";
import test from "node:test";
import { getConfig } from "../src/config.mjs";
import { createIssue, findIssue, resetIssueIds } from "../src/issues.mjs";
import { renderIssueRow } from "../src/render.mjs";
import { shouldRetry } from "../src/retry.mjs";
import { IssueService } from "../src/service.mjs";
import { IssueStore } from "../src/store.mjs";

test("default config is stable", () => {
  assert.deepEqual(getConfig(), { pageSize: 20, theme: "light" });
});

test("retry rejects client errors", () => {
  assert.equal(shouldRetry(400, 0, 3), false);
});

test("issues can be created and found", () => {
  resetIssueIds();
  const issue = createIssue({ title: " First " });
  assert.equal(issue.title, "First");
  assert.equal(findIssue([issue], issue.id), issue);
});

test("service stores and lists issues", () => {
  resetIssueIds();
  const service = new IssueService(new IssueStore());
  const issue = service.create({ title: "Ship" });
  assert.equal(service.get(issue.id), issue);
  assert.deepEqual(service.listIssues(), [issue]);
});

test("render keeps the established class structure", () => {
  assert.equal(
    renderIssueRow({ title: "Ship", priority: "normal" }),
    '<li class="issue issue--normal">Ship</li>',
  );
});
