# 第 3 章：`pi-agent-core`——Agent Loop 的状态机

## 学习目标

理解 Agent loop 的输入/输出、工具调用生命周期、消息队列和事件流；知道为什么它与具体 CLI、文件工具、终端 UI 解耦。

## 1. Agent 管理什么状态

核心 `Agent` 持有 `AgentContext`、模型、stream function、工具集合和回调。Context 的消息类型是可扩展的 `AgentMessage`；只有 provider 请求边界才需要将它转换成 LLM 能理解的 `Message[]`。转换由 `convertToLlm()` 完成，UI-only 或应用自定义消息可在这里过滤或翻译。

```text
AgentMessage[] ──transformContext──> AgentMessage[]
             ──convertToLlm────────> system/user/assistant/toolResult
             ──streamFn────────────> AssistantMessageEventStream
```

## 2. 最小 Agent

```ts
import { Agent } from "@earendil-works/pi-agent-core";
import { createModels } from "@earendil-works/pi-ai";
import { anthropicProvider } from "@earendil-works/pi-ai/providers/anthropic";
import { Type } from "typebox";

const models = createModels();
models.setProvider(anthropicProvider());
const model = models.getModel("anthropic", "claude-sonnet-4-6");
if (!model) throw new Error("缺少模型");

const agent = new Agent({
  initialState: {
    systemPrompt: "你是助手。",
    model,
    tools: [{
      name: "add",
      label: "加法",
      description: "将两个数相加",
      parameters: Type.Object({ a: Type.Number(), b: Type.Number() }),
      execute: async (_toolCallId, { a, b }) => ({
        content: [{ type: "text", text: String(a + b) }],
        details: undefined,
      }),
    }],
  },
  streamFn: models.streamSimple.bind(models),
});
agent.subscribe((event) => console.log(event.type));
await agent.prompt("2 加 3 是多少？");
```

实际扩展可直接使用 package 中的 `AgentTool` 类型和 TypeBox schema；示例省略 UI 和结果细节，以突出 loop。

## 3. 一次带工具的完整轮次

```text
agent_start
turn_start
message_start/end(user)
message_start(assistant) → message_update* → message_end(assistant toolCall)
tool_execution_start → tool_execution_update* → tool_execution_end
message_start/end(toolResult)
turn_end
turn_start → assistant final stream → turn_end
agent_end
```

事件是 UI 和外部集成的稳定观察点；完整 assistant message 用于持久化，delta 供实时呈现。不要只依赖 delta 重建最终结果，因为错误、工具输入和 stop reason 也会影响最终消息。

## 4. 工具调用的安全执行边界

loop 从 assistant message 中提取 tool call，按工具 schema 验证 arguments，寻找已注册的工具，执行 `beforeToolCall`，再执行工具，允许 `afterToolCall` 调整结果，最后生成 toolResult message。模型只提出意图；工具执行仍是应用程序代码。

例：模型给 `{ "a": "2", "b": 3 }`，而 schema 要 number。校验失败时，Agent 产生错误 tool result 并继续模型对话；不应把未校验 JSON 直接传给代码。

默认可并行执行同一 assistant 响应中的独立工具；如果某工具有共享状态/副作用，或标成 sequential，则整批串行。执行完成事件可按完成顺序到达，持久化 tool result 仍保持原始调用顺序。

## 5. 队列为何分 Steering 和 Follow-up

- **Steering**：正在运行时用户想改变当前方向，loop 在可调度边界插入，当前工具批次可能完成后才送回模型。
- **Follow-up**：等当前 Agent 工作自然结束后，再将用户消息作为下一轮输入。

例：Agent 正在检查三个文件时，steering 是“先别改文件，只总结风险”；follow-up 是“当前修复完成后，再帮我写 changelog”。Agent loop 在轮次边界轮询队列，不需要每个输入都强制打断 HTTP stream。

Abort 终止当前响应并走 aborted 收尾；取消信号同时传给 stream 与工具，使长操作有机会停止。队列如何在 abort 后回到输入编辑器由上层 coding-agent 负责。

## 6. 两个重要 hook

`prepareRequest` 在每次 provider 请求前得到当前 context/model/thinking level，可以换入规范化 transcript 或切换模型；传入的 pending messages 已进入 context。`finishTurn` 在一轮 assistant 与工具结果完成后、`turn_end` 之前决定结束或再请求一次。错误/abort 是硬退出；无条件返回 continue 会产生无限循环。

例：一个测试 harness 可在每次请求前从存储重载 canonical transcript；只有当 assistant 的状态是正常完成且任务仍有未处理项时才继续生成。

## 7. 核心代码

- [agent-loop.ts](../../pi/packages/agent/src/agent-loop.ts)：高层编排、事件顺序和 continuation。
- [agent.ts](../../pi/packages/agent/src/agent.ts)：状态持有、prompt/continue/abort API。
- [types.ts](../../pi/packages/agent/src/types.ts)：消息、工具、事件、hook 的合同。
- [stream-fn.ts](../../pi/packages/agent/src/stream-fn.ts)：默认流函数的适配入口。

阅读练习：在 `agent-loop.ts` 搜索 `executeToolCalls`，给“参数失败”和“工具抛错”分别画事件序列，再确认两种错误是否会让 agent_end 消失。

