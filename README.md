<p align="center">
  <img src="./assets/thinloop-retro-hero.png" alt="Thinloop：把复杂开发收束为清晰闭环" width="100%">
</p>

<h1 align="center">THINLOOP</h1>

<p align="center">
  <strong>需求值得被认真理解，实现不需要被流程接管。</strong>
  <br>
  面向强编码 Agent 的轻量开发闭环：先聊透，再实现，用证据收尾。
</p>

<p align="center">
  <kbd>v0.7.0</kbd>
  &nbsp;
  <kbd>ISSUE-DRIVEN</kbd>
  &nbsp;
  <kbd>EVIDENCE-BACKED</kbd>
  &nbsp;
  <kbd>LESS CEREMONY</kbd>
</p>

<p align="center">
  <a href="#quick-start">开始</a> ·
  <a href="#capabilities">能力</a> ·
  <a href="#workflow">闭环</a> ·
  <a href="#install">安装</a> ·
  <a href="#docs">文档</a>
</p>

---

Thinloop 不接管开发过程，只守住容易在长任务里丢失的结果：

> **需求不被误解，体验与架构有据可循，完成声明有真实证据，仓库漂移能被主动发现。**

<a id="quick-start"></a>

## 30 秒开始 / QUICK START

大多数开发任务只需要调用 `scd-quickdev` 并说明目标：

```text
使用 scd-quickdev 修复登录后偶发白屏，并补回归验证。
使用 scd-quickdev 增加 CSV 导出，完成后提 PR 并合并 main。
```

QuickDev 会先判断任务是否足够清楚，而不是要求用户选择流程：

| 当前情况 | 默认路径 |
|---|---|
| Bug 或清晰、局部的新功能 | 建立或确认 Issue，直接诊断、实现和验证 |
| 多个产品决定仍未明确 | 调用 Discovery 逐项澄清，批准后把结论写入 Issue |
| UI 或系统边界会显著影响实现 | 按需组合 UIUX 或 Architecture |
| 工程验证通过 | Agent 自审、提交、推送、提 PR，并在工程闸门通过后合并 |
| 合并完成 | Issue 保持 `awaiting-uat`，用户只做真实使用验收 |
| 生产部署、认证支付、破坏性数据等高风险工作 | 在高风险动作前停下并请求明确批准 |

GitHub Issue 是需求、任务和验收的唯一真值源；PR 是实现证据、工程审阅和回滚
边界。简单任务不会先写本地 Spec，也不强制创建 worktree。

<a id="capabilities"></a>

## 七块能力 / CAPABILITIES

<table width="100%">
  <tr>
    <td width="33%" valign="top">
      <img src="./assets/retro-discovery.png" alt="SCD Discovery 复古工程图标" width="92">
      <h3><a href="./skills/scd-discovery/SKILL.md">01 · SCD Discovery</a></h3>
      <p>把模糊想法收敛为明确批准、可以验收的 GitHub Issue。</p>
      <p><strong>适合：</strong>新产品、复杂功能、多个产品决定相互依赖。</p>
    </td>
    <td width="33%" valign="top">
      <img src="./assets/retro-uiux.png" alt="SCD UIUX 复古工程图标" width="92">
      <h3><a href="./skills/scd-uiux/SKILL.md">02 · SCD UIUX</a></h3>
      <p>把稳定的产品行为设计成可审阅、可实现的 Web 体验。</p>
      <p><strong>适合：</strong>复杂用户流、页面状态、交互与视觉设计。</p>
    </td>
    <td width="33%" valign="top">
      <img src="./assets/retro-architecture.png" alt="SCD Architecture 复古工程图标" width="92">
      <h3><a href="./skills/scd-architecture/SKILL.md">03 · SCD Architecture</a></h3>
      <p>把产品行为翻译为领域、系统边界和共享机器契约。</p>
      <p><strong>适合：</strong>新系统、公共接口和高影响技术边界。</p>
    </td>
  </tr>
  <tr>
    <td width="33%" valign="top">
      <img src="./assets/retro-dev-loop.png" alt="SCD QuickDev 复古工程图标" width="92">
      <h3><a href="./skills/scd-quickdev/SKILL.md">04 · SCD QuickDev</a></h3>
      <p>从 Issue 开始完成诊断、开发、验证、PR 和可自动合并的交付。</p>
      <p><strong>适合：</strong>Bug、清晰功能、已批准 Issue 和跨会话实现。</p>
    </td>
    <td width="33%" valign="top">
      <img src="./assets/retro-knowledge.png" alt="SCD Knowledge 复古工程图标" width="92">
      <h3><a href="./skills/scd-knowledge/SKILL.md">05 · SCD Knowledge</a></h3>
      <p>把已证实的开发经验沉淀为短知识，并在需要时找回。</p>
      <p><strong>适合：</strong>主动沉淀、查找或维护开发经验。</p>
    </td>
    <td width="33%" valign="top">
      <img src="./assets/retro-maintenance.png" alt="SCD Maintenance 复古工程图标" width="92">
      <h3><a href="./skills/scd-maintenance/SKILL.md">06 · SCD Maintenance</a></h3>
      <p>主动审计并小批修复技术债和代码—文档漂移。</p>
      <p><strong>适合：</strong>主动扫描、清理、对齐或维护现有仓库。</p>
    </td>
  </tr>
  <tr>
    <td width="33%" valign="top">
      <img src="./assets/retro-evolve.png" alt="SCD Evolve 复古工程图标" width="92">
      <h3><a href="./skills/scd-evolve/SKILL.md">07 · SCD Evolve</a></h3>
      <p>从一次开发互动中诊断 Skill 问题，经用户批准后做可回滚试验。</p>
      <p><strong>适合：</strong>主动复盘并优化本次真正使用过的 Thinloop Skill。</p>
    </td>
    <td width="33%" valign="top"></td>
    <td width="33%" valign="top"></td>
  </tr>
</table>

> 能力卡直达各 Skill 的权威说明；更细的契约和模板沿其 `Resources` 按需读取，不在 README 重复维护。

<a id="workflow"></a>

## 工作闭环 / WORKFLOW

```text
模糊任务 → Discovery → 批准 Issue →（按需 UIUX / Architecture）→ QuickDev
清晰任务 → 创建/确认 Issue ───────────────────────────────→ QuickDev
QuickDev → 分支 → 开发与工程验收 → PR → main → awaiting-uat → 真人使用验收
主动调用 → Maintenance / Knowledge
主动复盘 → Evolve → 候选 ID 审批 → 可回滚试验 → 证据
```

清晰任务直接开发；不清晰的需求先讨论。默认不强制 TDD、角色系统、子代理、
固定阶段或本地 Spec。完整的路由、状态与契约说明见
[工作流与项目状态](./docs/workflow-and-state.md)。

<a id="install"></a>

## 安装到 Codex、Claude Code、OpenCode、WorkBuddy 与 ZCode / INSTALL

| Agent | 推荐安装 | 更新生效 |
|---|---|---|
| Codex | 把七个 Skill 链接到 `~/.codex/skills` | 新任务 |
| OpenCode | 把七个 Skill 链接到 `~/.config/opencode/skills` | 重启 OpenCode |
| Claude Code | 安装完整插件 | 更新后重启或重新加载插件 |
| WorkBuddy | 安装完整插件 | 更新后重启 WorkBuddy |
| ZCode | 安装完整插件 | 更新后新建会话 |

完整命令、插件安装、升级迁移和调用方式见
[安装与更新指南](./docs/installation.md)。

<a id="docs"></a>

## 文档索引 / DOCS

| 文档 | 内容 |
|---|---|
| [工作流与项目状态](./docs/workflow-and-state.md) | 路由原则、Issue/PR 边界、最小状态与契约入口 |
| [安装与更新指南](./docs/installation.md) | 五类 Agent 的安装、升级、调用与 Evolve 源码配置 |
| [验证指南](./docs/verification.md) | 仓库校验命令、各 Agent 的运行时证据与已知边界 |
| [评测说明](./EVALUATION.md) | 评测方法、历史证据与限制 |

---

<p align="center">
  <strong>DEEPER UNDERSTANDING · LESS CEREMONY · STRONGER EVIDENCE</strong>
  <br>
  MIT License · 2026 mindcarver
</p>
