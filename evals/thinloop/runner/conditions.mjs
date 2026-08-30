import fs from "node:fs";
import path from "node:path";
import { relativeFiles, sha256 } from "../../discovery/runner/lib.mjs";
import { pluginRoot } from "./manifest.mjs";

export function installCondition({ condition, codexHome }) {
  if (condition.context !== "current-skills") return { id: condition.id, context: condition.context, skills: [] };
  const installed = [];
  for (const skill of condition.skills) {
    const source = path.join(pluginRoot, "skills", skill);
    const target = path.join(codexHome, "skills", skill);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.cpSync(source, target, { recursive: true, force: false });
    installed.push({
      name: skill,
      files: relativeFiles(target).map((file) => ({ file, sha256: sha256(fs.readFileSync(path.join(target, file))) })),
    });
  }
  return { id: condition.id, context: condition.context, skills: installed };
}

export function conditionPrompt(condition, prompt) {
  return condition.context === "short-prompt" ? `${condition.promptPrefix}\n\n${prompt}` : prompt;
}
