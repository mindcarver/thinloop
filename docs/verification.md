# Thinloop 验证指南

[返回 README](../README.md)

## 仓库校验

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

## 安装后证据

不同平台提供的可观测接口不同，不假设每个平台都有相同 CLI：

| Agent | 安装后检查 |
|---|---|
| Codex | 九个链接都能读取 `SKILL.md`；新任务可发现 `$scd-reengineering`、`$scd-project` 与 `$scd-quickdev` |
| OpenCode | 九个 Skill 链接均指向当前源码；运行时需确认 `scd-reengineering`、`scd-project` 与其他 Skill 均被发现 |
| Pi | 九个 Skill 链接均指向当前源码；Pi RPC `get_commands` 可发现九个 `/skill:scd-*` 命令 |
| Claude Code | `claude plugin list --json` 提供版本、enabled 与安装路径；检查器从该路径核对九个 Skill 和两个 Hook，包括 `scd-reengineering` |
| WorkBuddy | 插件页显示当前仓库版本、enabled、九个 Skill 和两个 Hook，包括 `scd-reengineering` |
| ZCode | Settings → Plugins 显示当前仓库版本、9 Skills、2 Hooks；Skills 中存在 `scd-reengineering`、`scd-project` 与 `scd-quickdev` |

在 Thinloop 源码仓库运行统一的只读检查：

```bash
node scripts/verify-install.mjs
node scripts/verify-install.mjs --format json
node scripts/verify-install.mjs --platform pi
```

检查器从
[`config/platform-capabilities.json`](../config/platform-capabilities.json)
读取六个平台的安装形态、Skill 根、Hook 和验证入口，并使用以下状态：

| 状态 | 含义 |
|---|---|
| `PASS` | 自动验证入口已确认安装内容符合当前源码 |
| `FAIL` | 自动验证入口已确认缺失、停用、版本漂移或 Skill / Hook 不完整 |
| `UNVERIFIED` | 所需 CLI 不可用、失败或没有返回有效 JSON，不能判断安装结果 |
| `MANUAL` | 平台没有可靠的自动验证入口，必须按提示从界面核验 |

退出码 `0` 表示没有确认失败，但仍可能包含 `UNVERIFIED` 或 `MANUAL`；
退出码 `1` 表示至少存在一个确认失败；退出码 `2` 表示参数、注册表或源码
仓库无效。Codex、OpenCode 与 Pi 检查分别遵循 `CODEX_HOME`、
`XDG_CONFIG_HOME` 与 `PI_CODING_AGENT_DIR`。检查器不会安装、更新、覆盖、
重启或重新加载任何 Agent。

OpenCode 的运行时发现需要另行手动执行 `opencode debug skill`。该命令会启动
OpenCode，并可能写入客户端日志，因此不属于统一只读检查器，也不影响其中
OpenCode 安装内容的 `PASS` / `FAIL` 判定。

Pi 的链接通过后，可用不创建会话、不调用模型、不开网络的 RPC 请求核验真实
运行时发现：

```bash
printf '%s\n' '{"type":"get_commands"}' \
  | pi --mode rpc --no-session --offline --no-extensions --no-context-files \
  | jq '[.data.commands[]
      | select(.source == "skill" and (.name | startswith("skill:scd-")))
      | {name, path: .sourceInfo.path}]'
```

结果应恰好包含九个 `skill:scd-*` 命令，路径均位于当前 Pi Skill 根。该检查
只证明 Skill 发现，不证明 Pi 存在 Thinloop 的连续性 Hook。

WorkBuddy 的 `codebuddy plugin list --json` 实测会写客户端日志，因此统一
检查器不会调用它；WorkBuddy 安装状态保持 `MANUAL`，必须在插件页核验。

OpenCode 与 Pi 当前都不声明连续性阻断能力，因为尚未核验到与 Claude Code、
WorkBuddy、ZCode Stop Hook 等价的可取消完成协议。ZCode 当前安装不提供可依赖
的 `zcode` CLI，所以以实际 Settings 界面作为安装验证边界。

完整评测方法、历史证据和限制见 [EVALUATION.md](../EVALUATION.md)。
