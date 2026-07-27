<p align="center">
  <img src="./assets/thinloop-retro-hero.png" alt="Thinloop：把复杂开发收束为清晰闭环" width="100%">
</p>

<h1 align="center">THINLOOP</h1>

<p align="center">
  <strong>需求值得被认真理解，实现不需要被流程接管。</strong>
  <br>
  面向强编码 Agent 的轻量开发闭环：先聊透，再实现，用证据收尾。
</p>

<p align="center">
  <kbd>v0.6.1</kbd>
  &nbsp;
  <kbd>SPEC-DRIVEN</kbd>
  &nbsp;
  <kbd>EVIDENCE-BACKED</kbd>
  &nbsp;
  <kbd>LESS CEREMONY</kbd>
</p>

<p align="center">
  <a href="#capabilities">能力</a> ·
  <a href="#principles">原则</a> ·
  <a href="#workflow">闭环</a> ·
  <a href="#install">安装</a> ·
  <a href="#verification">验证</a>
</p>

---

Thinloop 不接管开发过程，只守住容易在长任务里丢失的结果：

> **需求不被误解，体验与架构有据可循，完成声明有真实证据，仓库漂移能被主动发现。**

<a id="capabilities"></a>

## 七块能力 / CAPABILITIES

<table width="100%">
  <tr>
    <td width="33%" valign="top">
      <img src="./assets/retro-discovery.png" alt="SCD Discovery 复古工程图标" width="92">
      <h3><a href="./skills/scd-discovery/SKILL.md">01 · SCD Discovery</a></h3>
      <p>把模糊想法收敛为明确批准、可以验收的交付规格。</p>
      <p><strong>适合：</strong>新产品、复杂功能、多个产品决定相互依赖。</p>
    </td>
    <td width="33%" valign="top">
      <img src="./assets/retro-uiux.png" alt="SCD UIUX 复古工程图标" width="92">
      <h3><a href="./skills/scd-uiux/SKILL.md">02 · SCD UIUX</a></h3>
      <p>把稳定的产品行为设计成可审阅、可实现的 Web 体验。</p>
      <p><strong>适合：</strong>复杂用户流、页面状态、交互与视觉设计。</p>
    </td>
    <td width="33%" valign="top">
      <img src="./assets/retro-architecture.png" alt="SCD Architecture 复古工程图标" width="92">
      <h3><a href="./skills/scd-architecture/SKILL.md">03 · SCD Architecture</a></h3>
      <p>把产品行为翻译为领域、系统边界和共享机器契约。</p>
      <p><strong>适合：</strong>新系统、公共接口和高影响技术边界。</p>
    </td>
  </tr>
  <tr>
    <td width="33%" valign="top">
      <img src="./assets/retro-dev-loop.png" alt="SCD Dev Loop 复古工程图标" width="92">
      <h3><a href="./skills/scd-dev-loop/SKILL.md">04 · SCD Dev Loop</a></h3>
      <p>按已知边界安静实现，让每个完成声明对应真实检查。</p>
      <p><strong>适合：</strong>清晰改动、已批准规格和跨会话实现。</p>
    </td>
    <td width="33%" valign="top">
      <img src="./assets/retro-knowledge.png" alt="SCD Knowledge 复古工程图标" width="92">
      <h3><a href="./skills/scd-knowledge/SKILL.md">05 · SCD Knowledge</a></h3>
      <p>把已证实的开发经验沉淀为短知识，并在需要时找回。</p>
      <p><strong>适合：</strong>主动沉淀、查找或维护开发经验。</p>
    </td>
    <td width="33%" valign="top">
      <img src="./assets/retro-maintenance.png" alt="SCD Maintenance 复古工程图标" width="92">
      <h3><a href="./skills/scd-maintenance/SKILL.md">06 · SCD Maintenance</a></h3>
      <p>主动审计并小批修复技术债和代码—文档漂移。</p>
      <p><strong>适合：</strong>主动扫描、清理、对齐或维护现有仓库。</p>
    </td>
  </tr>
  <tr>
    <td width="33%" valign="top">
      <h3><a href="./skills/scd-evolve/SKILL.md">07 · SCD Evolve</a></h3>
      <p>从一次开发互动中诊断 Skill 问题，经用户批准后做可回滚试验。</p>
      <p><strong>适合：</strong>主动复盘并优化本次真正使用过的 Thinloop Skill。</p>
    </td>
    <td width="33%" valign="top"></td>
    <td width="33%" valign="top"></td>
  </tr>
</table>

> 能力卡直达各 Skill 的权威说明；更细的契约和模板沿其 `Resources` 按需读取，不在 README 重复维护。

<a id="principles"></a>

## 设计原则 / PRINCIPLES

| 遇到什么 | Thinloop 怎么做 |
|---|---|
| 目标、边界和验收已经清楚 | 直接进入 Dev Loop，不制造额外流程 |
| 多个上游产品决定仍会改变结果 | 用 Discovery 一次解决一个关键决定 |
| 体验或技术边界仍影响交付 | 按需调用 UIUX 或 Architecture，不设固定关卡 |
| 实现完成或工作将跨会话 | 用真实证据收尾，只保存恢复所需的最小状态 |
| 用户主动要求维护或沉淀 | 调用 Maintenance 或 Knowledge；普通开发不自动触发 |
| 用户主动要求优化 Thinloop | 调用 Evolve；先诊断和候选，按候选 ID 批准后才试验 |

默认不强制 TDD、角色系统、子代理或固定阶段，也不会自动暂存、提交、推送或部署。

<a id="workflow"></a>

## 工作闭环 / WORKFLOW

```text
模糊任务 → Discovery →（按需 UIUX / Architecture）→ Dev Loop → 证据
清晰任务 ───────────────────────────────→ Dev Loop → 证据
主动调用 → Maintenance / Knowledge
主动复盘 → Evolve → 候选 ID 审批 → 可回滚试验 → 证据
```

清晰任务从 Dev Loop 直接开始；Maintenance、Knowledge 和 Evolve 只在用户主动要求时出现。

<a id="state"></a>

## 最小项目状态 / STATE

Thinloop 不创建项目 Wiki，只在复杂度真实出现时保留相应载体：

```text
.scd/
├── specs/              # 已批准交付规格
├── ux/                 # 按需：复杂 Web 体验
├── architecture.md     # 按需：系统基线
├── designs/            # 按需：高影响功能设计
├── knowledge/          # 主动沉淀的项目经验
├── evolution/          # 主动批准的 Skill 进化历史
└── tasks/current.md    # 未完成工作的一份临时状态

contracts/              # 按需：跨边界机器契约
```

详细规则见 [Discovery 产物契约](./skills/scd-discovery/references/artifacts.md)、[Architecture 契约](./skills/scd-architecture/references/architecture-contract.md)、[Knowledge 存储契约](./skills/scd-knowledge/references/storage-contract.md)、[Evolve 历史契约](./skills/scd-evolve/references/source-and-history-contract.md) 和 [Dev Loop 连续性契约](./skills/scd-dev-loop/references/continuity-contract.md)。

<a id="install"></a>

## 安装到 Codex、Claude Code、OpenCode、WorkBuddy 与 ZCode / INSTALL

七个 Skill 遵循同一目录契约，可由 Codex、Claude Code、OpenCode、WorkBuddy
和 ZCode 共享。链接适合只使用 Skill 并随仓库实时更新；Claude Code /
WorkBuddy / ZCode 完整插件会额外启用连续性 Hook，但不要与同一 Agent 的
Skill 链接重复安装。

<details>
<summary><strong>Windows · Junction</strong></summary>

```powershell
$repo = "C:\path\to\thinloop"
$skillRoots = @(
  "$env:USERPROFILE\.codex\skills",
  "$env:USERPROFILE\.claude\skills",
  "$env:USERPROFILE\.config\opencode\skills",
  "$env:USERPROFILE\.workbuddy\skills",
  "$env:USERPROFILE\.zcode\skills"
)
$skillNames = @(
  "scd-discovery", "scd-uiux", "scd-architecture",
  "scd-dev-loop", "scd-knowledge", "scd-maintenance", "scd-evolve"
)

foreach ($root in $skillRoots) {
  New-Item -ItemType Directory -Force -Path $root | Out-Null
  foreach ($name in $skillNames) {
    $link = Join-Path $root $name
    if (-not (Test-Path -LiteralPath $link)) {
      New-Item -ItemType Junction -Path $link -Target (Join-Path $repo "skills\$name")
    }
  }
}

$skillRoots | ForEach-Object {
  $root = $_
  Get-Item -Force ($skillNames | ForEach-Object { Join-Path $root $_ })
} | Format-Table FullName, LinkType, Target
```

</details>

<details>
<summary><strong>macOS / Linux · Symbolic links</strong></summary>

```bash
repo="/path/to/thinloop"
skill_roots=(
  "${CODEX_HOME:-$HOME/.codex}/skills"
  "$HOME/.claude/skills"
  "${XDG_CONFIG_HOME:-$HOME/.config}/opencode/skills"
  "$HOME/.workbuddy/skills"
  "$HOME/.zcode/skills"
)
skills=(
  scd-discovery scd-uiux scd-architecture
  scd-dev-loop scd-knowledge scd-maintenance scd-evolve
)

for root in "${skill_roots[@]}"; do
  mkdir -p "$root"
  for name in "${skills[@]}"; do
    [ -e "$root/$name" ] || ln -s "$repo/skills/$name" "$root/$name"
  done
done
```

</details>

Skill 链接只同步方法，不启用 Hook。Codex 在下一次任务发现新 Skill；Claude
Code 会热加载个人 Skill；OpenCode 重启后通过原生 `skill` 工具按需加载。
OpenCode 也能读取 `~/.claude/skills`，但使用自己的目录不会依赖 Claude
兼容开关；WorkBuddy 可从技能页查看并在对话中选择 Skill；ZCode 可从
Settings → Skills 查看并用 `$scd-dev-loop` 显式调用。

### Evolve 权威源码

`scd-evolve` 诊断阶段不需要源码配置；用户按候选 ID 批准实施后，必须通过本次
调用的绝对路径，或用户级 `.scd/config.json` 中的
`thinloop_source_root`，定位 Thinloop 的 Git 源码仓库：

```json
{
  "thinloop_source_root": "/absolute/path/to/thinloop"
}
```

不要把插件缓存或已安装 Skill 目录配置为源码。若配置文件已有其他字段，更新时
必须保留；Skill 不会自动创建或覆盖该配置。

### Claude Code 完整插件

先审查仓库中的 Skill 与 `hooks/check-state.mjs`，然后选择本地开发加载或持久
安装：

```bash
# 本地开发：不写入插件市场配置
claude plugin validate /path/to/thinloop --strict
claude --plugin-dir /path/to/thinloop

# 持久安装：注册本地 marketplace，再安装到用户作用域
claude plugin marketplace add /path/to/thinloop
claude plugin install thinloop@thinloop --scope user
```

安装或更新后，在交互会话运行 `/reload-plugins`。完整插件中的 Skill 使用
`/thinloop:scd-discovery` 这类命名空间；个人 Skill 链接使用
`/scd-discovery`。插件会在 `PreCompact` 与 `Stop` 时检查已激活的
`.scd/tasks/current.md`，没有 SCD 状态文件时不产生输出。

### WorkBuddy 完整插件

先审查仓库中的 Skill 与 `hooks/check-state.mjs`，再通过 WorkBuddy 左侧的
插件页安装：

1. 点击插件页的 `+` 添加第三方插件市场。
2. 远程安装填入 `mindcarver/thinloop`；本地开发填入
   `/path/to/thinloop`。
3. 在 Thinloop 卡片点击安装并保持启用；更新后刷新插件市场。

WorkBuddy 5.3.5 内置的 CodeBuddy 运行时读取
`.codebuddy-plugin/marketplace.json` 与 `.codebuddy-plugin/plugin.json`。
完整插件会注册七个 Skill，并在 `PreCompact` 与 `Stop` 时通过
`CODEBUDDY_PLUGIN_ROOT` 运行连续性检查；状态不完整时返回原生
`continue: false`，让 Agent 先补齐恢复信息。

### ZCode 完整插件

先审查仓库中的 Skill 与 `hooks/check-state.mjs`，然后打开一个工作区：

1. 进入 Settings → Plugins，点击 Create → Add Plugin Marketplace。
2. 本地开发填入 `/path/to/thinloop`；远程安装填入
   `mindcarver/thinloop`；若远程 clone 超时，改用本地仓库路径。
3. 自定义 Marketplace 会显示在 Personal 筛选下；切换到 Personal 后，在
   `thinloop` 卡片点击 Install，并保持插件启用；更新代码后点击 Refresh。

完整插件会注册七个 Skill；`Stop` 发现激活状态不可恢复时会让主 Agent
继续补齐，最多连续三次；压缩后的 `SessionStart(compact)` 会把缺失状态作为
恢复上下文注入。ZCode 不支持 Codex 专用的 `PreCompact` 事件，因此当前运行时
会记录一条 warning 并只跳过该事件，不影响上述两个 ZCode Hook。

### 手动调用 / EXAMPLES

```text
Codex：使用 $scd-discovery 把这个想法聊透并形成可验收规格。
Codex：使用 $scd-dev-loop 按已批准规格实现并给出证据。
Codex：使用 $scd-evolve 复盘本次互动，只提出一个候选，不要先修改。
Claude Code Skill 链接：/scd-discovery
Claude Code 完整插件：/thinloop:scd-dev-loop
OpenCode：使用 scd-dev-loop skill 按已批准规格实现并给出证据。
WorkBuddy 完整插件：/thinloop:scd-dev-loop
ZCode：使用 $scd-dev-loop 按已批准规格实现并给出证据。
ZCode：使用 $scd-evolve 诊断本次使用过的 Thinloop Skill。
```

<a id="verification"></a>

## 本地验证 / VERIFICATION

| 检查 | 当前结果 |
|---|---:|
| Node 契约与 Hook 测试 | `PASS` |
| Discovery / Knowledge 用例结构 | `PASS` |
| UIUX / Architecture / Maintenance 契约 | `PASS` |
| Evolve 审批、源码与历史契约 | `PASS` |
| Codex Skill / 插件校验 | `PASS` |
| Claude Code 插件校验 | `PASS` |
| OpenCode Skill 发现与格式校验 | `PASS` |
| WorkBuddy 插件、Marketplace 与 Hook 校验 | `PASS` |
| ZCode 清单、Skill 与 Hook 契约 | `PASS` |

```powershell
node --test tests\*.test.mjs
node evals\validate-discovery-cases.mjs
node evals\validate-knowledge-cases.mjs
node skills\scd-maintenance\scripts\collect-signals.mjs --root . --format text
node skills\scd-evolve\scripts\evolution-history.mjs validate --history .scd\evolution\history.jsonl
claude plugin validate . --strict
opencode debug skill
codebuddy plugin validate .codebuddy-plugin/plugin.json
codebuddy plugin validate .codebuddy-plugin/marketplace.json
zcode plugins list --json
zcode skills list --json
```

Codex 官方校验器可对 `skills/` 下每个目录运行 `quick_validate.py`，再对仓库
根目录运行 `validate_plugin.py`；Claude Code 使用
`claude plugin validate . --strict`；OpenCode 安装链接并重启后，使用
`opencode debug skill` 检查七个 `scd-*` Skill。OpenCode 当前没有与 Codex /
Claude Stop Hook 等价的可取消完成协议，因此本次支持不声明连续性阻断能力。
WorkBuddy 使用其内置 CodeBuddy CLI 校验原生插件与 Marketplace 清单，并通过
专用 Hook 配置验证 `CODEBUDDY_PLUGIN_ROOT` 和 `continue: false` 协议。
ZCode 安装并启用完整插件后，使用 `zcode plugins list --json` 检查两个可运行
Hook，再用 `zcode skills list --json` 检查七个插件 Skill。
完整评测方法、历史证据和限制见 [EVALUATION.md](./EVALUATION.md)。

---

<p align="center">
  <strong>DEEPER UNDERSTANDING · LESS CEREMONY · STRONGER EVIDENCE</strong>
  <br>
  MIT License · 2026 mindcarver
</p>
