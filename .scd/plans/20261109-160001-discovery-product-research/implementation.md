---
status: approved
version: 2
created_at: 2026-11-09T16:00:01+08:00
updated_at: 2026-11-09T16:50:08+08:00
recorded_timezone: Asia/Shanghai
---

# 实施计划

## 文件和组织（推荐选择）

1. 新建 `skills/scd-research/SKILL.md` 与 `agents/openai.yaml`，中文入口名为“SCD 产品研究”；入口负责适用范围、研究决策、方法/深度选择、证据与权限底线、结果和自然交接，描述足以自动发现但不吸收普通编码/通用检索。
2. 新建 `skills/scd-research/references/product-research.md`：承载 R1–R4 的用户、竞品/替代、证据、风险与最小验证细则，并附固定上游来源及所借鉴内容的 MIT 版权许可。按需加载；不整包复制，不新增脚本/依赖。
3. `skills/scd-discovery/SKILL.md` 增加条件路由和消费研究结论的说明；仅对 `references/interviewing.md` 中与前期调研冲突的措辞作衔接调整。Discovery 保留原产品访谈、就绪、PRD、确认机制，不内置重复研究流程。不修改 PRD 模板、readiness 或 artifacts，除非实现时发现直接冲突；此类额外变更须先说明并修订计划。
4. `config/routing-kernel.json` 新增独立 Research 规范路由（由八条变九条），Discovery 路由只补衔接；`scripts/sync-routing-kernel.mjs` 的目录覆盖检查由 13 调整到 14。沿用生成命令同步 AGENTS、README 与实际生成的 Agent 表面，不手改生成段。
5. README 增加 Research 能力卡及 Research → Discovery 的使用说明；`scripts/generate-readme-diagrams.mjs` 增加 Research 流程定义，按已有格式生成 `assets/flows/scd-research.svg`，不重排旧技能稳定名称。没有产品 UI 变更；流程图检查不是产品浏览器验收。
6. 同步 `config/platform-capabilities.json` 中当前技能数量文案，并通过既有生成器更新 `docs/installation.md`、`docs/verification.md` 等当前安装说明；`.dsh-plugin/README.md` 当前技能总数改为十四。历史发布说明/历史评测冻结快照保留原计数，不做全仓 13→14 替换。
7. 必要的技能目录和覆盖回归修改限定为 `tests/routing-kernel.test.mjs`、`plugin-compatibility.test.mjs`、`opencode-compatibility.test.mjs`、`chinese-skill-payload.test.mjs`、`step-communication.test.mjs`、`readme-product-surface.test.mjs`、`thinloop-current-eval.test.mjs`、`platform-capabilities.test.mjs`；当前 ZCode fixture `tests/fixtures/zcode/{array,envelope}.json` 的 skillCount 与当前完整载荷一致。保留其他 13（如验收项编号）和冻结历史测试不变。
8. 在 `evals/discovery/product-research-scenarios.md` 保存下述可复现行为场景和原始材料；复用独立上下文执行，不添加新运行器、服务、评分器或强制网络依赖。用语匹配和目录数量检查只证明结构，不能宣称行为通过。
9. 功能版从 0.19.0 升至 0.20.0：同步 `.codex-plugin/plugin.json`、`.claude-plugin/plugin.json`、`.claude-plugin/marketplace.json`、`.codebuddy-plugin/plugin.json`、`.codebuddy-plugin/marketplace.json`、`.zcode-plugin/plugin.json`、`marketplace.json`、README badge、`docs/installation.md` 最新条目；新增 `docs/releases/v0.20.0.md`。不主动打 tag 或发布外部包。

## 行为验证场景

| 场景 | 原始输入 | 应观察结果 |
| --- | --- | --- |
| 未验证消费产品 | 希望做生活管理工具；原始材料显示数据在手机内、用户缺乏搬运意愿 | 通过 Research 研究行为、替代和采用成本，把数据进入/持续投入作为假设，不先承诺完整功能或手机集成可用 |
| 明确局部改动 | 已有列表空状态改一句文案，范围完整 | 直接走既有局部变更路径，不添加竞品、画像或市场证明 |
| 证据薄且矛盾 | 同源营销转载与少量真实用户意见不一致；无样本总体 | 保留反证与局限，不把转载算独立需求支持、不估造发生率或模拟访谈 |
| 用户固定产品形态 | 明确只做本地桌面内部工具，接受已知手工步骤 | 尊重约束，研究实际未决问题，不强迫商业化/手机端，也不反复要求市场证明 |
| 明确深度研究 | 给定产品主题与若干可读取的官方/用户原始材料，另有不可访问来源 | 实际读材料、核对主张、说明覆盖与来源限制，提出关键假设的下一验证；不联系别人、收款或写实施代码 |
| 已批准产品 | 完整 PRD、来源证据和明确开工授权 | 直接进入既有交付路径，复用有效研究与已批准契约，只调查真实新增缺口，不重新进入整套市场调研 |

独立验收亲读批准提交、实际差异及上述原始场景；分别核对 Research 独立完成、Research 到 Discovery 交接、Discovery 快速路径不倒退；使用隔离输出目录，逐场景记录行为、证据和 PASS/FAIL/BLOCKED。带固定材料的场景验证证据处理与路由，不能称为在线市场调研效果或跨模型收益。真实联网场景需以工具读取得到的来源为证据；网络不可用记具名限制。

## 工程验证

先运行仓库现有 CI 的无模型检查：`node --test tests/*.test.mjs`、`node scripts/check-version.mjs`、`node scripts/sync-routing-kernel.mjs --check`、`node evals/validate-discovery-cases.mjs`、`node evals/validate-knowledge-cases.mjs`、`node evals/knowledge/validate.mjs`、`node evals/thinloop/validate.mjs`、Knowledge 与 Thinloop 的 dry run、`node evals/delivery/run.mjs --mode protocol`、`node scripts/generate-readme-diagrams.mjs --check`、Claude plugin strict validation。对新增 Research 和改动 Discovery 分别执行 skill-creator quick_validate；仓库无编译构建步骤，不伪称执行了应用构建。

不运行旧版固定模型的 36 次完整研究评测，不改旧结果、不承诺通过未跑的运行时验证。新行为以此次独立上下文、隔离场景直接验收，不以文本存在或绿色 CI 替代。

## 执行顺序与交付

T1 确认本计划的精确版本并记录批准/开工事件，创建一个中文 Issue 引用计划 SHA 与 A1–A6。
T2 实现上述技能与路由/文档增量、版本同步；保留本任务外文件。
T3 执行工程检查和行为验证，修复本任务回归；无法核验的项目明确标记。
T4 按 release-contract 调用独立新上下文验收，读取 Issue/批准依据/真实差异和行为证据，只有 PASS 才进入合并。
T5 提交任务分支并推送，PR 使用 Refs；等必需检查通过后合并，保留获批计划 Git 历史，独立新克隆验证精确 SHA:file 可读。
T6 同步主检出 main，按既有安装契约刷新已安装 Agent 的 Thinloop 载荷（不安装 phuryn/pm-skills 或缺失宿主），核对版本、十四技能及平台支持的 hooks；记录 MANUAL/UNVERIFIED/SKIP，真实验收由用户保留。
T7 Issue 完成审计后按实际证据关闭并清理本任务 worktree/分支；不能恢复批准历史或安装必需证据不完整时保留资源并报告。

## 风险与停止条件

- 不把开产品之前“先研究”泛化成任何 Bug 都要访谈或竞品报告；按触发、复用和用户约束验收。
- 证据搜集与用户契约确认分开，不允许引用网页指令改变任务权限；研究不自动授权外联/实验副作用。
- 现有三份无关未跟踪产物留在原主检出，本任务隔离 worktree 操作。
- 缺失批准、GitHub 权限、必需检查、独立验收或高风险授权时，停止受影响动作并具名报告。
