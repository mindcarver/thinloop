<p align="center">
  <img src="./assets/thinloop-retro-hero.png" alt="Thinloop：把复杂开发收束为清晰闭环" width="100%">
</p>

<h1 align="center">THINLOOP</h1>

<p align="center">
  <strong>需求值得被认真理解，实现不需要被流程接管。</strong>
  <br>
  面向强编码 Agent 的轻量开发闭环：先聊透，再实现，用证据收尾，把真正有用的经验留下来。
</p>

<p align="center">
  <kbd>v0.4.0</kbd>
  &nbsp;
  <kbd>SPEC-DRIVEN</kbd>
  &nbsp;
  <kbd>EVIDENCE-BACKED</kbd>
  &nbsp;
  <kbd>KNOWLEDGE-AWARE</kbd>
</p>

<p align="center">
  <a href="#四块能力">四块能力</a> ·
  <a href="#设计原则">设计原则</a> ·
  <a href="#安装到-codex">安装</a> ·
  <a href="#本地验证">验证</a>
</p>

---

Thinloop 不试图成为另一个接管开发过程的重型框架。它只守住四个容易在长任务里丢失的结果：

> **需求没有被误解，体验不只停留在想象里，完成声明有真实证据，中断后和下一次开发仍能接上。**

## 四块能力

<table width="100%">
  <tr>
    <td width="50%" valign="top">
      <img src="./assets/retro-discovery.png" alt="SCD Discovery 复古工程图标" width="92">
      <h3>01 · SCD Discovery</h3>
      <p>把模糊想法收敛为一份明确批准、可以验收的交付规格。</p>
      <p><strong>适合：</strong>新产品、复杂功能、多个产品决定相互依赖。</p>
    </td>
    <td width="50%" valign="top">
      <img src="./assets/retro-uiux.png" alt="SCD UIUX 复古工程图标" width="92">
      <h3>02 · SCD UIUX</h3>
      <p>把稳定的产品行为设计成可审阅、可实现的 Web 体验。</p>
      <p><strong>适合：</strong>0→1 Web 产品、复杂页面流程、交互与视觉设计。</p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <img src="./assets/retro-dev-loop.png" alt="SCD Dev Loop 复古工程图标" width="92">
      <h3>03 · SCD Dev Loop</h3>
      <p>按已知边界安静实现，并让每个完成声明对应真实检查。</p>
      <p><strong>适合：</strong>清晰改动、已批准规格、跨会话实现。</p>
    </td>
    <td width="50%" valign="top">
      <img src="./assets/retro-knowledge.png" alt="SCD Knowledge 复古工程图标" width="92">
      <h3>04 · SCD Knowledge</h3>
      <p>把已证实的开发经验沉淀为短知识，并在需要时精准找回。</p>
      <p><strong>适合：</strong>用户主动要求沉淀、查找或维护经验。</p>
    </td>
  </tr>
</table>

## 设计原则

| 场景 | Thinloop 的行为 |
|---|---|
| 目标、边界和验收已经清楚 | 直接实现，不提问，不制造流程文档 |
| 只差一个实质决定 | 给出推荐，只问一个问题，然后继续 |
| 多个上游产品决定尚未存在 | 进入 Discovery，沿依赖逐个收敛 |
| 产品内核稳定，但 Web 体验仍无法可靠实现 | 按风险调用 UIUX，产出最小充分的交互与视觉依据 |
| 实现完成 | 用真实测试、运行或检查支撑完成声明 |
| 工作可能跨会话 | 只保存恢复所需的最小状态 |
| 用户明确要求沉淀经验 | 提炼短知识，判断项目内或跨项目，确认后写入 |

Thinloop 默认：

- 不强制 TDD、角色系统、子代理或固定阶段；
- 不自动暂存、提交、推送或部署；
- 不为普通小改动创建 PRD、计划或长期状态；
- 不把整段会话和完整日志塞进长期上下文；
- 不用“文件已经创建”代替“行为已经验证”。

## 工作闭环

```text
模糊想法
   │
   ▼
聊透产品内核 ──→ 需要界面设计？ ──→ UIUX 收敛
     │                  │                 │
     │                  └── 否 ──────────┤
     │                                    ▼
     └──────────────────────────────→ 明确批准
                                          │
                                          ▼
                                       可靠实现
                                          │
                                          ▼
                                     真实证据收尾
                                          │
                                          └── 用户需要时 ──→ 沉淀可复用经验
```

### 01 · SCD Discovery

Discovery 不靠固定问卷堆问题。它寻找当前最上游、会改变产品结果的那个决定，给出推荐与理由，一次只请求一个选择。

```text
确认用户、问题与期望变化
          ↓
定义下一次完整交付
          ↓
沿决策依赖逐层展开
          ↓
覆盖主路径、失败、数据、权限与边界
          ↓
静默执行矛盾与遗漏审查
          ↓
用户一次性批准完整契约
```

能从仓库、文档和环境确认的事实不会被重新问给用户。已有完整规格时走快速通道，只审查真实缺口。

### 02 · SCD UIUX

UIUX 不是所有前端改动的必经阶段。清晰的文案、颜色、间距和局部组件改动直接实现；只有用户流、页面状态、交互反馈、响应式、可访问性或视觉方向仍会影响结果时才进入设计。

```text
稳定的产品内核
      ↓
选择最小完整用户旅程
      ↓
收敛页面、状态、交互与恢复
      ↓
按风险选择说明、线框、原型或高保真
      ↓
与共享接口契约核对工程接缝
      ↓
交给 Dev Loop 实现
```

UIUX 可以提出页面需要的数据、操作和错误状态，但不会单方面决定前后端接口。前后端只有围绕同一份共享接口契约完成收敛后，才真正具备并行开发条件。

### 03 · SCD Dev Loop

Dev Loop 相信模型本身会规划和编码，只额外维护三个结果契约：

| 契约 | 守住什么 | 默认表现 |
|---|---|---|
| `SCOPE` | 目标、边界和验收足以行动 | 只有实质歧义才询问 |
| `EVIDENCE` | 完成声明对应实际验证 | 无法验证时明确降级 |
| `CONTINUITY` | 中断后恢复到正确下一步 | 只有真正需要时才保存状态 |

规格里的 `A1 / A2 / A3` 会一路映射到最终 Evidence。每一项只能是 `PASS`、`UNVERIFIED` 或带原因的阻塞，不能用一次无关测试笼统宣布全部完成。

### 04 · SCD Knowledge

Knowledge 只在用户明确要求时出现。它不会自动监听开发，也不会自动修改 Skill、规则、ADR 或 Hook。

| 存储层 | 路径 | 用途 |
|---|---|---|
| 项目知识 | `<repo>/.scd/knowledge/` | 当前仓库特有的约束、经验和陷阱 |
| 个人知识 | 用户配置的 Markdown 目录 | 能跨项目复用的方法与经验 |

```text
INDEX.md    一行一个触发入口
entries/    活跃的短知识
archive/    不参与普通召回的旧知识
```

写入前会检查证据、适用范围、重复、冲突和敏感信息；所有新增、更新、替换和归档都先展示给用户确认。查询时先看项目索引，再看个人索引，只读取少量真正相关的条目。

## 最小项目状态

Thinloop 不创建项目 Wiki。中型项目默认只需要两类长期信息和一份临时状态；只有复杂 Web 体验需要独立交接时，才按需增加一份 UX 契约：

```text
.scd/
├── architecture.md
├── specs/
│   ├── 001-mvp.md
│   └── 002-next-delivery.md
├── ux/
│   └── 001-mvp.md
└── tasks/
    └── current.md
```

| 载体 | 生命周期 | 内容 |
|---|---|---|
| `specs/<slug>.md` | 每次交付长期保留 | 用户行为、边界、决定和验收 |
| `ux/<slug>.md` | 只有复杂 Web 体验需要时保留 | 用户旅程、页面、状态、交互与设计交接 |
| `architecture.md` | 随系统边界演进 | 组件职责、数据流和长期技术取舍 |
| `tasks/current.md` | 未完成时临时存在 | 最小恢复状态、证据和唯一下一步 |

只有数据生命周期真正复杂时才拆出 `data-model.md`；只有具体功能存在高风险技术取舍时才创建 `designs/<feature>.md`。

## 安装到 Codex

四个 Skill 的工作流均与操作系统无关。下面分别提供 Windows Junction 和 macOS/Linux 符号链接示例；源码更新后，无需再次复制 Skill。

<details>
<summary><strong>Windows · Junction</strong></summary>

```powershell
$repo = "C:\path\to\thinloop"
$codexSkills = "$env:USERPROFILE\.codex\skills"

New-Item -ItemType Junction `
  -Path "$codexSkills\scd-discovery" `
  -Target "$repo\skills\scd-discovery"

New-Item -ItemType Junction `
  -Path "$codexSkills\scd-uiux" `
  -Target "$repo\skills\scd-uiux"

New-Item -ItemType Junction `
  -Path "$codexSkills\scd-dev-loop" `
  -Target "$repo\skills\scd-dev-loop"

New-Item -ItemType Junction `
  -Path "$codexSkills\scd-knowledge" `
  -Target "$repo\skills\scd-knowledge"

Get-Item -Force `
  "$codexSkills\scd-discovery", `
  "$codexSkills\scd-uiux", `
  "$codexSkills\scd-dev-loop", `
  "$codexSkills\scd-knowledge" |
  Format-List FullName,LinkType,Target
```

</details>

<details>
<summary><strong>macOS / Linux · Symbolic links</strong></summary>

```bash
repo="/path/to/thinloop"
codex_skills="${CODEX_HOME:-$HOME/.codex}/skills"

mkdir -p "$codex_skills"
ln -s "$repo/skills/scd-discovery" "$codex_skills/scd-discovery"
ln -s "$repo/skills/scd-uiux" "$codex_skills/scd-uiux"
ln -s "$repo/skills/scd-dev-loop" "$codex_skills/scd-dev-loop"
ln -s "$repo/skills/scd-knowledge" "$codex_skills/scd-knowledge"
```

</details>

> Skill 链接只负责方法同步。仓库根目录中的 Hook 仍需通过完整插件加载，并完成运行环境要求的信任审查。

新安装的 Skill 会在下一次 Codex 任务中被发现。

### 显式调用

```text
使用 $scd-discovery 把这个想法聊透并形成可验收规格。

使用 $scd-uiux 把这个 Web 产品行为设计成可审阅、可实现的体验。

使用 $scd-dev-loop 按已批准规格实现并给出证据。

使用 $scd-knowledge 沉淀或查找已证实的开发经验。
```

## 本地验证

当前仓库验证面：

| 检查 | 当前结果 |
|---|---:|
| Node 契约与 Hook 测试 | `31 / 31` |
| Discovery 用例结构 | `PASS` |
| UIUX 契约测试 | `PASS` |
| Knowledge 用例结构 | `PASS` |
| 官方 Skill 校验 | `PASS` |
| 官方插件校验 | `PASS` |

<details>
<summary><strong>运行核心测试</strong></summary>

```powershell
node --test tests\*.test.mjs
node evals\validate-discovery-cases.mjs
node evals\validate-knowledge-cases.mjs
```

</details>

<details>
<summary><strong>运行 Codex 官方 Skill / 插件校验</strong></summary>

Windows：

```powershell
$skillValidator = "$env:USERPROFILE\.codex\skills\.system\skill-creator\scripts\quick_validate.py"
$pluginValidator = "$env:USERPROFILE\.codex\skills\.system\plugin-creator\scripts\validate_plugin.py"

py $skillValidator skills\scd-discovery
py $skillValidator skills\scd-uiux
py $skillValidator skills\scd-dev-loop
py $skillValidator skills\scd-knowledge
py $pluginValidator .
```

macOS / Linux：

```bash
skill_validator="${CODEX_HOME:-$HOME/.codex}/skills/.system/skill-creator/scripts/quick_validate.py"
plugin_validator="${CODEX_HOME:-$HOME/.codex}/skills/.system/plugin-creator/scripts/validate_plugin.py"

python3 "$skill_validator" skills/scd-discovery
python3 "$skill_validator" skills/scd-uiux
python3 "$skill_validator" skills/scd-dev-loop
python3 "$skill_validator" skills/scd-knowledge
python3 "$plugin_validator" .
```

</details>

Dev Loop 第一版的 12 组成对隔离任务中，启用 Thinloop 为 **12/12**，未启用为 **10/12**，Hook 误拦截为 **0**。Discovery、UIUX 与 Knowledge 的当前本地用例主要验证结构和契约；真实代理行为结果只有实际运行后才记录。

完整方法、历史证据和限制见 [EVALUATION.md](./EVALUATION.md)。

## 仓库结构

<details>
<summary><strong>展开目录</strong></summary>

```text
thinloop/
├── .codex-plugin/
│   └── plugin.json
├── .scd/
│   └── specs/
├── assets/
│   ├── thinloop-retro-hero.png
│   ├── retro-discovery.png
│   ├── retro-uiux.png
│   ├── retro-dev-loop.png
│   └── retro-knowledge.png
├── skills/
│   ├── scd-discovery/
│   ├── scd-uiux/
│   ├── scd-dev-loop/
│   └── scd-knowledge/
├── hooks/
├── tests/
└── evals/
```

</details>

---

<p align="center">
  <strong>DEEPER UNDERSTANDING · LESS CEREMONY · STRONGER EVIDENCE</strong>
  <br>
  MIT License · 2026 mindcarver
</p>
