# Generative UI 未来发展方向 · 网上调研（2026-10-13）

> 为 30 分钟内部技术分享「生成式 UI / 04 · 未来发展方向」做的广谱调研。
> 每条事实一行 + 出处 URL。所有 GitHub star / release 数据抓取时间：**2026-10-13**。
> 数据来源优先级：官方 spec / 官方 docs / 官方 blog / 仓库 README / npm registry / GitHub API。

---

## 1. Vercel / AI SDK 路线

| # | 事实 | 出处 |
| --- | --- | --- |
| 1.1 | `vercel-labs/json-render` 定位就是 "The Generative UI framework"：**18,646 stars**，2026-01-14 创建，Apache-2.0，TypeScript，最新 `v0.21.1`（2026-10-13） | https://github.com/vercel-labs/json-render |
| 1.2 | 建库 9 个月涨到 18.6k★，约 **69★/天** —— 是本轮 generative UI 里增长最快的仓库 | 由 1.1 的 `created_at` 与 stars 推算 |
| 1.3 | json-render 的官方卖点四条：**Guardrailed / Predictable / Fast(stream) / Cross-Platform**（外加 batteries-included 36 个 shadcn/ui 组件） | https://github.com/vercel-labs/json-render#readme |
| 1.4 | 官方站点 playground 显示 **41 components / 6 actions**（README 写 36 个 shadcn 组件，两处口径略有出入） | https://json-render.dev/ |
| 1.5 | 一次 catalog 定义，官方支持 **11 个渲染目标**：React、React Native、Remotion（视频）、react-pdf、react-email（HTML 邮件）、Vue、Svelte、Solid、Ink（终端 TUI）、Next.js（路由/SSR/metadata）、react-three-fiber（3D） | https://github.com/vercel-labs/json-render#readme |
| 1.6 | json-render 文档里已经把 **AI SDK / A2UI / AG-UI / Adaptive Cards / OpenAPI** 全部列为官方 integration —— 说明「框架」在主动吞并「协议」 | https://json-render.dev/docs |
| 1.7 | npm `@json-render/core` 月下载 **8,468,104** | https://api.npmjs.org/downloads/point/last-month/@json-render/core |
| 1.8 | Vercel AI SDK 本地 submodule 版本 `ai@7.0.137`（2026-10-10 的 commit） | `ai/packages/ai/package.json` |
| 1.9 | AI SDK 的官方 generative UI 文档路径仍是 **tool call → React 组件映射**：给模型 tools，模型调 tool，结果交给组件渲染 | https://github.com/vercel/ai/blob/main/content/docs/04-ai-sdk-ui/04-generative-user-interfaces.mdx |
| 1.10 | **AI SDK RSC 仍是 experimental**，官方明写 "We recommend using AI SDK UI for production" —— Vercel 自己放弃了「模型直接吐 React 组件」那条路，收回到结构化工具调用 | https://github.com/vercel/ai/blob/main/content/docs/05-ai-sdk-rsc/03-generative-ui-state.mdx |
| 1.11 | json-render 已经在做 `createMcpApp`（把 catalog 直接暴露成 MCP App），相关 open issue #393：input schema 会丢掉 `state`/`on`/`watch`，且 tool description 会把 catalog 埋掉 | https://github.com/vercel-labs/json-render/issues/393 |

**一句话**：Vercel 的答案 = 「**catalog（Zod schema）+ JSON 输出 + 多端渲染器**」，并且不发明协议、而是去兼容所有协议。

---

## 2. 协议收敛：MCP Apps / MCP-UI / A2UI / AG-UI 各自定位与状态

### 2.1 MCP Apps（交付层，事实标准）

| # | 事实 | 出处 |
| --- | --- | --- |
| 2.1.1 | MCP Apps 是 **MCP 的第一个官方 extension**，SEP-1865，2026-01-26 正式 live / "ready for production" | https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/ |
| 2.1.2 | SEP 由 **Anthropic + OpenAI 的 MCP Core Maintainer 与 MCP-UI 作者共同署名**：Anton Pidkuiko、Olivier Chafik、Ido Salomon、Liad Yosef、Nick Cooper、Sean Strong、Jerome Swannack、Alexi Christakis、Bryan Ashley | https://blog.modelcontextprotocol.io/posts/2025-11-21-mcp-apps/ |
| 2.1.3 | 机制：tool 用 `_meta.ui.resourceUri` 指向 `ui://` 资源 → host 在 **sandboxed iframe** 里渲染 → JSON-RPC over `postMessage` 双向通信 | https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/ |
| 2.1.4 | 上线时已 ship 的 host：**Claude（web+desktop）、Goose、VS Code（Insiders）、ChatGPT** | 同上（Client Support 段） |
| 2.1.5 | README 的 Supported Clients 徽章列表已扩到 **8 个 host**：ChatGPT、Claude、VS Code、Goose、Postman、MCPJam、mcp-use inspector、Alpic | https://github.com/modelcontextprotocol/ext-apps#supported-clients |
| 2.1.6 | `modelcontextprotocol/ext-apps`：**2,950★**，2025-11-21 创建；release 已到 **v2.0.3（2026-09-25）**；线上 spec 版本 `2026-01-26` | https://github.com/modelcontextprotocol/ext-apps/releases |
| 2.1.7 | v2 与 v1 **wire protocol 不变**：2.x View 能在 1.x host 跑，2.x host 能渲染 1.x View（有 migration guide） | https://github.com/modelcontextprotocol/ext-apps#readme |
| 2.1.8 | npm `@modelcontextprotocol/ext-apps` 月下载 **20,040,062** | https://api.npmjs.org/downloads/point/last-month/@modelcontextprotocol/ext-apps |
| 2.1.9 | 官方文档给 MCP Apps 的四条理由：Context preservation、Bidirectional data flow、集成 host 已连接的能力、Security guarantees（sandboxed iframe 拿不到父页 cookie） | https://modelcontextprotocol.io/docs/extensions/apps.md |
| 2.1.10 | 安全模型四层：iframe sandboxing、pre-declared templates（host 渲染前可审 HTML）、auditable JSON-RPC、UI 发起 tools/call 需用户确认 | https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/ |
| 2.1.11 | 仓库直接 ship **4 个 Agent Skills**：`create-mcp-app`、`migrate-oai-app`、`add-app-to-server`、`convert-web-app` —— 「让 AI coding agent 帮你建 MCP App」成为官方推荐路径 | https://github.com/modelcontextprotocol/ext-apps#build-with-agent-skills |
| 2.1.12 | OpenAI 侧已经改写为 **standards-first**：新 UI 用 MCP Apps 标准，`window.openai` 只保留标准没覆盖的扩展（checkout、file、modal、widgetState）；并给出对照表 `_meta["openai/outputTemplate"]` → `_meta.ui.resourceUri` | https://developers.openai.com/apps-sdk/mcp-apps-in-chatgpt.md |
| 2.1.13 | OpenAI 官方明确：**UI 是可选的**，"Keep the MCP tools useful without a component so ChatGPT and Codex can complete the workflow without UI" | 同上 |

### 2.2 MCP-UI（被 MCP Apps 吸收）

| # | 事实 | 出处 |
| --- | --- | --- |
| 2.2.1 | `idosal/mcp-ui` **5,210★**，2025-05-13 创建，仍活跃（2026-09-16 push），未 archive | https://github.com/idosal/mcp-ui |
| 2.2.2 | README 自己写明：MCP-UI "pioneered the concept"，"directly influenced the MCP Apps specification"，且 **`@mcp-ui/client` 是 MCP Apps Host 的推荐 SDK** | 同上 |
| 2.2.3 | MCP 官方 blog 口径："MCP-UI isn't going anywhere… If you're already using MCP-UI, keep using it." | https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/ |
| 2.2.4 | npm `@mcp-ui/client` 月下载 **1,337,081** | https://api.npmjs.org/downloads/point/last-month/@mcp-ui/client |
| 2.2.5 | 被点名采用 MCP-UI 的公司：**Postman、Shopify、Hugging Face、Goose、ElevenLabs** | https://blog.modelcontextprotocol.io/posts/2025-11-21-mcp-apps/ |

### 2.3 A2UI（描述层，厂商中立化中）

| # | 事实 | 出处 |
| --- | --- | --- |
| 2.3.1 | 仓库已从 `google/A2UI` 移到 **`a2ui-project/a2ui`**（中立组织）；**16,688★**，Apache-2.0，2025-09-24 创建 | https://github.com/a2ui-project/a2ui |
| 2.3.2 | 版本状态：**v0.9.1 = 当前稳定**，**v1.0 = release candidate**（v1.0 曾叫 0.10）；v0.8 为 legacy | https://github.com/a2ui-project/a2ui/blob/main/specification/v1_0/README.md |
| 2.3.3 | 设计哲学原文：**"safe like data, but expressive like code"** —— 声明式数据、不执行任意代码，host 侧维护 trusted catalog | https://github.com/a2ui-project/a2ui#readme |
| 2.3.4 | 渲染器状态：**stable = Web Core / Lit / Angular / Flutter(GenUI SDK) / React / Lynx**；**Planned = SwiftUI、Jetpack Compose**（roadmap 里定的是 Q2 2026，到 2026-06 的文档仍是 planned → 实际已滑期） | https://github.com/a2ui-project/a2ui/blob/main/docs/public/roadmap.md |
| 2.3.5 | 社区渲染器已经长出一大片：React/Vue/Svelte/Android Compose/Compose Multiplatform/React Native/SwiftUI(社区)/Ink 终端/Material3 …（A2UI 官方有专门的 renderers 页在跟踪） | https://github.com/a2ui-project/a2ui/blob/main/docs/public/ecosystem/renderers.md |
| 2.3.6 | 传输层已打通：**A2A、AG-UI（day-zero）、REST、WebSockets、MCP** 全部 Complete | https://github.com/a2ui-project/a2ui/blob/main/docs/public/roadmap.md |
| 2.3.7 | 生产落地（官方 case study）：**Google Opal**（"hundreds of thousands of people" 用它做 AI mini-apps）、**Gemini Enterprise**（forms / approval dashboards / workflow）、**Flutter GenUI SDK**（GenUI 底层就是 A2UI）、**Google ADK Web**（内置 A2UI 渲染） | https://github.com/a2ui-project/a2ui/blob/main/docs/public/ecosystem/a2ui-in-the-world.md |
| 2.3.8 | Opal Principal Engineer Dimitri Glazkov 原话："A2UI is foundational to our work… Its declarative nature and focus on security allow us to experiment quickly and safely." | 同上 |
| 2.3.9 | Gemini Enterprise 的 A2UI 目前**只在 self-serve + A2A 注册路径**可用；Vertex AI Agent Engine 的 managed agent（`adkAgentDefinition`）还不支持 | 同上 |
| 2.3.10 | npm 生态：`@a2ui/react` / `@a2ui/lit` / `@a2ui/web_core` 均为 **0.13.0**；另有 `@copilotkit/a2ui-renderer@1.79.0`、`@ag-ui/a2ui-toolkit@0.0.5` | https://registry.npmjs.org/-/v1/search?text=a2ui |
| 2.3.11 | roadmap 长期愿景四条：**Full App UIs（agent 可选）**、**Multi-Agent 协调同一 UI（含冲突解决）**、**Accessibility 一等公民（ARIA/读屏/键盘/对比度）**、**高级交互（拖拽/手势/3D/AR-VR 探索）** | https://github.com/a2ui-project/a2ui/blob/main/docs/public/roadmap.md |
| 2.3.12 | v1.0 稳定有硬门槛：**"Once a sufficient number of renderers are ported… There is a high bar for accepting breaking changes"**；Q4 2026 目标包含 "**Certification program for renderers**" | https://github.com/a2ui-project/a2ui/blob/main/specification/v1_0/README.md |

### 2.4 AG-UI（传输 / 交互层）

| # | 事实 | 出处 |
| --- | --- | --- |
| 2.4.1 | `ag-ui-protocol/ag-ui` **16,507★**，MIT，2025-05-07 创建；CopilotKit 出品 | https://github.com/ag-ui-protocol/ag-ui |
| 2.4.2 | 定义：**event-based 协议**，agent 发 ~16 种标准事件，支持任意 transport（SSE / WebSocket / webhook） | https://github.com/ag-ui-protocol/ag-ui#readme |
| 2.4.3 | 1.0 规范已发布，transport 有两种标准绑定：**HTTP+SSE（默认）** 与 **HTTP+Protobuf（二进制）**；事件分 8 个 family | https://docs.ag-ui.com/spec/1.0/index |
| 2.4.4 | 官方对自己定位的明确切割：**"AG-UI is not a generative UI specification — it's a User Interaction protocol"**；它是把 A2UI / MCP-UI / Open-JSON-UI 这些 GenUI spec 接到 app 上的运行时 | https://docs.ag-ui.com/concepts/generative-ui-specs |
| 2.4.5 | 协议栈分工金句：**MCP 给 agent 工具、A2A 让 agent 互相通信、AG-UI 把 agent 接进用户界面** | https://github.com/ag-ui-protocol/ag-ui#readme |
| 2.4.6 | `thesysdev/openui` **10,854★**，MIT，homepage 自称 "The Open Standard for Generative UI"，topics 已带 `ag-ui` | https://github.com/thesysdev/openui |
| 2.4.7 | `CopilotKit/CopilotKit` **38,003★**，描述已改为 "The Frontend Stack for Agents & Generative UI. React, Angular, Mobile, Slack… **Makers of the AG-UI Protocol**" | https://github.com/CopilotKit/CopilotKit |
| 2.4.8 | npm `@ag-ui/core` 月下载 **10,511,365** | https://api.npmjs.org/downloads/point/last-month/@ag-ui/core |

### 2.5 收敛的「总线」：三种 GenUI 已被统一叙述

| # | 事实 | 出处 |
| --- | --- | --- |
| 2.5.1 | CopilotKit 官方分类法：**Controlled（AG-UI）/ Declarative（A2UI、Open-JSON-UI）/ Open-ended（MCP Apps）**，AG-UI 是底下那条双向运行时 | https://github.com/CopilotKit/generative-ui |
| 2.5.2 | CopilotKit 的 playground 一个界面里同时跑三种：Static GenUI（React hooks）、MCP Apps（flight/hotel/trading）、A2UI（restaurant finder/booking forms） | https://github.com/CopilotKit/generative-ui-playground |
| 2.5.3 | A2UI 官方对比表把三者当作互补：A2UI=声明式 blueprint / MCP Apps=服务器预构建 HTML / AG-UI=高带宽协议 | https://github.com/a2ui-project/a2ui/blob/main/docs/public/introduction/agent-ui-ecosystem.md |
| 2.5.4 | A2UI 侧正在做 **A2UI over MCP** + **A2UI in MCP Apps** 两个 bridge（文档已有专门章节） | https://a2ui.org/ |
| 2.5.5 | AG-UI 官方表里列了三家 GenUI spec：**A2UI（Google）、Open-JSON-UI（OpenAI）、MCP-UI（标为 "Microsoft + Shopify"）** —— 注：这张表已过时/有争议，MCP Apps 官方 blog 把 MCP-UI 记为 Ido Salomon & Liad Yosef 及社区，且 MCP Apps 已取代其地位 | https://docs.ag-ui.com/concepts/generative-ui-specs |
| 2.5.6 | **WebMCP（W3C webmachinelearning/webmcp，4,621★）正在和 MCP Apps 收敛**：ext-apps #797 提出 `text/html;profile=webmcp` mime type + `document.modelContext.registerTool`；#796 提 thin bridge | https://github.com/modelcontextprotocol/ext-apps/issues/797 |
| 2.5.7 | MCP 治理变化：**2025-12-09 MCP 加入 Agentic AI Foundation**；spec 有正式 feature lifecycle 与 deprecation policy | https://blog.modelcontextprotocol.io/posts/2025-12-09-mcp-joins-agentic-ai-foundation/ |

---

## 3. 近一年（2025H2–2026）重要项目与信号

### 3.1 热门仓库（按 stars，2026-10-13）

| 项目 | ★ | 创建 | 定位 |
| --- | --- | --- | --- |
| CopilotKit/CopilotKit | 38,003 | 2023-06 | Agent 前端栈 + Generative UI，AG-UI 作者 |
| vercel-labs/json-render | 18,646 | **2026-01** | Generative UI framework（catalog + JSON） |
| a2ui-project/a2ui | 16,688 | 2025-09 | Agent-to-User Interface 开放标准 |
| ag-ui-protocol/ag-ui | 16,507 | 2025-05 | Agent-User Interaction Protocol |
| tambo-ai/tambo | 11,188 | 2024-06 | React Generative UI SDK（详见 3.3，Cloud 已关停） |
| thesysdev/openui | 10,854 | 2024-12 | OpenUI Lang，token 最省的 GenUI 格式 |
| mcp-use/mcp-use | 10,755 | 2025-03 | fullstack MCP / MCP Apps 框架 |
| excalidraw/excalidraw-mcp | 5,518 | **2026-02** | "Fast and streamable Excalidraw MCP App" —— MCP Apps 的旗舰 demo |
| CopilotKit/OpenIntelligentUI | 3,056 | **2026-03** | 开箱可用的 agentic UI 界面 |
| modelcontextprotocol/ext-apps | 2,950 | 2025-11 | MCP Apps 官方规范 + SDK |
| AGenUI/AGenUI | 1,197 | — | iOS/Android/HarmonyOS 原生 A2UI 渲染器 |
| PrefectHQ/prefab | 743 | **2026-02** | "generative UI framework that even humans can use"（server-side 组件库发 A2UI） |

### 3.2 其他信号

| # | 事实 | 出处 |
| --- | --- | --- |
| 3.2.1 | MCP Apps 从提案到 production 只用了 **2 个月**（2025-11-21 SEP → 2026-01-26 live） | https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/ |
| 3.2.2 | MCP 主 spec 节奏：2025-11-25（一周年）→ 2026-07-28。**2026-07-28 是破坏性大改**：protocol-level session 与 initialize handshake 被删除（SEP-2575 / SEP-2567），新增 `server/discover`，list 结果可缓存（SEP-2549） | https://blog.modelcontextprotocol.io/posts/mcp-roadmap/ |
| 3.2.3 | 同一版本里 Tasks 被移出核心成为 extension（SEP-2663），server-initiated request 被 **Multi Round-Trip Requests**（SEP-2322）取代 | 同上 |
| 3.2.4 | MCP 2026-08 新 roadmap 五大 priority：**Agentic messaging primitives / HTTP-native transport 统一与加固 / Agent identity & enterprise security / 改进 primitives / SDK DX** | 同上 |
| 3.2.5 | 企业侧推进：issuer validation、issuer-bound client credentials、**CIMD（Client ID Metadata Documents）** 成为首选注册路径、Enterprise-Managed Authorization 转 stable | 同上 |
| 3.2.6 | VS Code 把 MCP 当「合同」在实现：2026-01-26 发博《Giving Agents a Visual Voice: MCP Apps Support in VS Code》 | https://code.visualstudio.com/blogs/2026/01/26/mcp-apps-support |
| 3.2.7 | 三家 host 文档都在教「从 OpenAI Apps SDK 迁移到 MCP Apps」：ext-apps 有 `migrate-oai-app` skill，Claude 文档也有 "Migrate from the OpenAI Apps SDK" 章节 | https://claude.com/docs/connectors/building/mcp-apps/getting-started |
| 3.2.8 | **生态出清信号**：Tambo 官方公告 **Tambo Cloud 2026-10-31 关停**，数据 2026-11-30 删除，团队转去做 Charming；开源部分鼓励 self-host | https://tambo.co/blog/posts/tambo-is-shutting-down |
| 3.2.9 | OpenUI（thesys）已商业化出 **Cloud Gateway + Observability（early access）**，商业模型是「一个 endpoint 跨所有模型 + agent 分析」 | https://www.openui.com/ |

---

## 4. 真实痛点与开放问题（可直接拿去讲「还没解决什么」）

### 4.1 安全 / CSP / sandbox（最集中的火力点）

| # | 问题 | 出处 |
| --- | --- | --- |
| 4.1.1 | **已确认的实现 bug**：#761 "Sandbox proxy does not apply `_meta.ui.csp` from the UI resource, so `resourceDomains` has no effect" —— 也就是服务器声明了 CSP 却根本不生效 | https://github.com/modelcontextprotocol/ext-apps/issues/761 |
| 4.1.2 | #434 要求把 CSP 默认值从 **MUST 降为 SHOULD**；#669 要求定义 **Apps 安全/CSP 行为的 breaking-change 流程** | https://github.com/modelcontextprotocol/ext-apps/issues/434 · https://github.com/modelcontextprotocol/ext-apps/issues/669 |
| 4.1.3 | #605 / #667 要求支持 `wasm-unsafe-eval` 才能跑 WebAssembly；#515 要求澄清 `*` 与 scheme-based 策略；#387 要求 `frameDomains` → `frame-src` 映射 | https://github.com/modelcontextprotocol/ext-apps/issues/605 |
| 4.1.4 | 官方 SEP 本身已经有 #58 "Sandbox capabilities"、#717 "Relax double sandboxed iframe architecture"、#716 "decouple rendering requirements from double-sandbox architecture" —— 双 iframe 架构被质疑过重 | https://github.com/modelcontextprotocol/ext-apps/issues/717 |
| 4.1.5 | spec 强制要求 sandbox proxy 与 host **不同 origin**，且 sandbox 必须带 `allow-scripts` + `allow-same-origin`（安全上最敏感的两种权限组合），同时 `object-src 'none'` | https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx |
| 4.1.6 | 若 `ui.csp` 缺省，host **MUST** 施加 restrictive default（默认全禁）—— 开发者不写 CSP 就大概率一片空白 | 同上 |

### 4.2 一致性 / 互操作 / 命名空间

| # | 问题 | 出处 |
| --- | --- | --- |
| 4.2.1 | #755 "MCP spec conformance: **10 requirements violated** （via @hasmcp/mcp-spec-test）— spec 2026-07-28"；#756 同工具对 2025-11-25 报了 5 条 | https://github.com/modelcontextprotocol/ext-apps/issues/755 |
| 4.2.2 | #742 "Documentation for MCP Apps does not match 2026-07-28 specification" —— 文档与规范脱节 | https://github.com/modelcontextprotocol/ext-apps/issues/742 |
| 4.2.3 | #743 提出 **Host Test Interface + Conformance Suite**，理由原文："Today the runner drives each host through browser automation with per-host shims… That does not scale and couples every test to a host's DOM" —— 多 host 一致性验证仍是手工作业 | https://github.com/modelcontextprotocol/ext-apps/issues/743 |
| 4.2.4 | #753 "Widget `callServerTool` calls hardcode bare tool names, **breaking under multi-server MCP hosts**" | https://github.com/modelcontextprotocol/ext-apps/issues/753 |
| 4.2.5 | #745 "Apps cannot call their server's tools through a **namespacing aggregator**" | https://github.com/modelcontextprotocol/ext-apps/issues/745 |
| 4.2.6 | #746 "**No way to distinguish an app-initiated `tools/call` from a model-initiated one**" —— 审计与溯源缺口 | https://github.com/modelcontextprotocol/ext-apps/issues/746 |
| 4.2.7 | #797 提 WebMCP 与 MCP Apps 要融合，但两边工具注册模型完全不同（`document.modelContext.registerTool` vs `ui://` resource） | https://github.com/modelcontextprotocol/ext-apps/issues/797 |

### 4.3 跨端漂移（A2UI 的实验室）

| # | 问题 | 出处 |
| --- | --- | --- |
| 4.3.1 | #3175 "**Cross-platform misalignment** on v1.0 ValidationResult truthiness and non-boolean 'valid' fields" | https://github.com/a2ui-project/a2ui/issues/3175 |
| 4.3.2 | #3172 "[Swift] v1.0 `formatString` renders `{"path":…}` instead of the bound value" | https://github.com/a2ui-project/a2ui/issues/3172 |
| 4.3.3 | #3164 "[Swift] Enforce `surfaceID` XOR `functionCallID` on `GenericError` **without trapping at runtime**" | https://github.com/a2ui-project/a2ui/issues/3164 |
| 4.3.4 | #3158 "@a2ui/react 0.13.0 throws `HTMLElement is not defined` **on import in Node**（regression from 0.12.0）" —— SSR 侧还没稳 | https://github.com/a2ui-project/a2ui/issues/3158 |
| 4.3.5 | #3155 "Direct JSON prompt: list common types **once instead of bundling them into every catalog schema**" —— 提示词膨胀问题在官方 issue 里被反复讨论 | https://github.com/a2ui-project/a2ui/issues/3155 |
| 4.3.6 | #3165 "Inline catalogs: reject unresolvable local refs at load and report dropped id conflicts" —— catalog 合并冲突 | https://github.com/a2ui-project/a2ui/issues/3165 |

### 4.4 组件目录 / 校验 / SSR（json-render 侧）

| # | 问题 | 出处 |
| --- | --- | --- |
| 4.4.1 | #378 "multi-component catalogs **accept invalid concrete props**" —— 目录变大后校验开始漏 | https://github.com/vercel-labs/json-render/issues/378 |
| 4.4.2 | #369 FR: "Allow SSR for `@json-render/react`" —— 服务端渲染还没支持 | https://github.com/vercel-labs/json-render/issues/369 |
| 4.4.3 | #354 "`handlers()` **silently drops actions** when `getSetState()` returns undefined" —— 静默失败 | https://github.com/vercel-labs/json-render/issues/354 |
| 4.4.4 | #355 shadcn Grid/Stack 不响应式（固定 `grid-cols-N`、无 `min-w-0`） | https://github.com/vercel-labs/json-render/issues/355 |
| 4.4.5 | #367 FR: 条件里要支持 directive（`visible` / `$cond`）—— 条件渲染表达力被质疑 | https://github.com/vercel-labs/json-render/issues/367 |

### 4.5 提示词成本 / 上下文挤占（AG-UI 官方 draft 里点名）

| # | 问题（原文） | 出处 |
| --- | --- | --- |
| 4.5.1 | "**OpenAI enforces a limit of 1024 characters for tool descriptions.** Gemini and Anthropic impose no such limit." | https://docs.ag-ui.com/drafts/generative-ui |
| 4.5.2 | "**Classes, nesting, `$ref`, and `oneOf` are not reliably supported across LLM providers.**" —— 复杂 schema 不可靠，直接影响 catalog 设计 | 同上 |
| 4.5.3 | "**Injecting a large UI description language into an agent may reduce its performance.** Agents dedicated solely to UI generation perform better than agents combining UI generation with other tasks." —— 与本次分享「把题目改简单」的结论完全同构 | 同上 |
| 4.5.4 | 该 draft 的动机本身就是痛点："Currently, creating custom user interfaces for agent interactions **requires programmers to define specific tool renderers**. This limits the flexibility." | 同上 |

### 4.6 评测 / 可观测性（刚开始有人做）

| # | 事实 | 出处 |
| --- | --- | --- |
| 4.6.1 | A2UI 仓库内有完整的 **eval/** 目录：`a2ui_eval`（dataset / scorers / run_ci_evals / report_evals）、`datasets/core_v0_9_1.yaml`、`datasets/core_v1_0.yaml`、`multi_turn_conversation_dataset.yaml`，并接进 CI | https://github.com/a2ui-project/a2ui/tree/main/eval |
| 4.6.2 | 另有独立的 **conformance/** 套件（agent / core / extensions / test_data），且有机械化产出：issue #3163 "chore: **weekly compliance audit report** (2026-10-13)" | https://github.com/a2ui-project/a2ui/tree/main/conformance · https://github.com/a2ui-project/a2ui/issues/3163 |
| 4.6.3 | A2UI 有 `iterative_format_optimizer` —— 用评测结果反过来改格式/提示词 | https://github.com/a2ui-project/a2ui/tree/main/eval |
| 4.6.4 | MCP Apps 侧在推 Conformance Suite + host 认证接口（见 4.2.3） | https://github.com/modelcontextprotocol/ext-apps/issues/743 |
| 4.6.5 | OpenUI 把 **Observability**（agent 产品分析）做成商业产品 | https://www.openui.com/ |
| 4.6.6 | json-render 内置 **Devtools** 与 Code Export | https://json-render.dev/docs |

---

## 5. 可量化的数字（可直接上幻灯片）

### 5.1 生态体量（npm 月下载，2026-10-13 抓取）

| 包 | 月下载 |
| --- | --- |
| `@modelcontextprotocol/ext-apps` | **20,040,062** |
| `@ag-ui/core` | **10,511,365** |
| `@json-render/core` | **8,468,104** |
| `@mcp-ui/client` | **1,337,081** |
| `@openuidev/react-lang` | **703,537** |
| `mcp-use` | **152,779** |
| `@tambo-ai/react` | **26,405** |

出处：`https://api.npmjs.org/downloads/point/last-month/<pkg>`

### 5.2 结构化输出的「良率」已经很高了（OpenUI 公开 benchmark）

- 测试规模：**31 个模型**模型榜；另有 **6 个模型 × 3 种格式（OpenUI / A2UI / json-render）** 的格式对比
- 模型榜 top：**Grok 4.6 99.5% @ $0.0185/task**、**GPT-5.6 Sol 99.5% @ $0.0476**、**Claude Opus 4.8 98.9% @ $0.0493**、**Gemini 3.7 Flash 98.9% @ $0.0100**
- 低成本端：**DeepSeek V4 Flash 85.8% @ $0.0004/task**、**Inkling Small 88.6% @ $0.0033**、**GPT-5.6 Luna 83.7% @ $0.0022**
- 结论可用：头部模型的结构有效性已经 98–99.5%，**「模型不会写」已不是主要瓶颈，格式与结构才是**（且成本差 100 倍以上）
- 出处：https://www.openui.com/benchmarks

### 5.3 格式本身能省的 token / 时间

- OpenUI 官方口径：**OpenUI Lang 比 JSON 少最多 67% token**；官网同期写 **"Renders 3x faster with 67% fewer tokens when compared to JSON based formats"**
- 出处：https://github.com/thesysdev/openui · https://www.openui.com/

### 5.4 采用面

- MCP Apps host：上线时 **4 家**（Claude / Goose / VS Code / ChatGPT），现文档面 **8 家**（+ Postman / MCPJam / mcp-use / Alpic）
- A2UI 官方渲染器：**5 个 stable**（Web Core / Lit / Angular / Flutter / React）+ Lynx；**2 个 planned**（SwiftUI / Jetpack Compose）
- A2UI 生产案例：Google Opal（官方称 **"hundreds of thousands of people"**）、Gemini Enterprise、Flutter GenUI、ADK Web
- MCP 主 spec：2025-11-25 → 2026-07-28 两版；MCP Apps 从 SEP 到 production **2 个月**

---

## 6. 给内部技术分享用：8 条最值得讲的趋势判断

> 每条都能挂到上面的事实出处。

### ① UI 正在变成「协议里的一等公民」，而不是每个客户端各自的定制
当 server 用 `_meta.ui.resourceUri` 声明 UI、host 用沙箱 iframe 渲染，开发者**第一次可以写一次 UI 跑在 ChatGPT / Claude / VS Code / Goose 上**。MCP Apps 是 MCP 历史上**第一个官方 extension**，并且在 2 个月内从提案走到 production。
→ 依据 2.1.1、2.1.4、3.2.1、2.1.6

### ② 赛道已经分层，别再问「谁赢」：传输层 / 描述层 / 交付层
AG-UI 官方自己出来切割："AG-UI is not a generative UI specification"；A2UI 官方给出三方互补对比表；CopilotKit 把三种方案归纳成 Controlled / Declarative / Open-ended。**它们不是竞品，是栈。**
→ 依据 2.4.4、2.5.1、2.5.3、2.4.5

### ③ 两种哲学长期并存，因为取舍是真实的：**沙箱 HTML vs 声明式 JSON**
MCP Apps = 服务器拥有全部外观，隔离靠 iframe；A2UI = host 拥有外观与主题，安全靠「只传数据不传代码」（"safe like data, but expressive like code"）。**选哪个取决于「谁该负责品牌一致性」和「谁敢执行第三方 HTML」**，这是产品问题不是技术问题。
→ 依据 2.3.3、2.5.3、2.1.9

### ④ 下一波主战场是「跨端」，不是「更聪明的模型」
json-render 一份 catalog 出 11 个渲染目标（含视频、PDF、邮件、终端 TUI、3D）；A2UI 已有 5 个官方 stable 渲染器 + Lynx + 一大堆社区渲染器（React/Vue/Svelte/Compose/RN/SwiftUI）。**「一份意图、多端各用自己组件渲染」正在从卖点变成入场券。**
→ 依据 1.5、2.3.4、2.3.5

### ⑤ 成本瓶颈已经从「模型能力」转移到「格式设计」
头部模型的结构有效性 98–99.5%（Grok 4.6 / GPT-5.6 都是 99.5%），而不同格式之间 **token 能差 67%**。AG-UI 的 draft 还明确写了：把大段 UI 语言塞进 agent **会降低它的整体表现**，"Agents dedicated solely to UI generation perform better"。
→ 依据 5.2、5.3、4.5.3、4.5.1

### ⑥ 治理与安全是当前**最真实、且尚未解决**的难点
不是理论风险，是挂在 issue 里的实现缺口：**服务器声明的 CSP 根本不生效**（#761）、conformance 测试一次报出 **10 条违反**（#755）、**无法区分「App 发起的 tools/call」和「模型发起的」**（#746）、多 MCP server 下工具命名空间直接崩（#753 / #745）、双 iframe 沙箱被质疑过重（#716 / #717）。
→ 依据 4.1.1、4.2.1、4.2.6、4.2.4、4.1.4

### ⑦ 评测 / 一致性 / 可观测性正在成为工程化标配（而且是自动化的）
A2UI 把 eval 与 conformance **接进了 CI**，还自动产出「每周合规审计报告」；用 `iterative_format_optimizer` 拿评测结果反过来改格式；MCP Apps 在做 host conformance suite；A2UI 路线图把「渲染器认证计划」写进 v1.0；OpenUI 把 Observability 做成商品。
→ 依据 4.6.1、4.6.2、4.6.3、4.6.4、2.3.12、4.6.5

### ⑧ 生态开始出清与合并：标准吸收项目，弱玩家退场
MCP-UI（5.2k★）**把自己并进了 MCP Apps**，还成为 host 的推荐 SDK；A2UI 从 `google/A2UI` 迁移到中立的 `a2ui-project`；MCP 加入 Agentic AI Foundation；**Tambo Cloud 宣布 2026-10-31 关停**；WebMCP 正在和 MCP Apps 收敛。**押协议比押框架更安全。**
→ 依据 2.2.2、2.3.1、2.5.7、3.2.8、2.5.6

---

## 7. 边缘信号（时间够可以加两句）

- **「给 agent 的 skill」成了交付 SDK 的新方式**：MCP Apps 仓库直接 ship 4 个 Agent Skills，官方推荐「让你的 coding agent 帮你建」 → https://github.com/modelcontextprotocol/ext-apps#build-with-agent-skills
- **OpenAI 官方把 UI 定义为可选**：先把 MCP tools 做得好用，UI 是增强项，不是前提 → https://developers.openai.com/apps-sdk/mcp-apps-in-chatgpt.md
- **A2UI 的长期愿景里有两条很值得提前布局**：Multi-Agent 协调同一块 UI（含冲突解决）、Accessibility 一等公民（ARIA / 读屏 / 键盘 / 对比度） → https://github.com/a2ui-project/a2ui/blob/main/docs/public/roadmap.md
- **AG-UI 的 draft（未落地）**：不做自定义 tool renderer、由 AI 直接产出界面 → https://docs.ag-ui.com/drafts/generative-ui

---

## 8. 调研方法与可信度说明

- GitHub star / created_at / release / issue 全部来自 **GitHub REST API**（`gh api`，已认证），抓取时间 **2026-10-13**。
- npm 下载量来自 **npm registry downloads API**，窗口为「最近一个月」。
- 网页正文用 `curl` + 去标签提取；`developers.openai.com`、`docs.ag-ui.com`、`modelcontextprotocol.io`、`claude.com/docs` 均支持在 URL 后加 `.md` 取 Markdown 版本，引用以此为准。
- **注意两处口径冲突**，讲的时候建议避开细节：① json-render 组件数（README 说 36，官网 playground 显示 41）；② AG-UI 文档把 MCP-UI 标注为 "Microsoft + Shopify"，与 MCP 官方 blog（Ido Salomon / Liad Yosef 及社区）不一致。
- 搜索式引擎（DuckDuckGo / Bing）在当前网络下被拦截或返回污染结果，因此**未采用任何二手聚合文章**，全部结论来自一手文档与 API。
