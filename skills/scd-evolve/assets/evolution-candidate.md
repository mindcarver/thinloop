# 演进诊断

- 覆盖范围：<full-transcript | visible-context | partial>
- 缺失证据：<无法观察到的内容>
- 已证明确实使用的 Thinloop 技能：<技能名称>
- 已考虑的不可编辑原因：<agent | requirements | tool-environment | model-limit | third-party-skill>

## 候选项 <EVO-id>

- 目标技能：<仅限已使用的 Thinloop 技能>
- 根因：<一个因果假设>
- 耦合理由：<多个目标确有共同需要；否则填无>
- 等级：<exploratory | supported | confirmed>
- 主要归因：<类别与因果链>
- 匹配信号：<已观察到的信号>
- 未匹配信号：<相关反证>
- 证据：<可观察来源与摘要结论>
- 可能的错误归因：<最有力的竞争性解释>

### 候选变更

- `add` `<repository-relative-path>`：<精确且有边界的新增内容>
- `delete` `<repository-relative-path>`：<精确且有边界的删除内容>
- `replace` `<repository-relative-path>`：<精确且有边界的替换内容>

### 试验

- 验证：<确定性检查；行为变化时还需新的隔离会话提示词>
- 回滚范围：<仅限候选项拥有的文件>
- 分发边界：不得提交、推送、发布、部署、重新安装或更新缓存

确认 `EVO-id` 后开始试验，或拒绝 `EVO-id`。确认前不得修改源文件或历史文件。
