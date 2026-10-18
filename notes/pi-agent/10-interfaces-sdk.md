# 第 10 章：CLI、JSON、RPC 与 TypeScript SDK

## 学习目标

看懂 Pi 同一个会话运行时如何接入终端用户、shell pipeline、外部进程控制器和 TypeScript 应用。

## 1. 四种接口共用同一核心

```text
                       ┌─ InteractiveMode → TUI + 键盘
CLI parse + runtime ───┼─ PrintMode       → 最终文本
                       ├─ JSON mode       → Agent events JSONL
                       └─ RPC mode        → 命令/响应/事件 JSONL
SDK → AgentSession ────┘
```

模式间差异主要是输入和输出 contract，不是每种模式都有一份 Agent。例：`pi -p "解释 package.json"` 与交互模式都使用 AgentSession；区别在于 print mode 从命令行取得输入并最终只写回答。

## 2. Print 与 JSON event stream

Print mode 适合单次 shell 自动化。JSON mode 把事件逐行输出，外层消费器能显示 `message_update`、工具调用和最终消息。为避免每个 delta 都携带整段累计文本，Pi 在 wire 形式移除 assistant 的重复 partial snapshot，保留增量和最终 authoritative message。

例（概念性 JSONL）：

```jsonl
{"type":"agent_start"}
{"type":"message_start","message":{"role":"assistant","content":[]}}
{"type":"message_update","assistantMessageEvent":{"type":"text_delta","delta":"完成"}}
{"type":"message_end","message":{"role":"assistant","content":[{"type":"text","text":"完成"}]}}
```

若你要把事件还原成 transcript，不能只拼 text_delta；必须同时处理工具调用、错误结尾、usage 和 message_end。

## 3. RPC 是双向命令流

RPC mode 使用 stdin 接受 JSONL command，stdout 输出 response、session event 和 extension UI request。command 的 `id` 用于与 `response.id` 关联；事件可以在 command response 之前/期间流出。

```jsonl
{"id":"1","type":"get_state"}
{"id":"2","type":"prompt","message":"读取 README 的标题"}
{"id":"3","type":"abort"}
```

```text
stdin: command → stdout: event* → stdout: correlated response
```

因为 stdout 是协议，普通日志不能混进去污染 JSONL；源码的 output guard 会在 headless protocol 下接管 stdout。UI request 可由宿主返回 confirm/select/input 响应。RPC host 不一定支持 TUI 专属功能，比如复杂 component overlay。

## 4. SDK 嵌入模式

SDK 通过 `createAgentSession()` 得到 `AgentSession`，可以配置 cwd、model、tools、resource loader、session manager 和 runtime，订阅事件并调用 `prompt()`、`abort()`、session navigation APIs。它不要求启动完整交互 CLI。

```ts
const { session } = await createAgentSession({
  cwd: projectDir,
  tools: ["read", "grep", "find", "ls"],
});
session.subscribe((event) => {
  if (event.type === "message_update") renderDelta(event);
});
await session.prompt("只读总结 src/ 的结构");
await session.dispose();
```

此例显示只读 loadout，但只读工具不等于隔离的进程权限。SDK 服务端应用应自行设置 OS/container sandbox。

## 5. 关联源码

- CLI 解析和模式选择：[main.ts](../../pi/packages/coding-agent/src/main.ts)、`src/cli/`
- Print/JSON：[print-mode.ts](../../pi/packages/coding-agent/src/modes/print-mode.ts)、[json-event.ts](../../pi/packages/coding-agent/src/modes/json-event.ts)
- RPC：[rpc-mode.ts](../../pi/packages/coding-agent/src/modes/rpc/rpc-mode.ts)、`rpc-types.ts`、`rpc-client.ts`
- SDK：[sdk.ts](../../pi/packages/coding-agent/src/core/sdk.ts)
- 文档：[cli.md](../../pi/packages/coding-agent/docs/cli.md)、[json.md](../../pi/packages/coding-agent/docs/json.md)、[rpc.md](../../pi/packages/coding-agent/docs/rpc.md)、[sdk.md](../../pi/packages/coding-agent/docs/sdk.md)

练习：构造一个想象中的 RPC 客户端，发 `prompt` 后收到两条 `message_update` 再收到 `response`。说明为什么 response 不是唯一可观察结果，以及为什么每个 command 都应有独立 id。

