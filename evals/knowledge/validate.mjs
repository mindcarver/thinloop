import { validateCases } from "./runner/cases.mjs";

const validation = validateCases();
if (!validation.ok) {
  process.stderr.write(`${validation.errors.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    `PASS knowledge behavior definitions: ${validation.cases} paired cases\n`,
  );
}
