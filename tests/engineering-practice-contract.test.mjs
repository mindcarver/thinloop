import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const canonical = "scd-quickdev/references/engineering-practice.md";
const consumers = [
  "scd-quickdev/SKILL.md",
  "scd-architecture/SKILL.md",
  "scd-reengineering/SKILL.md",
  "scd-test/references/acceptance-audit.md",
];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function localLinks(file) {
  return [...fs.readFileSync(file, "utf8").matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)]
    .map(([, target]) => target)
    .filter((target) => !target.includes("://"));
}

function resolveSharedReference(skillsRoot, consumer) {
  const source = path.join(skillsRoot, consumer);
  const targets = localLinks(source).filter((target) =>
    target.endsWith("engineering-practice.md"),
  );
  assert.equal(
    targets.length,
    1,
    `${consumer} must link to engineering-practice.md once`,
  );
  return fs.realpathSync(path.resolve(path.dirname(source), targets[0]));
}

test("A1: shared engineering practice contract resolves cleanly across all 10 platform layouts and defines all 4 pillars", () => {
  const skillsRoot = path.join(root, "skills");
  const expected = fs.realpathSync(path.join(skillsRoot, canonical));
  assert.ok(fs.existsSync(expected), "canonical engineering-practice.md must exist");

  for (const consumer of consumers) {
    assert.equal(resolveSharedReference(skillsRoot, consumer), expected);
  }

  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "thinloop-eng-links-"));
  try {
    const registry = JSON.parse(read("config/platform-capabilities.json"));
    const names = fs
      .readdirSync(skillsRoot)
      .filter((name) => !name.startsWith("."));
    for (const platform of registry.platforms) {
      const destination = path.join(
        temporary,
        platform.id,
        platform.installation.skillRoot,
      );
      fs.mkdirSync(destination, { recursive: true });
      if (platform.installation.mode === "skill-links") {
        for (const name of names) {
          fs.symlinkSync(
            path.join(skillsRoot, name),
            path.join(destination, name),
            process.platform === "win32" ? "junction" : "dir",
          );
        }
      } else {
        fs.cpSync(skillsRoot, destination, { recursive: true });
      }
      const platformExpected = fs.realpathSync(path.join(destination, canonical));
      for (const consumer of consumers) {
        assert.equal(
          resolveSharedReference(destination, consumer),
          platformExpected,
          platform.id,
        );
      }
    }
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }

  const practice = fs.readFileSync(expected, "utf8");
  assert.match(practice, /高内聚/);
  assert.match(practice, /低耦合/);
  assert.match(practice, /单向依赖/);
  assert.match(practice, /循环依赖/);
  assert.match(practice, /防腐/);
  assert.match(practice, /utils/);
  assert.match(practice, /Parse,\s*Don't Validate|边界一次解析/);
  assert.match(practice, /布尔/);
  assert.match(practice, /事务/);
  assert.match(practice, /幂等/);
  assert.match(practice, /早返回/);
  assert.match(practice, /先复用|复用先于复制/);
  assert.match(practice, /过度工程|过度抽象/);
  assert.match(practice, /只使用 1 次|单次逻辑/);
  assert.match(practice, /越界重构|Issue 范围/);
  assert.match(practice, /code-review/);
  assert.match(practice, /空[\s\S]*catch|吞/);
});

test("A2: full-project research, discovery and architecture enforce GitHub prior-art search while exempting local L0/L1 changes", () => {
  const research = read("skills/scd-research/references/product-research.md");
  const discovery = read("skills/scd-discovery/SKILL.md");
  const architectureSkill = read("skills/scd-architecture/SKILL.md");
  const architectureContract = read(
    "skills/scd-architecture/references/architecture-contract.md",
  );

  assert.match(research, /GitHub/);
  assert.match(research, /开源/);
  assert.match(discovery, /GitHub/);
  assert.match(discovery, /直接复用|直接采用/);
  assert.match(discovery, /Fork|改造/);
  assert.match(discovery, /借鉴/);
  assert.match(discovery, /清晰交付|清晰局部|局部变更/);

  assert.match(architectureSkill, /GitHub/);
  assert.match(architectureContract, /GitHub/);
  assert.match(architectureContract, /直接复用/);
  assert.match(architectureContract, /适配/);
  assert.match(architectureContract, /借鉴/);
  assert.match(architectureContract, /许可证/);
  assert.match(architectureContract, /安全|供应链/);
  assert.match(architectureContract, /不受信任|隔离|UNVERIFIED/);
});

test("A3: new feature planning and architecture integration verify pinned versions and latest official docs with honest UNVERIFIED fallback", () => {
  const planning = read("skills/scd-quickdev/references/planning-contract.md");
  const practice = read(path.join("skills", canonical));
  const architectureSkill = read("skills/scd-architecture/SKILL.md");
  const interfaceContract = read(
    "skills/scd-architecture/references/interface-contract.md",
  );

  for (const doc of [planning, practice]) {
    assert.match(doc, /最新官方文档|最新文档/);
    assert.match(doc, /锁定版本|package\.json|lockfile|实际版本/);
    assert.match(doc, /UNVERIFIED/);
    assert.match(doc, /记忆|编造/);
  }
  assert.match(architectureSkill, /最新官方|最新文档/);
  assert.match(interfaceContract, /最新官方|最新文档/);
  assert.match(interfaceContract, /UNVERIFIED/);
});

test("A4: Blind-First audit and release contract enforce 6 code-review anti-patterns and keep all 15 SKILL.md compact", () => {
  const audit = read("skills/scd-test/references/acceptance-audit.md");
  const release = read("skills/scd-quickdev/references/release-contract.md");

  for (const doc of [audit, release]) {
    assert.match(doc, /engineering-practice\.md/);
    assert.match(doc, /code-review/);
    assert.match(doc, /结构反模式/);
  }

  const skillDirs = fs
    .readdirSync(path.join(root, "skills"))
    .filter((name) => fs.existsSync(path.join(root, "skills", name, "SKILL.md")));
  assert.equal(skillDirs.length, 15, "must preserve exact 15 canonical scd-* skills");
  const totalBytes = skillDirs.reduce(
    (sum, name) => sum + fs.statSync(path.join(root, "skills", name, "SKILL.md")).size,
    0,
  );
  assert.ok(
    totalBytes < 82_000,
    `total 15 SKILL.md bytes (${totalBytes}) must remain compact (< 82000)`,
  );
});
