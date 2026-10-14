# 互操作与协议格局 · raw notes

> 采集日期：**2026-10-14**。范围：MCP Apps（原 MCP-UI）、AG-UI、OpenAI Apps SDK、GitHub Copilot 生成式 UI。
> 数据源：`gh api`（GitHub 实时，stars 为 2026-10-14 快照）、官方网页（curl）、本地只读笔记 `/Users/work/ai/notes/generative-ui/openai/`。
> 只读约束：未修改 `slides-generative-ui/` 或任何 submodule。

---

## 0. 一句话格局判断（分层）

| 层 | 协议 / 项目 | 官方自述定位 |
|---|---|---|
| **传输 / 事件流** | **AG-UI** | "event-based protocol that standardizes how AI agents connect to user-facing applications"；~16 个标准事件，任意 transport（SSE/WS/webhook）。**不是 UI 组件格式** |
| **传输 / 能力与 UI 资源挂载** | **MCP**（工具/资源）+ **MCP Apps**（官方 UI 扩展，`ui://` 资源 + postMessage JSON-RPC 桥） | MCP Apps 是"official MCP extension"，跑在 **sandbox iframe 运行时**里 |
| **声明式 UI 格式** | **A2UI**（Google 主导，JSON 组件操作） | 客户端用**自己的原生组件库**渲染；"safe like data, expressive like code" |
| **UI 语言** | **OpenUI Lang**（thesysdev） | "compact, streaming-first language for model-generated UI"；可产出 A2UI v1.0 payload，也可走 AG-UI 传输 |
| **运行时** | MCP Apps sandbox iframe、CopilotKit、GitHub Copilot **canvases** | 承载上面格式/语言的执行环境 |

**收敛方向**：**MCP-UI + OpenAI Apps SDK → 一起并入 MCP Apps（MCP 官方扩展）**。ChatGPT / VS Code GitHub Copilot 都已实现 MCP Apps；OpenAI 的 `window.openai.*` 被降级为"标准没有覆盖到的 ChatGPT 专有扩展/兼容别名"。AG-UI 与 A2UI/OpenUI/MCP Apps **互补而非竞争**（transport vs format vs runtime）。

---

## 1. MCP Apps（原 MCP-UI）

### 1.1 合并 / 改名时间线（关键）
- **2025-11-21** MCP 官方博客发布 *“MCP Apps: Extending servers with interactive user interfaces”*，提出 **SEP-1865**（MCP Apps Extension proposal）。作者含 MCP Core Maintainers（OpenAI、Anthropic）+ **MCP-UI creators**（Ido Salomon、Liad Yosef）。
  - 标题句：*"Introducing the MCP Apps Extension proposal (SEP-1865) to standardize interactive user interfaces in MCP, developed with the MCP-UI creators and maintainers from OpenAI and Anthropic."*
  - 原文：*"MCP-UI ... spearheaded the vision of agentic apps with interactive interfaces ... The OpenAI Apps SDK further validated the demand ... Anthropic, OpenAI, and MCP-UI are collaborating to create an official MCP extension."*
  - URL：https://blog.modelcontextprotocol.io/posts/2025-11-21-mcp-apps/
- **2025-11-21** 同日，官方仓库 `modelcontextprotocol/ext-apps` 建立（created_at 2025-11-21T11:39Z），描述 "Official repo for spec & SDK of MCP Apps protocol"。
- **2025-12-08** 首个 release `v0.0.2`。
- **2026-01-26** 官方在 **VS Code 博客**宣布 MCP Apps 为 **“the first official MCP extension”**，VS Code Insiders 为首个完整支持的 AI 代码编辑器，一周后进 Stable。
  - URL：https://code.visualstudio.com/blogs/2026/01/26/mcp-apps-support
- **规范版本目录**：`specification/2026-01-26/apps.mdx`（即 spec 版本 **2026-01-26**）；另有 `draft/`。
- **2026-02-22** OpenAI changelog：*"MCP Apps compatibility — ChatGPT is now fully compatible with the MCP Apps spec"*。
- **MCP-UI 现状**：仓库已迁到 `MCP-UI-Org/mcp-ui`（created 2025-05-13）。站点横幅：**“🎉 MCP-UI is now standardized into MCP Apps!”**；README：*"mcp-ui pioneered the concept ... directly influenced the MCP Apps specification"*，`@mcp-ui/*` 现在是 MCP Apps 的**实现**，`@mcp-ui/client` 被官方 MCP 文档推荐为 Host 渲染 SDK。

> 结论：**不是"MCP-UI 改名"，而是 MCP-UI 的模式被 MCP 官方吸收为扩展标准（MCP Apps），MCP-UI 随后转为该标准的 SDK/社区实现。**

### 1.2 官方规范与机制要点
来源：`modelcontextprotocol.io/docs/extensions/apps`、`apps.extensions.modelcontextprotocol.io`、ext-apps README/RELEASES。
- MCP Apps 是**可选扩展**（opt-in），扩展标识符 **`io.modelcontextprotocol/ui`**（见官方 client matrix）。核心 MCP spec 不受影响，server 只需给 UI 工具保留 text-only fallback。
- 工具声明 UI：`_meta.ui.resourceUri` → 指向 `ui://` 资源。
  - 注意历史演进：SEP-1865 提案期是**扁平** `_meta["ui/resourceUri"]`；ext-apps `0.2.2`（2026 初）**改为嵌套** `_meta.ui.resourceUri`。新代码用嵌套形式。
- UI 资源：`ui://` URI scheme，MIME `text/html+mcp`；初版只支持 `text/html`（sandbox iframe 渲染），外部 URL / remote DOM / native widget 明确延后。
- 通信：**不发明新协议**，直接复用 MCP 的 JSON-RPC base protocol，**transport 换成 `postMessage`**。方法前缀 `ui/*`：
  - `ui/initialize`、`ui/notifications/tool-input`、`ui/notifications/tool-result`、`ui/notifications/host-context-changed`、`ui/message`、`ui/update-model-context`；`tools/call` 复用核心方法。
- 安全：sandbox iframe（默认不给 same-origin）；模板可预读（prefetch/review）；`_meta.ui.csp` 控制外链来源；`_meta.ui.permissions` 申请麦克风/摄像头等；`_meta.ui.visibility` 控制工具对 model / app / both 可见。
- 宿主主题：host 提供标准化 CSS 变量 `hostContext.styles.variables`（含明暗主题）。
- 支持方（官方 client matrix，✓ MCP Apps）：Claude web / Claude Desktop、**ChatGPT**、**VS Code GitHub Copilot**、Microsoft 365 Copilot、Goose、Postman、MCPJam、Cursor 等。官方文档另列 Archestra.AI。

### 1.3 GitHub 数据（gh api，2026-10-14）
| repo | stars | forks | open issues | created | latest release |
|---|---|---|---|---|---|
| `modelcontextprotocol/ext-apps` | **2,950** | 401 | 224 | 2025-11-21 | **v2.0.3（2026-09-25）**；v2.0.0 为 2026-09-08 |
| `MCP-UI-Org/mcp-ui`（原 MCP-UI） | **5,210** | 403 | 64 | 2025-05-13 | `client/v7.1.1`（2026-05-09）；Apache-2.0 |
- npm：`@modelcontextprotocol/ext-apps@2.0.3`（2026-09-25）；`@mcp-ui/client@7.1.1`（2026-05-09）。
- **是否进入 MCP 官方规范/main repo？** 是官方**扩展**（extension），规范站 `extensions/apps`，但**位于独立仓库 `modelcontextprotocol/ext-apps`**，不是塞进 `modelcontextprotocol/modelcontextprotocol` 的 core spec 正文。core repo 仅维护扩展矩阵/指引（其 stars 9,448）。

### 1.4 引用可用句
- "MCP Apps is an extension to the core MCP specification." — modelcontextprotocol.io/docs/extensions/apps
- "ChatGPT implements the open MCP Apps standard ... This standards-first foundation lets the same UI run in ChatGPT and other compatible MCP Apps hosts." — developers.openai.com/plugins/build/chatgpt-ui.md

---

## 2. AG-UI

### 2.1 事实（gh api + 官方 README，2026-10-14）
- repo：`ag-ui-protocol/ag-ui`，created **2025-05-07**，homepage `ag-ui.com`，license MIT。
- stars **16,507**；forks 1,505；open issues **466**；最新 commit **2026-10-13**（`72e8ad18`，renovate deps）。
- releases：**按日期发 tag**（`release/2026-10-13`、`release/2026-10-12`…最新发布 2026-10-13T10:08Z）——高频滚动发布。
- npm：`@ag-ui/core` latest **1.0.2**（2026-10-05）。spec 目录含 `1.0/`（`schema.json`、`conformance`）与 `draft/`。

### 2.2 定位（官方原文）
- *"AG-UI is an open, lightweight, event-based protocol that standardizes how AI agents connect to user-facing applications."*
- 机制：后端 agent 每次 run **emit ~16 种标准事件**（run started、text delta、tool call、state delta、activity…），前端推入少量输入；**middleware 层**兼容任意 transport（SSE / WebSockets / webhooks）且允许宽松事件匹配。
- 官方"协议栈"原话：
  - *"MCP gives agents tools"*
  - *"A2A allows agents to communicate with other agents"*
  - *"AG-UI brings agents into user-facing applications"*
  - → **明确是 transport / 事件层，不是 UI 组件格式**。

### 2.3 与 A2UI / CopilotKit 的关系
- **CopilotKit 是 AG-UI 的发起方**：CopilotKit repo 自述 *"Makers of the AG-UI Protocol"*（38,003 stars，2026-10-14）。
- AG-UI README 的 Generative UI 支持表里 **同时列出 MCP Apps（✓ Supported）** 与 A2UI。
- AG-UI 仓库自带 **`a2ui-toolkit`（TS + Python）** 和 **`a2ui-middleware`**：提供 `createSurface` / `updateComponents` / `updateDataModel` op builders，把 A2UI 操作封装成 agent 工具，经 AG-UI 事件流传给前端渲染。
- 即：**AG-UI 是管道，A2UI 是管道里跑的声明式 UI 数据格式**；CopilotKit 是同时实现两者、并额外支持 MCP Apps 的前端栈。
- CopilotKit 文档 `generative-ui/` 目录并列：Display / Interactive / Tool Rendering / State Rendering / **MCP Apps** / **A2UI** / Your Components。

---

## 3. OpenAI Apps SDK（→ 已并入 MCP Apps / 更名 Plugins）

### 3.1 现状与关键时间点
- **Apps SDK 于 2025 年 DevDay（约 2025-10-06）推出**：官方示例仓库 `openai/openai-apps-sdk-examples` created **2025-10-06**（2,369 stars；最后一次 push 2026-04-15）。
- **`developers.openai.com/apps-sdk` 现在 301/重定向到 `developers.openai.com/plugins`**（实测 200 @ `/plugins`）。产品叙述改为 **Plugins**：*"Build and publish plugins with skills, MCP servers, and optional UI."*
- OpenAI 官方 changelog（`developers.openai.com/plugins/changelog.md`）关键条目：
  - **2026-02-22** *"MCP Apps compatibility — ChatGPT is now fully compatible with the MCP Apps spec."*
  - **2026-03-25** *"Approved Apps SDK integrations could be distributed as Codex plugins."*（Apps SDK → Plugins 过渡）
  - **2026-05-27** 工具生命周期改用 MCP Apps `ui/notifications/tool-input`。
  - **2026-05-28** ChatGPT 提供标准化 MCP Apps host CSS 变量（`hostContext.styles.variables`）。
  - **2026-07-21** 弃用 `_meta["openai/visibility"]`，改用 **`_meta.ui.visibility`**。
  - **2026-08-21** 稳定 OAuth callback / CIMD client ID。

### 3.2 官方互操作原文（最重要）
- *"For new UI: 1) Declare the UI resource with `_meta.ui.resourceUri`. 2) Use the `ui/*` JSON-RPC bridge over `postMessage` ... 3) Keep tools useful without UI ... This standards-first foundation lets the same UI run in ChatGPT and other compatible MCP Apps hosts."*（developers.openai.com/plugins/build/chatgpt-ui.md）
- **`window.openai` 降级为"标准未覆盖的扩展"**，并给出别名对照表（新代码优先左列标准）：

| 目标 | MCP Apps 标准 | ChatGPT 兼容别名 |
|---|---|---|
| 工具→UI 资源 | `_meta.ui.resourceUri` | `_meta["openai/outputTemplate"]` |
| 接收 tool input | `ui/initialize` + `ui/notifications/tool-input` | `window.openai.toolInput` |
| 接收 tool result | `ui/notifications/tool-result` | `window.openai.toolOutput` |
| UI 内调工具 | `tools/call` | `window.openai.callTool` |
| 发后续消息 | `ui/message` | `window.openai.sendFollowUpMessage` |

> 一句话：**OpenAI 主动放弃私有 UI 协议，把 Apps SDK 的 UI 层对齐到 MCP Apps；OpenAI 是被"收敛"的一方（与 Anthropic、MCP-UI 共同定义标准）。**

---

## 4. GitHub Copilot 的生成式 UI

**结论：有明确官方证据。GitHub 的方向不是"模型直出 HTML"，而是 Copilot app 里的 **canvas / canvas extensions**（agent 按 prompt 生成一个跑在 app 内的交互式小应用）。**

### 4.1 官方证据链（标题 + 日期 + URL + 关键句）
| 日期 | 标题 | URL | 关键句 |
|---|---|---|---|
| 2026-01-26 | *Giving Agents a Visual Voice: MCP Apps Support in VS Code* | https://code.visualstudio.com/blogs/2026/01/26/mcp-apps-support | "VS Code is the **first major AI code editor with full MCP Apps support**."；MCP Apps 为 "the first official MCP extension" |
| 2026-06-02 | *GitHub Copilot app: The agent-native desktop experience* | https://github.blog/news-insights/product-news/github-copilot-app-the-agent-native-desktop-experience/ | Copilot app 技术预览；"control center for agent-native development" |
| 2026-07-21 | *How to build interactive experiences with canvases* | https://github.blog/ai-and-ml/github-copilot/how-to-build-interactive-experiences-with-canvases/ | "these shared, interactive surfaces are extensions of the Copilot app called **canvases**... The agent can update the canvas as it works, and you can interact with that same workspace" |
| 2026-08-17 | *How canvases make agentic workflows visible, steerable, and cost-efficient* | https://github.blog/ai-and-ml/github-copilot/how-canvases-make-agentic-workflows-visible-steerable-and-cost-efficient/ | "**Chat is great for intent, but weak for durable execution**"；canvases 是 "a durable, shared surface" |
| 2026-09-24 | *When chat is the wrong UI* | https://github.blog/ai-and-ml/github-copilot/when-chat-is-the-wrong-ui/ | "chat is the wrong UI ... in the GitHub Copilot app, this is called a canvas. A canvas is a **little full-stack application that runs inside of the GitHub Copilot app with no browser chrome**." |
| 2026-09-25 | *GitHub Copilot app for Beginners: How to build custom workflows with canvases* | https://github.blog/ai-and-ml/github-copilot/github-copilot-app-for-beginners-how-to-build-custom-workflows-with-canvases/ | 用 `/create-canvas` skill 自然语言生成画布 |

官方文档（docs.github.com）：
- `/en/copilot/how-tos/github-copilot-app/working-with-canvas-extensions`
  - *"A canvas extension is a shared, interactive surface for a work artifact, such as a plan, triage board, browser session, release checklist, dashboard, incident, or spreadsheet."*
  - *"A canvas extension can be included in **a plugin alongside other capabilities, such as skills or MCP servers**."*
  - *"When you create a canvas, **the agent generates capabilities based on your prompt and workflow** ... ask it to add, remove, or revise those capabilities."*
  - 创建入口：会话内 `/create-canvas` skill；画布在 app 右侧面板打开；**双向**（agent 与人都能改）。
  - 例子：agentic kanban、issue triage board、markdown canvas、document/spreadsheet/deck canvas。

### 4.2 与协议的关系 / 边界
- **两个独立事实要分开**：
  1. **VS Code 里的 GitHub Copilot 是 MCP Apps host**（官方 client matrix ✓）——即 Copilot 能渲染第三方 MCP server 下发的 `ui://` UI。
  2. **Copilot app 的 "canvases" 是 GitHub 自己的运行时概念**，随 Copilot app / plugin 分发，**未见 GitHub 发布公开的、跨厂商的 canvas UI schema/spec**（不像 A2UI / OpenUI Lang 那种开放格式）。
- `Copilot Extensions`（GitHub Apps 扩展）是更早的、面向 API 的扩展机制，**不是**本文意义的生成式 UI 格式。
- **未找到**：GitHub 让 agent 直接"生成 UI 代码并渲染"的通用开放协议；也没有 GitHub 官方声明把 canvases 与 MCP Apps / A2UI 打通。

---

## 5. 谁在收敛谁（可直接引用）

1. **MCP Apps 是 OpenAI + Anthropic + MCP-UI 三方共同定义、由 MCP 官方背书的交互式 UI 扩展**（SEP-1865，2025-11-21；first official MCP extension，2026-01-26）。
2. **MCP-UI 被"吸收"**：模式进入官方标准，项目本身转为实现 + 社区实验场（“MCP-UI is now standardized into MCP Apps”）。
3. **OpenAI Apps SDK 向标准靠拢**：ChatGPT 2026-02-22 完全兼容 MCP Apps 规范；私有 `window.openai.*` 变可选兼容层；产品线从 "Apps SDK" 改叙述为 "Plugins"。
4. **GitHub Copilot / VS Code 同时是 MCP Apps host**（2026-01-26），又在 Copilot app 里自研 canvases（2026 年中）。
5. **AG-UI 在另一层**（transport/events），官方自述与 MCP（tools）、A2A（agent-agent）互补；**A2UI 是 declarative 格式，MCP Apps 是 iframe 运行时**，二者可并存；**OpenUI Lang 是语言**，可产出 A2UI v1.0 payload、并经 AG-UI 传输（`@openuidev/a2ui`、`@openuidev/langchain`）。
6. 因此"收敛"发生在**同一层内**：**开放 UI 运行时/标准层 → MCP Apps**；**事件传输层 → AG-UI（CopilotKit 生态）**；**声明式格式 → A2UI / OpenUI Lang**。它们并非一条赛道，而是栈的上下层。

---

## 6. 不确定 / 待核（明确标注）

- **SEP-1865 是否已正式"accepted"并进入 MCP core spec 正文**：目前看到的是官方 **extension**（独立仓 + extensions 文档 + client matrix），未确认它已 merge 进 `modelcontextprotocol/modelcontextprotocol` 的 core spec 版本（如 `specification/YYYY-MM-DD`）。**待核。**
- **MCP Apps 首个 spec 版本是否就是 2026-01-26 正式版**：仓库有 `specification/2026-01-26/` 与 `draft/`；README 链接指向该日期文件。是否后续有更新日期目录未逐一核对。**待核。**
- ~~"MCP-UI 改名/合并"的表述~~：来源一致为"标准化/吸收"，**不建议**说成"MCP-UI 改名为 MCP Apps"。
- **OpenAI Apps SDK 首次发布官方 blog 标题/日期**未直接抓到（以示例仓库 created 2025-10-06 与 DevDay 2025 推断为 2025-10-06）。**待核。**
- **GitHub canvases 是否有公开 UI schema/规范**：docs 只描述行为与应用场景，未给出跨厂商格式。**倾向"无公开格式"，但未穷尽。**
- **AG-UI / Canvases / MCP Apps 三者是否已有官方互操作演示**：AG-UI README 表格标注 MCP Apps ✓ Supported，但在本地 shallow clone 中未逐条核实集成代码路径。**待核。**
- stars / issues / release 均为 **2026-10-14 gh api 快照**，会继续变化；引用时建议带日期。
