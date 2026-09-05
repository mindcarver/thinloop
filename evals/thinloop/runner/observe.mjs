import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { snapshotSha256 } from "./browser-evidence.mjs";
export { validateBrowserEvidence } from "./browser-evidence.mjs";
import { changedFiles, repositoryStatus, runNativeTests, snapshotFiles } from "./fixture.mjs";

async function importFresh(file) {
  const url = pathToFileURL(file);
  url.searchParams.set("thinloop-eval", `${Date.now()}-${Math.random()}`);
  return import(url.href);
}

function outcome(ok, summary, details = {}) {
  return { ok, summary, ...details };
}

async function hiddenCheck({ testCase, repo, lastMessage, browserEvidence }) {
  try {
    if (testCase.hiddenCheck === "clamp-boundaries") {
      const { clamp } = await importFresh(path.join(repo, "src", "clamp.mjs"));
      const values = [clamp(-1, 0, 10), clamp(5, 0, 10), clamp(11, 0, 10)];
      return outcome(JSON.stringify(values) === "[0,5,10]", "clamp returns 0, 5, and 10 for the hidden boundary cases", { values });
    }
    if (testCase.hiddenCheck === "single-product-question") {
      const questions = (lastMessage.match(/[?？]/g) ?? []).length;
      const productDecision = /(?:格式|CSV|JSON|覆盖|数据范围|format|overwrite|scope)/i.test(lastMessage);
      return outcome(questions === 1 && productDecision, "assistant asks exactly one material product question before implementation", { questions, productDecision });
    }
    if (testCase.hiddenCheck === "issue-dag-plan") {
      const layers = [/(?:持久|数据库|storage|database)/i, /\bAPI\b/i, /(?:Web|界面|UI)/i]
        .filter((pattern) => pattern.test(lastMessage)).length;
      const issueBoundary = /(?:Issue|交付|任务)/i.test(lastMessage);
      const dependency = /(?:依赖|depends)/i.test(lastMessage);
      return outcome(layers === 3 && issueBoundary && dependency, "assistant separates all three delivery boundaries and states dependencies", { layers, issueBoundary, dependency });
    }
    if (testCase.hiddenCheck === "resume-and-clean-state") {
      const { exportCsv } = await importFresh(path.join(repo, "src", "export.mjs"));
      const value = exportCsv([{ id: 1, name: "Ada" }]);
      const stateCleared = !fs.existsSync(path.join(repo, ".scd", "tasks", "current.md"));
      return outcome(value === "id,name\n1,Ada" && stateCleared, "CSV export is complete and stale recovery state is removed", { value, stateCleared });
    }
    if (testCase.hiddenCheck === "normalize-and-preserve-dirty") {
      const { normalizeTag } = await importFresh(path.join(repo, "src", "tags.mjs"));
      const value = normalizeTag("  ThinLoop ");
      return outcome(value === "thinloop", "tag normalization trims and lowercases the hidden input", { value });
    }
    if (testCase.hiddenCheck === "browser-save-flow") {
      const source = fs.readFileSync(path.join(repo, "public", "app.mjs"), "utf8");
      const sourceWiresStatus = /#status/.test(source) && /textContent|innerText/.test(source);
      return outcome(sourceWiresStatus && browserEvidence?.ok === true, "source updates the visible status and supplied browser evidence exercises the save flow", { sourceWiresStatus, browserEvidence: browserEvidence?.ok === true });
    }
    if (testCase.hiddenCheck === "single-quote-escape") {
      const { escapeHtml } = await importFresh(path.join(repo, "src", "escape.mjs"));
      const value = escapeHtml("it's");
      const ok = value === "it&#39;s" || value === "it&#x27;s";
      return outcome(ok, "single quote is escaped in the hidden observed input", { value });
    }
    return outcome(false, `unknown hidden check: ${testCase.hiddenCheck}`);
  } catch (error) {
    return outcome(false, `hidden check could not execute: ${error.message}`);
  }
}

export async function observeRepository({ testCase, condition, repo, baseline, lastMessage = "" }) {
  const files = snapshotFiles(repo);
  const nativeTests = await runNativeTests(repo);
  const status = await repositoryStatus(repo);
  const changed = changedFiles(baseline.files, files);
  const dirtyFilesPreserved = Object.keys(testCase.dirtyFiles ?? {}).every((file) => baseline.files[file] === files[file]);
  const recoveryStateCleared = !fs.existsSync(path.join(repo, ".scd", "tasks", "current.md"));
  const browser = testCase.requiresBrowserEvidence ? { ok: false, reason: "awaiting post-implementation browser evidence import" } : null;
  const hidden = await hiddenCheck({ testCase, repo, lastMessage, browserEvidence: browser });
  return {
    files,
    snapshotSha256: snapshotSha256(files),
    observedAt: new Date().toISOString(),
    changedFiles: changed,
    nativeTests,
    ...status,
    dirtyFilesPreserved,
    recoveryStateCleared,
    browserEvidence: browser,
    hidden,
  };
}
