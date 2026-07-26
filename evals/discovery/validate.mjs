import fs from "node:fs";
import path from "node:path";
import {
  schemasRoot,
  validateCases,
} from "./runner/cases.mjs";

const validation = validateCases();
for (const schema of [
  "simulator-output.schema.json",
  "judge-output.schema.json",
]) {
  JSON.parse(fs.readFileSync(path.join(schemasRoot, schema), "utf8"));
}

if (!validation.ok) {
  process.stderr.write(`${validation.errors.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    `PASS discovery eval definitions: ${validation.cases} cases, 3x3 matrix\n`,
  );
}
