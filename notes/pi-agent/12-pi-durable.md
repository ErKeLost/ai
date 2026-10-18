# 第 12 章：`pi-durable`——围绕提交和可恢复任务构建 Agent

## 学习目标

理解 Durable 与普通 coding-agent session 的不同目标：重要变化先提交，长任务保存 checkpoint，进程重启后继续调度。学会阅读 Harness、Conversation、Entry、Document、Task、Submission 的关系。

## 1. 核心模型

- **Harness**：打开 storage、装配 Models/registry，并运行任务调度。
- **Conversation**：不可变 entry transcript，操作通过 atomic commit 写入。
- **Document**：和 transcript 并列的类型化 JSON 状态。
- **Task**：持久状态机，每个 step 保存 checkpoint，可在进程重开后恢复。
- **Submission**：用户输入或待写 entry 的句柄，可等待 done/unanswered。
- **Extension/Registry**：tools、hooks、system sections 和 task 实现；conversation 保存选择的名字，registry 是进程内加载的实现。

一个 input 完整生命周期：

```text
submit → pi.user entry
       → pi.generation task → pi.assistant(tool call)
       → pi.tool task(s) → pi.tool-result entries
       → next generation → final assistant → submission done
```

## 2. 最小例子：提交并等待回答

```ts
const harness = await Harness.open(
  new MemoryStorage(),
  { models, registry: createRegistry() },
  BACKGROUND_CONTEXT,
);
const root = await harness.root(BACKGROUND_CONTEXT, {
  agent: { model: { provider: "openai", modelId: "gpt-6-sol" } },
});
const submission = await root.submit({ type: "input", content: "法国首都是哪里？" }, BACKGROUND_CONTEXT);
const settled = await submission.wait(BACKGROUND_CONTEXT);
// settled === done 时，再从 AssistantEntry / conversation commit 读取答案。
await harness.close(BACKGROUND_CONTEXT);
```

`MemoryStorage` 仅适合进程内例子；持久运行可用 JSONL 或 SQLite storage。

## 3. 为什么先 commit 再执行

假设工具正在调用远程 API 时进程崩溃。如果“工具调用意图”只在内存里，重启后无法知道发生到哪一步。Durable 先把 generation/tool task 和输入提交，再运行；输出与状态也在完成后提交。恢复时可以依据 task checkpoint 和工具的 replay policy 决定接续。

```text
commit(call intent) → run side effect → commit result
```

这不自动提供 exactly-once 外部副作用。一个工具若调用支付接口且进程在支付成功后、结果提交前崩溃，安全重试依赖外部 idempotency key。`replay: "safe"` 是工具作者对重跑语义的声明，不会凭空让副作用幂等。

## 4. 工具与嵌套调用

`defineTool()` 声明输入 schema、execute、可选 structuredOutputSchema、replay policy、caller exposure 等。每个 tool call 有独立 task。`api.executeTool()` 可让 codemode/MCP bridge 调其他工具；嵌套调用拥有 task 层级、hooks 和 usage。

例：模型只看一个 `codemode` tool；脚本内部再调用 `read`、`grep`。每次调用各自是 durable task，但脚本只把最终汇总交回 generation task。

## 5. Storage 与运行环境

Memory、JSONL、SQLite 是后端选择。storage contract 由持久 Session 需要支持的读取/写入操作定义；所有 async 操作带 Chord `Context`，它传递取消语义。`BACKGROUND_CONTEXT` 表示后台工作不因单次调用方等待被取消。

默认本地工具经过 `ExecutionEnv` 抽象，因此 Durable 可以使用本地 Node 环境，也可用 pi-env 把操作转到远端机器。

## 6. 实验性状态与源码地图

该包 README 明确标为 Experimental，接口可能变化；学习源码时以 checkout 为准。

- Harness/task orchestration：`src/harness/`
- transcript 和 projection：`src/session/`、`entries.ts`
- JSONL/SQLite/memory storage：`src/storage/`
- coding tools：`src/tools/`
- compaction、images、codemode、tool-search：各自同名子目录
- quickstart：[README](../../pi/packages/durable/README.md)

练习：在工具任务执行中人为抛出异常，查找其 task state 与 tool result entry 如何关联；再比较 replay-safe 与不可重放工具在恢复后有何差别。

