# CopilotKit：可引用事实 + 官方路线图（生成式 UI 分享素材）

> 核对时间：2026-10-14。本地仓库 `/Users/work/ai/copilotkit`（`main` HEAD `04bc56a`，2026-10-09 23:00 UTC）。
> ⚠️ 路径说明：`docs` 是指向 `showcase/shell-docs` 的符号链接，文档源码实际在 `showcase/shell-docs/src/content/`；下文一切路径均为仓库内真实路径。
> 采集方式：本地 grep + 线上 `raw.githubusercontent.com` / npm registry / 官网与博客（`r.jina.ai` 转发）。`api.github.com` 当日未认证配额已耗尽（403 `rate limit exceeded ... 60/h`），GitHub Releases API 用 npm 版本与 raw CHANGELOG 替代。
> 关联笔记：`notes/generative-ui/future/ag-ui.md`（AG-UI 协议细节）、`notes/generative-ui/future/openai-mcp-apps.md`（MCP Apps 规范细节）。

## 已发布事实

### 版本与发布节奏

- **Monorepo lockstep 版本**：`@copilotkit/react-core` / `runtime` / `core` / `a2ui-renderer` / `mcp-apps-renderer` / `vue` / `react-native` / `web-components` 共用一个版本号。
  - 本地仓库快照 = **1.78.0**（`CHANGELOG.md` 首条：`1.78.0 - 2026-10-09`）。
  - npm `dist-tags.latest` = **1.79.0**，发布时间 **2026-10-12T17:30Z**（`https://registry.npmjs.org/@copilotkit/react-core`，2026-10-14 抓取；raw `main` CHANGELOG 已有 `1.79.0 - 2026-10-12`）。
- **独立版本线**：`@copilotkit/angular` latest **0.5.3**（2026-10-07）、`@copilotkit/channels` latest **0.11.0**（2026-09-22）。出处：npm registry（2026-10-14）。
- 最新主线条目：
  - **1.79.0 – 2026-10-12**：Learning 点击控件隐私安全标签；请求头改为每个请求求值（breaking：`headers` builder 每请求执行，切用户需 remount provider）。
  - **1.78.0 – 2026-10-09**：`react-core` 为每个 learning object 自动启动 Trajectory 捕获（breaking，可 `autoStart: false` 关闭）。
  - 出处：`CHANGELOG.md`；raw `https://raw.githubusercontent.com/CopilotKit/CopilotKit/main/CHANGELOG.md`。
- CHANGELOG 本身的新机制："per-release-lane `CHANGELOG.md`，release / publish 读回作为 GitHub Release body"（1.71.0, 2026-09-09 引入）。说明其发布/变更日志现在源码可控。

### 官方生成式 UI 分类法（仓库里并存两套表述，实质一致）

- **README 三分类（对外叙述，最常被引用）**：**Static (AG-UI Protocol)** / **Declarative (A2UI)** / **Open-Ended (MCP Apps & Open JSON)**。出处：`README.md` 的 "Generative UI → Compare the Three Types" 小节（附对比图 `assets/...962f49c2...`）。
- **官方 Spectrum 页面四档（最完整、可作权威出处）**，`https://www.copilotkit.ai/generative-ui-spectrum`（抓取 2026-10-14）：
  1. **Controlled Generative UI** — 开发者预置组件，agent 只选"渲染哪个组件、传什么数据"。
  2. **Declarative Generative UI** — 开发者声明 catalog 积木，agent 运行时组装 UI 树。
  3. **MCP Apps** — 通过 iframe 注入第三方 applet（"super hosts" 场景）。
  4. **Fully Open Generative UI** — agent 自己写 markup/layout/styling，host 在 sandbox 渲染。
- **文档 concepts 页（6 个 primitive + 三档）**：Components as Tools / Tool Call Rendering / State Rendering / Reasoning / A2UI / MCP Apps，并沿 **Controlled → Declarative → Open-Ended** 归并。出处：`showcase/shell-docs/src/content/docs/concepts/generative-ui-overview.mdx`。
- **showcase 仓库三分类（含 API 与协议归属）**：Controlled → AG-UI；Declarative → A2UI + Open-JSON-UI；Open-ended → MCP Apps / Custom UIs。出处：`examples/showcases/generative-ui/README.md`。
- **旧提法**：`docs/generative-ui/index.mdx` 仍列 "Display Only / Interactive / Tool Rendering / State Rendering / MCP Apps / A2UI"，是历史导航，且链接 `/generative-ui/your-components`（该页文件不存在，属陈旧链接）。

### 每类对应的 API 与成熟度

| 档位 | v2 API / 机制 | 成熟度表述 | 出处 |
|---|---|---|---|
| Controlled | `useComponent`（组件即前端工具）、`useFrontendTool`、`useRenderTool`、`useDefaultRenderTool`、`useInterrupt`、`useAgentContext` | Spectrum 称 "workhorse"，面向品牌关键高频面；文档无 beta 标签 | `concepts/generative-ui-overview.mdx`、`generative-ui/tool-based.mdx`、`tool-rendering.mdx`、`interactive.mdx` |
| Declarative | A2UI：provider `a2ui={{ catalog }}`、runtime `a2ui: { injectA2UITool }`、`createA2UIMessageRenderer`（`@copilotkit/a2ui-renderer`）；runtime 注入 `generate_a2ui` 工具 | 官方称已 ship、可用于生产；无 beta 标签 | `docs/generative-ui/a2ui/index.mdx` |
| Open-Ended | Open Generative UI：`OpenGenerativeUIMiddleware` + 内置 `OpenGenerativeUIActivityRenderer`；MCP Apps：`MCPAppsMiddleware` + 内置 `MCPAppsActivityRenderer` | Spectrum 原话：Open GenUI "**realistically still mostly experimental today**"；MCP Apps "not yet a good fit for non-web surfaces … (today the integration is iframe-only)" | `generative-ui/open-generative-ui.mdx`、`generative-ui/mcp-apps.mdx`、`copilotkit.ai/generative-ui-spectrum` |

> 注：文档**没有**使用 `stable / beta / alpha / experimental` 徽标或 frontmatter 字段（已 grep `showcase/shell-docs/src/content/docs/generative-ui/`，无命中）；唯一的成熟度判断来自 Spectrum 页面的文字描述。

### v1 → v2 迁移与废弃（"未来主线"的关键）

- 官方明确：**CopilotKit v1 SDK is deprecated**，v2 为当前 API 表面。v1/v2 至少**共存两个 minor**，移除 v1 属未来 **major** 变更（本迁移不删除 v1）。
- 导入路径迁移：`@copilotkit/react-core` → `@copilotkit/react-core/v2`；`@copilotkit/react-ui` → `react-core/v2`；`@copilotkit/runtime` → `@copilotkit/runtime/v2`；`@copilotkit/vue` → `@copilotkit/vue/v2`。
- Hook 映射：`useCopilotAction → useFrontendTool`、`useCopilotReadable → useAgentContext`、`useCoAgent → useAgent`、`useCopilotChat → useAgent`（headless：`useCopilotChatHeadless_c`）。
- 旧 hook 去向：`useCoAgentStateRender` 与 `useCopilotChatSuggestions` 在仓库中只保留于 `v1-deprecated-compatibility.ts`（v1 兼容层）；v2 对应改用 `useAgent`（订阅 `agent.state`；state-rendering 示例标题为 "useAgent subscription"）与 `useSuggestions`。出处：`packages/react-core/src/v1-deprecated-compatibility.ts:301,476`；`packages/react-core/src/v2/hooks/use-suggestions.tsx`；`docs/generative-ui/state-rendering.mdx`。
- 出处：`showcase/shell-docs/src/content/docs/migrate/v2.mdx`。

### A2UI

- **CopilotKit 有内置 A2UI 支持，且有独立包 `@copilotkit/a2ui-renderer`**（非 private）：本地 1.78.0；npm `dist-tags.latest = 1.79.0`（2026-10-12）。包描述："A2UI Renderer for CopilotKit – render A2UI surfaces in React applications"。出处：`packages/a2ui-renderer/package.json`；npm registry。
- 依赖 `@a2ui/web_core`（仓库 pin **0.10.4**；npm latest **0.13.0**，2026-10-09）；源码注释写明实现 **A2UI v0.9** 类型（`packages/a2ui-renderer/src/a2ui-types.ts`："v0.9 A2UI type definitions"）。npm 上另有分支标签 `pr = 0.0.0-a2ui-v0-9-latest-20260408115931`（A2UI v0.9 期）。
- **定位**：A2UI 由 **Google 主导，CopilotKit 是 launch & design partner**；CopilotKit 提供 **zero-day / day-zero support**。出处：`docs/generative-ui/a2ui/index.mdx`（"led by Google with CopilotKit as a launch and design partner"）；`docs/whats-new/a2ui-launch.mdx`（"launch partner"、"zero-day support"、"built by CopilotKit engineers" 的 A2UI Composer）。
- **两种用法**：Dynamic Schema（次级 LLM 生成 schema + data，runtime 注入 `generate_a2ui`）/ Fixed Schema（预写 JSON schema，agent 只流数据）。wire 三操作：`createSurface → updateComponents → updateDataModel`。Python SDK 提供 `copilotkit.a2ui.*` helpers。出处：`docs/generative-ui/a2ui/index.mdx`。
- 事件时间线：`docs/whats-new/index.mdx` 记 A2UI 发布为 **December 15, 2025**（"A2UI Launches Today"，与 Google 合作、launch partner）；CapilotKit 博客《A2UI v0.9: What's New in Google's Generative UI Spec》发布于 **2026-04-17**（Google A2UI v0.9 同日，v0.9 引入 prompt-first 生成、双向消息、模块化 schema、Agent SDK）。
- Angular 侧有破坏性变更：**1.75.1（2026-09-29）"render A2UI without Lit and support web component catalog"**（`feat(angular)!`）。出处：`CHANGELOG.md` 1.75.1。

### AG-UI 关系

- README 官方表述（可上幻灯片）：**"We are the company behind the AG-UI Protocol — adopted by Google, LangChain, AWS, Microsoft, Mastra, PydanticAI, and more!"** 出处：`README.md`。
- 文档：**"AG-UI is an open standard, developed by the CopilotKit team and several agent framework partners."** CopilotKit 用 AG-UI 抽象 app ↔ agent 连接（灵活性、统一通信、前端工具调用、状态管理）。出处：`docs/agentic-protocols/ag-ui.mdx`。
- Spectrum 页补充："AG-UI emerged from a partnership between CopilotKit and LangChain, with CrewAI joining shortly after … First-party integrations from Google (ADK, A2UI), Microsoft, Amazon (AWS Strands, AgentCore), Oracle …"
- **CopilotKit 已采用 AG-UI 1.0**：`@ag-ui/core`/`client`/`encoder`/`proto` 升到 1.0.0；本地多数包 pin `@ag-ui/client`、`@ag-ui/core` = **1.0.2**。出处：`docs/migrate/ag-ui-1.0.mdx`；`packages/*/package.json`。
- **AG-UI 1.0 于 2026-09-30 公布**（CopilotKit 博客《Introducing AG-UI 1.0》发布日期 2026-09-30）：stable specification + JSON Schema；TypeScript/Python/.NET SDK 由 schema 生成；新增 subagent、metadata、多模态工具结果、HITL interrupts、token usage，向后兼容。旁证：博客《AG-UI Protocol Explained in 60 seconds》（2026-10-05）称 "AG-UI just hit 1.0 with a stable specification"。

### MCP Apps / OpenAI 互操作

- **CopilotKit 内置 MCP Apps 支持，独立包 `@copilotkit/mcp-apps-renderer`**（非 private）：本地 1.78.0；npm latest 1.79.0。依赖 `@modelcontextprotocol/ext-apps@^1.7.5`、`@modelcontextprotocol/sdk@^1.29.0`、`@copilotkit/shared`，peer `@ag-ui/client >=0.0.59`。包描述强调 "framework-agnostic MCP Apps host … consumed by the React, Vue, and Angular frontends"。出处：`packages/mcp-apps-renderer/package.json`。
- 接入：runtime 配 `mcpApps.servers`（或 `MCPAppsMiddleware` 挂 agent）→ runtime 自动抓取 tool 对应的 UI resource，发出 `activity` 事件，内置 `MCPAppsActivityRenderer` 渲染为 sandboxed iframe；支持 http / sse 传输，thread 持久化恢复。出处：`docs/generative-ui/mcp-apps.mdx`。
- 依赖的 AG-UI 中间件：`@ag-ui/mcp-apps-middleware`（本地 `^0.1.1`；npm latest **0.1.2**，2026-10-08）。CHANGELOG 1.71.2 记 "Advertises and consumes the January MCP Apps MIME type correction (`text/html;profile=mcp-app`)"。出处：`packages/*/package.json`；`CHANGELOG.md`。
- **OpenAI 侧**：CopilotKit 把 **Open-JSON-UI** 列为 declarative 规格之一 —— "Open-JSON-UI | OpenAI | An open standardization of OpenAI's internal declarative Generative UI schema"。规格对照表明确：A2UI=Google、Open-JSON-UI=OpenAI、MCP Apps=MCP 生态。出处：`showcase/shell-docs/src/content/snippets/shared/generative-ui-specs-overview.mdx`；`examples/showcases/generative-ui/README.md`。
- 本地示例 `examples/showcases/open-mcp-client/apps/mcp-use-server/` 使用 `@openai/apps-sdk-ui` 构建 ChatGPT app（含 `.agent/skills/chatgpt-app-builder`）。**但未发现 CopilotKit 官方承诺"支持 OpenAI Apps SDK"**；CopilotKit 官方叙事是"通过 MCP Apps 把 ChatGPT/Claude App Store 的 UI 带进你自己的应用"。上述 SDK 只出现在示例代码，标注「未证实」为官方支持。

### Open Generative UI 与最近的对外发布

- **Open Generative UI**（CopilotKit 的 fully open-ended 实现）：runtime 挂 `OpenGenerativeUIMiddleware`，内置 `OpenGenerativeUIActivityRenderer` 在 sandboxed iframe 中按 `placeholderMessages → css → html → jsFunctions → jsExpressions` 顺序流式渲染 HTML/CSS/JS；可注册 Zod 校验的 sandbox functions 回调 host（theme/购物车/导航/取数）。出处：`docs/generative-ui/open-generative-ui.mdx`。
- **2026-10-09 发布 Open Intelligent UI**（GitHub `CopilotKit/OpenIntelligentUI`）：官方称 "the open-source alternative to ChatGPT's Intelligent UI"，完全开源，构建于 **Open Generative UI** 之上；示例 agent 用 LangChain Deep Agents，模型 OpenAI + TypeSafe Jev。发布于 OpenAI 推出 ChatGPT Intelligent UI 的同一周。出处：博客《Introducing Open Intelligent UI: the Open-Source Alternative to ChatGPT's Intelligent UI》2026-10-09；`https://github.com/CopilotKit/OpenIntelligentUI`。
- 博客列表（`copilotkit.ai/blog`，抓取 2026-10-14）另有近期条目：**2026-10-13 CLiF**（Continual Learning from Full-Stack Trajectories，early access）；**2026-10-12 aimock** model-misbehavior；**2026-09-03 WebMCP for CopilotKit**（`useFrontendTool` 注册的工具体可被 WebMCP 兼容浏览器 agent 发现/调用：ChatGPT Atlas、Comet、Dia）；**2026-09-10** Inspector + Automatic Learning。

## 官方路线图 / 未定

- **没有公开的、带日期里程碑的官方 Roadmap 页面**：`https://www.copilotkit.ai/roadmap` 返回 "Page not found"（抓取 2026-10-14）。**未证实**存在路线图；已发布方向主要来自 README 平台表与博客。
- README 平台状态表里的路线图式表述（可直接引用）：
  - React / Next.js ✅ GA；Angular ✅ Supported；Vue ✅ Supported（**Quickstart coming soon**）；
  - Discord / WhatsApp / Telegram：✅ Channels SDK adapter（**managed connection coming soon**）；
  - **Google Chat / iMessage / SMS：🟡 On the roadmap**；
  - Channels 图注："…with **more channels on the roadmap**"。
  - 出处：`README.md`。
- `docs/whats-new/v1-50.mdx` 的 "Coming Soon"（v1.50 当时）：Threads & Persistence、新设计系统、Zod schema 支持。其中 Threads/Persistence 现已由 **CopilotKit Intelligence**（rich threads、user memories、automatic learning）交付。
- MCP Apps 文档说明：iframe-only，尚未适配移动端/Slack（Spectrum 页原话，见上表）。
- 部分集成文档标注 "**not yet supported**"：A2UI Fixed Schema 的 Python `action_handlers=` 路径（Microsoft Agent Framework、Deep Agents 等）。出处：`docs/integrations/microsoft-agent-framework/generative-ui/a2ui/fixed-schema.mdx:128`、`docs/integrations/deepagents/generative-ui/a2ui/fixed-schema.mdx:131`。
- 已排期废弃：`@copilotkit/react-native` 的 `useRenderTool` 为 deprecated shim，"**scheduled for removal in the next minor**"（1.71.0, 2026-09-09）。出处：`CHANGELOG.md`。
- **未证实**：没有 RFC 编号体系；`prds/` 只有一条 OSS-873（Inspector "Try from here"，与生成式 UI 无关）；`.changeset/` 目录不存在（该仓库改用 per-lane CHANGELOG）。

## 互操作现状

- CopilotKit 文档自称**三协议全兼容**：**AG-UI**（agent ↔ user interaction）、**MCP**（agent ↔ tools & data）、**A2A**（agent ↔ agent）。出处：`docs/agentic-protocols/index.mdx`。
- **AG-UI 新增 A2A 与 MCP handshake**：前端经 AG-UI 连 host agent，host agent 再经 MCP/A2A 连子 agent，生成式 UI 等 UI 属性可一路传播到用户界面，且保留安全/策略/可观测控制。出处：`docs/whats-new/a2a-mcp-handshake.mdx`（页面标注 "December 15, 2025" 区块）。
- **AG-UI vs 生成式 UI 规范**（官方原话）："AG-UI is **not** a generative UI specification — it's a User Interaction protocol"；AG-UI 原生支持 A2UI、MCP Apps、Open-JSON-UI，也允许自定义标准。出处：`snippets/shared/generative-ui-specs-overview.mdx`。
- OpenAI 博客（2026-10-09）："Generative UI specs like **A2UI and MCP Apps ride on top of AG-UI**, so your agent can use any of them natively."
- 框架覆盖（Generative UI 支持）：LangGraph(Py/TS)、Google ADK、Microsoft Agent Framework、AWS Strands、Mastra、PydanticAI、CrewAI、Agno、AG2、LlamaIndex、Claude Agent SDK、Deep Agents。出处：`snippets/shared/generative-ui-specs-overview.mdx`。
- 跨前端/通道：React/Next GA、Angular、React Native、Vue、Slack/Teams/Discord/WhatsApp/Telegram（Channels）。出处：`README.md`。
- **MCP Apps 与 OpenAI 互操作细节**见姊妹笔记 `notes/generative-ui/future/openai-mcp-apps.md`（SEP-1865、`io.modelcontextprotocol/ui`、Stable 2026-01-26 等）。

## 链接清单

- 仓库：https://github.com/CopilotKit/CopilotKit
- README（三分类 + AG-UI 归属 + 平台表）：https://raw.githubusercontent.com/CopilotKit/CopilotKit/main/README.md
- CHANGELOG：https://raw.githubusercontent.com/CopilotKit/CopilotKit/main/CHANGELOG.md
- npm：https://registry.npmjs.org/@copilotkit/react-core ・ `/@copilotkit/a2ui-renderer` ・ `/@copilotkit/mcp-apps-renderer` ・ `/@ag-ui/mcp-apps-middleware` ・ `/@a2ui/web_core`
- Generative UI Spectrum（官方分类法权威页）：https://www.copilotkit.ai/generative-ui-spectrum
- 文档 · Generative UI 总览：https://docs.copilotkit.ai/generative-ui ・ https://docs.copilotkit.ai/concepts/generative-ui-overview
- 文档 · A2UI：https://docs.copilotkit.ai/generative-ui/a2ui
- 文档 · MCP Apps：https://docs.copilotkit.ai/generative-ui/mcp-apps
- 文档 · Open Generative UI：https://docs.copilotkit.ai/generative-ui/open-generative-ui
- 文档 · AG-UI：https://docs.copilotkit.ai/agentic-protocols/ag-ui
- 文档 · 迁移 v1→v2：https://docs.copilotkit.ai/migrate/v2 ・ AG-UI 1.0：https://docs.copilotkit.ai/migrate/ag-ui-1.0
- 博客 · Introducing AG-UI 1.0（2026-09-30）：https://www.copilotkit.ai/blog/ag-ui-1.0
- 博客 · A2UI v0.9（2026-04-17）：https://www.copilotkit.ai/blog/a2ui-whats-new-in-google-generative-ui-spec
- 博客 · Introducing Open Intelligent UI（2026-10-09）：https://www.copilotkit.ai/blog/introducing-open-intelligent-ui
- 博客 · Generative UI Spectrum（2026-04-23）：https://www.copilotkit.ai/blog/generative-ui-explained-how-agents-now-ship-their-own-interfaces
- 博客 · WebMCP for CopilotKit（2026-09-03）：https://www.copilotkit.ai/blog/introducing-webmcp-for-copilotkit
- 仓库 · Generative UI showcase：https://github.com/CopilotKit/CopilotKit/tree/main/examples/showcases/generative-ui
- 仓库 · Open Intelligent UI：https://github.com/CopilotKit/OpenIntelligentUI
- A2UI 官方站：https://a2ui.org/ ；A2UI Composer（CopilotKit 工程师构建）：https://a2ui-composer.ag-ui.com/
