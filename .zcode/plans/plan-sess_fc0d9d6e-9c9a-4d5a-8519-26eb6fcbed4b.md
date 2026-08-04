批准落地候选方案 EVO-20260803-quickdev-midflight-scope-shift。

改动：在 `skills/scd-quickdev/SKILL.md` 的 "Do not announce these path names…" 之后、"An explicit request to implement or use QuickDev…" 之前，插入一节 "## Re-select the path when scope shifts mid-flight"（约 20 行），点名三种飞行中范围漂移信号，并要求停止扩分支、指向 `scd-discovery`/`scd-project`。纯指令改动，不删不改既有文字，不动脚本/格式/其他技能。

试用验证：(1) 确定性——新标题唯一、`##` 嵌套完整、安装路径与源一致；(2) 全新隔离会话正向测试：喂本次会话开头（bug 报告 → 修上限 → 用户问 DeepSeek 适配器 + 粘贴架构方案），确认 agent 会主动提出 Discovery/Project 交接。

晋升：patch 版本 +1、同步四个 `*-plugin/plugin.json`、两项验证都过才记 `accepted`。分发边界：不做提交/推送/发布/部署/重装，等你单独授权。