import { loadManifest, validateManifest } from "./runner/manifest.mjs";

const validation = validateManifest(loadManifest());
if (!validation.ok) {
  process.stderr.write(`${validation.errors.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`PASS Thinloop current definitions: ${validation.cases} cases, ${validation.conditions} conditions\n`);
}
