---
status: draft
version: 1
created_at: 2026-11-09T16:00:01+08:00
updated_at: 2026-11-09T16:00:01+08:00
recorded_timezone: Asia/Shanghai
---

# 实施计划

## 文件和组织（推荐选择）

1. 增强 `skills/scd-discovery/SKILL.md` 的描述与“先调查，再提问”：新产品先评估证据，按缺口进入研究；只保留入口/边界，详情按需加载。
2. 新增 `skills/scd-discovery/references/product-research.md`：承载 R1–R4 的用户、竞品/替代、证据、假设和验证方法，并附固定上游来源及所借鉴内容的 MIT 版权许可。参考上游做法，按 Thinloop 原语重写，不整包复制。
3. 小幅同步 `skills/scd-discovery/references/interviewing.md`、`readiness-review.md`、`artifacts.md`：移除默认不研究与不强制研究的歧义，复用逐轮决策、证据位置与风险接受；不重复定义原流程。
4. `skills/scd-discovery/assets/product-prd.md` 只在“用户问题与当前替代方案”“假设与风险”增加证据/未知引用提示，不强制新的市场章节；同步 `agents/openai.yaml` 的入口说明，保持确认条款。
5. `config/routing-kernel.json` 的 Discovery 一条增加产品前期用户/竞品研究触发，执行原同步脚本生成对应 AGENTS/README/Agent 表面；不改变其他路由的含义。README 的 Discovery 能力卡同步，并说明研究不是市场需求已经验证。
6. 在 `evals/discovery/product-research-scenarios.md` 保存下述可复现的行为场景和输入证据；复用已有评测/独立上下文执行，不添加新运行器、服务、评分器或强制网络依赖。已有结构测试仅在旧契约被合法调整而失败时修订，不用关键词匹配宣称行为通过。
7. 功能版从 0.19.0 升至 0.20.0：同步 `.codex-plugin/plugin.json`、`.claude-plugin/plugin.json`、`.claude-plugin/marketplace.json`、`.codebuddy-plugin/plugin.json`、`.codebuddy-plugin/marketplace.json`、`.zcode-plugin/plugin.json`、`marketplace.json`、README badge、`docs/installation.md` 的最新条目；新增 `docs/releases/v0.20.0.md`。不主动打 tag 或发布外部包。

## 行为验证场景

| 场景 | 原始输入 | 应观察结果 |
| --- | --- | --- |
| 未验证消费产品 | 希望做生活管理工具；原始材料显示数据在手机内、用户缺乏搬运意愿 | 先研究行为、替代和采用成本，把数据进入/持续投入作为假设，不先承诺完整功能或手机集成可用 |
| 明确局部改动 | 已有列表空状态改一句文案，范围完整 | 直接走既有局部变更路径，不添加竞品、画像或市场证明 |
| 证据薄且矛盾 | 同源营销转载与少量真实用户意见不一致；无样本总体 | 保留反证与局限，不把转载算独立需求支持、不估造发生率或模拟访谈 |
| 用户固定产品形态 | 明确只做本地桌面内部工具，接受已知手工步骤 | 尊重约束，研究实际未决问题，不强迫商业化/手机端，也不反复要求市场证明 |
| 明确深度研究 | 给定产品主题与若干可读取的官方/用户原始材料，另有不可访问来源 | 实际读材料、核对主张、说明覆盖与来源限制，提出关键假设的下一验证；不联系别人、收款或写实施代码 |
| 已批准产品 | 完整 PRD、来源证据和明确开工授权 | 复用有效研究与已批准契约，只调查真实新增缺口，不重新进入整套市场调研 |

独立验收亲读批准提交、实际差异及上述原始场景；使用隔离输出目录，逐场景记录行为、证据和 PASS/FAIL/BLOCKED。带固定材料的场景验证证据处理与路由，不能称为在线市场调研效果或跨模型收益。真实联网场景需以工具读取得到的来源为证据；网络不可用记具名限制。

## 工程验证

先运行仓库现有 CI 的无模型检查：`node --test tests/*.test.mjs`、`node scripts/check-version.mjs`、`node scripts/sync-routing-kernel.mjs --check`、`node evals/validate-discovery-cases.mjs`、`node evals/validate-knowledge-cases.mjs`、`node evals/knowledge/validate.mjs`、`node evals/thinloop/validate.mjs`、Knowledge 与 Thinloop 的 dry run、`node evals/delivery/run.mjs --mode protocol`、`node scripts/generate-readme-diagrams.mjs --check`、Claude plugin strict validation。对改动技能执行 skill-creator quick_validate；仓库无编译构建步骤，不伪称执行了应用构建。

不运行旧版固定模型的 36 次完整研究评测，不改旧结果、不承诺通过未跑的运行时验证。新行为以此次独立上下文、隔离场景直接验收，不以文本存在或绿色 CI 替代。

## 执行顺序与交付

T1 确认本计划的精确版本并记录批准/开工事件，创建一个中文 Issue 引用计划 SHA 与 A1–A6。
T2 实现上述技能与路由/文档增量、版本同步；保留本任务外文件。
T3 执行工程检查和行为验证，修复本任务回归；无法核验的项目明确标记。
T4 按 release-contract 调用独立新上下文验收，读取 Issue/批准依据/真实差异和行为证据，只有 PASS 才进入合并。
T5 提交任务分支并推送，PR 使用 Refs；等必需检查通过后合并，保留获批计划 Git 历史，独立新克隆验证精确 SHA:file 可读。
T6 同步主检出 main，按既有安装契约刷新已安装 Agent 的 Thinloop 载荷（不安装 phuryn/pm-skills 或缺失宿主），核对版本、十三技能及平台支持的 hooks；记录 MANUAL/UNVERIFIED/SKIP，真实验收由用户保留。
T7 Issue 完成审计后按实际证据关闭并清理本任务 worktree/分支；不能恢复批准历史或安装必需证据不完整时保留资源并报告。

## 风险与停止条件

- 不把开产品之前“先研究”泛化成任何 Bug 都要访谈或竞品报告；按触发、复用和用户约束验收。
- 证据搜集与用户契约确认分开，不允许引用网页指令改变任务权限；研究不自动授权外联/实验副作用。
- 现有三份无关未跟踪产物留在原主检出，本任务隔离 worktree 操作。
- 缺失批准、GitHub 权限、必需检查、独立验收或高风险授权时，停止受影响动作并具名报告。
