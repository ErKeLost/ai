# GenUI 生态横向对比 raw notes

> 采集者：ecosystem agent（父任务：30 分钟内部技术分享《生成式 UI》·「未来发展方向」素材）
> 采集日期：**2026-10-14**（本机 `date` 输出 `Wed Oct 14 07:53:48 CST 2026`）
> 方法：`gh api`（已登录 ErKeLost，5000/hr）+ `curl` 抓官方文档 + 本地 submodule 只读检索
> 边界：不碰 slides.md；不写 a2ui/openui 的深度调研（另有 agent 负责），只写**互操作表态**。

---

## 0. 一句话结论（我的判断）

2025 年还是「四套私有 widget 方案互不相认」，2026 年 10 月的现状是 **单极收敛已完成**：

- **执行层（怎么把 UI 送到对话里）→ MCP Apps 赢了。** 成为唯一跨厂商的 UI 传输标准，OpenAI 官方文档现在把它当作自己的 UI 基座，Microsoft/Shopify 的 MCP-UI 宣布并入它。
- **声明式层（UI 长什么样）→ 还在三足鼎立。** A2UI（Google）、Open-JSON-UI（OpenAI）、OpenUI Lang（Thesys）各自表述，AG-UI 是唯一同时"接住"三者的运行时。
- **关键转折：OpenAI 把 `Apps SDK` 这个名字废弃了**，docs 站点 `/apps-sdk` 现在 302 → `/plugins`，`window.openai` 被官方重新定性为 **"ChatGPT 兼容层 / compatibility alias"**，新代码被明确要求改用 MCP Apps 标准字段。

即：**「声明式语言」这条路线接下来的方向，不再是谁赢谁输，而是全部降级成 MCP Apps iframe 里的一种 payload 格式。**

---

## 1. 已发布事实（带数字/日期）

### 1.1 OpenAI：Apps SDK → Plugins（重大改名/重定位）

| 事实 | 证据 | 日期 |
|---|---|---|
| `https://developers.openai.com/apps-sdk` **302 跳转到** `https://developers.openai.com/plugins`，标题变为 `Plugin development for ChatGPT and Codex` | curl 实测 final url + `<title>` | 2026-10-14 实测 |
| `developers.openai.com/plugins/build` 无对应页（404），真实路径是 `/plugins/build/chatgpt-ui`、`/plugins/build/extensions`、`/plugins/plan/tools` 等 | curl 抓 `/plugins` 页内 href 列表 | 2026-10-14 |
| 官方文档明写：**"Custom UI is optional"**，并 **"Start with MCP Apps"** —— ChatGPT 实现的是开放标准 MCP Apps，`window.openai` 只在 MCP Apps 覆盖不到的地方才用 | https://developers.openai.com/plugins/build/chatgpt-ui.md | 抓取于 2026-10-14 |
| 官方给出**新旧字段对照迁移表**（见 §3） | 同上 | — |
| 新仓库 `openai/plugins`（"OpenAI Plugins"）创建于 2026-03-04，7431★，最后推送 2026-10-08；README 讲的是 **Codex plugin**：`.codex-plugin/plugin.json` + `skills/` + `.mcp.json`，示例含 figma / notion / build-ios-apps / expo / netlify / remotion | `gh api repos/openai/plugins` | 2026-10-08 |
| 新仓库 `openai/mcp-extensions` **创建 2026-09-29**，Apache-2.0，1043★，推送 2026-10-10；"Build plugins that feel like native, first-class features of ChatGPT" | `gh api repos/openai/mcp-extensions` | 2026-09-29 创建 |
| `@openai/mcp-extensions` SDK **v0.2.0 发布于 2026-10-10**（npm latest 0.2.0, published 2026-10-13）；TS server helpers 已迁到 **MCP SDK 2**（`import { McpServer } from '@modelcontextprotocol/server'`），app transport **删掉了 `createAppTransport`，改用 `@modelcontextprotocol/ext-apps` 的 `App`** | https://github.com/openai/mcp-extensions CHANGELOG.md | 2026-10-10 |
| `openai/apps-sdk-ui`（旧组件库）最后 release **v0.2.2 = 2026-05-05**，仓库最后推送 2026-05-20，959★ —— 已基本停更 | `gh api repos/openai/apps-sdk-ui` | 2026-05-20 |
| `openai/openai-apps-sdk-examples` 最后推送 **2026-04-15**（2369★）—— 抽样仓库也停更 | `gh api` commits | 2026-04-15 |

**OpenAI Plugin UI changelog**（https://developers.openai.com/plugins/changelog.md）逐条日期：

| 日期 | 变更 |
|---|---|
| **2026-08-21** | 稳定 OAuth callback `https://chatgpt.com/connector_platform_oauth_redirect`；CIMD client id `https://chatgpt.com/oauth/client.json`（依赖 RFC 9207 issuer identification） |
| **2026-07-21** | 废弃 `_meta["openai/visibility"]`，改用 `_meta.ui.visibility`（model / app / both 三态） |
| **2026-06-12** | ChatGPT 应用权限控制（always / before changes / important only） |
| **2026-05-28** | ChatGPT 通过 `hostContext.styles.variables` 提供 **MCP Apps host CSS 变量**，随 `ui/notifications/host-context-changed` 更新 |
| **2026-05-27** | `window.openai.toolResponseMetadata` 保留 canonical MCP tool result envelope；需审批的工具改为走 MCP Apps `ui/notifications/tool-input` 生命周期 |
| **2026-05-26** | ChatGPT 读取 MCP server instructions |
| **2026-05-06** | 文档推荐给返回结构化内容的工具声明 `outputSchema` |
| **2026-03-25** | Plugin distribution guidance |

> 注意：**changelog 页最早/最新都止于 2026-08-21**，说明该页在 2026-08 后未再更新（或改名后搬迁）。

### 1.2 MCP Apps（= MCP-UI 的归宿）成为唯一执行标准

| 事实 | 证据 |
|---|---|
| 官方仓库 `modelcontextprotocol/ext-apps`，**创建 2025-11-21**，2950★，401 fork，最后推送 **2026-09-25** | `gh api repos/modelcontextprotocol/ext-apps` |
| 最新 release **v2.0.3 = 2026-09-25**（v2.0.1 2026-09-24、v2.0.2 2026-09-25 同日连发） | `gh api .../releases` |
| npm `@modelcontextprotocol/ext-apps` **2.0.3**（published 2026-09-25） | npm registry |
| 仓库自我定位：**"Official repo for spec & SDK of MCP Apps protocol - standard for UIs embedded AI chatbots, served by MCP servers"**；README 首句：**"render inline in Claude, ChatGPT and any other compliant chat client"** | README |
| 规范路径：`specification/2026-01-26/apps.mdx`（**2026-01-26 版规范**）；另有 draft | README 链接 |
| 规范文档站：`https://apps.extensions.modelcontextprotocol.io/api/`；文档入口 `https://modelcontextprotocol.io/docs/extensions/apps`；overview `https://modelcontextprotocol.io/extensions/apps/overview` | README / A2UI guide |
| **SEP 编号 = SEP-1865**（"MCP Apps extension (SEP-1865)"） | Mastra CHANGELOG: `packages/editor/CHANGELOG.md:2490`、`client-sdks/client-js/CHANGELOG.md:7396` |
| capability 名 `io.modelcontextprotocol/ui`；资源 MIME `text/html;profile=mcp-app` | Mastra CHANGELOG；`ag-ui/middlewares/mcp-apps-middleware/src/index.ts:420,832` |
| 提供 **4 个 Agent Skills**：`create-mcp-app`、`migrate-oai-app`（**"Converts an existing OpenAI App to use MCP Apps"**）、`add-app-to-server`、`convert-web-app` | ext-apps README |
| **MCP-UI 承认并入**：`MCP-UI-Org/mcp-ui` README 原文——"**`mcp-ui` pioneered the concept of interactive UI over MCP... Alongside Apps SDK, the patterns developed here directly influenced the MCP Apps specification, which standardized UI delivery over the protocol.**" "The `@mcp-ui/*` packages implement the MCP Apps standard. `@mcp-ui/client` is the recommended SDK for MCP Apps Hosts." "fully compliant with the MCP Apps specification and ready for production use" | `gh api repos/MCP-UI-Org/mcp-ui/readme` |
| `MCP-UI-Org/mcp-ui`：创建 2025-05-13，5210★，Apache-2.0，最后推送 **2026-09-16**（并入后趋缓）；npm `@mcp-ui/client` **7.1.1**（2026-05-09） | `gh api` + npm |
| MCP 协议版本出现三个：`2025-11-25`（旧）、**`2026-07-28`（新，`server/discover`）**、schema reference `2026-07-28` | openai/mcp-extensions `docs/spec.md` |

### 1.3 AG-UI：不做 UI 规范，做「接住所有 UI 规范」的运行时

官方文档 `ag-ui/docs/concepts/generative-ui-specs.mdx`（本地 submodule）原文表：

| Specification | Origin / Maintainer | Purpose（原文） |
|---|---|---|
| **A2UI** | **Google** | "A declarative, LLM-friendly Generative UI spec. **JSONL-based and streaming**, designed for platform-agnostic rendering." |
| **Open-JSON-UI** | **OpenAI** | "**An open standardization of OpenAI's internal declarative Generative UI schema.**" |
| **MCP-UI** | **Microsoft + Shopify** | "A fully open, **iframe-based** Generative UI standard extending MCP for user-facing experiences." |

同页最关键的定性句：

> **"Despite the naming similarities, AG-UI is not a generative UI specification — it's a User Interaction protocol that provides the bi-directional runtime connection between the agent and the application."**
> **"AG-UI natively supports all of the above generative UI specs and allows developers to define their own custom generative UI standards as well."**

`ag-ui/docs/agentic-protocols.mdx` 原文：

> "**MCP** Connects agents to tools and to context... **A2A** Connects agents to other agents... **AG-UI** Connects agents to users."
> "AG-UI has emerged as the **3rd leg of the AI protocol landscape**."
> "These three agentic protocols are complementary and have distinct technical goals; a single agent can and often does use all 3 simultaneously."

| AG-UI 事实 | 证据 |
|---|---|
| `ag-ui-protocol/ag-ui`：创建 2025-05-07，**16507★**，1505 fork，MIT，最后推送 **2026-10-13**，日更 | `gh api` |
| Release 节奏：`release/2026-10-13`、`release/2026-10-12`、`release/2026-10-10`、`release/2026-10-09` —— **几乎每工作日一个 release** | `gh api .../releases` |
| npm `@ag-ui/core` **1.0.2**（published 2026-10-05） | npm |
| **1.0 规范已落地**：`docs/spec/1.0/`，changelog 明写"**The specification exists.** 0.x defined shapes; behaviour lived in the TypeScript client. 规则现以 **BCP 14** 语言书写，schema 为结构权威、changelog 为行为权威" | `docs/spec/1.0/changelog.mdx` |
| 1.0 重大变更：`RUN_FINISHED` 带可选 `outcome`（success / interrupt / cancelled）；新增 `Interrupt` + resume；**subagents**（`subagentRunId`、`SUBAGENT_STARTED/FINISHED/ERROR`）；`THINKING_*` 退役 → **reasoning 事件族**（含 `REASONING_ENCRYPTED_VALUE`） | `docs/spec/1.0/changelog.mdx` |
| 约 **16 种标准事件类型**，传输无关（SSE / WebSocket / webhooks），带 middleware 层做宽松事件匹配 | `ag-ui/README.md` |
| **两个官方 UI-pec 中间件**：`@ag-ui/mcp-apps-middleware` **0.1.2**（2026-10-08）；`@ag-ui/a2ui-middleware` **0.0.12**（2026-10-06）。另 `@ag-ui/a2ui-toolkit` 0.0.5 / py `ag-ui-a2ui-toolkit` 0.0.4 | npm + 本地 package.json |
| mcp-apps-middleware 代码内自述：`MCPAppsActivityType = "mcp-apps"`，advertise `mimeTypes: ["text/html;profile=mcp-app"]`，注释 "Advertise MCP Apps UI support per **SEP-1865**" | `middlewares/mcp-apps-middleware/src/index.ts:25,420,832` |
| A2UI 接线工具名：`render_a2ui`、`log_a2ui_event`；ops：`createSurface` / `updateComponents` / `updateDataModel`；常量 `BASIC_CATALOG_ID`、`DEFAULT_SURFACE_ID`；dynamic 模式工具名 `generate_a2ui`（子 agent 流式产出） | `middlewares/a2ui-middleware/src/tools.ts`、`skills/ag-ui-a2ui-integration/sources.md` |
| 已接入 A2UI 的框架适配器：**LangGraph、ADK(Google)、Mastra、AWS Strands**（TS+PY 各一套） | skill `sources.md` 文件清单 |
| 附带 **agent skill** `ag-ui-a2ui-integration` v1.1.0，明确"**Treat AG-UI as the transport and agent integration layer, `@ag-ui/a2ui-middleware` as the server-side bridge, and A2UI as the UI payload format**" | `skills/ag-ui-a2ui-integration/SKILL.md` |
| 依赖 CopilotKit **>= 1.61.2** 才支持 `a2ui={{ catalog }}` 自动启用 | skill SKILL.md step 5 |

### 1.4 CopilotKit：把三路线做成产品分类（很有用的幻灯片素材）

`copilotkit/README.md` 第 181-197 行，官方把 Generative UI 分成**三类**并各给一个协议：

- **Static → AG-UI Protocol**
- **Declarative → A2UI**
- **Open-Ended → MCP Apps & Open JSON**

> "Compare the Three Types" 配图：`https://github.com/user-attachments/assets/962f49c2-31ea-43c5-b2a3-7cdde114705a`

| CopilotKit 事实 | 证据 |
|---|---|
| `CopilotKit/CopilotKit`：**38003★**，4729 fork，MIT，最后推送 **2026-10-13** | `gh api` |
| 最新 release **v1.79.0 = 2026-10-12**（v1.78.0 10-09、v1.77.2 10-08、v1.77.1 10-07） | `gh api .../releases` |
| npm `@copilotkit/react-core` **1.79.0**（2026-10-12） | npm |
| 自我定位："**We are the company behind the AG-UI Protocol — adopted by Google, LangChain, AWS, Microsoft, Mastra, PydanticAI, and more!**" | README |
| 平台矩阵：React/Next.js ✅GA；Angular ✅；Vue ✅；React Native ✅；Slack / Microsoft Teams ✅；Discord/WhatsApp/Telegram ✅adapter；**Google Chat / iMessage / SMS 🟡 on the roadmap** | README 表格 |
| 文档侧目录把 Declarative 细分为 **A2UI Dynamic Schema / A2UI Fixed Schema / A2UI JSON Render / Hashbrown**；Open-ended 细分为 **Interactivity / Shared state / Human-in-the-loop / WebMCP** | 抓 https://docs.copilotkit.ai/generative-ui/a2ui 导航 |
| 教育仓库 `CopilotKit/generative-ui`（851★，最后推送 2026-03-20），描述：**"Generative UI examples for: AG-UI, A2UI/Open-JSON-UI, and MCP Apps."** —— 标题里直接列出三套规范 | `gh search repos mcp-ui` |

### 1.5 Vercel AI SDK：只做 host，不发明声明式语言

| 事实 | 证据 |
|---|---|
| npm `ai` **7.0.139**（published 2026-10-13）；本地 submodule 为 7.0.137 | npm + `packages/ai/package.json` |
| `vercel/ai`：27302★，5320 fork，最后推送 2026-10-13 | `gh api` |
| **新增 MCP Apps 宿主支持**：文档 `content/docs/03-ai-sdk-core/17-mcp-apps.mdx`（标题 `MCP Apps`），描述 "MCP Apps extend MCP tools with interactive UI resources... tools can point to a `ui://` resource containing HTML that your app renders in a **sandboxed iframe**" | 本地文档 |
| 提供两块：`@ai-sdk/mcp`（`mcpAppClientCapabilities`、`splitMCPAppTools`）+ `@ai-sdk/react`（MCP App renderer，桥接 JSON-RPC） | 同上 |
| host 流程 6 步：带 MCP Apps client capabilities 连接 → listTools 按 `_meta.ui.visibility` 切分 model-visible / app-visible → 只把模型可见的交给 `streamText` → 读 `ui://` → sandboxed iframe 渲染 → 把 app-visible 的 `tools/call` 代理回 server | 同上 |
| capability 声明 MIME：`text/html;profile=mcp-app` | 同上 |
| 文档导航里 `MCP Apps` 与 `useChat`/`useObject` 并列，且已有专门的 reference 页 `/docs/reference/ai-sdk-ui/mcp-app-renderer` | `content/docs/04-ai-sdk-ui/01-overview.mdx:25` |
| **传统 Generative UI 仍以 tools→React component 为核心**（`04-generative-user-interfaces.mdx`："At the core of generative UI are tools"，"Generative UI is the process of connecting the results of a tool call to a React component"）—— 即 **没有采纳 A2UI/Open-JSON-UI 式声明式 payload** | 本地文档 |

### 1.6 Mastra / LangChain：两条不同的跟随策略

| 事实 | 证据 |
|---|---|
| Mastra 已实现 **MCP Apps extension (SEP-1865)**：`MCPServer` 接受 `appResources`（`ui://` → HTML app），MCPClient 保留完整 `_meta`（含 `ui.resourceUri`），双方 advertise `io.modelcontextprotocol/ui` capability | `packages/editor/CHANGELOG.md:2490`、`docs/.../reference/tools/mcp-server.mdx:1511-1513` |
| Mastra 依赖 `@modelcontextprotocol/ext-apps@^1.7.5`（templates）与 `1.7.1`（examples CDN） | `templates/template-genui-data-explorer/package-lock.json:4069` |
| Mastra 有 **OpenUI 官方集成页**：`docs/src/content/en/integrations/agentic-ui/openui.mdx` —— "OpenUI is an open standard for generative UI. It pairs a compact streaming-first language (**OpenUI Lang**) with a React runtime... **OpenUI connects to Mastra through the AG-UI protocol**"（`@ag-ui/mastra` 适配器 + OpenUI 客户端 `agUIAdapter()`） | 本地文档 |
| Mastra `integrations/agentic-ui/` 下已有四个集成页：`openui`、`assistant-ui`、`ai-sdk-ui`、`copilotkit` | 本地 find |
| Mastra 主仓库 turbo `0.1.11`，最后提交 2026-10-12 | 本地 |
| LangChain.js：文档侧**没有 generative UI / A2UI / MCP Apps 的声明式 UI 叙事**（grep 全仓库 0 命中），唯一相关产物是 `langchain-ai/agent-chat-ui`（3215★，2026-10-12），定位"Web app for interacting with **any LangGraph agent** via a chat interface" | local rg + `gh api` |
| `langchainjs` 最后提交 2026-10-08（`chore: version packages`） | 本地 |

### 1.7 GitHub Copilot：明确**没有**走上声明式生成式 UI

| 事实 | 证据 |
|---|---|
| 旧文档路径 `docs.github.com/en/copilot/building-copilot-extensions/about-building-copilot-extensions` **302 跳转到** `/en/copilot/concepts/context/mcp`（About Model Context Protocol） | curl 实测 |
| 该 MCP 概念页的 Copilot 文档导航中，只有 **MCP / Plugins / Agent skills / Tools / Hooks / Third-party coding agents / Agent apps**，**没有 UI / Apps / MCP Apps 条目** | curl + 文本检索：`UI` not found，`Apps` not found |
| 新仓库 `github/copilot-sdk`（**创建 2026-01-14**）：**10553★**，MIT，最后推送 **2026-10-13**；"Multi-platform SDK for integrating GitHub Copilot Agent into apps and services"，暴露 **Copilot CLI 同款 agent runtime**，六语言 SDK（Node/Python/Go/.NET/Java/Rust），全部通过 **JSON-RPC 与 Copilot CLI server 通信** | `gh api` + README |
| `copilot-sdk` docs/features 列表：agent-loop / changing-tools / context-management / custom-agents / **hooks** / image-input / **mcp** / **plugin-directories** / **skills** / steering-and-queueing / streaming-events —— **无 UI 相关 feature** | `gh api .../contents/docs/features` |
| `copilot-extensions` 组织：最新的 `github-models-extension` 最后推送 2026-06-29，`preview-sdk.js` 最后推送 2026-01-28，README 自称 **"alpha software"** 且指向现已重定向的旧文档；整个组织基本停摆 | `gh api orgs/copilot-extensions/repos` |
| GitHub 侧 2026-10-01 changelog 的「生成式」进展是 **`GitHub Copilot can now interact with desktop apps`**（computer use），不是生成式 UI | github.blog changelog 列表 |
| `github/awesome-copilot` 39985★，最后推送 2026-10-13 —— 生态热度在 **instructions/agents/skills**，不在 UI | `gh api orgs/github/repos` |

> 结论：GitHub Copilot 的路线是 **agent + MCP tools + skills/plugins + markdown 渲染**，把「UI 生成」留给了宿主（VS Code / GitHub.com）。**它没有采纳 MCP Apps，也没有声明式 UI 规范。**

---

## 2. 路线图 / 未定（Roadmap，带"官方怎么说"）

### 2.1 明确的「将会实现 / 未实现」

| 事项 | 原文 / 出处 | 状态 |
|---|---|---|
| **A2UI v1.0** | README 原文："A2UI's current production release is **v0.9.1**, a patch release in the stable **v0.9** protocol family. The **v1.0 specification is a release candidate**, while **v0.8 is legacy**. ... **Expect changes.**" 顶部标注 **"⚠️ Status: Early stage public preview"** | v1.0 = RC |
| A2UI Python 包节奏 | releases：`python/a2ui-core/v0.3.0` 与 `python/a2ui-agent-sdk/v0.8.0` 同日 **2026-10-08**；上一版 v0.2.0/v0.7.0 在 2026-09-28 —— **约 10 天一个 minor** | 活跃 |
| **A2UI ↔ MCP Apps 双向互操作（官方指南）** | `docs/public/guides/mcp-apps-in-a2ui.md`（MCP Apps in A2UI）与 `docs/public/guides/a2ui-in-mcp-apps.md`（A2UI in MCP Apps，原 `guide_a2ui_dynamic_mcp` 重命名而来）。后者架构：Client Host →（double-iframe sandbox 中的 MCP App，内含 A2UI surface）→ MCP Server | **已发布** |
| A2UI 样例里已有 `mcp/mcp-apps-calculator`（Angular）、`samples/client/shared/mcp_apps_inner_iframe`、"MCP Apps Proxy Agent" | 本地 `a2ui` 仓库 | 已有样例 |
| **MCP Apps v2.x → draft 仍在演进** | ext-apps 规范同时有 `specification/2026-01-26/apps.mdx`（发布版）与 `specification/draft/apps.mdx`（OpenAI 文档引用的就是 draft） | **持续演进** |
| **OpenAI 的扩展是"超集"，不是新标准** | mcp-extensions spec.md："This specification defines **extensions to MCP and MCP Apps** for use across ChatGPT... The MCP spec provides capabilities that work across MCP hosts. **These extensions allow deeper integration into ChatGPT**" —— 明确不打算跨宿主 | 已发布 0.2.0 |
| OpenAI 平台支持矩阵（"expected support at **DevDay launch**"） | Feature × {Desktop, Web, iOS, Android}：**File entrypoint / File opening / File resources / Composer at-mentions** 在 Web 或移动端标注 **Not supported**；Classic ChatGPT 被排除在外 | 有平台缺口 |
| OpenAI 明确要**分层**：可移植层 vs ChatGPT 专属 | "use `window.openai` **only for capabilities that the shared specification does not cover**... These optional extensions can improve the experience in ChatGPT **without making them part of the portable UI foundation**" | 已发布 |
| **MCP Apps host 样式标准化** | 2026-05-28 changelog：`hostContext.styles.variables` + `ui/notifications/host-context-changed`，目的是让 app 不用为每个宿主硬编码颜色 | 已发布 |
| CopilotKit Channels 扩展到更多 IM | README："🔜 **Google Chat / iMessage / SMS** 🟡 On the roadmap"；"Discord / WhatsApp / Telegram ✅ Channels SDK adapter (**managed connection coming soon**)"；Vue "Quickstart coming soon" | Roadmap |
| CopilotKit 把 WebMCP 列入 Open-ended GenUI | 文档导航 `Open-ended → Interactivity / Shared state / Human-in-the-loop / **WebMCP**` | 进行中 |
| AG-UI 仍在加协议特性 | 1.0 里的 subagents、interrupt-resume、reasoning 事件族都是新近加入；release 近乎每日 | 活跃 |
| ext-apps 提供 `migrate-oai-app` skill | 官方把"从 OpenAI App 迁移到 MCP Apps"做成了一等公民的迁移路径 | 已发布 |
| MCP-UI 定位转向 | README：`@mcp-ui/client` 现在是 **"the recommended SDK for MCP Apps Hosts"**，不再推自己的私有 spec | 已转型 |
| Mastra 的 GenUI 集成面在扩张 | `integrations/agentic-ui/` 从 1 个（openui）扩到 4 个（+ assistant-ui / ai-sdk-ui / copilotkit） | 进行中 |

### 2.2 我**没有**找到证据的（存在不确定性）

- **没有**找到 MCP Apps 官方明确的「下一版规范时间表 / 里程碑」页（ext-apps 无 milestones 数据可引用）。
- **没有**找到 A2UI 官方与 OpenAI Open-JSON-UI 的**正式互操作声明**——AG-UI 是唯一把两者都"接住"的层，但那是 AG-UI 的表述，不是 Google/OpenAI 的。
- **没有**找到 GitHub 关于 Copilot Extensions **正式弃用的带日期公告**（只是文档 302 掉 + 组织停更，属强信号）。
- **没有**确认 `developers.openai.com/apps-sdk` → `/plugins` 的具体切换日期（无 changelog 条目），只能确认 2026-10-14 已是跳转状态。
- **没有**确认 MCP Apps 在 Claude 侧的具体版本支持日期（README 只写了 "render inline in Claude, ChatGPT"）。
- ext-apps 仓库 license 为 `NOASSERTION`（不是标准 SPDX），README badge 写 Apache-2.0 —— 元数据不一致。

---

## 3. 互操作与协议关系（核心：谁定义标准、谁做运行时）

### 3.1 分层图（我按证据归纳）

```
┌─ 声明式层（UI 长什么样）────────────────────────────────────────────┐
│  A2UI (Google)        Open-JSON-UI (OpenAI)      OpenUI Lang (Thesys) │
│  · JSONL 流式          · "OpenAI 内部 schema 的开放标准化"  · 紧凑流式语言 │
│  · 平台无关渲染         · 声明式                    · React runtime    │
│  · catalog 白名单       ·                          ·                  │
│  状态：v0.9.1 生产 / v1.0 RC   状态：随 Plugins 演进   状态：1.0.0 (react-lang) │
└──────────────┬──────────────────────┬──────────────────┬────────────┘
               │                      │                  │
               └──────────┬───────────┴──────────────────┘
                          ▼
┌─ 交互/运行时层（怎么双向连通）──────────────────────────────────────┐
│  AG-UI (CopilotKit) — 明确自称"不是 GenUI 规范"，是 User Interaction protocol │
│  · 16 事件 / 传输无关 / 1.0 规范 / @ag-ui/{a2ui,mcp-apps}-middleware      │
│  · 官方："natively supports all of the above generative UI specs"        │
└──────────────────────────┬──────────────────────────────────────────┘
                           ▼
┌─ 执行/传输层（UI 怎么送到对话里）★ 已收敛 ──────────────────────────┐
│  MCP Apps (SEP-1865, modelcontextprotocol/ext-apps)  v2.0.3 (2026-09-25)│
│  · iframe 沙箱 + ui:// 资源 + JSON-RPC over postMessage                 │
│  · capability: io.modelcontextprotocol/ui / MIME: text/html;profile=mcp-app │
│  · Claude + ChatGPT 已实现；Vercel AI SDK / Mastra / AG-UI / MCP-UI 全部接入 │
│  · MCP-UI (Microsoft+Shopify) 已并入；OpenAI 已把它当自家 UI 基座           │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.2 OpenAI 官方给出的**标准 ↔ 兼容别名**对照表（最有说服力的收敛证据）

出处：https://developers.openai.com/plugins/build/chatgpt-ui.md

| Goal | **MCP Apps 标准（应用）** | ChatGPT 兼容别名（旧，保留但不再推荐） |
|---|---|---|
| Link a tool to a UI resource | `_meta.ui.resourceUri` | `_meta["openai/outputTemplate"]` |
| Receive tool input | `ui/initialize` + `ui/notifications/tool-input` | `window.openai.toolInput` |
| Receive tool results | `ui/notifications/tool-result` | `window.openai.toolOutput` |
| Call a tool from the UI | `tools/call` | `window.openai.callTool` |
| Send a follow-up message | `ui/message` | `window.openai.sendFollowUpMessage` |

原文："The compatibility aliases remain available for existing integrations. **New UI should use the shared fields and bridge methods in the middle column.**"

> 这是**"苹果式"兼容层写法**：旧 API 保留，新代码全部引导到开放标准。对幻灯片来说，这是"执行层已收敛"最硬的一张证据。

### 3.3 各方对「互操作」的官方表态（逐字引用）

| 主体 | 表态 | 出处 |
|---|---|---|
| **AG-UI** | "AG-UI works with all of these"（指 MCP-UI、Open JSON UI、A2UI）；"AG-UI is **not** a generative UI specification" | `docs/agentic-protocols.mdx` / `concepts/generative-ui-specs.mdx` |
| **CopilotKit** | 三类并列：Static=AG-UI / Declarative=A2UI / Open-Ended=MCP Apps & Open JSON；"We are the company behind the AG-UI Protocol" | README |
| **MCP-UI (MS+Shopify)** | "the patterns developed here directly influenced the MCP Apps specification"；"`@mcp-ui/client` is the recommended SDK for MCP Apps Hosts" | README |
| **OpenAI** | "ChatGPT implements the open MCP Apps standard"；"This standards-first foundation lets the **same UI run in ChatGPT and other compatible MCP Apps hosts**"；`window.openai` 只补标准未覆盖部分 | `plugins/build/chatgpt-ui.md` |
| **MCP Apps** | "render inline in Claude, ChatGPT and any other compliant chat client"；skill `migrate-oai-app` 专门做 OpenAI→MCP Apps 迁移 | ext-apps README |
| **A2UI (Google)** | 提供双向指南 `a2ui-in-mcp-apps` / `mcp-apps-in-a2ui`，即 A2UI payload 可跑在 MCP Apps sandbox 里 | A2UI docs |
| **Mastra** | 用 `@modelcontextprotocol/ext-apps` 实现 appResources；同时用 AG-UI 接 OpenUI | CHANGELOG + openui.mdx |
| **Vercel AI SDK** | 只做 MCP Apps **host**；自家 generative UI 仍是 tool→React component | `17-mcp-apps.mdx` |
| **GitHub Copilot** | 无表态；路线 = MCP tools + skills/plugins + markdown，无 UI 规范 | docs.github.com 重定向 + copilot-sdk features |

### 3.4 OpenAI 的**另一条**声明式路线：ChatKit Widgets（容易混，值得点名）

- 出处：https://developers.openai.com/api/docs/guides/chatkit-widgets.md
- "Widgets are the containers and components that come with ChatKit. You can use prebuilt widgets, modify templates, or design your own"
- 设计工具：**Widget Builder @ https://widgets.chatkit.studio**，产出 **JSON** 拷进后端
- 交互：`onAction` callback / `WidgetsOption`，widget 事件回传业务后端
- npm `@openai/chatkit-react` **1.6.1**（2026-07-31）
- **与 MCP Apps 是两条路**：ChatKit Widgets = 自家嵌入式 chat 的声明式 JSON（Open-JSON-UI 的数字近亲）；MCP Apps = 跨宿主 iframe。OpenAI 目前两条都在维护。

---

## 4. 硬数字速查（可上幻灯片）

| 项目 | 值 | 日期 |
|---|---|---|
| MCP Apps 规范仓库 `modelcontextprotocol/ext-apps` | **2950★** / 401 fork / 创建 2025-11-21 | 2026-10-14 查 |
| MCP Apps 最新 release | **v2.0.3** | **2026-09-25** |
| MCP Apps 规范版本 | `2026-01-26`（+ draft） | — |
| MCP Apps SEP 编号 | **SEP-1865** | — |
| A2UI 仓库 `google/A2UI` | **16688★** / 1328 fork / Apache-2.0 / 创建 2025-09-24 / 推送 2026-10-13 | 2026-10-14 |
| A2UI 生产版本 | **v0.9.1**（v0.8 legacy，**v1.0 = release candidate**） | README |
| A2UI Python core / agent-sdk | v0.3.0 / v0.8.0 | **2026-10-08** |
| AG-UI 仓库 | **16507★** / 1505 fork / MIT / 创建 2025-05-07 | 2026-10-14 |
| AG-UI `@ag-ui/core` | **1.0.2** | 2026-10-05 |
| AG-UI release 频率 | `release/2026-10-13` 等多个，近乎每日 | 2026-10 |
| CopilotKit | **38003★** / 4729 fork | 2026-10-14 |
| CopilotKit latest | **v1.79.0** | 2026-10-12 |
| OpenUI `thesysdev/openui` | **10854★** / 728 fork / MIT / 创建 2024-12-02 / 推送 2026-10-13 | 2026-10-14 |
| OpenUI `@openuidev/react-lang` | **1.0.0** | 2026-10-12 |
| MCP-UI `MCP-UI-Org/mcp-ui` | **5210★** / Apache-2.0 / 创建 2025-05-13 | 2026-10-14 |
| Vercel AI SDK | **27302★** / `ai@7.0.139` | 2026-10-13 |
| OpenAI `openai/plugins` | **7431★** / 创建 2026-03-04 | pushed 2026-10-08 |
| OpenAI `openai/mcp-extensions` | **1043★** / Apache-2.0 / 创建 **2026-09-29** | pushed 2026-10-10 |
| `@openai/mcp-extensions` | **0.2.0** | 2026-10-10 |
| OpenAI `apps-sdk-ui`（旧） | 959★ / 最后 release v0.2.2 | 2026-05-05（停更） |
| `openai/openai-apps-sdk-examples`（旧） | 2369★ / 最后推送 | 2026-04-15（停更） |
| GitHub `copilot-sdk` | **10553★** / MIT / 创建 2026-01-14 / 6 语言 | 2026-10-13 |
| GitHub `awesome-copilot` | **39985★** | 2026-10-13 |
| CopilotKit 教育仓库 `CopilotKit/generative-ui` | 851★ / "examples for: AG-UI, A2UI/Open-JSON-UI, and MCP Apps" | 2026-03-20 |

---

## 5. 幻灯片可用的 8 条（已在 FINAL_ANSWER 压缩）

1. **2026-10-14 实测：`developers.openai.com/apps-sdk` 302 → `/plugins`**，OpenAI 把 Apps SDK 改名/重定位为 Plugins。
2. OpenAI 官方文档：**"Start with MCP Apps"**，ChatGPT 实现的是开放 MCP Apps 标准；`window.openai` 降级为**兼容别名**，官方给出 5 行对照迁移表并写明"新 UI 应使用标准字段"。
3. **MCP Apps = SEP-1865**，仓库 `modelcontextprotocol/ext-apps` 2950★，最新 **v2.0.3（2026-09-25）**，规范 `2026-01-26`，MIME `text/html;profile=mcp-app`，capability `io.modelcontextprotocol/ui`。
4. **MCP-UI（Microsoft + Shopify）官方宣布并入**：其 patterns "directly influenced the MCP Apps specification"，`@mcp-ui/client` 转身成为"MCP Apps Host 的推荐 SDK"。
5. **AG-UI 明确表态自己不是 GenUI 规范**，而是 User Interaction protocol，且 "natively supports" A2UI / Open-JSON-UI / MCP-UI 三者；`@ag-ui/core@1.0.2`，配 `@ag-ui/mcp-apps-middleware@0.1.2` + `@ag-ui/a2ui-middleware@0.0.12`。
6. **CopilotKit 把 GenUI 产品化成三类**：Static=AG-UI / Declarative=A2UI / Open-Ended=MCP Apps & Open JSON；38003★，v1.79.0（2026-10-12）。
7. **Google A2UI 仍是 RC 状态**：16688★，生产版 v0.9.1，**v1.0 是 release candidate**，README 自述 "Early stage public preview... Expect changes"；但已提供 **A2UI ↔ MCP Apps 双向集成指南**。
8. **Vercel AI SDK 只做宿主不做语言**：`ai@7.0.139`，新增 MCP Apps host 支持（`@ai-sdk/mcp` + `@ai-sdk/react` renderer），自家 GenUI 仍是 tool→React component，未采纳声明式 payload。
9. **GitHub Copilot 明确缺席**：Copilot Extensions 文档 302 到 MCP 概念页，`copilot-sdk`（10553★，六语言，JSON-RPC）的 feature 列表里没有任何 UI 项；生态热度在 skills/plugins。
10. **OpenAI 另开一条声明式路线 ChatKit Widgets**（JSON + Widget Builder `widgets.chatkit.studio` + `onAction`），与 MCP Apps iframe 并行维护。

**「声明式语言这条路线接下来的方向在哪」我的判断（备注用）**：
不是"谁的 schema 赢"，而是**降级**——声明式 payload 变成 MCP Apps iframe 里的一种内容格式。就像 HTML 赢了之后，React/Vue 之争还在，但都得跑在浏览器里。所以下一步的竞争点会从"规范之战"转到三件务实的事：① catalog 白名单/信任模型怎么定（A2UI 的 catalog、MCP Apps 的 `_meta.ui.visibility` 在做同一件事）；② 跨宿主样式一致性（`hostContext.styles.variables` 刚开这个头）；③ 流式增量更新（A2UI 的 JSONL 增量 + AG-UI 的 streaming 事件如何对齐）。

---

## 6. 链接清单

### 协议 / 规范
- MCP Apps 仓库：https://github.com/modelcontextprotocol/ext-apps
- MCP Apps 规范 `2026-01-26`：https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx
- MCP Apps 文档：https://modelcontextprotocol.io/docs/extensions/apps
- MCP Apps overview：https://modelcontextprotocol.io/extensions/apps/overview
- MCP Apps API docs：https://apps.extensions.modelcontextprotocol.io/api/
- MCP Apps quickstart：https://apps.extensions.modelcontextprotocol.io/api/documents/quickstart.html
- MCP 规范 `2026-07-28` schema：https://modelcontextprotocol.io/specification/2026-07-28/schema
- MCP 规范 `2025-11-25`：https://modelcontextprotocol.io/specification/2025-11-25/index
- AG-UI 仓库：https://github.com/ag-ui-protocol/ag-ui
- AG-UI 官网/docs：https://ag-ui.com/ · https://docs.ag-ui.com/
- AG-UI Dojo：https://dojo.ag-ui.com/
- AG-UI GenUI specs 概念页：https://docs.ag-ui.com/concepts/generative-ui-specs
- AG-UI 协议分层页：https://docs.ag-ui.com/concepts/agentic-protocols
- A2UI 仓库：https://github.com/google/A2UI
- A2UI 文档：https://a2ui.org/
- A2UI in MCP Apps 指南：https://github.com/google/A2UI/blob/main/docs/public/guides/a2ui-in-mcp-apps.md
- MCP Apps in A2UI 指南：https://github.com/google/A2UI/blob/main/docs/public/guides/mcp-apps-in-a2ui.md
- OpenUI：https://github.com/thesysdev/openui · https://openui.com
- MCP-UI：https://github.com/MCP-UI-Org/mcp-ui

### OpenAI
- Plugins 首页（原 Apps SDK）：https://developers.openai.com/plugins
- Add UI to your MCP server：https://developers.openai.com/plugins/build/chatgpt-ui
- Plugin architecture：https://developers.openai.com/plugins/concepts/plugins
- Extensions：https://developers.openai.com/plugins/build/extensions
- Plugin UI changelog：https://developers.openai.com/plugins/changelog
- docs llms.txt：https://developers.openai.com/llms.txt （Markdown 版：页面 URL 后加 `.md`）
- `openai/mcp-extensions`：https://github.com/openai/mcp-extensions
- mcp-extensions spec：https://github.com/openai/mcp-extensions/blob/main/docs/spec.md
- `openai/plugins`：https://github.com/openai/plugins
- `openai/apps-sdk-ui`（旧）：https://github.com/openai/apps-sdk-ui
- `openai/openai-apps-sdk-examples`（旧）：https://github.com/openai/openai-apps-sdk-examples
- ChatKit Widgets：https://developers.openai.com/api/docs/guides/chatkit-widgets
- Widget Builder：https://widgets.chatkit.studio

### 运行时 / 框架
- CopilotKit：https://github.com/CopilotKit/CopilotKit
- CopilotKit GenUI 教育仓库：https://github.com/CopilotKit/generative-ui
- CopilotKit A2UI 文档：https://docs.copilotkit.ai/generative-ui/a2ui
- CopilotKit MCP Apps 文档：https://docs.copilotkit.ai/generative-ui/mcp-apps
- CopilotKit AG-UI 文档：https://docs.copilotkit.ai/agentic-protocols/ag-ui
- Vercel AI SDK：https://github.com/vercel/ai
- AI SDK MCP Apps 文档：https://ai-sdk.dev/docs/ai-sdk-core/mcp-apps
- AI SDK Generative UI：https://ai-sdk.dev/docs/ai-sdk-ui/generative-user-interfaces
- Mastra OpenUI 集成：https://mastra.ai/integrations/agentic-ui/openui
- Mastra MCP Apps（appResources）：https://mastra.ai/reference/tools/mcp-server
- LangChain Agent Chat UI：https://github.com/langchain-ai/agent-chat-ui

### GitHub Copilot
- copilot-sdk：https://github.com/github/copilot-sdk
- awesome-copilot：https://github.com/github/awesome-copilot
- Copilot 的 MCP 概念（旧 Extensions 文档现重定向到这里）：https://docs.github.com/en/copilot/concepts/context/mcp
- Copilot changelog：https://github.blog/changelog/
- copilot-extensions 组织：https://github.com/copilot-extensions

### 本地 submodule 内关键文件（只读）
- `ag-ui/docs/concepts/generative-ui-specs.mdx`（三规范对照表 ★）
- `ag-ui/docs/agentic-protocols.mdx`（MCP/A2A/AG-UI 分层 ★）
- `ag-ui/docs/spec/1.0/changelog.mdx`（AG-UI 1.0 行为化）
- `ag-ui/skills/ag-ui-a2ui-integration/SKILL.md` + `sources.md`（AG-UI 作为 transport 的定位 ★）
- `ag-ui/middlewares/a2ui-middleware/`、`middlewares/mcp-apps-middleware/`（SEP-1865）
- `copilotkit/README.md:181-197`（三类 GenUI ★）
- `ai/content/docs/03-ai-sdk-core/17-mcp-apps.mdx`（AI SDK host 流程 ★）
- `mastra/docs/src/content/en/integrations/agentic-ui/openui.mdx`
- `mastra/packages/editor/CHANGELOG.md:2490`（SEP-1865 实现条目）
- `openai-apps-sdk-examples/README.md`（旧 Apps SDK 世界观，2026-04 后停更）
