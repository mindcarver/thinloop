# Thinloop 安装与更新指南

[返回 README](../README.md)

十二个 Skill 遵循同一目录契约。推荐安装方式如下：

| Agent | 推荐安装 | 更新生效 |
|---|---|---|
| Codex | 把十二个 Skill 链接到 `~/.codex/skills` | 新任务 |
| OpenCode | 把十二个 Skill 链接到 `~/.config/opencode/skills` | 重启 OpenCode |
| Pi | 把十二个 Skill 链接到 `~/.pi/agent/skills` | 新会话或执行 `/reload` |
| CodeWhale | 把十二个 Skill 链接到 `~/.codewhale/skills` | 新会话 |
| Reasonix | 把十二个 Skill 链接到 `~/.reasonix/skills` | 新会话 |
| DeepSeek Harness | 把十二个 Skill 链接到 `~/.dsh/skills` | 新会话（filesystem provider 的 watcher 会自动失效并更新目录） |
| Claude Code | 安装完整插件 | 更新后重启或重新加载插件 |
| WorkBuddy | 安装完整插件 | 更新后重启 WorkBuddy |
| ZCode | 安装完整插件 | 更新后新建会话 |

Skill 链接随源码仓库更新，但默认不启用连续性 Hook；Claude Code、WorkBuddy
和 ZCode 的完整插件会额外启用各自支持的 Hook，DeepSeek Harness 则通过手动
挂载 `.dsh-plugin/continuity.mjs` 插件启用 `agent/turn-stopping` 连续性闸门。
不要在同一个 Agent 中同时安装完整插件和个人 Skill 链接，以免重复暴露同名
能力。

## Codex、OpenCode、Pi、CodeWhale、Reasonix 与 DeepSeek Harness

### Windows · Junction

```powershell
$repo = "C:\path\to\thinloop"
$codeWhaleSkillRoot = if ($env:CODEWHALE_SKILLS_DIR) {
  $env:CODEWHALE_SKILLS_DIR
} else {
  "$env:USERPROFILE\.codewhale\skills"
}
$skillRoots = @(
  "$env:USERPROFILE\.codex\skills",
  "$env:USERPROFILE\.config\opencode\skills",
  "$env:USERPROFILE\.pi\agent\skills",
  $codeWhaleSkillRoot,
  "$env:USERPROFILE\.reasonix\skills",
  if ($env:DSH_HOME) { "$env:DSH_HOME\skills" } else { "$env:USERPROFILE\.dsh\skills" }
)
$skillNames = @(
  "scd-discovery", "scd-uiux", "scd-architecture",
  "scd-project", "scd-execute", "scd-quickdev", "scd-knowledge", "scd-maintenance",
  "scd-next",
  "scd-interview",
  "scd-evolve", "scd-reengineering"
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

### macOS / Linux · Symbolic links

```bash
repo="/path/to/thinloop"
skill_roots=(
  "${CODEX_HOME:-$HOME/.codex}/skills"
  "${XDG_CONFIG_HOME:-$HOME/.config}/opencode/skills"
  "${PI_CODING_AGENT_DIR:-$HOME/.pi/agent}/skills"
  "${CODEWHALE_SKILLS_DIR:-$HOME/.codewhale/skills}"
  "$HOME/.reasonix/skills"
  "${DSH_HOME:-$HOME/.dsh}/skills"
)
skills=(
  scd-discovery scd-uiux scd-architecture
  scd-project scd-execute scd-quickdev scd-knowledge scd-maintenance scd-next scd-interview scd-evolve
  scd-reengineering
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

上面的脚本只移除明确的旧链接 `scd-dev-loop`，并修复十二个 Thinloop Skill
链接；遇到同名的真实文件或目录会跳过，不会覆盖用户内容。OpenCode 也能读取
`~/.claude/skills`，Pi 也能读取 `~/.agents/skills`；CodeWhale 使用
`~/.codewhale/skills`，并允许 `CODEWHALE_SKILLS_DIR` 直接覆盖整个 Skill
根。使用各自的原生目录可以明确区分安装来源，不依赖兼容目录。

Pi 会把这些 Skill 注册为 `/skill:scd-*` 命令。链接更新后，在现有会话执行
`/reload`，或开启新会话。Thinloop 当前没有为 Pi 安装扩展，也不声明
Stop 等价的连续性阻断能力。

CodeWhale 会在新会话发现这些 Skill，可用 `/skills` 查看并用
`/skill scd-next` 激活。Thinloop 只安装标准 `SKILL.md`，不安装 CodeWhale
Plugin Bundle 或连续性 Hook；当前 CodeWhale 的 Bundle 兼容层尚未提供 Hook
适配器。

Reasonix 会在新会话发现 `~/.reasonix/skills` 下的标准 `SKILL.md` 目录；可直接
输入 `/scd-next` 激活。Thinloop 当前不为 Reasonix 写入 Hook 配置，避免把
Reasonix 已有的全局或项目 Hook 与未经验证的连续性阻断语义混合。

DeepSeek Harness 的 Skill 发现由内置的 filesystem provider 负责：它按
`<projectRoot>/.dsh/skills`、`<projectRoot>/.agents/skills`、自定义目录、
`$DSH_HOME/skills`（默认 `~/.dsh/skills`）与 `~/.agents/skills` 分层扫描
标准 `SKILL.md` 目录。把十二个 Skill 链接到 `~/.dsh/skills` 后，新会话的
skill 工具即可发现并加载 `scd-next`、`scd-execute`、`scd-project`、
`scd-quickdev` 等全部 Skill；provider 的 watcher 会自动失效并更新模型侧
目录，不依赖重启。DeepSeek Harness 没有 Claude Code、WorkBuddy、ZCode 那种
「JSON Hook 清单 + 子进程处理程序」的声明式 Hook，但提供可编程的 Cordis
插件生命周期事件系统：Thinloop 通过 `.dsh-plugin/continuity.mjs` 插件注册
`agent/turn-stopping`（`Stop` 的等价物）监听器，在状态不可恢复时
`agent.steer(...)` 让 Agent 继续补齐，而不是在不可恢复的状态上停下。该插件
需手动挂载到 Agent preset 的 `agent.cordis.yml`（详见
`.dsh-plugin/README.md`）；DSH 未暴露第三方可用的压缩前否决点，压缩后仍由
`AGENTS.md` 基线机制重新注入指令。

## Evolve 权威源码

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

## Claude Code 完整插件

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

## WorkBuddy 完整插件

先审查仓库中的 Skill 与 `hooks/check-state.mjs`，再通过 WorkBuddy 左侧的
插件页安装：

1. 点击插件页的 `+` 添加第三方插件市场。
2. 远程安装填入 `mindcarver/thinloop`；本地开发填入
   `/path/to/thinloop`。
3. 在 Thinloop 卡片点击安装并保持启用；更新后刷新插件市场。

WorkBuddy 5.3.5 内置的 CodeBuddy 运行时读取
`.codebuddy-plugin/marketplace.json` 与 `.codebuddy-plugin/plugin.json`。
完整插件会注册十二个 Skill，并在 `PreCompact` 与 `Stop` 时通过
`CODEBUDDY_PLUGIN_ROOT` 运行连续性检查；状态不完整时返回原生
`continue: false`，让 Agent 先补齐恢复信息。

## ZCode 完整插件

先审查仓库中的 Skill 与 `hooks/check-state.mjs`，然后打开一个工作区：

1. 进入 Settings → Plugins，点击 Create → Add Plugin Marketplace。
2. 本地开发填入 `/path/to/thinloop`；远程安装填入
   `mindcarver/thinloop`；若远程 clone 超时，改用本地仓库路径。
3. 自定义 Marketplace 会显示在 Personal 筛选下；切换到 Personal 后，在
   `thinloop` 卡片点击 Install，并保持插件启用。

完整插件会注册十二个 Skill；`Stop` 发现激活状态不可恢复时会让主 Agent 继续
补齐，最多连续三次；压缩后的 `SessionStart(compact)` 会把缺失状态作为恢复
上下文注入。ZCode 不支持 Codex 专用的 `PreCompact` 事件，因此当前运行时会
记录一条 warning 并只跳过该事件，不影响上述两个 ZCode Hook。

## 更新已有安装

先更新源码仓库：

```bash
git -C /path/to/thinloop pull --ff-only
```

随后按安装方式刷新：

```bash
# Codex / OpenCode / Pi / CodeWhale / Reasonix / DeepSeek Harness：重新运行上面的链接脚本，然后新建任务或会话、重启或 /reload

# Claude Code 完整插件
claude plugin update thinloop@thinloop --scope user

# WorkBuddy 完整插件（安装了 CodeBuddy CLI 时）
codebuddy plugin update thinloop@thinloop --scope user
```

- Claude Code：命令成功后重启客户端，或在交互会话重新加载插件。
- WorkBuddy：也可以在插件页刷新市场后更新 Thinloop；完成后重启 WorkBuddy。
- ZCode：Settings → Plugins → Refresh → `thinloop` → Update；更新后新建会话。
- 升级到 v0.13.1：确认当前列表中存在 `scd-knowledge`、`scd-next`、`scd-execute`、`scd-reengineering`、`scd-project` 与 `scd-quickdev`，
  并且插件版本与当前源码仓库一致。Knowledge 仍只在用户显式调用时工作，写入前仍需确认具体草稿和目标。
- 升级到 v0.13.3：确认当前列表中存在十二个 Skill，包括新增的 `scd-interview`；个人面试题默认存到
  `~/.scd/interview-questions/`，可用用户级 `.scd/config.json` 的 `interview_root` 覆盖。
- 升级到 v0.13.4：QuickDev 在工程检查后直接进入独立行为验收；一个新鲜上下文 Agent 返回
  `PASS`、`FAIL` 或 `BLOCKED`。
- 升级到 v0.13.5：确认 QuickDev 会先询问是否需要审核完整 Issue、实施方案和 tasks；其创建或
  更新的 Issue 使用中文，命令、路径和机器状态标识保持规范原值。
- 升级到 v0.13.6：确认十二个 Skill 的 `SKILL.md`、Agent 提示词、参考契约和模板均使用中文；
  Issue 标题、正文、验收、实施任务、验证更新和评论也使用中文，机器标识保持规范原值。
- 升级到 v0.13.7：确认 QuickDev 默认不再询问方案确认偏好，而是直接创建或更新中文 Issue
  并继续；只有用户主动要求先看或先确认方案、Issue 或 tasks 时才等待明确确认。
- 升级到 v0.14.0：确认重要 UIUX 工作会生成项目内 UI 图与必要的非生产原型，并把视觉 ID、
  状态、视口和 UX 契约交给前端；重大视觉方向确认后才能 `ready`，QuickDev 仍默认自主实施。
- 升级到 v0.15.0：确认 QuickDev 在独立验收前闭合 Issue 的验收、实施和交付三本账；任何
  页面差异都必须执行真实浏览器交互与视觉验收，缺少必需证据时只能 `BLOCKED`。
- 升级到 v0.16.0：确认 `Thinloop CI`、当前三臂评测、单一路由内核、README 产品表面和
  Tag-only GitHub Release 链路均存在；发布范围、证据和已知限制见
  [`docs/releases/v0.16.0.md`](./releases/v0.16.0.md)。
- 若从 v0.6.x 升级，另确认旧 `scd-dev-loop` 已消失。

更新后可以在 Thinloop 源码仓库运行只读检查器：

```bash
node scripts/verify-install.mjs
```

检查器从
[`config/platform-capabilities.json`](../config/platform-capabilities.json)
读取九个平台的能力契约，遵循 `CODEX_HOME`、`XDG_CONFIG_HOME`、
`PI_CODING_AGENT_DIR/skills`、`CODEWHALE_SKILLS_DIR`、`~/.reasonix/skills`
与 `DSH_HOME`，只读取 Skill
链接、CodeWhale 的无网络 `doctor --json` 报告、Claude Code 插件清单及本地
插件内容；
不安装、修复、覆盖、重启或重新加载任何 Agent。状态和退出码见
[验证指南](./verification.md)。

## 手动调用示例

```text
Codex：使用 $scd-discovery 把这个想法聊透并形成可验收 Issue。
Codex：从 0 到 1 时使用 $scd-discovery 形成批准的 `.scd/product/prd.md`；再使用 $scd-project 把批准的多交付产品契约分解为 Initiative、Delivery Issues 和依赖 DAG；不要运行实现 loop。
Codex：使用 $scd-execute 继续这个已批准的 Initiative，自动执行当前安全 READY 波次；最多并行两个。
Codex：使用 $scd-next 检查当前 Issue、PR 和 Initiative 状态，告诉我还有什么没做以及唯一建议下一步。
Codex：使用 $scd-reengineering 把这个开源项目换成 Go 重新实现，只保留批准的兼容能力，并按 READY 波次交付。
Codex：使用 $scd-quickdev 修复这个 Bug，验证后提 PR 并合并 main。
Codex：使用 $scd-evolve 复盘本次互动，只提出一个候选，不要先修改。
Claude Code Skill 链接：/scd-discovery
Claude Code 完整插件：/thinloop:scd-quickdev
OpenCode：使用 scd-quickdev skill 按 Issue 开发、验证并合并。
OpenCode：使用 scd-project skill 建立 multi-Issue 项目 DAG，只报告 READY/BLOCKED，不执行这些 Issues。
OpenCode：使用 scd-execute skill 继续已批准的 Initiative，按安全 READY 波次执行。
OpenCode：使用 scd-next skill 只读检查当前项目进度和下一步。
OpenCode：使用 scd-reengineering skill 评估并执行这个项目级重构，独立节点并行、硬依赖串行。
Pi：使用 /skill:scd-quickdev 按 Issue 开发、验证并合并。
Pi：使用 /skill:scd-project 从批准的 PRD 分解 multi-Issue 项目 DAG，不执行 Issues。
Pi：使用 /skill:scd-execute 继续已批准的 Initiative，串行合并并在每次交付后重算 DAG。
Pi：使用 /skill:scd-next 只读检查当前项目进度和下一步。
CodeWhale：使用 /skill scd-quickdev 按 Issue 开发、验证并合并。
CodeWhale：使用 /skill scd-project 从批准的 PRD 分解 multi-Issue 项目 DAG，不执行 Issues。
CodeWhale：使用 /skill scd-execute 继续已批准的 Initiative，按安全 READY 波次执行。
CodeWhale：使用 /skill scd-next 只读检查当前项目进度和下一步。
Reasonix：使用 /scd-quickdev 按 Issue 开发、验证并合并 main。
Reasonix：使用 /scd-project 从批准的 PRD 分解 multi-Issue 项目 DAG，不执行 Issues。
Reasonix：使用 /scd-execute 继续已批准的 Initiative，按安全 READY 波次执行。
Reasonix：使用 /scd-next 只读检查当前项目进度和下一步。
DeepSeek Harness：使用 $scd-quickdev 按 Issue 开发、验证并合并。
DeepSeek Harness：使用 $scd-project 从批准的 PRD 分解 multi-Issue 项目 DAG，不执行 Issues。
DeepSeek Harness：使用 $scd-execute 继续已批准的 Initiative，按安全 READY 波次执行。
DeepSeek Harness：使用 $scd-next 只读检查当前项目进度和下一步。
DeepSeek Harness：使用 $scd-reengineering 重新实现这个项目并保留选定兼容契约。
WorkBuddy 完整插件：/thinloop:scd-quickdev
ZCode：使用 $scd-quickdev 按 Issue 开发、验证并合并。
ZCode：使用 $scd-project 分解 multi-Issue 项目并验证依赖 DAG，不启动执行 loop。
ZCode：使用 $scd-execute 继续这个已批准的 Initiative，执行当前安全 READY Issues。
ZCode：使用 $scd-next 只读检查当前项目进度和下一步。
ZCode：使用 $scd-reengineering 重新实现这个项目并保留选定兼容契约。
ZCode：使用 $scd-evolve 诊断本次使用过的 Thinloop Skill。
```
