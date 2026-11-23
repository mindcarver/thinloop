import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("A1: independent acceptance enforces Blind-First two-step order (blind verification before audit reconciliation)", () => {
  const audit = read("skills/scd-test/references/acceptance-audit.md");
  const release = read("skills/scd-quickdev/references/release-contract.md");
  const independent = release.split("## 独立验收").at(-1);

  for (const [name, text] of [
    ["acceptance-audit.md", audit],
    ["release-contract.md", independent],
  ]) {
    assert.match(text, /Blind-First/, name);
    assert.match(text, /先盲验、后对账/, name);
    assert.match(text, /第一步[（(：:]*盲验/, name);
    assert.match(text, /第二步[（(：:]*对账/, name);
    assert.match(text, /原始要求[\s\S]*获批验收场景[\s\S]*精确差异/, name);
    assert.match(text, /不读取实施者的自检 `PASS` 结论|不得读取实施者的自检 `PASS` 结论/, name);
    assert.match(text, /锚定偏误/, name);
    assert.match(text, /候选完成审计三本账/, name);
    assert.match(text, /实施者声称 `PASS` 但盲验未观察到/, name);
    assert.match(text, /断言偏离原意图|断言偏离原始意图/, name);

    const step1Idx = text.search(/第一步[（(：:]*盲验/);
    const step2Idx = text.search(/第二步[（(：:]*对账/);
    assert.ok(step1Idx >= 0 && step2Idx > step1Idx, `${name}: 第一步（盲验）必须先于第二步（对账）`);

    assert.doesNotMatch(
      text,
      /先读取实施者自检 `PASS`[\s\S]{0,20}再盲验|可直接采信实施者自检 `PASS`/,
      `${name}: 不得允许先读自检结论或直接采信自检 PASS`,
    );
  }
});

test("A1: acceptance audit and release contract enforce all 5 test-review anti-pattern gates", () => {
  const audit = read("skills/scd-test/references/acceptance-audit.md");
  const release = read("skills/scd-quickdev/references/release-contract.md");
  const independent = release.split("## 独立验收").at(-1);

  for (const [name, text] of [
    ["acceptance-audit.md", audit],
    ["release-contract.md", independent],
  ]) {
    assert.match(text, /`test-review`/, name);
    assert.match(text, /5 条测试反模式门禁/, name);
    assert.match(text, /过度 Mock 穿透[\s\S]*真实接线/, name);
    assert.match(text, /弱断言\/浅断言[\s\S]*`toBeDefined`[\s\S]*`toBeTruthy`/, name);
    assert.match(text, /测试实现细节[\s\S]*内部私有调用[\s\S]*公开可观察行为/, name);
    assert.match(text, /硬编码等待[\s\S]*`sleep`[\s\S]*`setTimeout`/, name);
    assert.match(text, /无清理副作用[\s\S]*共享可变状态[\s\S]*残留文件[\s\S]*顺序依赖/, name);
    assert.match(text, /不得(?:直接)?采信该测试为有效(?:直接)?证据|不采信该测试为有效证据/, name);
  }
});

test("A2: test design defines P0/P1/P2 risk tiers, Red Mode ATDD for P0 and bugs, and 5 conditional NFR checks", () => {
  const skill = read("skills/scd-test/SKILL.md");
  const design = read("skills/scd-test/references/test-design.md");

  for (const [name, text] of [
    ["scd-test/SKILL.md", skill],
    ["test-design.md", design],
  ]) {
    assert.match(text, /`P0`/, name);
    assert.match(text, /`P1`/, name);
    assert.match(text, /`P2`/, name);
    assert.match(text, /核心契约、权限、数据一致性、不可逆路径/, name);
    assert.match(text, /独立反例/, name);
    assert.match(text, /先红后绿 ATDD/, name);
    assert.match(text, /Red Mode/, name);
    assert.match(text, /强制独立(?:新上下文)?子 Agent 复跑/, name);
    assert.match(text, /主要业务流程与失败恢复/, name);
    assert.match(text, /次要展示\/边缘格式[\s\S]*聚焦轻核对[\s\S]*不机械套(?:用)?重型(?:场景)?矩阵/, name);
    assert.match(text, /`P0` 新行为(?:与|和)缺陷修复/, name);
    assert.match(text, /修改业务代码前/, name);
    assert.match(text, /精准失败在目标断言/, name);
    assert.match(text, /编译失败[\s\S]*环境(?:错误|不可用)[\s\S]*不能/, name);
  }

  assert.match(
    design,
    /\| 验收 ID \| 风险级别 \| 要求及来源 \| 起始状态与操作 \| 预期结果 \| 必须识别的错误 \| 验证方式 \|/,
  );
  assert.match(design, /\| A1 \| P0 \|/);

  assert.match(design, /条件触发式 NFR/);
  assert.match(design, /仅当变更触及对应领域时启用，不为无关小改强填/);
  assert.match(design, /并发与幂等[\s\S]*重复点击[\s\S]*重试[\s\S]*并发写入/);
  assert.match(design, /越权反例[\s\S]*越权读[\s\S]*越权写[\s\S]*角色\/边界绕过/);
  assert.match(design, /大输入\/空输入与超时降级/);
  assert.match(design, /向后兼容与数据迁移回滚/);
  assert.match(design, /首屏或关键接口明显性能退化/);
});

test("A3: controlled WAIVED status preserves PASS/FAIL/BLOCKED main verdicts and enforces strict red lines", () => {
  const evidence = read("skills/scd-quickdev/references/evidence-contract.md");
  const audit = read("skills/scd-test/references/acceptance-audit.md");
  const release = read("skills/scd-quickdev/references/release-contract.md");

  for (const [name, text] of [
    ["evidence-contract.md", evidence],
    ["acceptance-audit.md", audit],
    ["release-contract.md", release],
  ]) {
    assert.match(text, /`PASS`、`FAIL` 或 `BLOCKED`/, name);
    assert.match(text, /`WAIVED`/, name);
    assert.match(text, /仅(?:适用于|限)非 `P0`、非高风险门/, name);
    assert.match(text, /缺失原因/, name);
    assert.match(text, /残留风险/, name);
    assert.match(text, /补测\/跟踪条件/, name);
    assert.match(text, /用户显式批准依据/, name);
    assert.match(text, /严禁对 `P0`[\s\S]*高风险人工门[\s\S]*未获用户明示批准的缺口使用 `WAIVED`/, name);
    assert.match(text, /严禁(?:把|将)已观察到的(?:违背（`FAIL`）|`FAIL`)伪装成 `WAIVED`/, name);
    assert.match(text, /不得把 `UNVERIFIED` 或部分验证行为提升为 `PASS`/, name);

    assert.doesNotMatch(
      text,
      /允许对 `P0`[^\n。；]*`WAIVED`|允许对高风险[^\n。；]*`WAIVED`|验收者可自行批准 `WAIVED`|将 `FAIL` 记为 `WAIVED`/,
      `${name}: 不得放宽 WAIVED 红线`,
    );
  }
});

test("A3: L0 independent-subagent exemption applies strictly to docs/comments/copy-only changes without behavior or UI diff", () => {
  const release = read("skills/scd-quickdev/references/release-contract.md");
  const independent = release.split("## 独立验收").at(-1);

  assert.match(independent, /L0 纯文档、注释或纯文案无行为改动/);
  assert.match(independent, /无(?:任何)?代码行为[\s\S]*页面\/样式变更|无代码行为与页面差异/);
  assert.match(independent, /可免(?:除)?强制调用独立新上下文子 Agent/);
  assert.match(independent, /记录明确免除理由[\s\S]*直接聚焦验证/);
  assert.match(
    independent,
    /所有涉及代码行为、测试断言、配置\/脚本逻辑或页面\/样式的改动仍 100% 强制调用独立新上下文子 Agent/,
  );
  assert.match(independent, /(?:不得|严禁)借 L0 跳过/);

  assert.doesNotMatch(
    release,
    /L0[^\n。；]*(?:免确认|免用户确认|跳过用户确认|自动批准)/,
    "release-contract.md 不得放宽 L0 方案确认",
  );
  assert.doesNotMatch(
    independent,
    /所有 L0[^\n。；]*免(?:除)?(?:强制)?调用独立|L0[^\n。；]*(?:含|涉及|包含)代码(?:改动|行为)[^\n。；]*免(?:除)?(?:强制)?调用独立/,
    "release-contract.md 不得对代码行为改动或全部 L0 免除独立子 Agent",
  );
});

test("scd-test entry point resolves all referenced contracts and references", () => {
  const skillPath = "skills/scd-test/SKILL.md";
  const skill = read(skillPath);

  for (const expectedTarget of [
    "../scd-quickdev/references/step-communication.md",
    "references/test-design.md",
    "references/acceptance-audit.md",
    "../scd-quickdev/references/release-contract.md",
    "../scd-quickdev/references/planning-contract.md",
  ]) {
    assert.ok(skill.includes(`(${expectedTarget})`), `missing link: ${expectedTarget}`);
    const resolved = path.resolve(root, path.dirname(skillPath), expectedTarget);
    assert.ok(fs.existsSync(resolved), `broken link target: ${expectedTarget}`);
  }
});
