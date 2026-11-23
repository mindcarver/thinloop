import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
const root = new URL('../', import.meta.url);
const read = file => fs.readFileSync(new URL(file, root), 'utf8');
const contract = read('skills/scd-quickdev/references/planning-contract.md');
test('planning contract separates actual approval, Git evidence, and engineering readiness', () => {
  for (const marker of ['不能自引用', '此前已存在的提交与精确文件清单', 'Git字段不能单独证明用户真实批准', '方案批准与开工授权分别记录', '漏答保持待定', '普通“继续”只延续已批准范围', '暂停受影响工作', 'occurred_at为空', '不补造历史批准']) assert.ok(contract.includes(marker), marker);
});
test('all design and delivery entrypoints load the shared readable contract', () => {
  for (const name of ['quickdev','discovery','architecture','uiux','project','execute','reengineering','ui-polish','maintenance','next','evolve']) {
    const file = `skills/scd-${name}/SKILL.md`;
    const text = read(file);
    const link = text.match(/\]\(([^)]+planning-contract\.md)\)/)?.[1];
    assert.ok(link, name);
    assert.ok(fs.existsSync(new URL(path.posix.join(path.posix.dirname(file), link), root)), name);
  }
});
test('six optional planning templates preserve status, version and real timestamp placeholders', () => {
  for (const name of ['plan','requirements','architecture','ux','implementation','decisions']) {
    const text = read(`skills/scd-quickdev/assets/planning/${name}.md`);
    for (const marker of ['status: draft','version: 1','created_at:', 'updated_at:', 'Asia/Shanghai', '+08:00']) assert.ok(text.includes(marker), `${name}: ${marker}`);
  }
  const ignore = read('.gitignore');
  for (const line of ['.scd/tasks/current.md','.scd/cache/','.scd/logs/']) assert.ok(ignore.split('\n').includes(line));
  assert.ok(!ignore.split('\n').includes('.scd/'));
});
test('local design decisions persist and baseline templates have unique time metadata', () => {
  for (const name of ['architecture','uiux']) assert.match(read(`skills/scd-${name}/SKILL.md`), /实际设计决策和局部增量写入任务计划/);
  for (const file of ['skills/scd-discovery/assets/product-prd.md','skills/scd-architecture/assets/architecture-contract.md','skills/scd-architecture/assets/feature-design.md','skills/scd-architecture/assets/domain-contract.md','skills/scd-uiux/assets/ux-contract.md']) {
    const front = read(file).split('---')[1];
    for (const key of ['version','created_at','updated_at','recorded_timezone']) assert.equal([...front.matchAll(new RegExp(`^${key}:`, 'gm'))].length, 1, `${file}: ${key}`);
    assert.match(front, /updated_at:.*\+08:00/);
  }
});
test('local routing cannot exempt non-product technical choices from confirmation', () => {
  const scope = read('skills/scd-quickdev/references/scope-contract.md');
  assert.match(scope, /不是具体技术选择确认的排他条件/);
  assert.doesNotMatch(scope, /只有在无用户参与的选择.*才提问/);
  for (const file of ['skills/scd-project/SKILL.md','skills/scd-project/references/project-contract.md']) {
    const text = read(file);
    assert.match(text, /依赖边或共享技术方案/);
    assert.match(text, /即使产品行为不变/);
    assert.doesNotMatch(text, /只有产品契约变化时才请求确认|只有受影响结果.*才再次取得确认/);
  }
  const maintenance = read('skills/scd-maintenance/SKILL.md');
  assert.match(maintenance, /具体技术方案也按计划契约确认/);
  assert.doesNotMatch(maintenance, /只有权威选择.*才询问/);
});
test('release preserves approved Git objects before deleting their final reference', () => {
  assert.match(contract, /新克隆/);
  assert.match(contract, /git show/);
  assert.match(contract, /获批SHA是默认分支祖先/);
  assert.match(contract, /不得擅自创建tag、改仓库保护/);
  const release = read('skills/scd-quickdev/references/release-contract.md');
  assert.match(release, /未通过时BLOCKED，不删除最后引用/);
  assert.match(release, /等价diff不能替代批准历史/);
  assert.match(release, /获批SHA及文件的新克隆恢复证据后，删除本地任务分支/);
  assert.match(release, /不会删除获批SHA的最后持久引用后，显式删除远端任务分支/);
});
test('installation retains historical 0.18.2 and separately describes 0.19.0', () => {
  const installation = read('docs/installation.md');
  assert.match(installation, /升级到 v0\.18\.2：步骤提示改为/);
  assert.match(installation, /升级到 v0\.19\.0：默认先确认具体技术选择/);
});
test('planning contract defines L0/L1/L2 tiers while preserving explicit confirmation invariants', () => {
  const issue = read('skills/scd-quickdev/references/issue-delivery-contract.md');
  const quickdev = read('skills/scd-quickdev/SKILL.md');
  for (const marker of [
    'L0（清晰局部小修/纯文档/小配置）',
    '免建 6 模板 `.scd/plans/` 目录与双次本地计划提交',
    '对话与紧凑中文 Issue 承载具体方案确认与开工授权',
    '绝不得跳过用户对具体方案与开工范围的明确确认',
    '不得扩大到含高风险门、跨模块架构决策',
    '范围扩大，立即升级至 L1/L2',
    'L1（常规单功能/含关键行为或 UI 变更）',
    '只保留实际需要的计划文档',
    'L2（多交付 Initiative / 架构边界 / 高风险变更）',
    '完整持久计划目录、精确版本冻结、独立集成验收与高风险人工门',
    '不新增运行时校验器、Schema检查脚本、依赖或Hook',
  ]) {
    assert.ok(contract.includes(marker), `planning-contract missing: ${marker}`);
  }
  assert.match(issue, /L0\/L1\/L2 规模自适应分级/);
  assert.match(quickdev, /L0\/L1\/L2 分级/);
  for (const [name, text] of [['planning-contract', contract], ['issue-delivery-contract', issue], ['quickdev', quickdev]]) {
    assert.doesNotMatch(text, /L0[^\n。；]*(?:免确认|免用户确认|跳过用户确认|自动批准)|状态：默认免确认/, name);
  }
});
test('persistent reachability supports Squash-Merge-only repos and blocks when merged records are missing', () => {
  const release = read('skills/scd-quickdev/references/release-contract.md');
  for (const [name, text] of [['planning-contract', contract], ['release-contract', release]]) {
    assert.match(text, /普通 Merge 仓库/, name);
    assert.match(text, /仅允许 Squash Merge 的消费者仓库/, name);
    assert.match(text, /合并后默认分支上的持久计划文件与批准事件记录/, name);
    assert.match(text, /批准版本、用户实际确认依据及时间戳/, name);
    assert.match(text, /L0 紧凑中文 Issue 批准记录/, name);
    assert.match(text, /已合并 PR 合并提交/, name);
    assert.match(text, /不再一律 `BLOCKED`/, name);
    assert.match(text, /放行并执行分支清理/, name);
    assert.match(text, /若合并后默认分支缺失该持久计划文件或批准事件记录[\s\S]*BLOCKED[\s\S]*不删除最后引用/, name);
  }
  assert.doesNotMatch(contract, /若消费者仅允许会丢失批准历史的squash\/rebase，停止/);
  assert.doesNotMatch(release, /若只能用丢失该历史的squash\/rebase，停止/);
  assert.match(release, /不得擅自创建 tag 或改保护/);
});
