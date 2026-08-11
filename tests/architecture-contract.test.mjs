import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("architecture is composable and keeps clear changes on the direct path", () => {
  const skill = read("skills/scd-architecture/SKILL.md");

  assert.match(skill, /\*\*直接实施：\*\*/);
  assert.match(skill, /\*\*聚焦设计：\*\*/);
  assert.match(skill, /\*\*产品架构：\*\*/);
  assert.match(skill, /\*\*架构演进：\*\*/);
  assert.match(skill, /\*\*架构验证：\*\*/);
  assert.match(skill, /不提架构问题、不创建架构产物/);
  assert.match(skill, /新增一个端点也不足以证明/);
});

test("architecture translates approved business behavior without inventing it", () => {
  const skill = read("skills/scd-architecture/SKILL.md");
  const contract = read(
    "skills/scd-architecture/references/architecture-contract.md",
  );

  assert.match(skill, /存在已确认 PRD 时，由 PRD 负责产品级业务决策/);
  assert.match(skill, /否则由作为依据的 Issue 负责/);
  assert.match(skill, /不得发明缺失的产品行为/);
  assert.match(contract, /从属于已确认产品行为/);
  assert.match(contract, /不授权发明缺失规则/);
});

test("architecture and uiux reconcile one shared machine contract", () => {
  const skill = read("skills/scd-architecture/SKILL.md");
  const discovery = read("skills/scd-discovery/SKILL.md");
  const uiux = read("skills/scd-uiux/SKILL.md");
  const quickdev = read("skills/scd-quickdev/SKILL.md");
  const contract = read(
    "skills/scd-architecture/references/interface-contract.md",
  );

  assert.match(skill, /可以与 `scd-uiux` 并行进行/);
  assert.match(skill, /前后端独立实施前，必须通过共享接口契约统一/);
  assert.match(skill, /不得单方面定稿接口/);
  assert.match(contract, /所有生产者和消费者的共同事实来源/);
  assert.match(contract, /不要保留两套字段或错误定义/);
  assert.match(discovery, /UIUX 与 Architecture 可以并行进行/);
  assert.match(discovery, /一个共享的机器可读契约/);
  assert.match(uiux, /`scd-architecture` 推动需求与前后端约束收敛/);
  assert.match(quickdev, /格式感知证据解析规范机器可读契约/);
});

test("machine contracts require real format-aware evidence", () => {
  const skill = read("skills/scd-architecture/SKILL.md");
  const contract = read(
    "skills/scd-architecture/references/interface-contract.md",
  );
  const readiness = read(
    "skills/scd-architecture/references/readiness-review.md",
  );

  assert.match(skill, /只有在规范契约机器可读、经过真实工具解析/);
  assert.match(contract, /格式感知工具真实解析、检查或编译过它/);
  assert.match(contract, /没有实质内容只存在于 Markdown/);
  assert.match(
    readiness,
    /文件存在、YAML 语法有效[\s\S]*都不能单独证明/,
  );
});

test("architecture artifacts split only when durable complexity activates them", () => {
  const skill = read("skills/scd-architecture/SKILL.md");
  const contract = read(
    "skills/scd-architecture/references/architecture-contract.md",
  );

  assert.match(skill, /普通领域模型保存在 `.scd\/architecture\.md`/);
  assert.match(skill, /只有[\s\S]*才拆出 `.scd\/domain\.md`/);
  assert.match(skill, /\.scd\/designs\/<feature>\.md/);
  assert.match(contract, /不要为解释一个端点或模块而重写仓库架构/);
});

test("new shared contracts prefer repository convention then root contracts", () => {
  const skill = read("skills/scd-architecture/SKILL.md");
  const contract = read(
    "skills/scd-architecture/references/interface-contract.md",
  );

  assert.match(skill, /仓库现有的契约位置和格式/);
  assert.match(skill, /根目录中可见的 `contracts\/`/);
  assert.match(contract, /优先使用仓库现有契约格式和位置/);
});

test("architecture readiness is not approval and production mutation stays out", () => {
  const skill = read("skills/scd-architecture/SKILL.md");
  const contract = read(
    "skills/scd-architecture/references/architecture-contract.md",
  );

  assert.match(skill, /`ready` 表示机械与语义就绪，不是第二次产品确认/);
  assert.match(skill, /不得编写生产业务代码/);
  assert.match(skill, /执行真实数据迁移/);
  assert.match(skill, /或部署/);
  assert.match(contract, /不是人工确认门/);
});

test("architecture templates preserve separate responsibilities", () => {
  const architecture = read(
    "skills/scd-architecture/assets/architecture-contract.md",
  );
  const feature = read("skills/scd-architecture/assets/feature-design.md");
  const domain = read("skills/scd-architecture/assets/domain-contract.md");

  assert.match(architecture, /managed_by: scd-architecture/);
  assert.match(architecture, /## 共享接口契约/);
  assert.match(feature, /## 共享契约变更/);
  assert.match(feature, /## 备选方案与决策/);
  assert.match(domain, /## 生命周期与状态转换/);
  assert.match(domain, /## 跨实体一致性/);
});

test("the approved architecture specification retains A1 through A10", () => {
  const specification = read(".scd/specs/scd-architecture.md");

  assert.match(specification, /status: approved/);
  for (let index = 1; index <= 10; index += 1) {
    assert.match(specification, new RegExp(`^- A${index}:`, "m"));
  }
});
