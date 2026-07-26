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
  <kbd>v0.6.0</kbd>
  &nbsp;
  <kbd>SPEC-DRIVEN</kbd>
  &nbsp;
  <kbd>EVIDENCE-BACKED</kbd>
  &nbsp;
  <kbd>KNOWLEDGE-AWARE</kbd>
</p>

<p align="center">
  <a href="#六块能力">六块能力</a> ·
  <a href="#设计原则">设计原则</a> ·
  <a href="#安装到-codex">安装</a> ·
  <a href="#本地验证">验证</a>
</p>

---

Thinloop 不试图成为另一个接管开发过程的重型框架。它只守住六个容易在长任务里丢失的结果：

> **需求没有被误解，体验不只停留在想象里，系统与接口边界有据可循，完成声明有真实证据，仓库漂移能被主动发现，中断后仍能接上。**

## 六块能力

<table width="100%">
  <tr>
    <td width="33%" valign="top">
      <img src="./assets/retro-discovery.png" alt="SCD Discovery 复古工程图标" width="92">
      <h3>01 · SCD Discovery</h3>
      <p>把模糊想法收敛为一份明确批准、可以验收的交付规格。</p>
      <p><strong>适合：</strong>新产品、复杂功能、多个产品决定相互依赖。</p>
    </td>
    <td width="33%" valign="top">
      <img src="./assets/retro-uiux.png" alt="SCD UIUX 复古工程图标" width="92">
      <h3>02 · SCD UIUX</h3>
      <p>把稳定的产品行为设计成可审阅、可实现的 Web 体验。</p>
      <p><strong>适合：</strong>0→1 Web 产品、复杂页面流程、交互与视觉设计。</p>
    </td>
    <td width="33%" valign="top">
      <img src="./assets/retro-architecture.png" alt="SCD Architecture 复古工程图标" width="92">
      <h3>03 · SCD Architecture</h3>
      <p>把产品行为翻译为领域、系统边界和可验证的共享接口契约。</p>
      <p><strong>适合：</strong>0→1 系统、新服务、公共接口和高影响技术边界。</p>
    </td>
  </tr>
  <tr>
    <td width="33%" valign="top">
      <img src="./assets/retro-dev-loop.png" alt="SCD Dev Loop 复古工程图标" width="92">
      <h3>04 · SCD Dev Loop</h3>
      <p>按已知边界安静实现，并让每个完成声明对应真实检查。</p>
      <p><strong>适合：</strong>清晰改动、已批准规格、跨会话实现。</p>
    </td>
    <td width="33%" valign="top">
      <img src="./assets/retro-knowledge.png" alt="SCD Knowledge 复古工程图标" width="92">
      <h3>05 · SCD Knowledge</h3>
      <p>把已证实的开发经验沉淀为短知识，并在需要时精准找回。</p>
      <p><strong>适合：</strong>用户主动要求沉淀、查找或维护经验。</p>
    </td>
    <td width="33%" valign="top">
      <h3>06 · SCD Maintenance</h3>
      <p>主动审计并小批修复技术债、代码—文档漂移和过期仓库事实。</p>
      <p><strong>适合：</strong>用户主动要求扫描、清理、对齐或维护现有仓库。</p>
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
| 系统边界、领域责任或共享接口仍会影响实现 | 按风险调用 Architecture，产出可验证的最小技术设计 |
| 实现完成 | 用真实测试、运行或检查支撑完成声明 |
| 工作可能跨会话 | 只保存恢复所需的最小状态 |
| 用户明确要求沉淀经验 | 提炼短知识，判断项目内或跨项目，确认后写入 |
| 用户明确要求维护仓库 | 先用证据找出债务，再小批修复选定问题 |

Thinloop 默认：

- 不强制 TDD、角色系统、子代理或固定阶段；
- 不自动暂存、提交、推送或部署；
- 不为普通小改动创建 PRD、计划或长期状态；
- 不把整段会话和完整日志塞进长期上下文；
- 不在普通开发中自动扫描或重写整个仓库；
- 不用“文件已经创建”代替“行为已经验证”。

## 工作闭环

```text
模糊想法
   │
   ▼
聊透产品内核
     │
     ├── 按需并行 ──→ UIUX：用户旅程、页面与状态
     │
     └── 按需并行 ──→ Architecture：领域、系统与共享接口
                                │
                                ▼
                         统一契约、明确批准
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

### 03 · SCD Architecture

Architecture 不是每个后端改动的必经阶段。符合现有边界和契约的局部实现直接交给 Dev Loop；只有领域规则需要技术落位，或组件、数据归属、权限、事务、并发、公共接口、集成、迁移与回滚仍会影响结果时才进入设计。

```text
稳定的产品内核
      ↓
映射领域状态、不变量与责任
      ↓
收敛组件边界、数据归属和运行流
      ↓
与 UIUX 并行核对操作、状态、错误和权限
      ↓
生成并真实解析一份共享机器契约
      ↓
交给 Dev Loop 实现
```

普通领域模型保留在 `.scd/architecture.md`；只有独立复杂度达到阈值才拆为 `.scd/domain.md`。现有系统默认记录功能级增量，不重写全局架构。Architecture 可以做隔离的可行性探针，但不会写生产业务代码、执行真实迁移、修改线上基础设施或部署。

### 04 · SCD Dev Loop

Dev Loop 相信模型本身会规划和编码，只额外维护三个结果契约：

| 契约 | 守住什么 | 默认表现 |
|---|---|---|
| `SCOPE` | 目标、边界和验收足以行动 | 只有实质歧义才询问 |
| `EVIDENCE` | 完成声明对应实际验证 | 无法验证时明确降级 |
| `CONTINUITY` | 中断后恢复到正确下一步 | 只有真正需要时才保存状态 |

规格里的 `A1 / A2 / A3` 会一路映射到最终 Evidence。每一项只能是 `PASS`、`UNVERIFIED` 或带原因的阻塞，不能用一次无关测试笼统宣布全部完成。

### 05 · SCD Knowledge

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

### 06 · SCD Maintenance

Maintenance 只在用户主动要求时运行，不依赖定时任务，也不会把普通功能开发升级成全仓库审计。

| 操作 | 行为 |
|---|---|
| Audit | 只读扫描确定性信号，并核对规格、架构、测试、实现和文档 |
| Focused | 只检查用户指定的文件、子系统、债务类型或发现 |
| Repair | 重新确认事实源后，小批修复选定问题并逐项验证 |

技能自带跨平台、无第三方依赖的信号收集器，可检查断裂的相对 Markdown 链接、文档中不存在的 npm script，以及显式 `TODO / FIXME / HACK / XXX` 标记。语义一致性仍由 Agent 对相关事实源做有边界的比较，不会把词法命中直接包装成“已确认技术债”。

## 最小项目状态

Thinloop 不创建项目 Wiki。中型项目保留产品规格和系统基线；UX、复杂领域、功能设计与共享契约只在被实际复杂度激活时出现：

```text
.scd/
├── architecture.md
├── domain.md                 # 按需
├── specs/
│   ├── 001-mvp.md
│   └── 002-next-delivery.md
├── ux/
│   └── 001-mvp.md
├── designs/
│   └── high-impact-feature.md
└── tasks/
    └── current.md

contracts/                    # 仓库没有既有契约位置时
└── openapi.yaml
```

| 载体 | 生命周期 | 内容 |
|---|---|---|
| `specs/<slug>.md` | 每次交付长期保留 | 用户行为、边界、决定和验收 |
| `ux/<slug>.md` | 只有复杂 Web 体验需要时保留 | 用户旅程、页面、状态、交互与设计交接 |
| `architecture.md` | 随系统边界演进 | 组件职责、数据流和长期技术取舍 |
| `domain.md` | 只有领域独立复杂时保留 | 生命周期、不变量、权限与跨实体一致性 |
| `designs/<feature>.md` | 高影响功能设计期间及以后 | 功能级技术增量、取舍、迁移与回滚 |
| `contracts/*` | 跨边界契约存在期间 | 前后端或生产者/消费者共同解析的规范 |
| `tasks/current.md` | 未完成时临时存在 | 最小恢复状态、证据和唯一下一步 |

只有领域生命周期真正复杂时才拆出 `domain.md`；只有具体功能存在高风险技术取舍时才创建 `designs/<feature>.md`。

## 安装到 Codex

六个 Skill 的工作流均与操作系统无关。下面分别提供 Windows Junction 和 macOS/Linux 符号链接示例；源码更新后，无需再次复制 Skill。

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
  -Path "$codexSkills\scd-architecture" `
  -Target "$repo\skills\scd-architecture"

New-Item -ItemType Junction `
  -Path "$codexSkills\scd-dev-loop" `
  -Target "$repo\skills\scd-dev-loop"

New-Item -ItemType Junction `
  -Path "$codexSkills\scd-knowledge" `
  -Target "$repo\skills\scd-knowledge"

New-Item -ItemType Junction `
  -Path "$codexSkills\scd-maintenance" `
  -Target "$repo\skills\scd-maintenance"

Get-Item -Force `
  "$codexSkills\scd-discovery", `
  "$codexSkills\scd-uiux", `
  "$codexSkills\scd-architecture", `
  "$codexSkills\scd-dev-loop", `
  "$codexSkills\scd-knowledge", `
  "$codexSkills\scd-maintenance" |
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
ln -s "$repo/skills/scd-architecture" "$codex_skills/scd-architecture"
ln -s "$repo/skills/scd-dev-loop" "$codex_skills/scd-dev-loop"
ln -s "$repo/skills/scd-knowledge" "$codex_skills/scd-knowledge"
ln -s "$repo/skills/scd-maintenance" "$codex_skills/scd-maintenance"
```

</details>

> Skill 链接只负责方法同步。仓库根目录中的 Hook 仍需通过完整插件加载，并完成运行环境要求的信任审查。

新安装的 Skill 会在下一次 Codex 任务中被发现。

### 显式调用

```text
使用 $scd-discovery 把这个想法聊透并形成可验收规格。

使用 $scd-uiux 把这个 Web 产品行为设计成可审阅、可实现的体验。

使用 $scd-architecture 把已批准的产品行为设计成领域、系统和共享接口契约。

使用 $scd-dev-loop 按已批准规格实现并给出证据。

使用 $scd-knowledge 沉淀或查找已证实的开发经验。

使用 $scd-maintenance 审计这个仓库的技术债和代码—文档漂移。

使用 $scd-maintenance 修复我选中的 MAINT-... 问题并给出验证证据。
```

## 本地验证

当前仓库验证面：

| 检查 | 当前结果 |
|---|---:|
| Node 契约与 Hook 测试 | `59 / 59` |
| Discovery 用例结构 | `PASS` |
| UIUX 契约测试 | `PASS` |
| Architecture 契约测试 | `PASS` |
| Maintenance 契约与信号收集器 | `PASS` |
| Knowledge 用例结构 | `PASS` |
| 官方 Skill 校验 | `PASS` |
| 官方插件校验 | `PASS` |

<details>
<summary><strong>运行核心测试</strong></summary>

```powershell
node --test tests\*.test.mjs
node skills\scd-maintenance\scripts\collect-signals.mjs --root . --format text
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
py $skillValidator skills\scd-architecture
py $skillValidator skills\scd-dev-loop
py $skillValidator skills\scd-knowledge
py $skillValidator skills\scd-maintenance
py $pluginValidator .
```

macOS / Linux：

```bash
skill_validator="${CODEX_HOME:-$HOME/.codex}/skills/.system/skill-creator/scripts/quick_validate.py"
plugin_validator="${CODEX_HOME:-$HOME/.codex}/skills/.system/plugin-creator/scripts/validate_plugin.py"

python3 "$skill_validator" skills/scd-discovery
python3 "$skill_validator" skills/scd-uiux
python3 "$skill_validator" skills/scd-architecture
python3 "$skill_validator" skills/scd-dev-loop
python3 "$skill_validator" skills/scd-knowledge
python3 "$skill_validator" skills/scd-maintenance
python3 "$plugin_validator" .
```

</details>

Dev Loop 第一版的 12 组成对隔离任务中，启用 Thinloop 为 **12/12**，未启用为 **10/12**，Hook 误拦截为 **0**。Discovery、UIUX、Architecture、Maintenance 与 Knowledge 的当前本地用例主要验证结构和契约；真实代理行为结果只有实际运行后才记录。

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
│   ├── retro-architecture.png
│   ├── retro-dev-loop.png
│   └── retro-knowledge.png
├── skills/
│   ├── scd-discovery/
│   ├── scd-uiux/
│   ├── scd-architecture/
│   ├── scd-dev-loop/
│   ├── scd-knowledge/
│   └── scd-maintenance/
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
