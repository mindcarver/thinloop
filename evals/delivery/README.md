# 完整交付协议与真实 Agent 最小评测

该套件分开回答两个问题，不把两种证据合并成产品有效性结论：

- `protocol`：真实 Git 仓库、bare remote、分支、worktree、提交与推送，配合**模拟文件 Issue/PR tracker**，能否执行交付门和故障恢复？这是确定性协议回归；其中验收者是代码检查函数，**不是模型或独立 Agent**。
- `model`：真实编码 Agent 能否实现一个有失败测试的任务，新上下文验收 Agent 能否亲自运行检查、拒绝错误完成声明并接受正确实现？通过后，确定性适配器完成提交、模拟 PR、合并、同步、清理和模拟 Issue 关闭。**后半段不是 Agent 自主操作真实 GitHub。**

它不替代 Thinloop 技能自然触发率、实际 GitHub 权限/保护规则、多平台表现或整体成功率的评测，也没有测量完整模型驱动的交付生命周期。

## 运行

仅需要 Node.js 22 与 Git 的协议回归（CI 运行此模式，无凭据、无模型请求）：

```sh
node evals/delivery/run.mjs --mode protocol
node --test tests/delivery-eval.test.mjs
```

显式启用真实模型 smoke（会使用现有 Codex 登录并产生模型用量；必须指定当前账号可用的 `--model`，没有隐式模型默认值）：

```sh
node evals/delivery/run.mjs --mode model --model gpt-6-astra --output work/evals/delivery-model
```

模型模式复用现有隔离 runner：独立临时 `CODEX_HOME`，仅复制现有认证，忽略用户配置与规则，编码 Agent 使用 `workspace-write`，验收 Agent 使用 `read-only` 和 `--ephemeral`；工具网络与应用、浏览器、多 Agent 功能关闭。没有外部 GitHub 写入。fixture、临时认证和工作树在结束后销毁；输出只保留脱敏轨迹、代码、diff、tracker 和结果。模型/CLI/认证缺失或不能执行时输出 `BLOCKED`、退出码 2；已观察到行为违反时输出 `FAIL`、退出码 1；只有通过才退出 0。不得通过放宽 sandbox 绕过 `BLOCKED`。

模型输出目录必须为空，防止复用旧轨迹。`evidence.sha256` 记录产物哈希；在输出目录执行 `shasum -a 256 -c evidence.sha256` 检查归档是否改变。哈希只证明归档一致性，不为模型结论背书。

输出中的 `adapter`/`tracker` 固定标记 `simulated-file-issue-pr-tracker`。这是隔离评测适配器，不是生产调度器或 GitHub API 客户端。它有意只测 fast-forward 合并，不证明 squash、rebase merge、真实检查 API 或并发竞争下的完备性。

## 覆盖与证据

| 场景 | 可复核观察 |
| --- | --- |
| 正常交付 | 提交→模拟 PR→验收绑定→真实推送 main→读远端→同步/检查→精确清理→模拟 Issue 关闭 |
| 验收后 head 改变 | 旧验收拒绝合并；发布并重新验收新 head 后才能继续 |
| 验收契约改变 | contract hash 改变后旧验收失效 |
| 兄弟通道先合并 | 真实 sibling worktree 提交推进 main；旧 base 验收失效；rebase 并重新验收；保留 sibling 资源 |
| 合并报错但远端成功 | 独立 Node 子进程真实 push 后退出 1；重新查询远端确认已成功 |
| 提前关闭/脏工作树 | 清理前拒绝关闭，脏工作树拒绝删除并保持 Issue OPEN |
| 真实中断恢复 | 子进程实际实施、提交和验收、写 checkpoint 后被 SIGKILL；另一个 PID 读取 checkpoint 和 live Git/tracker，重新过门后完成交付 |
| 模型负例 | 故意损坏代码附带虚假的“已完成”声明，fresh evaluator 实际运行失败测试并返回 FAIL |
| 模型正例 | coding Agent 修改代码并跑测试，fresh evaluator 直接运行测试/边界检查后返回 PASS；验收绑定 base/head/contract 后 adapter 继续 |

每个 tracker 事件保存顺序号、进程 PID、绑定提交和状态；`summary.json` 保存模式与结果。模型轨迹保留命令执行、返回结果及结构化结论，可逐条核对，不能只阅读 Agent 最终回答。`implementation.diff`、`clamp.mjs`、`clamp.test.mjs` 支持离线运行 `node --test clamp.test.mjs` 复核代码。fixtures 的临时绝对路径不再可访问是预期行为；提交 SHA 与事件、归档代码一起承担证据作用。

“进程中断恢复”是协议工作进程恢复，不是模型会话恢复；“负例虚假声明”是注入的对抗素材，不是实际编码 Agent 生成的假话。单次模型 smoke 只证明该模型在该 fixture 的观察行为，不能用于推断概率、节省量或相对原生 Agent 的优势。
