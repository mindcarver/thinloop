<p align="center">
  <img src="./assets/thinloop-retro-hero.png" alt="Thinloop：把复杂开发收束为清晰闭环" width="100%">
</p>

<h1 align="center">THINLOOP</h1>

<p align="center">
  <kbd>SCD / SIMPLIFY COMPLEX DEVELOPMENT</kbd>
  &nbsp;
  <kbd>BUILD 0.2.0</kbd>
  &nbsp;
  <kbd>CODEX DEVELOPMENT INSTRUMENT</kbd>
</p>

<p align="center">
  <strong>需求值得被认真理解，实现不需要被流程接管。</strong>
  <br>
  Thinloop 用一个深入的需求收敛环和一个安静的开发闭环，
  <br>
  把复杂开发变成可批准、可验证、可恢复的交付。
</p>

<table align="center">
  <thead>
    <tr>
      <th align="center">SCD MODULE</th>
      <th align="center">它负责什么</th>
      <th align="center">什么时候出现</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td align="center"><code>scd-discovery</code></td>
      <td align="center">把模糊想法收敛为明确批准、可以验收的规格</td>
      <td align="center">新产品或多个产品决策相互依赖时</td>
    </tr>
    <tr>
      <td align="center"><code>scd-dev-loop</code></td>
      <td align="center">按已知边界实现，用真实证据支撑完成声明</td>
      <td align="center">清晰改动、已批准规格和未完成实现</td>
    </tr>
  </tbody>
</table>

<p align="center">
  <code>模糊想法</code>
  &nbsp;→&nbsp;
  <code>聊透当前交付</code>
  &nbsp;→&nbsp;
  <code>明确批准</code>
  &nbsp;→&nbsp;
  <code>可靠实现</code>
</p>

---

<h2 align="center">01 / 轻，不等于草率</h2>

<p align="center">
  Thinloop 不规定固定阶段，不要求每个任务写计划，
  <br>
  也不把一个清晰改动升级成产品研讨会。
</p>

<table align="center">
  <thead>
    <tr>
      <th align="center">内部路径</th>
      <th align="center">判断</th>
      <th align="center">表现</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td align="center"><code>DIRECT</code></td>
      <td align="center">目标、边界、验收已经清楚</td>
      <td align="center">直接实现，不提问，不创建状态</td>
    </tr>
    <tr>
      <td align="center"><code>CLARIFY</code></td>
      <td align="center">一个答案就能补足范围</td>
      <td align="center">只问一个实质问题，然后继续</td>
    </tr>
    <tr>
      <td align="center"><code>DISCOVERY</code></td>
      <td align="center">多个上游产品决定尚未存在</td>
      <td align="center">逐个收敛，批准前不编码</td>
    </tr>
  </tbody>
</table>

<p align="center">
  新产品、应用、插件、服务和系统默认进入 <code>DISCOVERY</code>。
  <br>
  已有完整规格则走快速通道：审查真实缺口，不重复采访。
</p>

<p align="center">
  ◇ 不强制 TDD
  &nbsp;◇&nbsp;
  不默认创建工作树或子代理
  &nbsp;◇&nbsp;
  不生成角色和命令套件
  <br>
  ◇ 不自动暂存、提交或部署
  &nbsp;◇&nbsp;
  不为普通小改动制造流程产物
</p>

---

<h2 align="center">02 / SCD DISCOVERY</h2>

<p align="center">
  Discovery 不靠一张固定问卷堆问题。
  <br>
  它寻找当前最上游的决策，给出推荐与理由，一次只请求一个决定。
</p>

<p align="center">
  <code>确认用户、问题与期望变化</code>
  <br>↓<br>
  <code>定义下一次完整交付</code>
  <br>↓<br>
  <code>沿决策依赖逐层展开</code>
  <br>↓<br>
  <code>覆盖主路径、失败、数据、权限与边界</code>
  <br>↓<br>
  <code>静默执行矛盾与遗漏审查</code>
  <br>↓<br>
  <code>用户明确批准</code>
</p>

<p align="center">
  能从仓库、文档和环境确认的事实不会被重新问给用户。
  <br>
  模型负责调查、推荐和发现矛盾；用户拥有产品取舍。
</p>

<p align="center">
  <strong>聊透的是下一次准备实现的完整版本，</strong>
  <br>
  不是一次设计产品未来三年的全部可能性。
</p>

---

<h2 align="center">03 / 中型项目的最小文档面</h2>

<p align="center">
  默认只有两份长期信息和一份临时状态。
</p>

<pre align="center"><code>.scd/
|-- architecture.md
|-- specs/
|   |-- 001-mvp.md
|   `-- 002-next-delivery.md
`-- tasks/
    `-- current.md</code></pre>

<table align="center">
  <thead>
    <tr>
      <th align="center">载体</th>
      <th align="center">生命周期</th>
      <th align="center">内容</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td align="center"><code>specs/&lt;slug&gt;.md</code></td>
      <td align="center">每次交付长期保留</td>
      <td align="center">用户行为、边界、决定和验收</td>
    </tr>
    <tr>
      <td align="center"><code>architecture.md</code></td>
      <td align="center">随系统边界演进</td>
      <td align="center">组件职责、数据流和长期技术取舍</td>
    </tr>
    <tr>
      <td align="center"><code>tasks/current.md</code></td>
      <td align="center">未完成时临时存在</td>
      <td align="center">最小恢复状态、证据和唯一下一步</td>
    </tr>
  </tbody>
</table>

<p align="center">
  只有数据生命周期真正复杂时才拆出 <code>data-model.md</code>；
  <br>
  只有具体功能存在高风险技术取舍时才创建 <code>designs/&lt;feature&gt;.md</code>；
  <br>
  不保留会迅速过期的 <code>implementation-plan.md</code>。
</p>

---

<h2 align="center">04 / SCD DEV LOOP</h2>

<p align="center">
  Dev Loop 维护三个结果契约。
</p>

<table align="center">
  <thead>
    <tr>
      <th align="center">CONTRACT</th>
      <th align="center">它守住什么</th>
      <th align="center">默认表现</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td align="center"><code>SCOPE</code></td>
      <td align="center">目标、边界和验收足以行动</td>
      <td align="center">只有实质歧义才询问</td>
    </tr>
    <tr>
      <td align="center"><code>EVIDENCE</code></td>
      <td align="center">完成声明对应实际验证</td>
      <td align="center">无法验证时明确降级</td>
    </tr>
    <tr>
      <td align="center"><code>CONTINUITY</code></td>
      <td align="center">中断后恢复到正确下一步</td>
      <td align="center">只有必要时才保存状态</td>
    </tr>
  </tbody>
</table>

<p align="center">
  规格里的 <code>A1 / A2 / A3</code> 会一路映射到最终 Evidence。
  <br>
  每一项只能是 <code>PASS</code>、<code>UNVERIFIED</code> 或带原因的阻塞，
  <br>
  不允许用一次无关的测试笼统宣布全部完成。
</p>

---

<h2 align="center">05 / 安装到 CODEX</h2>

<h3 align="center">Windows：使用 Junction 保持源码实时同步</h3>

<p align="center">
  仓库中的 Skill 更新后，Codex 侧无需再次复制。
  <br>
  分别把两个 Skill 目录链接到用户 Skill 目录。
</p>

<pre align="center"><code>$repo = "C:\Users\Administrator\workspace\mindcarver\thinloop"
$codexSkills = "$env:USERPROFILE\.codex\skills"

New-Item -ItemType Junction `
  -Path "$codexSkills\scd-discovery" `
  -Target "$repo\skills\scd-discovery"

New-Item -ItemType Junction `
  -Path "$codexSkills\scd-dev-loop" `
  -Target "$repo\skills\scd-dev-loop"</code></pre>

<p align="center"><strong>验证链接</strong></p>

<pre align="center"><code>Get-Item -Force `
  "$env:USERPROFILE\.codex\skills\scd-discovery", `
  "$env:USERPROFILE\.codex\skills\scd-dev-loop" |
  Format-List FullName,LinkType,Target</code></pre>

<p align="center">
  新安装的 Skill 在下一次 Codex 任务中被发现。
  <br>
  Skill Junction 只负责方法实时同步；插件根目录中的 Hook
  <br>
  仍需通过完整插件加载并完成一次信任审查后才会执行。
</p>

<p align="center"><strong>需要显式调用时</strong></p>

<pre align="center"><code>使用 $scd-discovery 把这个想法聊透并形成可验收规格。

使用 $scd-dev-loop 按已批准规格实现并给出证据。</code></pre>

---

<h2 align="center">06 / 本地验证</h2>

<pre align="center"><code>node --test tests\*.test.mjs
node evals\validate-discovery-cases.mjs

py C:\Users\Administrator\.codex\skills\.system\skill-creator\scripts\quick_validate.py `
  skills\scd-discovery

py C:\Users\Administrator\.codex\skills\.system\skill-creator\scripts\quick_validate.py `
  skills\scd-dev-loop

py C:\Users\Administrator\.codex\skills\.system\plugin-creator\scripts\validate_plugin.py .</code></pre>

<p align="center">
  Dev Loop 第一版的 12 组成对隔离任务中：
  <br>
  启用 Thinloop 为 <strong>12 / 12</strong>，未启用为 <strong>10 / 12</strong>，
  Hook 误拦截为 <strong>0</strong>。
</p>

<p align="center">
  Discovery 另附 12 组路由与恢复评测用例。
  <br>
  用例结构可以本地验证；真实代理行为结果只有实际运行后才记录。
  <br>
  完整方法、历史证据和限制见 <a href="./EVALUATION.md">EVALUATION.md</a>。
</p>

---

<h2 align="center">07 / 仓库结构</h2>

<pre align="center"><code>thinloop/
|-- .codex-plugin/
|   `-- plugin.json
|-- .scd/
|   `-- specs/
|       `-- scd-discovery.md
|-- assets/
|   `-- thinloop-retro-hero.png
|-- skills/
|   |-- scd-discovery/
|   |   |-- SKILL.md
|   |   |-- agents/openai.yaml
|   |   `-- references/
|   `-- scd-dev-loop/
|       |-- SKILL.md
|       |-- agents/openai.yaml
|       |-- assets/current-task.md
|       `-- references/
|-- hooks/
|-- tests/
`-- evals/</code></pre>

---

<p align="center">
  <kbd>DEEPER UNDERSTANDING.</kbd>
  &nbsp;
  <kbd>LESS CEREMONY.</kbd>
  &nbsp;
  <kbd>STRONGER EVIDENCE.</kbd>
</p>

<p align="center">
  <strong>先把真正重要的决定聊透，再让强模型安静地把它做出来。</strong>
</p>

<p align="center">
  MIT License · 2026 mindcarver
</p>
