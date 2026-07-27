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
| Codex | 七个链接都能读取 `SKILL.md`；新任务可发现 `$scd-quickdev` |
| Claude Code | `claude plugin list` 显示 `thinloop@thinloop`、`0.7.1`、enabled |
| OpenCode | `opencode debug skill` 输出七个当前 `scd-*` Skill |
| WorkBuddy | `codebuddy plugin list`（若当前 CLI 支持）或插件页显示 `0.7.1`、enabled |
| ZCode | Settings → Plugins 显示 `0.7.1`、7 Skills、2 Hooks；Skills 中存在 `scd-quickdev` |

OpenCode 当前没有与 Claude Code、WorkBuddy、ZCode Stop Hook 等价的可取消完成
协议，因此不声明连续性阻断能力。ZCode 当前安装不提供可依赖的 `zcode` CLI，
所以以实际 Settings 界面作为安装验证边界。

完整评测方法、历史证据和限制见 [EVALUATION.md](../EVALUATION.md)。
