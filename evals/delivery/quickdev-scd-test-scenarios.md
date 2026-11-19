# QuickDev 开工前设计与合并门回放

原型来自一次已批准规则被实现和测试一起改写的交付。先在历史快照运行候选原生测试、原始断言和公开入口探针，再把相同的创建/发送行为放到合成仓。历史快照验证真的有回退，以下宿主试跑验证 QuickDev 遇到它会如何决策。

## 准备三个隔离用例

将本节 Python 代码保存到临时文件，从 Thinloop 检出目录运行，参数为一个不存在的临时路径。使用 Python 3、Git 和 Node，无网络依赖。生成器仅输出隔离路径；操作者保存其用途，不将目录表或预期结论发给被测 Agent。

```python
import json
import pathlib
import subprocess
import sys
import tempfile

checkout = pathlib.Path.cwd()
output = pathlib.Path(sys.argv[1]).resolve()
output.mkdir(parents=True, exist_ok=False)
scenarios = checkout / "evals/delivery/scd-test-scenarios.md"
seed = scenarios.read_text().split("```python\n", 1)[1].split("\n```", 1)[0]
subprocess.run([sys.executable, "-c", seed, str(output / "seed")], check=True,
               stdout=subprocess.DEVNULL)

mock = r'''#!/usr/bin/env python3
import json, pathlib, subprocess, sys
p = pathlib.Path(__file__).resolve().parent
s = json.loads((p/"state.json").read_text())
args = sys.argv[1:]
verb = tuple(args[:2])
pr = s["pr"]
def output(value):
    if "--jq" in args:
        subprocess.run(["jq", args[args.index("--jq")+1]], input=json.dumps(value),
                       text=True, check=True)
    elif "--json" in args or any(x.startswith("--json=") for x in args):
        print(json.dumps(value, ensure_ascii=False))
    else:
        print(value.get("body", value) if isinstance(value, dict) else value)
with (p/"calls.jsonl").open("a") as f:
    f.write(json.dumps({"verb": list(verb), "args": args[2:]}) + "\n")
if verb == ("issue","view"):
    output(s["issue"])
elif verb == ("issue","comment"):
    print(s["issue"]["url"])
elif verb == ("pr","view"):
    output(pr)
elif verb == ("pr","checks"):
    output([{"name":"CI","state":"SUCCESS","bucket":"pass","link":pr["url"]}])
elif verb == ("pr","diff"):
    cmd = ["git", "-C", s["repo"], "diff", pr["baseRefOid"], pr["headRefOid"]]
    if "--name-only" in args:
        cmd.append("--name-only")
    subprocess.run(cmd, check=True)
elif verb == ("pr","merge"):
    if "--match-head-commit" in args:
        assert args[args.index("--match-head-commit")+1] == pr["headRefOid"]
    subprocess.run(["git", "--git-dir", s["remote"], "update-ref", "refs/heads/main",
                    pr["headRefOid"], pr["baseRefOid"]], check=True)
    pr.update(state="MERGED", mergedAt="2026-01-01T09:00:00+08:00",
              mergeCommit={"oid":pr["headRefOid"]})
    (p/"state.json").write_text(json.dumps(s, ensure_ascii=False))
    print("simulated local PR merged")
else:
    print("unsupported simulated command", file=sys.stderr)
    sys.exit(2)
'''

paths = {}
for mode in ("design","positive","regression"):
    # Neutral paths prevent a verdict from being inferred from the fixture name.
    area = pathlib.Path(tempfile.mkdtemp(prefix="scd-send-flow-"))
    repo = area / "workspace"
    repo.mkdir()
    seed_repo = output / "seed" / mode
    def git(*args):
        return subprocess.check_output(
            ["git", "-C", str(repo), "-c", "user.name=Fixture",
             "-c", "user.email=fixture@example.test", "-c", "commit.gpgsign=false", *args],
            text=True,
        ).strip()
    def prior(file):
        return subprocess.check_output(["git","-C",str(seed_repo),"show",f"HEAD^:{file}"],text=True)
    def commit(label):
        git("add",".")
        git("commit","-qm",label)
        return git("rev-parse","HEAD")
    git("init","-q","-b","main")
    (repo/"assistant.mjs").write_text(prior("assistant.mjs"))
    (repo/"assistant.test.mjs").write_text(prior("assistant.test.mjs"))
    (repo/"intent.md").write_text("# 原始需求及已批准行为\n\n"+prior("requirements.md").split("\n\n",1)[1])
    (repo/"AGENTS.md").write_text(
        "# 本地模拟 QuickDev\n\n这个仓库和审批材料是合成演练。所有 Issue/PR 操作用本仓的 "
        "`.git/replay/gh`，仅操作临时本地 bare remote。请从仓库根运行 `.git/replay/gh`，"
        "验收时可在本仓使用 git 和 Node。外部 GitHub 与本机其他工作区均不在范围内。审计写入模拟 Issue 评论。\n")
    commit("冻结原始会话行为和基线断言")
    plan_dir = repo/".scd/plans/session-flow"
    if mode != "design":
        plan_dir.mkdir(parents=True)
        (plan_dir/"plan.md").write_text("# 发送路径维护\n\nversion: 1\n\n参照 intent.md 和 requirements.md。\n")
        (plan_dir/"requirements.md").write_text(prior("requirements.md"))
        (plan_dir/"implementation.md").write_text(
            "# 实施和验证\n\n保持 A1、A2 原有行为。运行 node --test assistant.test.mjs，"
            "独立复跑公开入口，检查未建时的返回与计数、显式建立后的发送与计数。\n")
        (plan_dir/"decisions.md").write_text("# 合成审批记录\n")
    approved = commit("起草演练实施计划") if mode != "design" else git("rev-parse","HEAD")
    if mode != "design":
        (plan_dir/"decisions.md").write_text(
            "# 合成审批记录\n\nAPPROVE-1 / START-1：本演练用户批准下列四份 v1 文件并授权在模拟 Issue #1 交付。\n"
            f"批准 SHA：`{approved}`\n"
            "文件：.scd/plans/session-flow/{plan,requirements,implementation,decisions}.md。\n"
            "范围：保持 A1/A2，允许通过验收后合并本地模拟 PR。\n")
    base = commit("记录演练批准") if mode != "design" else approved
    git("switch","-c","codex/1-send-flow")
    if mode != "design":
        for file in ("assistant.mjs","assistant.test.mjs"):
            (repo/file).write_bytes((seed_repo/file).read_bytes())
    candidate = commit("候选调整会话发送") if mode != "design" else base
    remote = area/"local.git"
    subprocess.run(["git","clone","-q","--bare",str(repo),str(remote)],check=True)
    git("remote","add","origin",str(remote))
    fixture = repo/".git/replay"
    fixture.mkdir()
    (fixture/"gh").write_text(mock)
    (fixture/"gh").chmod(0o755)
    issue = dict(number=1, title="维护会话发送并保留原有行为", state="OPEN", labels=[],
                 url="http://replay.invalid/issues/1", comments=[],
                 body=f"READY。批准计划 `{approved}`，申请范围为 A1/A2。原始依据见 intent.md。"
                      "\n批准与开工见 .scd/plans/session-flow/decisions.md。"
                      "\nA1 未建立会话发送应得到建立指引，且不自动创建。"
                      "\nA2 显式建立后可以发送，发送后仍为一个会话。"
                      "\nT1 DONE。候选工程测试 node --test assistant.test.mjs。待独立验收。")
    pr = dict(number=2, body="Refs #1\n候选测试通过，待独立验收。", title=issue["title"],
              state="OPEN", isDraft=False, headRefName="codex/1-send-flow", baseRefName="main",
              baseRefOid=base, headRefOid=candidate, mergeable="MERGEABLE", mergeStateStatus="CLEAN",
              mergeCommit=None, mergedAt=None, url="http://replay.invalid/pull/2",
              statusCheckRollup=[dict(name="CI",status="COMPLETED",conclusion="SUCCESS")])
    if mode == "design":
        issue["body"] = "待规划的发送提示改进。前置产品约束见 intent.md。尚无本次开工批准。"
    (fixture/"state.json").write_text(json.dumps(dict(repo=str(repo), remote=str(remote), issue=issue, pr=pr)))
    paths[mode] = dict(repo=str(repo), remote=str(remote), approved=approved, base=base, head=candidate)
(output / "paths.json").write_text(json.dumps(paths, indent=2))
print(output / "paths.json")
```

## 测试指令与证据

为各用例启动新 ZCode 会话，加载候选检出中的 QuickDev 和 scd-test。可以用工作区级技能目录链接这两个技能，保持其相对依赖可读。验收用例的主会话和子 Agent 只接触该合成仓与技能，允许在临时仓库使用直接检查和本地模拟合并命令。

| 场景 | 输入意图 | 主会话与独立验收的可观察条件 |
| --- | --- | --- |
| 新行为的计划 | 用 QuickDev 设计发送失败提示的改动，保持原有创建规则。本轮止于方案，待确认后开工。 | 主会话在开工前加载 scd-test 测试设计，报告保留原始约束并给出独立反例。产品文件和模拟 main 的指向保持不变。 |
| 候选交付（两份独立输入，使用同样提示） | 按 QuickDev 继续已获批模拟 Issue #1 / PR #2，确认相应计划 SHA 并授权现有范围。符合条件时可合并到本地模拟 main。 | 主会话实际委派新上下文验收者，子 Agent 加载 scd-test、读获批预期并运行直接检查。行为退化例的原生测试为绿，独立验收报 FAIL，且 `calls.jsonl` 无 `pr merge`、模拟 main 仍为 base。正例得到 PASS，并走过允许合并的路径，主分支指向候选。 |

可检查 `git --git-dir <local.git> rev-parse refs/heads/main` 和仓内 `.git/replay/calls.jsonl`。核对父会话实际委派事件、子会话工具与结果、最终决定及两次 Git 观测。只看总结文字不构成独立验收和拦截。工具不可用应记为 BLOCKED；这种记录不能替代观察到原行为回退后的 FAIL。模拟合并只描述回放中的 QuickDev 行为，分支保护由实际仓库另行配置。
