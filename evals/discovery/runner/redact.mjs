import fs from "node:fs";
import path from "node:path";
import { relativeFiles } from "./lib.mjs";

function collectStrings(value, output = new Set()) {
  if (typeof value === "string" && value.length >= 8) {
    output.add(value);
    output.add(JSON.stringify(value).slice(1, -1));
  } else if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, output);
  } else if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectStrings(item, output);
  }
  return output;
}

export function createRedactor({
  auth,
  userProfile = process.env.USERPROFILE,
} = {}) {
  const exactSecrets = [...collectStrings(auth)].sort(
    (left, right) => right.length - left.length,
  );

  return function redact(input) {
    let text = String(input ?? "");
    let secretReplacements = 0;
    let pathReplacements = 0;
    for (const secret of exactSecrets) {
      if (!secret) continue;
      const parts = text.split(secret);
      if (parts.length > 1) {
        secretReplacements += parts.length - 1;
        text = parts.join("[REDACTED_AUTH]");
      }
    }

    const patterns = [
      /\bsk-(?:proj-)?[A-Za-z0-9_-]{12,}\b/g,
      /\bBearer\s+[A-Za-z0-9._~+/=-]{12,}\b/gi,
      /("(?:access|refresh|id)_token"\s*:\s*")[^"]+(")/gi,
      /("(?:OPENAI_API_KEY|CODEX_ACCESS_TOKEN)"\s*:\s*")[^"]+(")/gi,
    ];
    for (const pattern of patterns) {
      text = text.replace(pattern, (...matches) => {
        secretReplacements += 1;
        if (matches.length >= 4 && matches[1] !== undefined) {
          return `${matches[1]}[REDACTED_AUTH]${matches[2]}`;
        }
        return "[REDACTED_AUTH]";
      });
    }

    if (userProfile) {
      const variants = new Set([
        userProfile,
        userProfile.replaceAll("\\", "\\\\"),
        userProfile.replaceAll("\\", "/"),
      ]);
      for (const variant of variants) {
        if (!variant) continue;
        const parts = text.split(variant);
        if (parts.length > 1) {
          pathReplacements += parts.length - 1;
          text = parts.join("%USERPROFILE%");
        }
      }
    }
    return {
      text,
      replacements: secretReplacements + pathReplacements,
      secretReplacements,
      pathReplacements,
    };
  };
}

export function scanTree(root, redactor) {
  const findings = [];
  for (const relative of relativeFiles(root)) {
    const file = path.join(root, relative);
    const buffer = fs.readFileSync(file);
    if (buffer.includes(0)) continue;
    const original = buffer.toString("utf8");
    const result = redactor(original);
    if (result.secretReplacements > 0 || /\bsk-(?:proj-)?/i.test(original)) {
      findings.push({
        file: relative,
        replacements: result.secretReplacements,
      });
    }
  }
  return findings;
}
