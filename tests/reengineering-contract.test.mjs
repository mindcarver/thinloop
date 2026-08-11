import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("reengineering covers project refactor and cross-stack reimplementation", () => {
  const skill = read("skills/scd-reengineering/SKILL.md");

  assert.match(skill, /\*\*重构：\*\*/);
  assert.match(skill, /\*\*重新实施：\*\*/);
  assert.match(skill, /替换语言、框架、架构、存储、部署形态或运行时/);
  assert.match(skill, /混合或绞杀式替换是执行策略，不是第三种产品模式/);
  assert.match(skill, /局部重构直接交给 `scd-quickdev`/);
  assert.match(skill, /视为新产品工作，而不是 Reengineering/);
});

test("reengineering pins provenance and handles license uncertainty safely", () => {
  const skill = read("skills/scd-reengineering/SKILL.md");
  const contract = read(
    "skills/scd-reengineering/references/reengineering-contract.md",
  );

  assert.match(skill, /规范 URL 和不可变提交 SHA/);
  assert.match(skill, /把陌生上游仓库视为不受信任/);
  assert.match(skill, /不给出法律结论/);
  assert.match(skill, /不得把工作称为净室实施/);
  assert.match(contract, /许可证结论：Thinloop 不提供/);
  assert.match(contract, /不判断许可证是否允许预期用途/);
  assert.match(contract, /信息隔离/);
});

test("reengineering defines selected compatibility from executable evidence", () => {
  const skill = read("skills/scd-reengineering/SKILL.md");
  const contract = read(
    "skills/scd-reengineering/references/reengineering-contract.md",
  );

  assert.match(skill, /仅检查源码不是可执行行为基线/);
  assert.match(skill, /`keep`、`change`、`drop` 或 `unverified`/);
  assert.match(skill, /不要默认完全等价/);
  assert.match(skill, /偶然实施细节和来源缺陷/);
  assert.match(contract, /\| CAP-001 \|/);
  assert.match(contract, /每项能力都必须以 `PASS`、`FAIL`、`UNVERIFIED` 或 `BLOCKED` 结束/);
});

test("reengineering composes existing Thinloop authority", () => {
  const skill = read("skills/scd-reengineering/SKILL.md");
  const project = read("skills/scd-project/SKILL.md");
  const execute = read("skills/scd-execute/SKILL.md");
  const quickdev = read("skills/scd-quickdev/SKILL.md");

  assert.match(skill, /再工程前使用 `scd-discovery`/);
  assert.match(skill, /使用 `scd-architecture`/);
  assert.match(skill, /使用 `scd-project`/);
  assert.match(skill, /调用 `scd-execute`/);
  assert.match(skill, /通过 `scd-quickdev` 只交付一个 Delivery Issue/);
  assert.match(project, /通用外部消费者/);
  assert.match(execute, /每条 `scd-quickdev` 通道只负责一个 READY Delivery Issue/);
  assert.match(quickdev, /Reengineering 波次通过额外的故障关闭门后，经 Execute 进入 QuickDev/);
});

test("reengineering executes bounded READY waves without corrupting the DAG", () => {
  const skill = read("skills/scd-reengineering/SKILL.md");
  const execution = read(
    "skills/scd-reengineering/references/execution-contract.md",
  );

  assert.match(skill, /启动独立 Agent 和隔离工作树/);
  assert.match(skill, /在可用并发和仓库策略范围内/);
  assert.match(skill, /依赖或协调冲突节点保持串行/);
  assert.match(skill, /串行合并/);
  assert.match(execution, /不得作为伪造边写入 Project DAG/);
  assert.match(execution, /必须逐个合并/);
  assert.match(execution, /停止下游节点/);
  assert.match(execution, /专门集成 Delivery Issue/);
});

test("reengineering preserves independent acceptance and high-risk gates", () => {
  const skill = read("skills/scd-reengineering/SKILL.md");
  const execution = read(
    "skills/scd-reengineering/references/execution-contract.md",
  );

  assert.match(skill, /新上下文验收者/);
  assert.match(skill, /不能证明再工程完成/);
  assert.match(skill, /生产流量变更、破坏性数据迁移/);
  assert.match(skill, /不得从实施确认推断切换权限/);
  assert.match(execution, /独立验收的子节点无法证明组装结果/);
  assert.match(execution, /重建执行状态/);
  assert.doesNotMatch(`${skill}\n${execution}`, /\.scd\/reengineering/);
});

test("reengineering fails closed across explicit authority states", () => {
  const skill = read("skills/scd-reengineering/SKILL.md");
  const execution = read(
    "skills/scd-reengineering/references/execution-contract.md",
  );

  for (const state of [
    "SOURCE_BASELINED",
    "DIRECTION_APPROVED",
    "PROJECT_MATERIALIZED",
    "GRAPH_APPROVED",
    "EXECUTING",
    "INTEGRATION_ACCEPTED",
  ]) {
    assert.match(skill, new RegExp(`\\\`${state}\\\``));
  }

  assert.match(skill, /不得跳过或推断状态/);
  assert.match(skill, /首次实施编辑或提交前/);
  assert.match(skill, /在当前状态报告 `BLOCKED`/);
  assert.match(skill, /validate-execution-receipt\.mjs/i);
  assert.match(execution, /任何验证错误都故障关闭/);
});

test("reengineering rejects local substitutes for tracker and acceptance evidence", () => {
  const skill = read("skills/scd-reengineering/SKILL.md");
  const execution = read(
    "skills/scd-reengineering/references/execution-contract.md",
  );
  const combined = `${skill}\n${execution}`;

  assert.match(combined, /`TaskCreate`、`TodoWrite`/);
  assert.match(
    combined,
    /会话局部任务、待办或清单不是 GitHub Issues/,
  );
  assert.match(
    combined,
    /直接推送默认分支不是 QuickDev 通道/,
  );
  assert.match(
    combined,
    /本地工程检查不是新上下文验收/,
  );
  assert.match(
    skill,
    /不得使用本地任务工具复制或近似替代/,
  );
  assert.match(
    skill,
    /绝不把实施直接提交或推送到默认分支/,
  );
});

test("reengineering keeps staged and unmanaged work honest", () => {
  const contract = read(
    "skills/scd-reengineering/references/reengineering-contract.md",
  );

  assert.match(
    contract,
    /每个延期的 `keep` 或 `change` 能力继续作为可见的/,
  );
  assert.match(
    contract,
    /不得声称完成重写、相同产品契约、完全等价/,
  );
  assert.match(contract, /恢复未受管理的原型/);
  assert.match(
    contract,
    /把现有代码分类为未受管理候选，而不是 DONE/,
  );
  assert.match(
    contract,
    /不会追溯性声称原未受管理执行合规/,
  );
});
