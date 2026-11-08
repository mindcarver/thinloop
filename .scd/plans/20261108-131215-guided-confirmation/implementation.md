---
status: approved
version: 1
created_at: 2026-11-08T13:22:52+08:00
updated_at: 2026-11-08T14:04:38+08:00
recorded_timezone: Asia/Shanghai
plan_approved_at: null
implementation_authorized_at: null
approval_recorded_at: 2026-11-08T14:02:36+08:00
implementation_authorization_recorded_at: 2026-11-08T14:02:36+08:00
approved_git_ref: 4346eceda744b707d09c879b7e623b58adbc7038
---

# 开发计划：落实逐项确认与可追溯计划

## 实施前提

用户已通过AP-001批准Git 4346eceda744b707d09c879b7e623b58adbc7038中的requirements.md、architecture.md及本实施方案，并明确授权GPT-6.1 Sol子智能体开工。当前状态：实施中，Issue #116。

## 任务与文件范围

### T1：共享规则与文档模板

新增 skills/scd-quickdev/references/planning-contract.md，按architecture.md的D1–D7编写规则和开工/合并前清单。

在 skills/scd-quickdev/assets/planning/ 下新增 plan.md、requirements.md、architecture.md、ux.md、implementation.md、decisions.md 六份按需使用的模板。模板使用中文、明确占位符、状态/版本/时间和来源；不会要求每项任务生成全部文件。

更新 skills/scd-discovery/assets/product-prd.md、skills/scd-architecture/assets/architecture-contract.md、feature-design.md、domain-contract.md，以及skills/scd-uiux/assets/ux-contract.md，补齐适用时间/版本/批准引用，保留原领域字段与位置。

### T2：修改确认和交接规则

- Discovery：先问再决定，保存草稿和逐轮决策，删除默认直通/未答以假设解除依赖/禁止永久计划的冲突要求。
- QuickDev：默认先审阅方案和实施计划；改写issue-delivery-contract、scope-contract、extended-issue、continuity-contract、release-contract及主技能中免确认、Issue独占方案、永久计划禁令等冲突。
- Architecture/UIUX：具体技术或体验选择要确认；工程ready与用户批准分开；更新主技能、职责契约、就绪审查和资产引用。
- Project：计划负责已批准方案，Initiative/Delivery Issue负责执行拓扑与验收追踪；更新主技能及project-contract，保留不执行实现的边界。
- Execute/Reengineering：开通道前读取精确计划与授权范围；不能把普通「继续」扩成未批准任务；更新主技能与execution/reengineering相关交接契约，不修改现有DAG/receipt验证脚本。
- UI Polish/Maintenance：修改直接优化/自主修复规则，实施经已批准计划进入QuickDev；只读审计不创建开发计划。
- Next：只读展示计划、当前批准版本、待确认项与可执行范围；更新status-contract，不替用户批准。
- Evolve：仅在其原有明确批准和脱敏边界内衔接计划，保留试验禁止自行发布等更窄权限。
- Knowledge/Interview：检查引用有无冲突；不改写它们的私人存储和专用确认流程。

主技能的agents/openai.yaml中与旧默认流程冲突的提示一并调整。参考契约仅修改直接受本次默认行为影响的部分。

### T3：Git边界、路由与说明

修改.gitignore，仅加入architecture.md D6确定的三个临时位置。更新对应连续性文档，不修改Hook源码或运行时配置。

修改config/routing-kernel.json中相关路由表述并执行node scripts/sync-routing-kernel.mjs；同步README、docs/workflow-and-state.md、docs/installation.md及AGENTS非生成区中的交付前提，明确先批准计划再自主交付。

按D8将全部既有版本载体更新为0.19.0，新增docs/releases/v0.19.0.md。历史版本说明保持历史事实；本次不重写已有.scd/specs基线或迁移外部消费者文档。

### T4：工程验证与独立场景验收

修订与新规则冲突的现有测试：重点为quickdev-contract、discovery-contract、architecture-contract、uiux-contract、project-contract、execute-contract、reengineering-contract、next-contract、maintenance-contract、evolve-contract、chinese-skill-payload、routing-kernel和相关交付/文档测试。仅按实际冲突修改断言与定义；新增必要的指令契约回归，不新增运行时校验代码。

执行现有CI命令：node --test tests/*.test.mjs；版本一致性；路由--check；既有评测定义验证与dry-run；delivery protocol；README图检查；Claude插件严格验证。项目没有独立编译步骤，不虚构构建命令。

启动一个实际的新上下文独立验收子Agent，亲读Issue、获批计划、精确差异并运行直接检查。需要观察以下情景：

- S1：直接请求一个清晰功能，仍先展示未决技术选择和计划，不自行实现。
- S2：用户漏答技术选择，保持待定，不以推荐或假设解锁依赖。
- S3：产品需求已确认但架构尚未批准，不把ready当开工授权。
- S4：用户明确批准精确计划并开工，按计划连续推进，不反复询问已批准事项。
- S5：实施中引入新依赖/技术路径或实质改计划，展示差异并重新确认。
- S6：跨会话恢复，从Git还原批准版本；新草稿或未知旧批准不误认成已批准。
- S7：纯状态查询不创建计划；Project不执行；Execute不扩大批准范围。
- S8：草稿/需求/架构/开发/决策文件可追溯，临时文件忽略范围准确，时间包含+08:00且未知事件时间不造假。

情景必须标清受控模拟与实际仓库动作；不能把测试绿灯写成所有宿主真实使用已验收。FAIL修复后复验；BLOCKED保留真实缺口。

### T5：交付与客户端同步

更新同一Issue的验收、实施与交付三本账，创建PR并等待必需CI。独立验收PASS后完成普通合并、main精确差异核对及任务资源清理。

核验已安装Codex、Claude Code、ZCode及其他受影响客户端的版本、全部13技能和支持的Hook；使用原生更新或已有源码链接，WorkBuddy按现有约定SKIP；不升级宿主、不安装缺失客户端。不能验证的结果如实保留，不能写PASS。

把本次计划、用户批准和实施结果纳入交付Git历史。完成时间在事实成立时记录，不提前填写。

## 依赖与验收映射

T1 → T2 → T3 → T4 → T5。T2与T3需在同一候选版本完整交付；不发布混合的新旧默认规则。

- A1：FR-001/003/004，通过S1–S5及跨技能引用核对。
- A2：FR-002/005/007/008，通过文档模板、真实Git跟踪与忽略检查及S6/S8核对。
- A3：FR-006/011/012，通过计划/Issue/现有基线的精确引用与批准Git版本还原核对。
- A4：FR-009，通过时区、事件/记录时间区分与版本关联核对。
- A5：FR-010，通过真实diff确认未新增校验器/Hook/运行时依赖，现有工程与独立验收通过。
- A6：合并版本、客户端核验、三本账及精确清理符合既有交付要求。

## 风险与停止条件

指令约束仍取决于Agent遵从；用户选择10B，因此不提供跨宿主硬拦截保证。Git批准关联需要实际确认依据，不能自填字段冒充用户批准。

如果必须修改上述范围外的运行时代码、引入新依赖、更改既有Hook或迁移消费者文档，先展示新增方案并询问。权限、凭据或必需环境缺失时如实记录阻塞。
