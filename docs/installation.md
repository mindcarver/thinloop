# Thinloop 安装与更新指南

[返回 README](../README.md)

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

## Codex 与 OpenCode

### Windows · Junction

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

### macOS / Linux · Symbolic links

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

上面的脚本只移除明确的旧链接 `scd-dev-loop`，并修复七个 Thinloop Skill
链接；遇到同名的真实文件或目录会跳过，不会覆盖用户内容。OpenCode 也能读取
`~/.claude/skills`，但使用自己的目录不会依赖 Claude 兼容开关。

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
完整插件会注册七个 Skill，并在 `PreCompact` 与 `Stop` 时通过
`CODEBUDDY_PLUGIN_ROOT` 运行连续性检查；状态不完整时返回原生
`continue: false`，让 Agent 先补齐恢复信息。

## ZCode 完整插件

先审查仓库中的 Skill 与 `hooks/check-state.mjs`，然后打开一个工作区：

1. 进入 Settings → Plugins，点击 Create → Add Plugin Marketplace。
2. 本地开发填入 `/path/to/thinloop`；远程安装填入
   `mindcarver/thinloop`；若远程 clone 超时，改用本地仓库路径。
3. 自定义 Marketplace 会显示在 Personal 筛选下；切换到 Personal 后，在
   `thinloop` 卡片点击 Install，并保持插件启用。

完整插件会注册七个 Skill；`Stop` 发现激活状态不可恢复时会让主 Agent 继续
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
  `scd-quickdev`，并且插件版本与当前源码仓库一致。

更新后可以在 Thinloop 源码仓库运行只读检查器：

```bash
node scripts/verify-install.mjs
```

检查器从
[`config/platform-capabilities.json`](../config/platform-capabilities.json)
读取五个平台的能力契约，遵循 `CODEX_HOME`、`XDG_CONFIG_HOME` 的自定义
Skill 根，只读取 Skill 链接、Claude Code 插件清单及本地插件内容；
不安装、修复、覆盖、重启或重新加载任何 Agent。状态和退出码见
[验证指南](./verification.md)。

## 手动调用示例

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
