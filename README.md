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
  <kbd>v0.7.0</kbd>
  &nbsp;
  <kbd>ISSUE-DRIVEN</kbd>
  &nbsp;
  <kbd>EVIDENCE-BACKED</kbd>
  &nbsp;
  <kbd>LESS CEREMONY</kbd>
</p>

<p align="center">
  <a href="#quick-start">开始</a> ·
  <a href="#capabilities">能力</a> ·
  <a href="#principles">原则</a> ·
  <a href="#workflow">闭环</a> ·
  <a href="#install">安装</a> ·
  <a href="#verification">验证</a>
</p>

---

Thinloop 不接管开发过程，只守住容易在长任务里丢失的结果：

> **需求不被误解，体验与架构有据可循，完成声明有真实证据，仓库漂移能被主动发现。**

<a id="quick-start"></a>

## 30 秒开始 / QUICK START

大多数开发任务只需要调用 `scd-quickdev` 并说明目标：

```text
使用 scd-quickdev 修复登录后偶发白屏，并补回归验证。
使用 scd-quickdev 增加 CSV 导出，完成后提 PR 并合并 main。
```

QuickDev 会先判断任务是否足够清楚，而不是要求用户选择流程：

| 当前情况 | 默认路径 |
|---|---|
| Bug 或清晰、局部的新功能 | 建立或确认 Issue，直接诊断、实现和验证 |
| 多个产品决定仍未明确 | 调用 Discovery 逐项澄清，批准后把结论写入 Issue |
| UI 或系统边界会显著影响实现 | 按需组合 UIUX 或 Architecture |
| 工程验证通过 | Agent 自审、提交、推送、提 PR，并在工程闸门通过后合并 |
| 合并完成 | Issue 保持 `awaiting-uat`，用户只做真实使用验收 |
| 生产部署、认证支付、破坏性数据等高风险工作 | 在高风险动作前停下并请求明确批准 |

GitHub Issue 是需求、任务和验收的唯一真值源；PR 是实现证据、工程审阅和回滚
边界。简单任务不会先写本地 Spec，也不强制创建 worktree。

<a id="capabilities"></a>

## 七块能力 / CAPABILITIES

<table width="100%">
  <tr>
    <td width="33%" valign="top">
      <img src="./assets/retro-discovery.png" alt="SCD Discovery 复古工程图标" width="92">
      <h3><a href="./skills/scd-discovery/SKILL.md">01 · SCD Discovery</a></h3>
      <p>把模糊想法收敛为明确批准、可以验收的 GitHub Issue。</p>
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
      <img src="./assets/retro-dev-loop.png" alt="SCD QuickDev 复古工程图标" width="92">
      <h3><a href="./skills/scd-quickdev/SKILL.md">04 · SCD QuickDev</a></h3>
      <p>从 Issue 开始完成诊断、开发、验证、PR 和可自动合并的交付。</p>
      <p><strong>适合：</strong>Bug、清晰功能、已批准 Issue 和跨会话实现。</p>
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
| 目标、边界和验收已经清楚 | 直接进入 QuickDev，不制造额外需求流程 |
| 多个上游产品决定仍会改变结果 | 用 Discovery 一次解决一个关键决定 |
| 体验或技术边界仍影响交付 | 按需调用 UIUX 或 Architecture，不设固定关卡 |
| 实现完成 | Agent 验证、自审、提 PR 并在工程闸门通过后合并 `main` |
| 合并完成 | Issue 保持 `awaiting-uat`，由用户只做真实使用验收 |
| 用户主动要求维护或沉淀 | 调用 Maintenance 或 Knowledge；普通开发不自动触发 |
| 用户主动要求优化 Thinloop | 调用 Evolve；先诊断和候选，按候选 ID 批准后才试验 |

默认不强制 TDD、角色系统、子代理或固定阶段。QuickDev 的实现请求包含任务内
Issue、分支、提交、推送、PR 与合资格合并；高风险合并和生产部署仍需明确授权。

<a id="workflow"></a>

## 工作闭环 / WORKFLOW

```text
模糊任务 → Discovery → 批准 Issue →（按需 UIUX / Architecture）→ QuickDev
清晰任务 → 创建/确认 Issue ───────────────────────────────→ QuickDev
QuickDev → 分支 → 开发与工程验收 → PR → main → awaiting-uat → 真人使用验收
主动调用 → Maintenance / Knowledge
主动复盘 → Evolve → 候选 ID 审批 → 可回滚试验 → 证据
```

GitHub Issue 是需求和验收的唯一真值源，PR 保存实现与验证证据。清晰任务从
QuickDev 直接开始；Maintenance、Knowledge 和 Evolve 只在用户主动要求时出现。

<a id="state"></a>

## 最小项目状态 / STATE

Thinloop 不创建项目 Wiki，只在复杂度真实出现时保留相应载体：

```text
.scd/
├── ux/                 # 按需：复杂 Web 体验
├── architecture.md     # 按需：系统基线
├── designs/            # 按需：高影响功能设计
├── knowledge/          # 主动沉淀的项目经验
├── evolution/          # 主动批准的 Skill 进化历史
└── tasks/current.md    # 未完成工作的一份临时状态

contracts/              # 按需：跨边界机器契约
```

仓库中已有的 `.scd/specs/` 文件仅保留为旧版本设计和评估历史；v0.7.0
开始的新交付不会读取或创建本地产品规格。

详细规则见 [Discovery 产物契约](./skills/scd-discovery/references/artifacts.md)、[QuickDev Issue 交付契约](./skills/scd-quickdev/references/issue-delivery-contract.md)、[Architecture 契约](./skills/scd-architecture/references/architecture-contract.md)、[Knowledge 存储契约](./skills/scd-knowledge/references/storage-contract.md)、[Evolve 历史契约](./skills/scd-evolve/references/source-and-history-contract.md) 和 [QuickDev 连续性契约](./skills/scd-quickdev/references/continuity-contract.md)。

<a id="install"></a>

## 安装到 Codex、Claude Code、OpenCode、WorkBuddy 与 ZCode / INSTALL

七个 Skill 遵循同一目录契约。推荐安装方式如下：

| Agent | 推荐安装 | 更新生效 |
|---|---|---|
| Codex | 把七个 Skill 链接到 `~/.codex/skills` | 新任务 |
| OpenCode | 把七个 Skill 链接到 `~/.config/opencode/skills` | 重启 OpenCode |
| Claude Code | 安装完整插件 | 更新后重启或重新加载插件 |
| WorkBuddy | 安装完整插件 | 更新后重启 WorkBuddy |
| ZCode | 安装完整插件 | 更新后新建会话 |

Skill 链接随源码仓库更新，但不启用连续性 Hook；Claude Code、WorkBuddy 和
ZCode 的完整插件会额外启用各自支持的 Hook。不要在同一个 Agent 中同时安装
完整插件和个人 Skill 链接，以免重复暴露同名能力。

<details>
<summary><strong>Windows · Junction</strong></summary>

```powershell
$repo = "C:\path\to\thinloop"
$skillRoots = @(
  "$env:USERPROFILE\.codex\skills",
  "$env:USERPROFILE\.config\opencode\skills"
)
$skillNames = @(
  "scd-discovery", "scd-uiux", "scd-architecture",
  "scd-quickdev", "scd-knowledge", "scd-maintenance", "scd-evolve"
)

foreach ($root in $skillRoots) {
  New-Item -ItemType Directory -Force -Path $root | Out-Null

  $legacy = Join-Path $root "scd-dev-loop"
  $legacyItem = Get-Item -LiteralPath $legacy -Force -ErrorAction SilentlyContinue
  if ($null -ne $legacyItem -and
      ($legacyItem.Attributes -band [IO.FileAttributes]::ReparsePoint)) {
    Remove-Item -LiteralPath $legacy
  }

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
  "${XDG_CONFIG_HOME:-$HOME/.config}/opencode/skills"
)
skills=(
  scd-discovery scd-uiux scd-architecture
  scd-quickdev scd-knowledge scd-maintenance scd-evolve
)

for root in "${skill_roots[@]}"; do
  mkdir -p "$root"
  [ -L "$root/scd-dev-loop" ] && unlink "$root/scd-dev-loop"

  for name in "${skills[@]}"; do
    link="$root/$name"
    target="$repo/skills/$name"

    if [ -L "$link" ]; then
      [ "$(readlink "$link")" = "$target" ] && continue
      unlink "$link"
    elif [ -e "$link" ]; then
      echo "skip existing non-link: $link" >&2
      continue
    fi

    ln -s "$target" "$link"
  done
done
```

</details>

上面的脚本只移除明确的旧链接 `scd-dev-loop`，并修复七个 Thinloop Skill
链接；遇到同名的真实文件或目录会跳过，不会覆盖用户内容。OpenCode 也能读取
`~/.claude/skills`，但使用自己的目录不会依赖 Claude 兼容开关。

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
   `thinloop` 卡片点击 Install，并保持插件启用。

完整插件会注册七个 Skill；`Stop` 发现激活状态不可恢复时会让主 Agent
继续补齐，最多连续三次；压缩后的 `SessionStart(compact)` 会把缺失状态作为
恢复上下文注入。ZCode 不支持 Codex 专用的 `PreCompact` 事件，因此当前运行时
会记录一条 warning 并只跳过该事件，不影响上述两个 ZCode Hook。

### 更新已有安装 / UPDATE

先更新源码仓库：

```bash
git -C /path/to/thinloop pull --ff-only
```

随后按安装方式刷新：

```bash
# Codex / OpenCode：重新运行上面的链接脚本，然后开启新任务或重启 Agent

# Claude Code 完整插件
claude plugin update thinloop@thinloop --scope user

# WorkBuddy 完整插件（安装了 CodeBuddy CLI 时）
codebuddy plugin update thinloop@thinloop --scope user
```

- Claude Code：命令成功后重启客户端，或在交互会话重新加载插件。
- WorkBuddy：也可以在插件页刷新市场后更新 Thinloop；完成后重启 WorkBuddy。
- ZCode：Settings → Plugins → Refresh → `thinloop` → Update；更新后新建会话。
- 从 v0.6.x 升级：确认旧 `scd-dev-loop` 已消失，当前列表中存在
  `scd-quickdev`，并且插件版本显示 `0.7.0`。

### 手动调用 / EXAMPLES

```text
Codex：使用 $scd-discovery 把这个想法聊透并形成可验收 Issue。
Codex：使用 $scd-quickdev 修复这个 Bug，验证后提 PR 并合并 main。
Codex：使用 $scd-evolve 复盘本次互动，只提出一个候选，不要先修改。
Claude Code Skill 链接：/scd-discovery
Claude Code 完整插件：/thinloop:scd-quickdev
OpenCode：使用 scd-quickdev skill 按 Issue 开发、验证并合并。
WorkBuddy 完整插件：/thinloop:scd-quickdev
ZCode：使用 $scd-quickdev 按 Issue 开发、验证并合并。
ZCode：使用 $scd-evolve 诊断本次使用过的 Thinloop Skill。
```

<a id="verification"></a>

## 本地验证 / VERIFICATION

仓库自身提供并维护以下可执行校验：

```bash
node --test tests/*.test.mjs
node evals/validate-discovery-cases.mjs
node evals/validate-knowledge-cases.mjs
node skills/scd-maintenance/scripts/collect-signals.mjs --root . --format text
claude plugin validate . --strict
codebuddy plugin validate .codebuddy-plugin/plugin.json
codebuddy plugin validate .codebuddy-plugin/marketplace.json
```

安装后的运行时证据按平台检查，不假设每个平台都有相同 CLI：

| Agent | 安装后检查 |
|---|---|
| Codex | 七个链接都能读取 `SKILL.md`；新任务可发现 `$scd-quickdev` |
| Claude Code | `claude plugin list` 显示 `thinloop@thinloop`、`0.7.0`、enabled |
| OpenCode | `opencode debug skill` 输出七个当前 `scd-*` Skill |
| WorkBuddy | `codebuddy plugin list`（若当前 CLI 支持）或插件页显示 `0.7.0`、enabled |
| ZCode | Settings → Plugins 显示 `0.7.0`、7 Skills、2 Hooks；Skills 中存在 `scd-quickdev` |

OpenCode 当前没有与 Claude Code / WorkBuddy / ZCode Stop Hook 等价的可取消完成
协议，因此不声明连续性阻断能力。ZCode 当前安装不提供可依赖的 `zcode` CLI，
所以 README 以实际 Settings 界面作为安装验证边界。
完整评测方法、历史证据和限制见 [EVALUATION.md](./EVALUATION.md)。

---

<p align="center">
  <strong>DEEPER UNDERSTANDING · LESS CEREMONY · STRONGER EVIDENCE</strong>
  <br>
  MIT License · 2026 mindcarver
</p>
