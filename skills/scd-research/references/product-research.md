# 产品研究方法

按会改变当前决定的未知项选用，已有证据直接复用。研究深度来自解决关键不确定性，不是报告篇幅或框架数量。

## 用户、任务与采用

从过去发生的具体事件开始：谁在什么场景下遇到问题，多久发生，如何处理，谁参与，有什么损失，已经投入多少时间或钱。区分真实行为、当事人自述、愿望和模型推断。

按行为、任务和约束识别人群，检查同一群体内部是否仍有不同目标；年龄、职业等只在确实影响决定时记录。不为画像添加虚构姓名、原话、比例或“意外洞察”。付费者与使用者不同、家庭或组织共同决策时分别说明。

覆盖一个完整过程：触发 → 数据/材料准备 → 操作 → 纠错/协作 → 结果 → 再次使用。寻找“拿不到数据”“用户不愿搬运”“必须持续手工维护”“通知到不了”等采用前提，不能只评估 AI 生成结果是否漂亮。它们是情境问题，不是所有产品的固定需求。

有真实访谈条件时，用不推销、不诱导的提问：

- 上次发生是什么时候？请从开始到结束说一下。
- 当时用了什么办法，为什么选它？最麻烦在哪里？
- 为解决问题尝试过什么？实际花了多少时间或钱？
- 最近一次放弃、换工具或续费时发生了什么？

先归纳每份原始材料的行为和上下文，再跨材料找重复与分歧；保留反例。创始人描述、公开评论和实际访谈分别标明，不冒充用户接触。访谈计划不是已开展的访谈。

## 竞品与替代

围绕同一用户任务比较，而非机械列功能：直接竞品、间接产品、平台自带能力、人工/表格办法，以及继续不处理。没有足够直接竞品时说明，不能凑固定家数。

根据当前决策核对定位、主要用户、实际可用能力、费用与限制、入口/平台、使用流程、用户不满和迁移阻力。产品页面的宣传与实测分别陈述；查到文档不能称为完成安装验收。

产品能力和价格优先读当前官方说明；痛点查用户原帖、评论、公开工单或给定访谈。评价是否来自目标人群、是否涉及相同版本和场景、是否有利益相关或营销痕迹。厂商声称的优点和缺点均不是独立需求证据。

市场/商业只在影响决定时展开：谁付钱，已有替代投入是什么，怎样触达，为什么愿意切换，成本是否改变价值。市场规模估算要给来源、公式、假设和适用范围；无依据不生成 TAM、份额或收入预测。内部工具可用时间、错误或协作成本衡量，不强造付费模式。

## 证据与反证

对会影响选择的发现保留紧凑记录，而非强制为每句建表：

| 主张 | 原始来源与日期/版本 | 人群和情境 | 支持、反证与未知 | 对决定的影响 |
| --- | --- | --- | --- | --- |

只有确认读到的内容才作为来源事实。标明一手观察、用户自述、厂商说明、转述与推断；来源发布日期、研究读取日期与事实发生日期不要混为一谈。

同源转载去重；论坛和投诉是选择性样本，不能用帖子数推出人群占比或付费率。已付费/持续使用比口头兴趣更直接，但单个案例仍不能外推全体。没有严格方法时用有解释的定性判断，不制造精确需求得分或统计置信度。

主动寻找现有办法已经足够、用户拒绝迁移、未获授权、功能其实已有等反证。证据冲突时核对人群、日期、版本和任务差异；无法消除就保留冲突，不投票“取多数”。过期或不可访问的信息明确列出缺口。

## 假设、验证与决定

按实际问题覆盖价值、可用性、技术可行性、商业/采用风险，不强制逐格填表。优先处理“如果错了，本方向就失去意义”且证据薄弱的前提；用影响、未知程度和验证成本解释顺序，不为 ICE/RICE 凑数字。

对关键项写清：假设、已有支持/反证、最小验证、观察什么、何种结果会改变决定。阈值来自任务约定、历史基线或明确标注的提议，不套用通用转化率或固定访谈人数。

选择能回答问题的最小方法：

| 未知项 | 可用方法 | 不能据此声称 |
| --- | --- | --- |
| 问题如何发生、现有办法为何不足 | 过去行为访谈、工作流程观察、原始反馈 | 总体发生率或市场规模 |
| 能否拿到所需数据或完成关键操作 | 官方接口/权限核对，必要时交 Architecture 隔离探针 | 仅凭技术介绍就端到端可行 |
| 用户能否完成操作 | 交 UIUX 设计并观察原型任务 | 好看即易用，或易用即有人要 |
| 是否愿意付出并持续使用 | 经授权的人工服务试用、真实行为实验 | 点击、候补名单或“愿意用”等同付费/留存 |

任何试验先明确不同结果下继续、调整、收窄、暂缓或不做的决定。读资料不能验证付费或留存；验证计划和结果分开。当用户无法访问、网络受限或试验未授权时，交付下一步方案和证据局限，不伪造结果或自动开展外联。

## 来源与许可

方法参考并按 Thinloop 既有边界重写自 [phuryn/pm-skills](https://github.com/phuryn/pm-skills/tree/9af7bfd0bc47fdad43c2eaa7a43cd13918e7aaef)：`pm-market-research/skills/{market-segments,user-personas,competitor-analysis,customer-journey-map}`；`pm-product-discovery/skills/{interview-script,summarize-interview,identify-assumptions-new,prioritize-assumptions,brainstorm-experiments-new,opportunity-solution-tree}`。未引入插件依赖、固定产出数量、精确评分或自动开工语义。

上游许可保留如下：

MIT License

Copyright (c) 2026 Pawel Huryn

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
