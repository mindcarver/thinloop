# Thinloop 验证指南

[返回 README](../README.md)

## 仓库校验

仓库自身提供并维护以下可执行校验：

```bash
node --test tests/*.test.mjs
node evals/validate-discovery-cases.mjs
node evals/validate-knowledge-cases.mjs
node evals/knowledge/validate.mjs
node evals/knowledge/runner/run.mjs --mode dry
node skills/scd-maintenance/scripts/collect-signals.mjs --root . --format text
claude plugin validate . --strict
codebuddy plugin validate .codebuddy-plugin/plugin.json
codebuddy plugin validate .codebuddy-plugin/marketplace.json
```

Knowledge 发布前还需在隔离 Fixture 中运行真实成对行为评测：

```bash
node evals/knowledge/runner/run.mjs --mode smoke
node evals/knowledge/runner/run.mjs --mode full
```

该评测固定任务、模型、推理强度、沙箱和 Skill，只改变项目知识是否存在；
同时包含虚假方法与平台边界不匹配用例。只有“无知识失败、有知识通过”的同对
结果计为可观察提升，召回、引用或单次任务成功不单独作为因果证据。完整运行会
调用真实模型，默认结果目录位于 Thinloop 同级的 `test/` 工作区，不写入仓库。

## 安装后证据

不同平台提供的可观测接口不同，不假设每个平台都有相同 CLI：

| Agent | 安装后检查 |
|---|---|
| Codex | 十二个链接都能读取 `SKILL.md`；新任务可发现 `$scd-next`、`$scd-execute`、`$scd-project` 与 `$scd-quickdev` |
| OpenCode | 十二个 Skill 链接均指向当前源码；运行时需确认 `scd-next`、`scd-execute`、`scd-project` 与其他 Skill 均被发现 |
| Pi | 十二个 Skill 链接均指向当前源码；Pi RPC `get_commands` 可发现十二个 `/skill:scd-*` 命令 |
| CodeWhale | 十二个 Skill 链接均指向当前源码；`codewhale doctor --json` 确认全局 Skill 根、数量且跳过实时 API 探测 |
| Reasonix | 十二个 Skill 链接均指向当前源码；新会话可通过 `/scd-next`、`/scd-execute`、`/scd-project` 与 `/scd-quickdev` 调用 |
| DeepSeek Harness | 十二个 Skill 链接均指向当前源码；新会话的 skill 工具可发现 `scd-next`、`scd-execute`、`scd-project` 与 `scd-quickdev` |
| Claude Code | `claude plugin list --json` 提供版本、enabled 与安装路径；检查器从该路径核对十二个 Skill 和两个 Hook，包括 `scd-next` 与 `scd-execute` |
| WorkBuddy | 不验证：WorkBuddy 无可靠只读 CLI 探测；已取消插件页核验要求 |
| ZCode | 不验证：ZCode 无可用 CLI；已取消 Settings → Plugins 核验要求 |

在 Thinloop 源码仓库运行统一的只读检查：

```bash
node scripts/verify-install.mjs
node scripts/verify-install.mjs --format json
node scripts/verify-install.mjs --platform pi
node scripts/verify-install.mjs --platform codewhale
node scripts/verify-install.mjs --platform reasonix
node scripts/verify-install.mjs --platform dsh
```

检查器从
[`config/platform-capabilities.json`](../config/platform-capabilities.json)
读取九个平台的安装形态、Skill 根、Hook 和验证入口，并使用以下状态：

| 状态 | 含义 |
|---|---|
| `PASS` | 自动验证入口已确认安装内容符合当前源码 |
| `FAIL` | 自动验证入口已确认缺失、停用、版本漂移或 Skill / Hook 不完整 |
| `UNVERIFIED` | 所需 CLI 不可用、失败或没有返回有效 JSON，不能判断安装结果 |
| `MANUAL` | 平台没有可靠的自动验证入口，必须按提示从界面核验 |
| `SKIP` | 平台按用户决定不参与验证，检查器不核验也不计入失败 |

退出码 `0` 表示没有确认失败，但仍可能包含 `UNVERIFIED`、`MANUAL` 或 `SKIP`；
退出码 `1` 表示至少存在一个确认失败；退出码 `2` 表示参数、注册表或源码
仓库无效。Codex、OpenCode、Pi、CodeWhale、Reasonix 与 DeepSeek Harness
检查分别遵循 `CODEX_HOME`、`XDG_CONFIG_HOME`、`PI_CODING_AGENT_DIR`、
`CODEWHALE_SKILLS_DIR`、`~/.reasonix/skills` 与 `DSH_HOME`（默认 `~/.dsh`）。
检查器不会安装、更新、覆盖、重启或重新加载任何 Agent。

CodeWhale 的链接通过后，检查器会自动运行无网络的结构化诊断：

```bash
codewhale doctor --json \
  | jq '{version, global: .skills.global, api_checked: .api_connectivity.checked}'
```

全局路径必须等于当前 CodeWhale Skill 根，数量至少为十二，且
`api_checked` 必须为 `false`。该证据证明 CodeWhale 实际选择了正确的全局
Skill 根，不会调用模型或实时 API；它不证明存在 Thinloop 连续性 Hook。

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

结果应恰好包含十二个 `skill:scd-*` 命令，路径均位于当前 Pi Skill 根。该检查
只证明 Skill 发现，不证明 Pi 存在 Thinloop 的连续性 Hook。

WorkBuddy 与 ZCode 按用户决定不参与验证：统一检查器将其记为 `SKIP`，不再
要求在插件页或 Settings → Plugins 中核验。

OpenCode、Pi 与 CodeWhale 当前都不声明连续性阻断能力，因为尚未核验到与
Claude Code、WorkBuddy、ZCode Stop Hook 等价的可取消完成协议；CodeWhale
当前的 Plugin Bundle 兼容层也没有 Hook 适配器。

Reasonix 的 `reasonix doctor --json` 用于本地诊断，不输出 Skill 清单，不能作为
Skill 发现证据。安装链接通过后，必须在新 Reasonix 会话中输入 `/scd-next` 做
运行时发现核对；Reasonix 也尚未在 Thinloop 中声明连续性阻断能力。

DeepSeek Harness 没有可依赖的 CLI 或插件列表命令，安装链接通过后，必须在新
会话中通过 skill 工具核对 `scd-next`、`scd-execute`、`scd-project` 与
`scd-quickdev` 是否出现在可用目录中。filesystem provider 的 watcher 会自动
失效并更新模型侧目录，因此链接更新后无需重启。DeepSeek Harness 的连续性
阻断不是声明式子进程 Hook，而是可编程的 Cordis 插件：Thinloop 通过
`.dsh-plugin/continuity.mjs` 注册 `agent/turn-stopping` 监听器，在
`.scd/tasks/current.md` 属于 SCD 管理但不可恢复时 `agent.steer(...)` 让 Agent
继续补齐。挂载与运行时行为需手动核验（无只读 CLI 探测，统一检查器将其记为
`MANUAL`）：新会话写入一份缺章节的状态文件，确认 Agent 停止前被打断、补齐
后才允许停下；DSH 未暴露第三方可用的压缩前否决点，压缩后仍由 DSH 自身的
`AGENTS.md` 机制重新注入指令基线。

完整评测方法、历史证据和限制见 [EVALUATION.md](../EVALUATION.md)。
