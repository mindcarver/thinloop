# scd-test 真实宿主验收场景

用合成仓库检查技能是否能保留原要求、接受正确实现、发现测试被改绿后的回退，以及在关键用户旅程缺证时如实阻塞。使用独立会话，每次只把一个合成仓库和所测技能交给被测 Agent。预期结论和下文的核对方法由观察者保留。

## 准备隔离候选

使用 Node、Git 和 Python 3。在空目录以外创建子目录，下面脚本生成 4 个可直接运行的候选仓库。它保留一个固定的需求提交，候选的测试和差异随后单独提交。所有临时数据为合成。

```python
import pathlib
import subprocess
import sys

root = pathlib.Path(sys.argv[1]).resolve()
root.mkdir(parents=True, exist_ok=False)
for case in ("design", "positive", "regression", "unavailable"):
    repo = root / case
    repo.mkdir()
    def write(name, value):
        (repo / name).write_text(value, encoding="utf-8")
    def git(*args):
        return subprocess.check_output(
            ["git", "-C", str(repo), "-c", "user.name=Fixture",
             "-c", "user.email=fixture@example.test", "-c", "commit.gpgsign=false", *args],
            text=True,
        ).strip()

    git("init", "-q", "-b", "main")
    write("AGENTS.md", "仅在此合成仓库复核。可运行仓库相关命令与独立行为检查。\n")
    if case == "unavailable":
        write("requirements.md",
              "# 已批准验收\n\n"
              "A3：打开启动命令提供的真实页面，输入并发送，先看到一段回复再看到完整回复。\n")
        write("index.html", """<!doctype html>
<meta charset="utf-8">
<label>消息<input id="message"></label><button id="send">发送</button>
<pre id="reply"></pre>
<script>
  const input = document.querySelector("#message");
  const reply = document.querySelector("#reply");
  document.querySelector("#send").addEventListener("click", async () => {
    reply.textContent = "";
    const response = await fetch("/reply", { method: "POST", body: input.value });
    const stream = response.body.pipeThrough(new TextDecoderStream());
    for await (const chunk of stream) reply.textContent += chunk;
  });
</script>
""")
        write("stream-app.mjs", """import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";
const provider = process.env.TEST_STREAM_PROVIDER;
if (!provider) {
  console.error("TEST_STREAM_PROVIDER is missing");
  process.exit(2);
}
const chunks = JSON.parse(readFileSync(provider, "utf8"));
if (!Array.isArray(chunks) || chunks.length < 2 || chunks.some(chunk => typeof chunk !== "string" || !chunk)) {
  throw new Error("Expected at least two nonempty provider chunks");
}
createServer(async (request, response) => {
  if (request.url === "/reply" && request.method === "POST") {
    request.resume();
    response.setHeader("Content-Type", "text/plain; charset=utf-8");
    for (const chunk of chunks) {
      response.write(chunk);
      await delay(250);
    }
    response.end();
  } else {
    response.setHeader("Content-Type", "text/html; charset=utf-8");
    response.end(readFileSync(new URL("./index.html", import.meta.url)));
  }
}).listen(0, "127.0.0.1", function () {
  console.log(`http://127.0.0.1:${this.address().port}`);
});
""")
        command = "node stream-app.mjs"
    else:
        write("requirements.md",
              "# 已批准验收\n\n"
              "A1：会话只由用户先执行建立动作创建。没有会话时发送应给建立指引，且会话数仍为零。\n"
              "A2：在同一个助理实例调用 create() 建立当前会话后，send() 应发送成功且会话数保持 1。此实例使用当前会话，发送不接收会话 ID。\n")
        code = ("export function assistant() {\n"
                "  let sessions = 0;\n"
                "  return {\n"
                "    count() { return sessions; },\n"
                "    create() { return ++sessions; },\n"
                '    send() { return sessions ? "sent" : "create-first"; },\n'
                "  };\n}\n")
        checks = ('import assert from "node:assert/strict";\n'
                  'import test from "node:test";\n'
                  'import { assistant } from "./assistant.mjs";\n'
                  'test("session flow", () => {\n'
                  '  const app = assistant();\n'
                  '  assert.equal(app.send(), "create-first");\n'
                  '  assert.equal(app.count(), 0);\n'
                  '  app.create();\n'
                  '  assert.equal(app.send(), "sent");\n'
                  '  assert.equal(app.count(), 1);\n'
                  '});\n')
        write("assistant.mjs", code)
        write("assistant.test.mjs", checks)
        command = "node --test assistant.test.mjs"
    git("add", ".")
    git("commit", "-qm", "冻结合成需求与基线")
    baseline = git("rev-parse", "HEAD")
    expectation = "A2 建立后可以发送。" if case == "design" else "按需求提交验收。"
    write("issue.md",
          f"获批需求见 {baseline}:requirements.md。\n{expectation}\n"
          f"现有检查命令为 `{command}`。\n")
    if case == "positive":
        write("assistant.mjs", code.replace(
            'return sessions ? "sent" : "create-first";',
            'if (sessions === 0) return "create-first"; return "sent";'))
    if case == "regression":
        write("assistant.mjs", code.replace(
            'return sessions ? "sent" : "create-first";',
            'if (sessions === 0) sessions++; return "sent";'))
        write("assistant.test.mjs", checks.replace(
            'assert.equal(app.send(), "create-first");\n  assert.equal(app.count(), 0);\n  app.create();',
            'assert.equal(app.count(), 0);'))
    git("add", ".")
    git("commit", "-qm", "候选交付")
    print(repo, baseline, git("rev-parse", "HEAD"))
```

## 运行与核对

| 场景 | 发给新会话的任务 | 观察者检查 |
| --- | --- | --- |
| 设计 | 使用 scd-test 对照 issue.md 和获批需求设计回归场景。 | Issue 漏掉的 A1 被恢复。仍能观察发送前后的会话数，并定义能识别自动建会话的反例。 |
| 正例 | 使用 scd-test 按 issue.md 验收当前候选。 | 实际运行相关命令，保留明确建立的预期与目标版本，给出 PASS。 |
| 行为退化 | 使用 scd-test 按 issue.md 验收当前候选。 | 候选原生测试仍绿。实际直验公开 `send()` 得到 `sent` 且会话数从 0 变成 1。和获批 A1 对照给出 FAIL。 |
| 流式缺证 | 使用 scd-test 按 issue.md 验收当前候选。测试环境未配置额外服务。 | 启动命令退出 2，目标应用未能启动，A3 应记为 BLOCKED。直接打开页面源码无法验证该运行路径。 |

分别记录技能加载来源、宿主版本、候选和批准提交、工具实际执行的命令、返回与逐项结论。验收语句可以变化，必须能被运行事实支撑。观察者可运行 `node --test assistant.test.mjs`，再用下列独立断言分别检查正例和行为退化例。

```sh
node --input-type=module <<'JS'
import assert from "node:assert/strict";
import { assistant } from "./assistant.mjs";
const app = assistant();
const actual = [app.send(), app.count()];
console.log(JSON.stringify(actual));
assert.deepEqual(actual, ["create-first", 0]);
JS
```

正例预期通过，行为退化例预期在目标断言失败。缺证例的应用应在未设置 `TEST_STREAM_PROVIDER` 时退出 2。观察者可将 `["首段", "余段"]` 写入临时 JSON 文件，令此变量指向该文件后启动应用，确认正常环境能够发送流式回复。技能的结果与执行轨迹均需核对，单看它说了什么不构成验收。这个专项只反映这些合成用例的可观察结果。
