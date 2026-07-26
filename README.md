<p align="center">
  <img src="./assets/thinloop-retro-hero.png" alt="Thinloop：把复杂开发收束为清晰闭环" width="100%">
</p>

<h1 align="center">THINLOOP</h1>

<p align="center">
  <kbd>SCD / SIMPLIFY COMPLEX DEVELOPMENT</kbd>
  &nbsp;
  <kbd>BUILD 0.1.0</kbd>
  &nbsp;
  <kbd>CODEX DEVELOPMENT INSTRUMENT</kbd>
</p>

<p align="center">
  <strong>模型已经足够强。</strong>
  <br>
  我们需要的不是更重的流程，而是更可靠的结果。
</p>

<p align="center">
  Thinloop 是一个轻量 Codex 开发插件。<br>
  它不规定固定阶段，不接管你的开发方式，<br>
  只在真正重要的地方维护三个结果契约。
</p>

<table align="center">
  <thead>
    <tr>
      <th align="center">信号通道</th>
      <th align="center">它守住什么</th>
      <th align="center">默认表现</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td align="center"><code>SCOPE</code></td>
      <td align="center">目标、边界和验收条件足以开始</td>
      <td align="center">只有实质歧义才询问</td>
    </tr>
    <tr>
      <td align="center"><code>EVIDENCE</code></td>
      <td align="center">完成声明必须对应真实验证</td>
      <td align="center">无法验证时明确降级</td>
    </tr>
    <tr>
      <td align="center"><code>CONTINUITY</code></td>
      <td align="center">中断后能恢复到正确下一步</td>
      <td align="center">只有必要时才保存状态</td>
    </tr>
  </tbody>
</table>

<p align="center">
  普通任务应该像拨动一枚机械开关：<br>
  <strong>直接、安静、可预测。</strong>
</p>

---

<h2 align="center">01 / 它刻意不做什么</h2>

<p align="center">
  Thinloop 不是另一套庞大的开发方法论。
</p>

<p align="center">
  ◈ 不强制 TDD<br>
  ◈ 不强制 PRD、角色分工或阶段播报<br>
  ◈ 不默认创建工作树、子代理或项目 Wiki<br>
  ◈ 不自动暂存、提交、推送或部署<br>
  ◈ 不因为一个小改动就生成计划和状态文件
</p>

<p align="center">核心只有一个 Skill：</p>

<pre align="center"><code>scd-dev-loop</code></pre>

<p align="center">
  Scope、Evidence、Continuity 是它内部按需读取的参考契约，<br>
  不会膨胀成一排需要手动选择的技能。
</p>

---

<h2 align="center">02 / 工作方式</h2>

<p align="center">
  <code>复杂请求</code><br>
  ↓<br>
  <code>范围是否足够清楚？</code><br>
  ↓<br>
  <code>实现最小且完整的改动</code><br>
  ↓<br>
  <code>运行当前风险下最强的实际验证</code><br>
  ↓<br>
  <code>只在可能跨会话时保存最小恢复状态</code><br>
  ↓<br>
  <code>完成后清理</code>
</p>

<p align="center"><strong>验证证据按风险自适应</strong></p>

<p align="center">
  行为 / 回归测试<br>
  ↓<br>
  类型检查 · 构建 · Lint<br>
  ↓<br>
  真实运行 · API · UI<br>
  ↓<br>
  静态检查 + 明确未验证边界
</p>

---

<h2 align="center">03 / 安装到 Codex</h2>

<h3 align="center">Windows：推荐使用目录联接</h3>

<p align="center">
  开发中的仓库不需要复制。<br>
  把 Skill 目录联接到 Codex，后续修改项目文件即可立即保持同步。
</p>

<pre align="center"><code>$source = "C:\Users\Administrator\workspace\mindcarver\thinloop\skills\scd-dev-loop"
$target = "$env:USERPROFILE\.codex\skills\scd-dev-loop"

New-Item -ItemType Junction -Path $target -Target $source</code></pre>

<p align="center"><strong>验证联接</strong></p>

<pre align="center"><code>Get-Item -Force "$env:USERPROFILE\.codex\skills\scd-dev-loop" |
  Format-List FullName,LinkType,Target</code></pre>

<p align="center">
  Codex 官方支持扫描软连接形式的 Skill 目录。<br>
  新安装的 Skill 在下一次任务中可用。
</p>

<p align="center"><strong>需要显式调用时</strong></p>

<pre align="center"><code>使用 $scd-dev-loop 完成这个仓库改动。</code></pre>

<p align="center">
  正常情况下无需显式调用。<br>
  Skill 描述会让 Codex 在功能实现、Bug 修复、重构、迁移<br>
  和恢复未完成工作时自动选择它。
</p>

<h3 align="center">关于 Hook</h3>

<p align="center">
  Skill 目录联接能实时同步核心方法，<br>
  但插件根目录中的 <code>PreCompact</code> / <code>Stop</code> Hook<br>
  只有在完整插件被启用并完成信任审查后才会加载。
</p>

<p align="center">
  Hook 是机械兜底，不是语义执行引擎。<br>
  它只检查由 Thinloop 管理的：
</p>

<pre align="center"><code>.ai/tasks/current.md</code></pre>

<p align="center">
  没有这个文件时直接放行；<br>
  Hook 自身异常时也会放行并给出警告，避免死锁。
</p>

---

<h2 align="center">04 / 最小恢复状态</h2>

<p align="center">
  只有任务可能跨会话、多条验收路径需要分别完成、<br>
  关键决策需要保留，或用户主动暂停时，才创建状态文件。
</p>

<pre align="center"><code>managed_by: scd-dev-loop
status: active
updated_at: 2026-07-26T11:00:00+08:00</code></pre>

<p align="center"><strong>正文固定保存</strong></p>

<p align="center">
  <code>Outcome</code> ·
  <code>Boundaries</code> ·
  <code>Acceptance</code> ·
  <code>Decisions</code> ·
  <code>Evidence</code> ·
  <code>Next action</code>
</p>

<p align="center">
  同一工作树最多一个 <code>current.md</code>。<br>
  完成后保留长期有效的决策，删除临时恢复状态。
</p>

---

<h2 align="center">05 / 仓库结构</h2>

<pre align="center"><code>thinloop/
|-- .codex-plugin/
|   `-- plugin.json
|-- assets/
|   `-- thinloop-retro-hero.png
|-- skills/
|   `-- scd-dev-loop/
|       |-- SKILL.md
|       |-- agents/openai.yaml
|       |-- assets/current-task.md
|       `-- references/
|-- hooks/
|   |-- hooks.json
|   `-- check-state.mjs
|-- tests/
`-- evals/</code></pre>

<p align="center"><strong>运行本地检查</strong></p>

<pre align="center"><code>node --test tests\check-state.test.mjs

py C:\Users\Administrator\.codex\skills\.system\skill-creator\scripts\quick_validate.py `
  skills\scd-dev-loop

py C:\Users\Administrator\.codex\skills\.system\plugin-creator\scripts\validate_plugin.py .</code></pre>

---

<h2 align="center">06 / 已有证据</h2>

<p align="center">
  第一版使用 12 组、24 次隔离任务做配对评测。
</p>

<table align="center">
  <thead>
    <tr>
      <th align="center">条件</th>
      <th align="center">隐藏验收</th>
      <th align="center">Hook 误拦截</th>
      <th align="center">自动提交</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td align="center">未启用 Thinloop</td>
      <td align="center">10 / 12</td>
      <td align="center">0</td>
      <td align="center">0</td>
    </tr>
    <tr>
      <td align="center">启用 Thinloop</td>
      <td align="center"><strong>12 / 12</strong></td>
      <td align="center">0</td>
      <td align="center">0</td>
    </tr>
  </tbody>
</table>

<p align="center">
  清晰小改动保持零额外提问、零状态文件。<br>
  净提升集中在连续性：
</p>

<p align="center">
  ◈ 完成已有跨会话任务后，清理失效状态<br>
  ◈ 按要求中途停止时，留下完整且唯一的下一步
</p>

<p align="center">
  完整方法与限制见 <a href="./EVALUATION.md">EVALUATION.md</a>
</p>

---

<h2 align="center">07 / 设计原则</h2>

<p align="center">
  <kbd>LESS CEREMONY.</kbd>
  &nbsp;
  <kbd>STRONGER EVIDENCE.</kbd>
  &nbsp;
  <kbd>CONTINUITY ONLY WHEN IT MATTERS.</kbd>
</p>

<p align="center">
  <strong>少一点仪式，多一点证据；</strong><br>
  <strong>只在真正需要时保存连续性。</strong>
</p>

---

<p align="center">
  MIT License · 2026 mindcarver
</p>
