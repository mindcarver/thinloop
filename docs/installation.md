# Thinloop 安装与更新指南

[返回 README](../README.md)

十个 Skill 遵循同一目录契约。推荐安装方式如下：

| Agent | 推荐安装 | 更新生效 |
|---|---|---|
| Codex | 把十个 Skill 链接到 `~/.codex/skills` | 新任务 |
| OpenCode | 把十个 Skill 链接到 `~/.config/opencode/skills` | 重启 OpenCode |
| Pi | 把十个 Skill 链接到 `~/.pi/agent/skills` | 新会话或执行 `/reload` |
| Claude Code | 安装完整插件 | 更新后重启或重新加载插件 |
| WorkBuddy | 安装完整插件 | 更新后重启 WorkBuddy |
| ZCode | 安装完整插件 | 更新后新建会话 |

Skill 链接随源码仓库更新，但不启用连续性 Hook；Claude Code、WorkBuddy 和
ZCode 的完整插件会额外启用各自支持的 Hook。不要在同一个 Agent 中同时安装
完整插件和个人 Skill 链接，以免重复暴露同名能力。

## Codex、OpenCode 与 Pi

### Windows · Junction

```powershell
$repo = "C:\path\to\thinloop"
$skillRoots = @(
  "$env:USERPROFILE\.codex\skills",
  "$env:USERPROFILE\.config\opencode\skills",
  "$env:USERPROFILE\.pi\agent\skills"
)
$skillNames = @(
  "scd-discovery", "scd-uiux", "scd-architecture",
  "scd-project", "scd-execute", "scd-quickdev", "scd-knowledge", "scd-maintenance",
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
)
skills=(
  scd-discovery scd-uiux scd-architecture
  scd-project scd-execute scd-quickdev scd-knowledge scd-maintenance scd-evolve
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

上面的脚本只移除明确的旧链接 `scd-dev-loop`，并修复十个 Thinloop Skill
链接；遇到同名的真实文件或目录会跳过，不会覆盖用户内容。OpenCode 也能读取
`~/.claude/skills`，Pi 也能读取 `~/.agents/skills`；使用各自的原生目录可以
明确区分安装来源，不依赖兼容目录。

Pi 会把这些 Skill 注册为 `/skill:scd-*` 命令。链接更新后，在现有会话执行
`/reload`，或开启新会话。Thinloop 当前没有为 Pi 安装扩展，也不声明
Stop 等价的连续性阻断能力。

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
完整插件会注册十个 Skill，并在 `PreCompact` 与 `Stop` 时通过
`CODEBUDDY_PLUGIN_ROOT` 运行连续性检查；状态不完整时返回原生
`continue: false`，让 Agent 先补齐恢复信息。

## ZCode 完整插件

先审查仓库中的 Skill 与 `hooks/check-state.mjs`，然后打开一个工作区：

1. 进入 Settings → Plugins，点击 Create → Add Plugin Marketplace。
2. 本地开发填入 `/path/to/thinloop`；远程安装填入
   `mindcarver/thinloop`；若远程 clone 超时，改用本地仓库路径。
3. 自定义 Marketplace 会显示在 Personal 筛选下；切换到 Personal 后，在
   `thinloop` 卡片点击 Install，并保持插件启用。

完整插件会注册十个 Skill；`Stop` 发现激活状态不可恢复时会让主 Agent 继续
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
# Codex / OpenCode / Pi：重新运行上面的链接脚本，然后开启新任务、重启或 /reload

# Claude Code 完整插件
claude plugin update thinloop@thinloop --scope user

# WorkBuddy 完整插件（安装了 CodeBuddy CLI 时）
codebuddy plugin update thinloop@thinloop --scope user
```

- Claude Code：命令成功后重启客户端，或在交互会话重新加载插件。
- WorkBuddy：也可以在插件页刷新市场后更新 Thinloop；完成后重启 WorkBuddy。
- ZCode：Settings → Plugins → Refresh → `thinloop` → Update；更新后新建会话。
- 升级到 v0.10.1：确认当前列表中存在 `scd-execute`、`scd-reengineering`、`scd-project` 与 `scd-quickdev`，
  并且插件版本与当前源码仓库一致。
- 若从 v0.6.x 升级，另确认旧 `scd-dev-loop` 已消失。

更新后可以在 Thinloop 源码仓库运行只读检查器：

```bash
node scripts/verify-install.mjs
```

检查器从
[`config/platform-capabilities.json`](../config/platform-capabilities.json)
读取六个平台的能力契约，遵循 `CODEX_HOME`、`XDG_CONFIG_HOME` 的自定义
Skill 根以及 `PI_CODING_AGENT_DIR/skills`，只读取 Skill 链接、Claude Code
插件清单及本地插件内容；
不安装、修复、覆盖、重启或重新加载任何 Agent。状态和退出码见
[验证指南](./verification.md)。

## 手动调用示例

```text
Codex：使用 $scd-discovery 把这个想法聊透并形成可验收 Issue。
Codex：从 0 到 1 时使用 $scd-discovery 形成批准的 `.scd/product/prd.md`；再使用 $scd-project 把批准的多交付产品契约分解为 Initiative、Delivery Issues 和依赖 DAG；不要运行实现 loop。
Codex：使用 $scd-execute 继续这个已批准的 Initiative，自动执行当前安全 READY 波次；最多并行两个。
Codex：使用 $scd-reengineering 把这个开源项目换成 Go 重新实现，只保留批准的兼容能力，并按 READY 波次交付。
Codex：使用 $scd-quickdev 修复这个 Bug，验证后提 PR 并合并 main。
Codex：使用 $scd-evolve 复盘本次互动，只提出一个候选，不要先修改。
Claude Code Skill 链接：/scd-discovery
Claude Code 完整插件：/thinloop:scd-quickdev
OpenCode：使用 scd-quickdev skill 按 Issue 开发、验证并合并。
OpenCode：使用 scd-project skill 建立 multi-Issue 项目 DAG，只报告 READY/BLOCKED，不执行这些 Issues。
OpenCode：使用 scd-execute skill 继续已批准的 Initiative，按安全 READY 波次执行。
OpenCode：使用 scd-reengineering skill 评估并执行这个项目级重构，独立节点并行、硬依赖串行。
Pi：使用 /skill:scd-quickdev 按 Issue 开发、验证并合并。
Pi：使用 /skill:scd-project 从批准的 PRD 分解 multi-Issue 项目 DAG，不执行 Issues。
Pi：使用 /skill:scd-execute 继续已批准的 Initiative，串行合并并在每次交付后重算 DAG。
WorkBuddy 完整插件：/thinloop:scd-quickdev
ZCode：使用 $scd-quickdev 按 Issue 开发、验证并合并。
ZCode：使用 $scd-project 分解 multi-Issue 项目并验证依赖 DAG，不启动执行 loop。
ZCode：使用 $scd-execute 继续这个已批准的 Initiative，执行当前安全 READY Issues。
ZCode：使用 $scd-reengineering 重新实现这个项目并保留选定兼容契约。
ZCode：使用 $scd-evolve 诊断本次使用过的 Thinloop Skill。
```
