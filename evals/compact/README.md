# QuickDev 精简成对评测

只比较显式调用后的局部行为，不测自然语言自动路由、不测模型自主操作完整 GitHub 交付链。
冻结方案见 [Issue94](https://github.com/mindcarver/thinloop/issues/94)：三类 fixture、两次重复、两种 QuickDev 载荷，共12个真实 subject。

- `definition.json` 固定旧 QuickDev 提交、其余11个 Skill的公共提交、CLI/model/reasoning、同一局部授权 prompt 和交错顺序。只替换 QuickDev 载荷。
- 候选先提交，`--candidate` 必须是完整 SHA。全部文件逐项 SHA-256；入口与总载荷 bytes/chars 和真实 Token 分开记录。
- 每对最多两个并发进程，只交错启动顺序；这不是串行 A/B 与 B/A 的顺序平衡。Subject的 HOME、仓库、轨迹目录只用随机ID，条件标签保留在外部 manifest/results，不写入模型上下文。
- 隔离 HOME 只临时复制现有 Codex 认证，复用现有 runner 的 `--ignore-user-config`、禁工具网络/浏览器/多Agent和workspace-write；不改全局配置、安装或认证。临时认证在finally清理。
- 两臂均明确授权本地fixture实施，禁止外部Issue/PR、分支/工作树、提交和其他Agent。这是用户批准的局部例外，不能把结果当成完整外部交付契约的成功率。

```sh
node evals/compact/run.mjs --mode dry --candidate <frozen-commit-sha>
# PATH应选择已冻结的Codex CLI 0.153.0；不安装/升级CLI。
node evals/compact/run.mjs --candidate <frozen-commit-sha> --pairs 1 --output /absolute/evidence/directory
# 首pair验证格式、实际完整读取QuickDev、usage和直接行为结果，再继续同一归档：
node evals/compact/run.mjs --candidate <same-sha> --pairs 6 --output /same/evidence/directory
```

续跑只读取完整配对，不重跑已保存样本；若定义或载荷变化，原目录拒绝继续，必须保留原始失败记录并新建归档。出现基础设施BLOCKED，或baseline通过而candidate失败，停止后续配对，先诊断并修复/回退相关精简后重测。

生成汇总：`node evals/compact/report.mjs /absolute/evidence/directory`。正式归档的 `evidence.sha256` 可用 `shasum -a 256 -c evidence.sha256` 核对；重新生成报告后需要重新封存对应hash，不能把旧清单当新报告的证明。

`observations/`保存原生测试、隐藏行为、范围/脏改动、恢复状态和已修复评分器结果；`traces/`保存完整脱敏命令轨迹和最终回答、安装文件hash及diff；`results/`记录完整入口实际stdout读取证明、真实usage、已知工具项/command_execution事件次数和unknown覆盖（单条shell内多个子命令仍是一条事件）。可用`evidence.json`逐文件核对归档。

未报告的cache/reasoning字段保持null；known工具计数不把未知事件推算为零。完成声明评分只识别明确整体声明，其他情况为unknown。没有价格来源，成本始终null。三个小fixture各两次不能支持统计显著性、通用节省比例或完整交付增益。原生Git/模拟tracker交付回归另见 [delivery](../delivery/README.md)。
