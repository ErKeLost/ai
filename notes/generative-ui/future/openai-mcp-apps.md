# OpenAI / MCP Apps 侧：已确定的事实 + 未来发展方向

> 收集时间：2026-10（本机 `date` 与仓库材料一致）
> 用途：供幻灯片「04 · 未来发展方向」章节引用。每条都带出处（URL 或本地路径）。
> 采集方式：本地已抓取材料 + `openai-apps-sdk-examples` submodule + 一手线上源（GitHub raw / npm registry / developers.openai.com `llms.txt` 系列 / modelcontextprotocol.io `.md`）。
> ⚠️ 注意：`api.github.com` 未认证配额（60/h）在采集时已耗尽，因此 GitHub 侧的 release body、tree 列表改用 `raw.githubusercontent.com` 取；引用时以 raw 链接为准。

---

## 一、已确定 / 已发布

### 1. MCP Apps 是正式标准，编号 SEP-1865，已 Stable

| 项 | 值 | 出处 |
|---|---|---|
| Proposal 编号 | **SEP-1865** | https://raw.githubusercontent.com/modelcontextprotocol/ext-apps/main/specification/2026-01-26/apps.mdx |
| Track | Extensions | 同上 |
| 扩展标识符 | **`io.modelcontextprotocol/ui`** | 同上 / `notes/generative-ui/openai/en/mcp-apps-spec.md` |
| 状态 | **Stable (2026-01-26)** | 同上 |
| 创建日期 | **2025-11-21** | 同上 |
| 存储位置 | `modelcontextprotocol/ext-apps`（官仓，`ext-` 前缀） | https://modelcontextprotocol.io/extensions/overview.md |
| 规范 URL | `apps.extensions.modelcontextprotocol.io` | 同上 |

规范原文（可引用）：
> "MCP Apps extends the Model Context Protocol to enable servers to deliver interactive user interfaces to hosts... This extension addresses the growing community need for rich, interactive experiences in MCP-enabled applications, maintaining security, auditability, and alignment with MCP's core architecture."

作者名单里同时有 **OpenAI**（Ido Salomon、Liad Yosef）、**Anthropic**（Olivier Chafik、Jerome Swannack）、**Microsoft** 等 —— 这是"跨厂商共同署名"的直接证据。

### 2. 核心 MCP 协议已经把「扩展」做成一等公民

- 核心规范当前版本 **2026-07-28**，`ClientCapabilities` / `ServerCapabilities` 新增 `extensions` 字段（SEP）；另有 `server/discover` 方法用于声明支持哪些扩展。
  - https://modelcontextprotocol.io/specification/2026-07-28/changelog.md（第 34/37 行附近）
  - https://modelcontextprotocol.io/specification/2026-07-28/index.md
- 官方扩展统一放在 `modelcontextprotocol` 组织下 `ext-` 前缀的仓库。现有官方扩展（4 个）：
  | 扩展 | 标识符 | 来源仓库 |
  |---|---|---|
  | MCP Apps | `io.modelcontextprotocol/ui` | `ext-apps` |
  | OAuth Client Credentials | `io.modelcontextprotocol/oauth-client-credentials` | `ext-auth` |
  | Enterprise-Managed Authorization | `io.modelcontextprotocol/enterprise-managed-authorization` | `ext-auth` |
  | Skills over MCP | `io.modelcontextprotocol/skills` | `ext-skills`（SEP-2640，**Final**） |
  - https://modelcontextprotocol.io/extensions/client-matrix.md
  - https://modelcontextprotocol.io/extensions/skills/overview.md
- 另外：原先在核心里的 `tasks` 被移出核心、变成官方扩展 `io.modelcontextprotocol/tasks`（SEP-2663）—— 说明"MCP 核心保持瘦身，能力往外挂扩展"是官方明确路线。
  - https://modelcontextprotocol.io/specification/2026-07-28/changelog.md

### 3. MCP Apps 已是**跨厂商事实标准**：11 个宿主客户端已支持

`modelcontextprotocol.io/extensions/client-matrix` 的 MCP Apps 一列（✅）：

1. Claude (web) 2. Claude Desktop 3. **VS Code GitHub Copilot** 4. **Microsoft 365 Copilot** 5. Goose (Block) 6. Postman 7. MCPJam 8. **ChatGPT** 9. **Cursor** 10. Archestra.AI 11. PostHog Code

出处：https://modelcontextprotocol.io/extensions/client-matrix.md
（本地副本亦见 `notes/generative-ui/openai/en/mcp-apps-spec.md` 的 "Client support" 段，但本地版缺少 Cursor / PostHog Code，说明**这份 matrix 仍在增长**。）

含义：Anthropic 与 Microsoft 都在支持 MCP Apps（VS Code Copilot + M365 Copilot 双线），
所以"MCP Apps 是跨厂商标准"已被客户端矩阵证明，而不仅是 OpenAI 的私有路线。

### 4. SDK 与规范节奏（可作为"标准在收敛"的证据）

`@modelcontextprotocol/ext-apps`（npm）—— 36 个版本，10 个月：

| 版本 | 日期 | 事件 |
|---|---|---|
| 0.0.1 | 2025-12-08 | 首版 |
| 1.0.0 | **2026-01-26** | 与规范 Stable 同日发布 |
| 1.7.5 | 2026-07-23 | 1.x 末版 |
| 2.0.0 | **2026-09-08** | 迁移到 MCP TS SDK 2.0 拆包 |
| 2.0.3 | 2026-09-25 | 当前最新（security patch） |

- https://registry.npmjs.org/@modelcontextprotocol/ext-apps
- **关键兼容性事实（v2.0.0 release 原文）**：
  > "The MCP Apps wire protocol is unchanged: 2.x Views run in 1.x hosts and 2.x hosts render 1.x Views (covered by a test that runs the published 1.7.5 against this release in both directions). What breaks is dependencies and the TypeScript API."
  - 2.0 的破坏性变更全在依赖与 TS API：`@modelcontextprotocol/sdk@^1` → `@modelcontextprotocol/client@^2.0.0` + `@modelcontextprotocol/server@^2.0.0`，zod 必须 4.2+，Node 20+。
  - 出处：https://github.com/modelcontextprotocol/ext-apps/releases/tag/v2.0.0
- 仓库热度（2026-09-25 快照）：**2,950 stars / 401 forks / 224 open issues**，创建于 2025-11-21。
  - https://api.github.com/repos/modelcontextprotocol/ext-apps（采集时数据）
- 其他相关包：`@openai/apps-sdk-ui` **0.2.2**（2026-05-05，ChatGPT 官方设计系统）
  - https://registry.npmjs.org/@openai/apps-sdk-ui
- 仓库自述：MCP Apps 的目标是 "render **inline in Claude, ChatGPT and any other compliant chat client**"
  - https://raw.githubusercontent.com/modelcontextprotocol/ext-apps/main/README.md

### 5. OpenAI 侧：Apps SDK → 「Plugins」；且**先讲标准、再叠私有扩展**

- OpenAI 官方开发文档的 Apps SDK 入口现在重定向到 **Plugins** 文档集：
  `https://developers.openai.com/apps-sdk/llms.txt` → `# Plugins / Build and publish plugins with skills, MCP servers, and optional UI.`
- 官方明确定调"以标准为先"（原文，非常适合作幻灯片引用）：
  > "ChatGPT implements the open [MCP Apps standard] for UI returned by an MCP server. ... This **standards-first foundation** lets the same UI run in ChatGPT and other compatible MCP hosts."
  > "After the MCP Apps flow works, use `window.openai` **only for capabilities that the shared specification does not cover**."
  - 本地：`notes/generative-ui/openai/en/add-ui-to-your-mcp-server.md`（## Start with MCP Apps / ## Layer on ChatGPT extensions）
  - 在线：https://developers.openai.com/plugins/build/chatgpt-ui.md
- 时间锚点：**OpenAI Apps SDK 2025 年 11 月发布**（规范 Motivation 原文承认它"validated the demand"，且 MCP Apps 设计吸收了 Apps SDK + MCP-UI 两者）：
  > "OpenAI's Apps SDK, launched in November 2025, further validated the demand for rich UI experiences... The architecture of both the Apps SDK and MCP-UI have both significantly informed the design of this specification."
  - https://raw.githubusercontent.com/modelcontextprotocol/ext-apps/main/specification/2026-01-26/apps.mdx
- 社区基座：MCP-UI（mcpui.dev）作为"社区试验场"，其采用者含 Postman、HuggingFace、Shopify、Goose、ElevenLabs（同上出处）。

### 6. 同一份 Plugin 现在同时跑在 ChatGPT 和 Codex

- 官方 Plugins 文档大量出现 "**ChatGPT and Codex**" 并列，且明确 "Published plugins can run in ChatGPT and Codex."
  - https://developers.openai.com/plugins/llms-full.txt（第 779、795、1433、1724 行等）
- quickstart 原文："Build an MCP server for **ChatGPT and Codex**, with optional UI in ChatGPT."
  - https://developers.openai.com/plugins/build/app-quickstart.md
- 「ChatGPT Work」（web / desktop Cloud 模式 / dots）是新的承载场景：
  - "MCP Events is available in Work chats on ChatGPT web, in Work chats in the desktop app with **Cloud** selected, and with dots. Workspace controls for plugins and event-triggered tasks apply."
  - https://developers.openai.com/plugins/llms-full.txt（第 2522 行）

### 7. OpenAI 私有扩展层已规格化、可查版本

- 仓库 `openai/mcp-extensions`：**Apache-2.0**，创建 **2026-09-29**，最近推送 **2026-10-10**，1,043 stars / 13 open issues。
  - https://api.github.com/repos/openai/mcp-extensions
- npm `@openai/mcp-extensions`：**0.1.0 (2026-09-29) → 0.2.0 (2026-10-13)**，描述 "OpenAI extensions for MCP servers and apps."
  - https://registry.npmjs.org/@openai/mcp-extensions
- 规格开头自述（重要：它明确自己是"叠在 MCP + MCP Apps 之上"的 ChatGPT 专属层）：
  > "This specification defines extensions to [MCP](.../2025-11-25/index) and [MCP Apps](.../draft/apps.mdx) for use across ChatGPT, including ChatGPT Work, ChatGPT Desktop, and ChatGPT mobile apps. ... These extensions allow deeper integration into ChatGPT..."
  - https://raw.githubusercontent.com/openai/mcp-extensions/main/docs/spec.md
- OpenAI 的 11 个扩展（本地表，逐条可引用）：
  Sidebar apps / Conversation panels / Plugin settings / File viewers & editors / Display modes / Deep links / Extended model context / Extended message sending / Composer mentions / Extended forms / Plugin onboarding
  - 本地：`notes/generative-ui/openai/en/extensions.md`（Extension reference 表）
  - 在线：https://developers.openai.com/plugins/build/extensions.md
- 平台支持矩阵（原文标注 "expected support at **DevDay launch**"）—— 可作为"哪些能力还没铺开"的依据：
  File entrypoint / File opening / File resources / Composer at-mentions → **Desktop only**；
  Extended forms → Desktop + Web*(资源选择) ；
  MCP App deep links → iOS ✅ / **Android ✗**。
  - https://raw.githubusercontent.com/openai/mcp-extensions/main/docs/spec.md（## Platform Support）

### 8. 官方示例仓现状（submodule `openai-apps-sdk-examples`）

- 本地路径：`/Users/work/ai/openai-apps-sdk-examples`，HEAD `18cc38e`（**2026-04-15**）。
- 9 个 MCP server 示例：`pizzaz_server_node` / `pizzaz_server_python` / `kitchen_sink_server_node` / `kitchen_sink_server_python` / `solar-system_server_python` / `shopping_cart_python` / `authenticated_server_python` / `cards_against_ai_server_node` / **`mcp_app_basics_node`（新增）**。
- `src/` 下 24 个目录（23 个 widget 示例 + `utils/` 公共工具），覆盖能力面：`call-server-tool`、`get-host-capabilities`、`get-host-context`、`get-host-version`、`host-theming`、`open-link`、`request-display-mode`、`send-message`、`show-tool-result`、**`streaming-tool-input`**、`update-model-context`、`todo`、`shopping-cart`、`mixed-auth-*`、`solar-system`、`pizzaz-*`、`cards-against-ai`…（`ls openai-apps-sdk-examples/src`）
- 依赖版本：根 `package.json` 与各 server 用 **`@modelcontextprotocol/ext-apps: ^1.0.1`**、**`@openai/apps-sdk-ui: ^0.2.1`**、`@modelcontextprotocol/sdk: ^1.26.0`。
  - ⚠️ 和上游不一致：npm 上 ext-apps 已到 **2.0.3**。示例仓仍钉在 1.0.x 线（1.0.1 发布于 2026-01-26）。
- **仓库内没有 TODO / ROADMAP / CHANGELOG 文件**（唯一命中 `*TODO*` 的是 `src/todo/` 这个待办清单 widget 示例，非路线图）。
- 有价值的工程事实：
  - `shopping_cart_python` 演示用 `_meta["widgetSessionId"]` 跨轮保持 `widgetState`（跨会话状态仍在"各自约定"阶段）。
  - README 要求为 Chrome **142** 关闭 `local-network-access` flag 才能看本地 widget 预览。
    > "If you are on Chrome and have recently updated to version 142, you will need to disable the local-network-access flag"
  - README 说明 Python MCP SDK 启用 DNS rebinding 保护，ngrok 隧道需显式设置 `MCP_ALLOWED_HOSTS` / `MCP_ALLOWED_ORIGINS` —— 安全默认值在收紧。
  - 出处：`openai-apps-sdk-examples/README.md`

### 9. 官方承认的工程现实

- **双层 iframe + CSP**（原文"最值得上幻灯片"的一句）：
  > "For security reasons, OpenAI renders Apps inside a **double-nested iframe**. ... CSPs are the new CORS"
  - 本地：`notes/generative-ui/openai/en/15-lessons-building-chatgpt-apps.md` §9
  - 在线：https://developers.openai.com/blog/15-lessons-building-chatgpt-apps.md
- 展示形态是**四选一**，不是只有 inline：**Inline card / Inline carousel / fullscreen / Picture-in-picture (PiP)**
  - 本地：`notes/generative-ui/openai/en/add-ui-to-your-mcp-server.md`（## Choose a presentation）
  - 本地：`notes/generative-ui/openai/en/ui-guidelines.md`（## Display modes）
- 官方 15 条经验里可直接引用的三条（标题即结论）：
  - §2 "Lazy-loading doesn't translate well to AI apps"
  - §5 "UI must adapt to multiple display modes, and their constraints"
  - §12 "Not every test belongs in ChatGPT"
  - §15 → 这 15 条已被做成一个 **Codex Skill** 来加速开发（"how we incorporated them into a Codex Skill to help you build ChatGPT Apps 10x faster"）
  - https://developers.openai.com/blog/15-lessons-building-chatgpt-apps.md

---

## 二、实验性 / 未定（这些才是"未来发展方向"的真正素材）

### A. 规范 draft 正在从"UI 展示"长向"App 自己的工具"（最大的一条新增能力）

- `specification/draft/apps.mdx` 比 Stable 版**多了整整一章 `### App-Provided Tools`**（draft 第 1739–2179 行，约 440 行；Stable 版完全没有）。
  - Stable：https://raw.githubusercontent.com/modelcontextprotocol/ext-apps/main/specification/2026-01-26/apps.mdx （1,775 行 / 59 KB）
  - Draft：https://raw.githubusercontent.com/modelcontextprotocol/ext-apps/main/specification/draft/apps.mdx （2,660+ 行 / **90 KB**，比 Stable 大 ~53%）
- 这一段揭示的方向：**App 不再只是"被渲染的界面"，而是能向模型注册自己的工具**（`app.registerTool(...)` + `tools: { listChanged: true }`），让模型可以 `tools/list` 发现、`get_board_state` 查询、`make_move` 操作。
- 原文（动机段，可直接引用）：
  > "Without tool registration, apps are opaque to the model: the host renders the app in a sandboxed iframe and has no guaranteed access to its internals... With tool registration, apps expose a semantic interface: the model discovers available operations via `tools/list`, queries app state via tools (e.g., `get_board_state`), executes actions via tools (e.g., `make_move`)."
  > "This is *pull*-based and complements the *push*-based `ui/update-model-context` request... Push lets an app proactively keep the model's context current; pull lets the agent query and command the app on demand."
- 一句话总结给幻灯片：**从「模型生成 UI」走向「UI 也能被模型调用」——双向语义接口。**

### B. 还没解决的开放问题（全部来自 ext-apps 的 open issues / 规范风险段）

| 开放问题 | 证据 |
|---|---|
| **UI 与 WebMCP 的合流尚未定** | issue #797 "WebMCP convergence"；#796 "explore: add a thin bridge between WebMCP and MCP Apps Tools" |
| **App 能否与进行中的对话并排**（而非替换/插卡） | issue #781 "Support an MCP App beside an active conversation" |
| **多 server 宿主下工具名冲突／裸名硬编码** | issue #753 "Widget callServerTool calls hardcode bare tool names, breaking under multi-server MCP hosts" |
| **媒体/视频类 widget 的权限策略未定** | issue #757 "Extend permission-policy negotiation for media/video widgets (fullscreen, presentation/Cast, remote-playback…)" |
| **渲染兼容性仍有宿主差异 bug** | issue #671 "MCP Apps UI Resource Not Rendering in Claude Desktop / claude.ai" |
| **框架生态不完整**（Angular 例子仍缺） | issue #423 "Angular based MCP apps example" |
| **规范自身的"已知风险"** | draft 的 `### Other risks`：Social engineering（UI 可展示误导内容）、Resource consumption（恶意 View 可耗尽 CPU/内存，需宿主做限制） |
| **权限/资源限制尚无强制条款** | 同上，均为 "Hosts should…" 建议而非 MUST |
| 调试能力待补 | issue #786 "PostMessageTransport: make debug logging opt-in" |

- issues 列表来源：https://api.github.com/repos/modelcontextprotocol/ext-apps/issues?state=open（采集快照，224 open）
- 风险段：https://raw.githubusercontent.com/modelcontextprotocol/ext-apps/main/specification/draft/apps.mdx（### Other risks / ## Reservations in MCP）

### C. 规范里"刻意留给未来"的部分（原文级证据）

- 内容类型只做了 HTML 一种，明确留了口子：
  > "The initial specification focuses on HTML resources (`text/html;profile=mcp-app`) with a clear path for future extensions."
  - https://raw.githubusercontent.com/modelcontextprotocol/ext-apps/main/specification/2026-01-26/apps.mdx（## Abstract / ### Overview）
- 命名空间预留（说明官方认为这是长期占坑）：
  > "## Reservations in MCP — The resource prefix `ui://` will be reserved for MCP Apps; The label `io.modelcontextprotocol/ui` is reserved."
- MCP-UI 的 external URL / remote DOM 内容类型目前**不在**标准内（标准只收 HTML），属"未来再议"。

### D. OpenAI 侧仍在 beta / 未铺开的能力

| 能力 | 状态 | 出处 |
|---|---|---|
| ChatGPT payment sheet 内嵌结账 | **private beta**（select partners） | plugins-full.txt 第 726 / 2063 行 |
| Instant Checkout | **beta**，仅部分 marketplace 伙伴 | 第 8100 行 |
| Local services Get Quote / Product checkout / Restaurant reservation conversion | **beta** | 第 6956 / 7182 / 7276 行 |
| Plugin extensions 在 Web 上 | "**coming soon** to ChatGPT Free and Go users" | 第 4460 行 / `en/extensions.md` |
| MCP Events（webhook 订阅） | 依据 **draft** 规范；且明确不支持 polling / streaming 与 `gap`/`terminated` 控制通知 | 第 2526 / 2852 行 |
| 文件类 entrypoint / composer @-mention | Desktop only | `openai/mcp-extensions` Platform Support 表 |
| MCP App deep links | iOS ✅ / **Android ✗** | 同上 |
| Skills over MCP（SDK/宿主支持） | "SDK and host support is **still being implemented**" | https://modelcontextprotocol.io/extensions/skills/overview.md |

- 顺带一个"标准在收敛"的旁证：OpenAI 明确 **不再认旧的 `experimental` 声明**，统一到 `capabilities.extensions`：
  > "The declaration must be under `capabilities.extensions`. OpenAI does not recognize the earlier `experimental` declaration."
  - plugins-full.txt 第 1604 行；亦见 `openai/mcp-extensions` 的 Server Capabilities 表（`2026-07-28` 及以后走 `server/discover`）。

---

## 三、官方原话摘录（可直接进幻灯片的引文）

1. **标准定位**
   > "Official repo for spec & SDK of MCP Apps protocol - standard for UIs embedded AI chatbots, served by MCP servers"
   — https://api.github.com/repos/modelcontextprotocol/ext-apps（repo description）

2. **为什么要标准（碎片化）**
   > "Without formal standardization: Servers cannot reliably expect UI support via MCP / Each host may implement slightly different behaviors / Security and auditability patterns are inconsistent / Developers must maintain separate implementations or adapters for different hosts (e.g., MCP-UI vs. Apps SDK)"
   — SEP-1865 Motivation，https://raw.githubusercontent.com/modelcontextprotocol/ext-apps/main/specification/2026-01-26/apps.mdx

3. **标准与私有扩展的分工（最适合作 04 页收尾）**
   > "ChatGPT implements the open MCP Apps standard for UI returned by an MCP server. ... This standards-first foundation lets the same UI run in ChatGPT and other compatible MCP hosts."
   > "After the MCP Apps flow works, use `window.openai` only for capabilities that the shared specification does not cover."
   — https://developers.openai.com/plugins/build/chatgpt-ui.md ／ 本地 `notes/generative-ui/openai/en/add-ui-to-your-mcp-server.md`

4. **安全模型**
   > "MCP Apps run in a sandboxed iframe... They can't access the parent page, steal cookies, or escape their container. This means hosts can safely render third-party apps without trusting the server author completely."
   — https://modelcontextprotocol.io/extensions/apps/overview.md

5. **"CSP 是新的 CORS"**
   > "OpenAI renders Apps inside a double-nested iframe... CSPs are the new CORS... you have to be surgical."
   — https://developers.openai.com/blog/15-lessons-building-chatgpt-apps.md

6. **App 注册自己的工具（draft 的未来）**
   > "Apps can register their own tools that hosts and agents can call, making apps introspectable and accessible to the model."
   — https://raw.githubusercontent.com/modelcontextprotocol/ext-apps/main/specification/draft/apps.mdx

7. **生态而非围墙**
   > "In a real ChatGPT session, your app is rarely the only one in play... it's a reminder that you're part of an ecosystem, not a sealed product. ... Do your part of the job and hand control back to the conversation."
   — https://developers.openai.com/blog/what-makes-a-great-chatgpt-app.md ／ 本地 `notes/generative-ui/openai/en/what-makes-a-great-chatgpt-app.md`

8. **OpenAI 私有扩展的自我定位**
   > "The MCP spec provides capabilities that work across MCP hosts. These extensions allow deeper integration into ChatGPT, enabling you to build richer features for your users than the standard MCP spec allows."
   — https://raw.githubusercontent.com/openai/mcp-extensions/main/docs/spec.md

---

## 四、链接清单

### 规范 / 标准
| 内容 | URL | 本地副本 |
|---|---|---|
| MCP Apps 规范 **Stable 2026-01-26**（SEP-1865, 59KB） | https://raw.githubusercontent.com/modelcontextprotocol/ext-apps/main/specification/2026-01-26/apps.mdx | `notes/generative-ui/openai/en/mcp-apps-spec.md`（精简版） |
| MCP Apps 规范 **draft**（90KB，含 App-Provided Tools） | https://raw.githubusercontent.com/modelcontextprotocol/ext-apps/main/specification/draft/apps.mdx | — |
| MCP Apps 官方文档站 | https://apps.extensions.modelcontextprotocol.io | — |
| API 文档 | https://apps.extensions.modelcontextprotocol.io/api/ | — |
| MCP 扩展总览 | https://modelcontextprotocol.io/extensions/overview.md | — |
| **扩展支持矩阵（11 个客户端）** | https://modelcontextprotocol.io/extensions/client-matrix.md | — |
| MCP Apps 概览（核心站） | https://modelcontextprotocol.io/extensions/apps/overview.md | `notes/generative-ui/openai/en/mcp-apps-spec.md` |
| Skills over MCP（SEP-2640, Final） | https://modelcontextprotocol.io/extensions/skills/overview.md | — |
| 核心 MCP 规范 2026-07-28 | https://modelcontextprotocol.io/specification/2026-07-28/index.md | — |
| 核心规范 changelog（extensions 字段） | https://modelcontextprotocol.io/specification/2026-07-28/changelog.md | — |
| ext-apps README | https://raw.githubusercontent.com/modelcontextprotocol/ext-apps/main/README.md | — |
| ext-apps v2.0.0 release notes（wire 兼容性） | https://github.com/modelcontextprotocol/ext-apps/releases/tag/v2.0.0 | — |
| ext-apps 迁移指南 v2 | https://apps.extensions.modelcontextprotocol.io/api/documents/migrate-to-v2.html | — |
| ext-apps open issues（开放问题来源） | https://github.com/modelcontextprotocol/ext-apps/issues | — |

### OpenAI 官方
| 内容 | URL | 本地副本 |
|---|---|---|
| 给 MCP server 加 UI（核心文） | https://developers.openai.com/plugins/build/chatgpt-ui.md | `notes/generative-ui/openai/en/add-ui-to-your-mcp-server.md` |
| Plugin 扩展（11 个） | https://developers.openai.com/plugins/build/extensions.md | `notes/generative-ui/openai/en/extensions.md` |
| Plugin UI 字段参考 | https://developers.openai.com/plugins/reference.md | `notes/generative-ui/openai/en/plugin-ui-reference.md` |
| UI 设计规范（display modes） | https://developers.openai.com/plugins/concepts/ui-guidelines.md | `notes/generative-ui/openai/en/ui-guidelines.md` |
| 15 条实战经验 | https://developers.openai.com/blog/15-lessons-building-chatgpt-apps.md | `notes/generative-ui/openai/en/15-lessons-building-chatgpt-apps.md` |
| 什么样的 app 才算好 | https://developers.openai.com/blog/what-makes-a-great-chatgpt-app.md | `notes/generative-ui/openai/en/what-makes-a-great-chatgpt-app.md` |
| MCP server + UI quickstart | https://developers.openai.com/plugins/build/app-quickstart.md | `notes/generative-ui/openai/en/mcp-server-and-ui-quickstart.md` |
| Examples 索引 | https://developers.openai.com/plugins/build/examples.md | `notes/generative-ui/openai/en/examples.md` |
| Plugins 文档全量单文件 | https://developers.openai.com/plugins/llms-full.txt | — |
| Plugins 目录 | https://developers.openai.com/plugins/llms.txt | — |
| 博客索引 | https://developers.openai.com/blog/llms.txt | — |
| **OpenAI 私有扩展规范** | https://raw.githubusercontent.com/openai/mcp-extensions/main/docs/spec.md | — |
| OpenAI 扩展设计模式 | https://raw.githubusercontent.com/openai/mcp-extensions/main/docs/patterns.md | — |
| MCP Events（draft triggers/events） | https://github.com/modelcontextprotocol/experimental-ext-triggers-events/blob/main/docs/design-sketch-proposal.md | — |
| Bits & Bolts kitchen-sink plugin | https://github.com/openai/mcp-extensions/tree/main/plugins/bits-and-bolts | — |

### 示例仓 / 包
| 内容 | 位置 |
|---|---|
| 官方示例仓（submodule） | `openai-apps-sdk-examples`（HEAD `18cc38e`, 2026-04-15） |
| 示例仓 GitHub | https://github.com/openai/openai-apps-sdk-examples |
| `@modelcontextprotocol/ext-apps` | https://registry.npmjs.org/@modelcontextprotocol/ext-apps （latest **2.0.3**） |
| `@openai/apps-sdk-ui` | https://registry.npmjs.org/@openai/apps-sdk-ui （latest **0.2.2**） |
| `@openai/mcp-extensions` | https://registry.npmjs.org/@openai/mcp-extensions （latest **0.2.0**） |
| OpenAI Apps SDK UI 组件库 | https://openai.github.io/apps-sdk-ui/ |
| MCP-UI（社区基座） | https://github.com/MCP-UI-Org/mcp-ui ・ https://mcpui.dev/ |

---

## 五、给「04 · 未来发展方向」的取舍建议

**可以放心当结论讲的（有硬证据）**
1. MCP Apps 已是跨厂商正式标准（SEP-1865, Stable 2026-01-26, `io.modelcontextprotocol/ui`），**11 个宿主**已支持，含 Claude、VS Code Copilot、M365 Copilot、ChatGPT、Cursor。
2. 战线已经从"谁家 UI 协议赢"转向"**标准 + 各家私有扩展层**"：OpenAI 自己都写"standards-first foundation"，私有能力只用 `window.openai`，且已单独出 `openai/mcp-extensions`（Apache-2.0，0.2.0）。
3. **同一份 Plugin 现在同时跑 ChatGPT 和 Codex** —— 生成式 UI 从"聊天里的卡片"升级为"跨产品的能力载体"。
4. **UI 从展示走向可被调用**（draft 的 App-Provided Tools）：模型可以查询和操作界面内部状态，push（`ui/update-model-context`）+ pull（app tools）双向。

**建议标为"尚未解决"再讲（显得可信）**
5. WebMCP 与 MCP Apps 的合流未定（#797/#796）；App 与对话并排尚未支持（#781）；多 server 工具名冲突（#753）。
6. 安全与资源限制仍只是"Hosts should"（social engineering / 资源耗尽），CSP 双 iframe 是主要工程税。
7. 非 HTML 内容类型（external URL、remote DOM）与 Angular 等框架支持都还没进标准。
8. 商业化与事件订阅还在 beta/private beta（Checkout、MCP Events 仅支持 draft 子集）。

**如果只放 3 条**
- 标准收敛：11 个宿主 × 1 个规范（`io.modelcontextprotocol/ui`），wire 协议 1.x↔2.x 双向兼容。
- 双向化：UI 从"被渲染"变成"可被模型调用"（App-Provided Tools, draft）。
- 分工定型：开放标准打底 + 厂商私有扩展层（OpenAI: 11 个扩展，其中 4 类仅 Desktop）。
