import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const checker = path.join(root, "scripts", "check-version.mjs");
const version = JSON.parse(fs.readFileSync(
  path.join(root, ".codex-plugin/plugin.json"), "utf8",
)).version;
const tag = `v${version}`;
const differentVersion = version.replace(/\d+$/, (patch) => Number(patch) + 1);
const differentTag = `v${differentVersion}`;
const releaseNotes = `docs/releases/${tag}.md`;
const workflow = fs.readFileSync(
  path.join(root, ".github", "workflows", "release.yml"),
  "utf8",
);
const versionFiles = [
  ".codex-plugin/plugin.json",
  ".claude-plugin/plugin.json",
  ".claude-plugin/marketplace.json",
  ".codebuddy-plugin/plugin.json",
  ".codebuddy-plugin/marketplace.json",
  ".zcode-plugin/plugin.json",
  "marketplace.json",
  "README.md",
  "docs/installation.md",
  releaseNotes,
];

function makeFixture() {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "thinloop-release-"));
  for (const relativePath of versionFiles) {
    const destination = path.join(fixture, relativePath);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(path.join(root, relativePath), destination);
  }
  return fixture;
}

function runCheckerWithEnv(fixture, env, ...args) {
  return spawnSync(
    process.execPath,
    [checker, "--root", fixture, ...args],
    { cwd: root, encoding: "utf8", env: { ...process.env, ...env } },
  );
}

function runChecker(fixture, ...args) {
  return runCheckerWithEnv(fixture, {}, ...args);
}

test("version checker accepts all carriers, the matching tag, and exact notes", () => {
  const fixture = makeFixture();
  try {
    const result = runChecker(
      fixture,
      "--tag",
      tag,
      "--require-release-notes",
    );

    assert.equal(result.status, 0, result.stderr);
    assert.ok(result.stdout.includes(`PASS version ${version}: 11 surfaces`));
    assert.ok(result.stdout.includes(`notes ${releaseNotes}`));
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});

test("version checker rejects a mismatched carrier", () => {
  const fixture = makeFixture();
  try {
    const manifestPath = path.join(fixture, ".claude-plugin", "plugin.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    manifest.version = differentVersion;
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    const result = runChecker(fixture);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /.claude-plugin\/plugin\.json version/);
    assert.ok(result.stderr.includes(`expected ${version}`));
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});

test("version checker rejects a tag that differs from the manifest", () => {
  const fixture = makeFixture();
  try {
    const result = runChecker(fixture, "--tag", differentTag);

    assert.equal(result.status, 1);
    assert.ok(result.stderr.includes(
      `tag ${differentTag} does not match manifest version ${version}`,
    ));
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});

test("version checker consumes a tag-shaped GITHUB_REF_NAME", () => {
  const fixture = makeFixture();
  try {
    const result = runCheckerWithEnv(
      fixture,
      { GITHUB_REF_NAME: differentTag },
    );

    assert.equal(result.status, 1);
    assert.ok(result.stderr.includes(
      `tag ${differentTag} does not match manifest version ${version}`,
    ));
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});

test("version checker rejects missing exact-tag release notes", () => {
  const fixture = makeFixture();
  try {
    fs.rmSync(path.join(fixture, "docs", "releases", `${tag}.md`));
    const result = runChecker(
      fixture,
      "--tag",
      tag,
      "--require-release-notes",
    );

    assert.equal(result.status, 1);
    assert.ok(result.stderr.includes(`missing release notes: ${releaseNotes}`));
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});

test("release workflow is tag-only and limits write permission to release creation", () => {
  assert.match(workflow, /^name: Thinloop Release$/m);
  assert.match(workflow, /^  push:\n    tags:\n      - "v\*"$/m);
  assert.doesNotMatch(workflow, /^  pull_request:/m);
  assert.doesNotMatch(workflow, /^    branches:/m);
  assert.match(workflow, /^permissions:\n  contents: read$/m);
  assert.match(workflow, /^  verify:[\s\S]*?^    permissions:\n      contents: read$/m);
  assert.match(workflow, /^  release:[\s\S]*?^    permissions:\n      contents: write$/m);
  assert.doesNotMatch(workflow, /^\s+(?:packages|id-token|actions): write$/m);
});

test("release workflow reproduces CI gates before exact-notes release creation", () => {
  const commands = [
    'node scripts/check-version.mjs --tag "$GITHUB_REF_NAME" --require-release-notes',
    "node --test tests/*.test.mjs",
    "node scripts/sync-routing-kernel.mjs --check",
    "node evals/validate-discovery-cases.mjs",
    "node evals/validate-knowledge-cases.mjs",
    "node evals/knowledge/validate.mjs",
    "node evals/thinloop/validate.mjs",
    "node evals/knowledge/runner/run.mjs --mode dry",
    "node evals/thinloop/runner/run.mjs --mode dry",
    "node scripts/generate-readme-diagrams.mjs --check",
    "npm exec --yes --package=@anthropic-ai/claude-code@2.1.197 -- claude plugin validate . --strict",
  ];

  for (const command of commands) assert.ok(workflow.includes(command), command);
  assert.match(workflow, /git merge-base --is-ancestor "\$GITHUB_SHA" refs\/remotes\/origin\/main/);
  assert.match(workflow, /^    needs: verify$/m);
  assert.match(workflow, /gh release create "\$GITHUB_REF_NAME"/);
  assert.match(workflow, /--verify-tag/);
  assert.match(workflow, /--notes-file "docs\/releases\/\$\{GITHUB_REF_NAME\}\.md"/);
  assert.doesNotMatch(workflow, /npm publish|NPM_TOKEN|NODE_AUTH_TOKEN/);
});
