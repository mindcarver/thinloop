# DeepSeek Harness 连续性插件

Thinloop 为 DeepSeek Harness（DSH）提供一个 Cordis 插件
`.dsh-plugin/continuity.mjs`，把 `.scd/tasks/current.md` 的可恢复性闸门从
`hooks/check-state.mjs` 移植到 DSH 的插件生命周期事件系统。

## 与声明式 Hook 的区别

Claude Code、WorkBuddy、ZCode 的连续性 Hook 是「JSON Hook 清单 + 子进程
处理程序」：客户端在 `PreCompact` / `Stop` / `SessionStart` 时启动
`hooks/check-state.mjs`，由它返回阻断决策。DSH 没有这种声明式子进程 Hook；
DSH 的等价物是 **Cordis 插件注册的生命周期事件监听器**。本插件在
`agent/turn-stopping`（`Stop` 的等价物，serial）触发时重读状态，若状态属于
SCD 管理但不可恢复，就 `agent.steer(...)` 一条纠正消息，让 Agent 继续补齐
而不是在不可恢复的状态上停下。DSH 不暴露第三方可用的压缩前否决点，因此
`PreCompact` 的一半不在此移植；压缩后由 DSH 自身的 `AGENTS.md` 基线机制
重新注入指令。

## 安装

1. 确认 `.dsh-plugin/` 与 `hooks/` 都留在同一份 Thinloop 检出内，插件通过
   相对路径导入 `../hooks/validate-state.mjs`，两处必须同时存在。
2. 找到要启用的 Agent preset 的 `agent.cordis.yml`（Agent 平面组合，而非
   宿主 `cordis.patch.yml`；生命周期事件在 Agent 作用域派发）。系统内置
   preset 位于 DSH 的 `config/agent-presets/<id>/agent.cordis.yml`。
3. 在该组合文件的顶层列表追加一行：

   ```yaml
   - id: thinloop-continuity
     name: /绝对路径/thinloop/.dsh-plugin/continuity.mjs
   ```

   `name` 既可以是包名，也可以是与组合文件目录相对的路径（如
   `./thinloop/.dsh-plugin/continuity.mjs`），或 `file:///` 绝对 URL；
   Windows 下请优先使用 `file:///D:/path/to/thinloop/.dsh-plugin/continuity.mjs`
   形式，避免把盘符误解为 URL scheme。
4. 重启或新建 DSH 会话，让新组合生效。

## 验证

- 静态检查：`node --check .dsh-plugin/continuity.mjs`；共享校验器由
  `tests/validate-state.test.mjs` 覆盖。
- 运行时验证为手动项：新会话写入一份 `managed_by` 为 `scd-quickdev` /
  `scd-discovery` 但缺少章节的 `.scd/tasks/current.md`，确认 Agent 停止前被
  纠正消息打断、补齐状态后才允许停下；没有 SCD 状态文件时应静默不干预。
  本仓库的统一只读检查器（`scripts/verify-install.mjs`）没有可依赖的 DSH
  CLI，无法自动验证插件挂载，因此该项保持 `MANUAL`。

## 与 Claude Code / WorkBuddy / ZCode 的差异

| 平台 | 机制 | 阻断方式 |
|---|---|---|
| Claude Code | `PreCompact` + `Stop` 子进程 Hook | `decision: block` |
| WorkBuddy | `PreCompact` + `Stop` 子进程 Hook | `continue: false` |
| ZCode | `SessionStart(compact)` + `Stop` 子进程 Hook | `decision: block` / `hookSpecificOutput` |
| DeepSeek Harness | `agent/turn-stopping` Cordis 插件监听器 | `agent.steer(...)` 继续本轮 |
