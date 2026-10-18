# 第 5 章：工具、上下文与系统提示词

## 学习目标

本章把“模型看见的请求”拆成可检查的部分：system message、历史消息、tool declarations 和本轮输入。你会看懂 Pi 的内建工具如何接入 Agent，以及用户文件、skill、模板和 shell 输出如何进入模型上下文。

## 1. 工具定义与工具执行是两回事

工具定义包含名称、说明、TypeBox 参数 schema 和执行函数。模型收到的只是定义；它输出一个 tool call 请求后，Pi 才校验参数并调用本地函数。

```ts
import { readFile } from "node:fs/promises";
import { Type } from "@earendil-works/pi-ai";
import { defineTool, type ExtensionAPI } from "@earendil-works/pi-coding-agent";

const readCounter = defineTool({
  name: "read_counter",
  label: "读取计数器",
  description: "读取一个整数计数值",
  parameters: Type.Object({ path: Type.String() }),
  async execute(_toolCallId, { path }) {
    return {
      content: [{ type: "text", text: await readFile(path, "utf8") }],
      details: undefined,
    };
  },
});

export default function (pi: ExtensionAPI) {
  pi.registerTool(readCounter);
}
```

模型可以提出 `read_counter({path:"count.txt"})`，但是否注册该工具、参数是否合法、如何读取文件，都由 host 控制。Pi 内建 coding tools 由 [tools/index.ts](../../pi/packages/coding-agent/src/core/tools/index.ts) 组合；实现分别位于 `core/tools/{read,bash,edit,write,grep,find,ls}.ts`。

## 2. 模型可见工具集就是 loadout

Pi 默认工具通常是 read、bash、edit、write；也可用只读工具组合，或由 extensions/MCP 增加工具。Settings/CLI 的 `defaultTools`、allowlist 和 denylist 会影响活动工具集。System prompt 会列出可见工具和各工具的使用规则。

```text
注册工具全集：{read, bash, edit, write, grep, find, ls, ...extension tools}
当前活动集：{read, grep, find, ls}
发给模型：活动集里可直接调用且未隐藏声明的工具
```

“不显示给模型”不一定等于“不能从别的工具调用”。Codemode 和 tool-search 使用动态 loadout 把可调用工具与直接暴露给模型的工具分开。

## 3. 上下文组装不是把所有文字拼成一个字符串

Pi 保留结构化 `SystemMessage` 和 message content blocks。默认提示分为可单独更新的 sections，例如工具说明、规则、项目 context、skills 和 cwd。扩展可以只 patch 一节，不必替换完整 system prompt。

```text
SystemMessage:
  preamble: “你是编码助手……”
  tools: “read: 读取文件；bash: 执行命令……”
  project_context: “项目约定……”
  skills: “可用技能：pdf-tools …”
  cwd: “/workspace/app”
```

分段结构让 Pi 能在模型切换或工具更改后更新必要部分，同时保留其他内容。源码重点：[system-prompt.ts](../../pi/packages/coding-agent/src/core/system-prompt.ts)、[messages.ts](../../pi/packages/coding-agent/src/core/messages.ts)。

## 4. 哪些资源进入哪一层

- **Context files**（例如 AGENTS.md）：加载后进入项目 context section。
- **Skills**：system prompt 通常只列名称、描述、路径；任务匹配后再读完整 `SKILL.md`，减少常驻 token。
- **Prompt templates**：输入 `/review focus` 时先展开成完整用户文本，再进入 Agent。
- **Theme**：只影响 UI 展示，不应该变成模型知识。
- **Shell 命令输出**：可以作为 bashExecution message 保存，转换到 LLM 形式时成为 user 内容；`!!` 命令可排除在模型 context 外。
- **图片/文件参数**：CLI 与 editor 预处理后转成 text/image content block，并受模型输入能力限制。

例：`/review auth` 先通过模板展开为“审查变更，重点看 auth”，然后它作为一条用户消息入 session；技能的简短 description 让模型判断是否读取相应的 `SKILL.md`。

## 5. 控制输出和副作用

读写工具对路径做解析，结果按行数/字节数截断；大输出会提示完整输出位置。写文件工具会做原子或受控写入，工具并发可能访问同一文件，因此 mutation queue 会把完整 read-modify-write 操作串起来。

例：两个模型 tool calls 同时修改 `config.json` 的不同字段，如果各自独立 read → write，后写者可能覆盖前者。将这一操作包进共享的 per-file mutation queue，能避免本地并发丢更新；它不解决两个独立 Pi 进程间的竞态。

## 6. 源码阅读和练习

- 工具注册：[tools/index.ts](../../pi/packages/coding-agent/src/core/tools/index.ts)
- 消息映射：[messages.ts](../../pi/packages/coding-agent/src/core/messages.ts)
- system prompt：[system-prompt.ts](../../pi/packages/coding-agent/src/core/system-prompt.ts)
- 资源发现：[resource-loader.ts](../../pi/packages/coding-agent/src/core/resource-loader.ts)
- 官方说明：[message-types.md](../../pi/packages/coding-agent/docs/message-types.md)、[skills.md](../../pi/packages/coding-agent/docs/skills.md)、[prompt-templates.md](../../pi/packages/coding-agent/docs/prompt-templates.md)

练习：按 `convertToLlm()` 的 switch，分别追踪 bashExecution、custom、compactionSummary 三种消息的转换；再确认 `display` 是否会决定它是否发给模型。

