# 第三方数据来源与许可

本目录收录第三方开源项目的机器可读设计资产。来源、许可与改动记录如下；各上游项目保留其原始版权与许可。

## plugin87/ux-ui-agent-skills（MIT License）

- 来源：<https://github.com/plugin87/ux-ui-agent-skills>（main 分支，按文件原样收录）
- 许可：MIT License，版权归属上游作者
- 收录范围：`tokens/`（14 个 DTCG 令牌 JSON）、`components/`（11 份组件规范 Markdown）
- 改动：无（原样搬运）；后续如有改动在各节记录

## nextlevelbuilder/ui-ux-pro-max-skill（MIT License）

- 来源：<https://github.com/nextlevelbuilder/ui-ux-pro-max-skill>（main 分支，按文件原样收录）
- 许可：MIT License，版权归属上游作者
- 收录范围：`knowledge/`（styles/typography/products/ui-reasoning/ux-guidelines/icons/charts/motion/landing 共 9 张 CSV + catalog-summary.json + data-provenance.json）、`stacks/`（22 张框架 CSV）
- 改动：无（原样搬运）；检索脚本 `scripts/search.mjs` 为本项目自研（node 零依赖），非上游代码

## 大体量参考语料（vendor/）

- `vendor/design-systems/`：来自 plugin87/ux-ui-agent-skills（MIT License，<https://github.com/plugin87/ux-ui-agent-skills>，main 分支）design-systems/ 目录全量原样收录（2148 文件，约 31MB；设计系统实物参照语料）
- `vendor/google-fonts.csv`、`vendor/google-font-licenses.json`、`vendor/phosphor-icons-upstream.json`：来自 nextlevelbuilder/ui-ux-pro-max-skill（MIT License，<https://github.com/nextlevelbuilder/ui-ux-pro-max-skill>，main 分支）data/ 目录原样收录；Google Fonts 元数据及其许可声明、Phosphor Icons 上游数据随文件内附
- 改动：无（原样搬运）
