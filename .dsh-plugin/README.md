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

## 挂载层：宿主级用户 patch，而非 agent preset

推荐把插件挂载到 **home 级用户 patch 层** `$DSH_HOME/cordis.patch.yml`
（默认 `~/.dsh/cordis.patch.yml`）。理由：

- DSH 的 profile 组合顺序是 bundle patch → profile 自身
  `cordis.patch.yml` → home 级 `$DSH_HOME/cordis.patch.yml` → `--patch`
  overlay。desktop（Electron）宿主通过同一个 `runProfile` 组合代码启动
  desktop profile，因此 home 级一行的效果覆盖 **所有 profile、所有 agent
  preset**（standard、ptc、cordis 与用户自建 preset），无需复制任何 preset。
- `agent/turn-stopping` 是按 Agent 作用域派发的 scoped 事件，而 DSH 的
  scope 事件过滤规则对 **未打标签的监听器始终放行**（祖先作用域可以观察
  后代活动）。宿主层注册的 `ctx.on("agent/turn-stopping", ...)` 能收到每个
  Agent 的停止事件——官方 `dsh-hooks-codex` / `dsh-hooks-claude-code` 桥
  插件正是以同样的挂载形态实现各自的 `Stop` 语义。
- 不复制 preset 就不会随 DSH 升级漂移：shipped preset 属于部署，升级会
  覆盖它；任何 preset 拷贝都会与新版 `standard` 逐渐失配。

需要把闸门限制到单个 preset 时，才把同样的行写进该 preset 的
`agent.cordis.yml`（用户自建 preset 位于 `$DSH_HOME/.agent-presets/<id>/`）。
注意 preset 是整份会话组合的拷贝，DSH 升级后需要人工同步，且与宿主级挂载
同时启用会对同一停止事件各 steer 一次；两者选其一。

## 安装

1. 确认 `.dsh-plugin/` 与 `hooks/` 都留在同一份 Thinloop 检出内：插件通过
   相对路径导入 `../hooks/validate-state.mjs`，两处必须同时存在。
2. 把十二个 Skill 链接到 `$DSH_HOME/skills`（见
   [docs/installation.md](../docs/installation.md) 的统一链接脚本）。
3. 在 `$DSH_HOME/cordis.patch.yml` 顶层列表追加一个 `insert` 块（文件为
   `[]` 时替换为下面内容；已有其他条目时保留它们）：

   ```yaml
   - insert:
       - id: thinloop-continuity
         name: file:///绝对路径/thinloop/.dsh-plugin/continuity.mjs
   ```

   注意 `cordis.patch.yml` 是 **patch 层**：新增条目必须用 `insert` 列表，
   直接写 `- id: thinloop-continuity` 裸行会被当作按 id 更新既有条目，组合
   时报 `entry "thinloop-continuity" not found`。裸行形式只适用于
   `cordis.yml` 组合文件（例如 agent preset 的 `agent.cordis.yml`）。
   `name` 既可以是包名，也可以是 `file:///` 绝对 URL；macOS/Linux 也可写
   绝对路径（如 `/Users/me/thinloop/.dsh-plugin/continuity.mjs`）。Windows
   下请使用 `file:///D:/path/to/thinloop/.dsh-plugin/continuity.mjs` 形式，
   避免把盘符误解为 URL scheme。profile 自身的
   `$DSH_HOME/profiles/<name>/cordis.patch.yml` 是等效挂载点（同样用
   `insert` 块），只影响该 profile。
4. 重启 DSH 或新建会话，让新组合生效（home 级与 profile 级 patch 在启动时
   应用；配置了 `patchReload: live` 的 profile 会被 watcher 热加载）。

## 验证

- 静态检查：`node --check .dsh-plugin/continuity.mjs`；共享校验器由
  `tests/validate-state.test.mjs` 覆盖，插件结构由
  `tests/plugin-compatibility.test.mjs` 覆盖。
- 组合检查（只读，不启动会话）：`dsh --profile web --dump-config` 输出的
  组合树应包含 `thinloop-continuity` 行。`desktop` profile 由 Electron 独占
  管理，CLI 拒绝对它做 config-dump，但 home 级层对它同样生效。
- 统一只读检查器：`node scripts/verify-install.mjs --platform dsh` 读取
  `$DSH_HOME/cordis.patch.yml` 与 `$DSH_HOME/profiles/*/cordis.patch.yml`，
  挂载行指向当前源码的 `.dsh-plugin/continuity.mjs` 时 `hooks` 检查为
  `PASS`；未挂载时保持 `MANUAL`（skills-only 仍是受支持安装形态）。
- 运行时行为：临时目录写入一份 `managed_by` 为 `scd-quickdev` 但缺章节的
  `.scd/tasks/current.md`，在该目录运行
  `dsh --profile headless "简单任务"`，确认 Agent 停止前被纠正消息打断、
  补齐状态后才允许停下；没有 SCD 状态文件时应静默不干预。

## 与 Claude Code / WorkBuddy / ZCode 的差异

| 平台 | 机制 | 阻断方式 |
|---|---|---|
| Claude Code | `PreCompact` + `Stop` 子进程 Hook | `decision: block` |
| WorkBuddy | `PreCompact` + `Stop` 子进程 Hook | `continue: false` |
| ZCode | `SessionStart(compact)` + `Stop` 子进程 Hook | `decision: block` / `hookSpecificOutput` |
| DeepSeek Harness | `agent/turn-stopping` Cordis 插件监听器 | `agent.steer(...)` 继续本轮 |
