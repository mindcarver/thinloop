# scd-discovery 真实行为评测

这套评测比较同一强模型在以下两个 Thinloop 快照下的表现：

- baseline：`3141d81`，只有 `scd-dev-loop`；
- candidate：`bcdee83`，包含 `scd-discovery` 与 `scd-dev-loop`。

它不在提示词中点名 Skill。每次 subject 运行都会创建全新的 fixture
仓库、用户目录和 `CODEX_HOME`，只复制当前 Codex 登录信息与被测快照。
临时 Home 在 case 结束后删除，结果目录不保存认证文件。

## 用例

`cases/cases.json` 包含 9 个 case，组成完整的 3 x 3 矩阵：

| 产品形态 | 清晰小需求 | 模糊复杂需求 | 完整规格 |
|---|---:|---:|---:|
| CLI | 1 | 1 | 1 |
| Web | 1 | 1 | 1 |
| API / 数据 | 1 | 1 | 1 |

提示词只表达“先讨论、暂不实现”的自然用户意图。隐藏事实表不会复制到
fixture，也不会发送给被测 subject。事实表可以声明
`bounded_default_acceptance`：只接受不扩大既定范围、权限、数据、平台或
外部依赖的保守默认建议；安全、删除和新增能力仍必须有明确事实。

## 运行

先运行无模型调用的验证：

```powershell
node evals\discovery\validate.mjs
.\evals\discovery\run.ps1 -Mode dry
```

真实冒烟包含 clear、underdefined、complete 各一个候选版 case：

```powershell
.\evals\discovery\run.ps1 -Mode smoke
```

正式评测包含 9 个 case、2 个条件、2 次重复，共 36 次 subject 运行，并
增加匿名配对裁判：

```powershell
.\evals\discovery\run.ps1 -Mode full
```

正式评测只有在全部发布门槛和秘密扫描通过时返回退出码 `0`；门槛未通过
仍会完整写出证据与报告，但返回非零退出码，便于脚本和 CI 阻止误发布。

默认输出到：

```text
<Thinloop 上级目录>\test\thinloop-eval-workspace\runs\<run-id>
```

可以用 `-Workspace` 和 `-RunId` 覆盖。运行器固定使用
`gpt-5.6-sol`，subject 与 judge 为 high reasoning，simulator 为 low
reasoning，service tier 为 priority。模型不可用时结果是
`indeterminate`，不会静默换模型。

调试单个 case 时可以直接调用 runner：

```powershell
node evals\discovery\runner\run.mjs --mode smoke --case cli-underdefined-team-sharing --run-id debug-cli-underdefined
```

也可用 `--conditions baseline,candidate` 与 `--repetitions 1` 缩小诊断
运行；正式发布结果仍必须使用默认的两个条件和两次重复。

长运行被中断后，用同一个 `run-id` 显式恢复：

```powershell
.\evals\discovery\run.ps1 -Mode full -RunId discovery-v1-formal -Resume
```

恢复会校验模式、case、条件和重复次数，并跳过已有 subject 与裁判结果；
默认不允许覆盖同名运行。

## 结果

- `manifest.json`：版本、模型、配置和运行范围；
- `raw/`：脱敏后的 Codex JSONL 和 stderr；
- `transcripts/`：用户与助手可见对话；
- `diffs/`：逐回合 Git 状态与补丁；
- `scores/`：确定性结果、匿名判断和发布门槛；
- `report.md` / `summary.json`：可审阅总结，包括 subject 耗时、token 与
  工具调用计数。

完整结果不会自动写入 Thinloop 仓库。只有人工确认并通过敏感信息检查
的匿名摘要才可以提升到 `benchmarks/`。

## 安全边界

- subject 使用 `workspace-write`，只允许写 disposable fixture；
- 不使用危险沙箱绕过；
- 工具网络关闭；
- 每回合检查 Git 状态；
- 行为失败不自动重跑；
- 基础设施、模拟器或裁判失败最多重试一次并保留
  `indeterminate`；
- 结果目录再次扫描认证值与常见密钥格式。
