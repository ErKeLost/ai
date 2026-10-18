# 第 11 章：MCP 与 Codemode——外部工具如何进入 Agent

## 学习目标

区分 MCP client、Pi extension tool wrapper 和 Codemode sandbox；理解 JSON-RPC、stdio/HTTP transport、工具结果转换，以及“批量工具编排”的意义。

## 1. MCP 的分层

`pi-mcp` 是 transport-neutral client，不依赖官方 MCP SDK，也不直接依赖 coding-agent。Transport 负责消息 framing/I/O；`McpClient` 负责初始化、request id、timeout、取消、server request 和 protocol helpers。

```text
pi coding-agent extension / app
          │ listTools() / callTool()
       McpClient
          │ JSON-RPC messages
  StdioTransport 或 StreamableHttpTransport
          │
      MCP server
```

例：stdio server 作为子进程；远程 server 使用 Streamable HTTP。两者上层都调用同一个 `client.listTools()` 和 `client.callTool()`。

```ts
const transport = new StdioTransport({ command: "npx", args: ["-y", "mcp-server"] });
const client = new McpClient({ name: "pi-reader", version: "1.0.0" });
await client.connect(transport);
const tools = await client.listTools();
const result = await client.callTool("search", { query: "session tree" });
await client.close();
```

## 2. MCP Tool 如何变成 AgentTool

MCP 的 inputSchema 需要适配为 Pi TypeBox-compatible schema，名称需符合模型 provider 的限制。wrapper 执行时调用 `callTool()`，再把 text/image/embedded resources 转成 pi-ai content blocks。MCP tool 的 `isError` 是结果字段，不应误当成 JSON-RPC protocol failure。

例：服务器返回 `structuredContent: {count: 3}` 和一段文本。Agent model-facing 内容可显示文本；程序化调用方可以保留 structuredContent，而 UI 根据 details 自行展示。

## 3. Codemode：模型写小程序，程序调用多个工具

如果给模型十几个细粒度工具，模型可能需要发很多轮工具请求。Codemode 提供一个 `codemode` 工具，模型输出 JS 脚本，在 sandbox 中通过 `tools.<name>(args)` 调用注入的工具；这些嵌套调用结果留在脚本一侧，只有脚本 `text()` 输出和返回值回到模型对话。

```js
const files = await tools.find({ pattern: "*.ts" });
const matches = await tools.grep({ pattern: "SessionManager", files });
text(JSON.stringify({ fileCount: files.length, matches }));
return matches.slice(0, 5);
```

这个例子将 find→grep→选择结果压成一个模型工具调用。宿主仍需验证工具参数、控制可用工具、限制输出和处理失败。

## 4. QuickJS sandbox 的能力模型

`pi-codemode` 用 QuickJS/WASM 限制脚本环境：没有 `process`、`require`、fetch、timer 或 module import；脚本通过宿主注入的 tools/functions 工作，参数和结果做 JSON round trip。Node/Bun 默认在 worker thread 执行；Cloudflare 有 RemoteCodemodeSandbox 等部署形态。sandbox 约束脚本自身能力，但被注入的工具本身仍可做其授权功能。

例：若注入 `writeFile` tool，sandbox 并不会令它变只读；脚本只能写什么取决于 host 对该函数如何做路径和权限控制。

## 5. 工具加载和权限语义

工具可以 direct、model-only、codemode、deferred 或 hidden 暴露。`tool_search` 可先搜到按需工具，再加入 model loadout。MCP server 的工具可以被 extension 动态注册；大量工具更适合延迟发现，而不是每次都塞入模型请求。

## 6. 源码导航

- [pi-mcp README](../../pi/packages/mcp/README.md)、[client.ts](../../pi/packages/mcp/src/client.ts)、`src/transports/`、`src/protocol/`
- [pi-codemode README](../../pi/packages/codemode/README.md)、[source.ts](../../pi/packages/codemode/src/source.ts)、`src/runtime/`
- coding-agent 集成：`packages/coding-agent/src/extensions/mcp/`、`extensions/codemode/`、`extensions/tool-search/`
- agent-level MCP/codemode 示范：`packages/agent/examples/mcp-codemode/`

练习：追踪 MCP `tools/call` 的一次失败，分别判断错误来自 JSON-RPC transport、MCP `isError` result、Pi schema validation 还是 host tool execute。它们在不同层，恢复策略也不同。

