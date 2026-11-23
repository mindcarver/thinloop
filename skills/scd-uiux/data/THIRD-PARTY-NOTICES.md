# 第三方数据来源与许可

本目录收录第三方开源项目的机器可读设计资产。来源、许可与改动记录如下；各上游项目保留其原始版权与许可。

## plugin87/ux-ui-agent-skills（MIT License）

- 来源：<https://github.com/plugin87/ux-ui-agent-skills>（main 分支，按文件原样收录）
- 许可：MIT License，版权归属上游作者
- 收录范围：`tokens/`（14 个 DTCG 令牌 JSON）、`components/`（11 份组件规范 Markdown）
- 改动：移除未接入检索的 `vendor/design-systems/`（31 MB 离线语料，见 Issue #138），仅保留实际使用的 DTCG 令牌与组件规范

## nextlevelbuilder/ui-ux-pro-max-skill（MIT License）

- 来源：<https://github.com/nextlevelbuilder/ui-ux-pro-max-skill>（main 分支）
- 许可：MIT License，版权归属上游作者
- 收录范围：`knowledge/`（styles/typography/products/ui-reasoning/ux-guidelines/icons/charts/motion/landing 共 9 张 CSV + catalog-summary.json + data-provenance.json）、`stacks/`（12 张 Web 技术栈 CSV：`angular`、`astro`、`html-tailwind`、`laravel`、`nextjs`、`nuxt-ui`、`nuxtjs`、`react`、`shadcn`、`svelte`、`threejs`、`vue`）
- 改动：按 `scd-uiux` 的 Web 适用边界移除 10 张原生移动/桌面栈 CSV（`avalonia`、`flutter`、`javafx`、`jetpack-compose`、`react-native`、`swiftui`、`uno`、`uwp`、`winui`、`wpf`）及未接入检索的 `vendor/`（`google-fonts.csv`、`google-font-licenses.json`、`phosphor-icons-upstream.json`），见 Issue #138；检索脚本 `scripts/search.mjs` 为本项目自研（node 零依赖，含中英设计词同义映射），非上游代码

## 方法论与规则改写来源

- `references/design-method.md`：方法论框架改写自 bmad-code-org/bmad-method-wds-expansion（MIT License，Copyright (c) 2025 BMad Code, LLC，<https://github.com/bmad-code-org/bmad-method-wds-expansion>）的触发映射/场景/设计循环思想——**中文改写并适配本仓库治理，非逐字复制**
- `references/platform-principles.md`：本项目自写；方法灵感引用 Apple HIG 与 Material Design 官方公开指南（仅引用出处，不复制原文）；无障碍要点吸收自 plugin87/ux-ui-agent-skills（MIT）accessibility 规则的改写
