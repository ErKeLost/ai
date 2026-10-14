# UI 协议标准化格局（生成式 UI）

> 调研日期：2026-10-14。事实优先，每条尽量带出处 + 日期/版本。无法核实的标「未证实」。
> 主要来源：本地笔记 `notes/generative-ui/openai/`、`a2ui/`、`ag-ui/`、`copilotkit/`、`openui/`，以及 npm registry、官网、`raw.githubusercontent.com`。

---

## 已发布事实

### 1. MCP Apps —— MCP 官方扩展，已 Stable

| 项 | 事实 | 出处 |
|---|---|---|
| 提案 | **SEP-1865 “MCP Apps: Interactive User Interfaces for MCP”**，Track: Extensions | `raw.githubusercontent.com/modelcontextprotocol/ext-apps/main/specification/2026-01-26/apps.mdx` |
| 作者 | Ido Salomon、Liad Yosef、Olivier Chafik、Jerome Swannack、Jonathan Hefner、Anton Pidkuiko、Nick Cooper、Bryan Ashley、Alexi Christakis（MCP-UI + Anthropic + OpenAI 等混合署名） | 同上 |
| 时间线 | 创建 **2025-11-21**；**Stable 2026-01-26**；`draft/` 分支仍在更新 | 同上；`specification/draft/apps.mdx` 状态为 Draft |
| 官方地位 | MCP **官方扩展**（官方扩展必须放在 `modelcontextprotocol` GitHub org 的 `ext-` 仓库）；扩展标识符 **`io.modelcontextprotocol/ui`** | https://modelcontextprotocol.io/docs/extensions/overview（2026-10 现状）；apps.mdx `### Extension Identifier` |
| 是否进核心 | **否，是可选的 extension**，需通过 capabilities 显式协商。核心 MCP 规范 **2026-07-28** 版只新增了 `extensions` 字段来承载此类扩展 | https://modelcontextprotocol.io/specification/2026-07-28/changelog |
| 规范要点 | 工具用 `_meta.ui.resourceUri` 指向 `ui://` 资源；UI 资源 MIME 固定为 `text/html;profile=mcp-app`；宿主在 **sandbox iframe** 内渲染；App↔Host 通过 **postMessage 上的 JSON-RPC 2.0** 通信 | apps.mdx |
| `ui/*` 方法 | `ui/initialize` → `ui/notifications/initialized`（握手）；`ui/notifications/tool-input`、`tool-input-partial`（流式）、`tool-result`、`tool-cancelled`；`ui/message`（发消息给聊天）；`ui/update-model-context`（更新模型上下文）；`ui/open-link`；`ui/request-display-mode`；`ui/notifications/size-changed`、`host-context-changed`；`ui/resource-teardown`；沙箱代理用 `ui/notifications/sandbox-proxy-ready`、`sandbox-resource-ready`。工具调用复用核心 MCP 的 `tools/call` | apps.mdx `### MCP Apps Specific Messages` / `### Lifecycle` |
| 安全 | 强制 iframe sandbox；`_meta.ui.csp`（`connectDomains` / `resourceDomains` / `frameDomains`）、`_meta.ui.permissions`（麦克风/摄像头等）、`_meta.ui.domain`（提交插件时必填的独立 origin） | apps.mdx；`notes/generative-ui/openai/en/plugin-ui-reference.md`（§394–407） |
| Display Mode | `inline` / `fullscreen` / `pip`，View 在 `ui/initialize` 的 `appCapabilities.availableDisplayModes` 声明 | apps.mdx `### Display Modes` |
| 废弃项 | 扁平的 `_meta["ui/resourceUri"]` 已废弃，改用 `_meta.ui.resourceUri`；“**will be removed before GA**” → 说明 **GA 尚未发生** | apps.mdx line 341/347 |
| SDK | npm `@modelcontextprotocol/ext-apps`：首次发布 **2025-12-08**，**2.0.3 于 2026-09-25**（2.0.0 于 2026-09-08）；README 明确 **1.x↔2.x wire protocol 不变** | registry.npmjs.org；ext-apps README |
| 宿主 | Claude / Claude Desktop / VS Code GitHub Copilot / Microsoft 365 Copilot / Goose / Postman / MCPJam / Archestra.AI；**ChatGPT 官方文档也声明实现**。VS Code 于 **2026-01-26** 发博宣布支持 | https://apps.extensions.modelcontextprotocol.io；https://developers.openai.com/apps-sdk/mcp-apps-in-chatgpt.md；code.visualstudio.com/blog 2026-01-26 |
| 血缘 | 统一了 **MCP-UI**（社区，iframe/HTML/remote-dom，adopters 含 Postman、HuggingFace、Shopify、Goose、ElevenLabs）与 **OpenAI Apps SDK**（2025-11 发布）两条路线。MCP-UI 现已改称“MCP Apps 的社区实现/试验场” | apps.mdx `## Motivation`；https://mcpui.dev（2026-07-08） |

> 注意区分：**MCP Apps**（`io.modelcontextprotocol/ui`，2026-01-26 Stable）与 **MCP-UI**（社区项目 mcp-ui.org，现定位为 MCP Apps 的 SDK/试验场）不是一回事，但后者是前者的直接前身与实现。

### 2. OpenAI Apps SDK —— 以 MCP Apps 为 UI 标准

- **Apps SDK 于 2025-11 发布**（SEP-1865 Motivation 原文；“launched in November 2025”）。`@openai/apps-sdk-ui` npm 首次发布 2025-11-20，0.2.0 于 2025-11-23，最新 **0.2.2（2026-05-05）**。
- **ChatGPT 已把 MCP Apps 当作官方 UI 标准**：OpenAI 官方文档标题即《Add UI to your MCP server》，原文“ChatGPT implements the open MCP Apps standard… This standards-first foundation lets the same UI run in ChatGPT and other compatible MCP Apps hosts.”（https://developers.openai.com/apps-sdk/mcp-apps-in-chatgpt.md，2026-10）。
- **优先用标准字段**：`_meta.ui.resourceUri`、`ui/initialize`+`ui/notifications/tool-input`、`ui/notifications/tool-result`、`tools/call`、`ui/message`；ChatGPT 私有兼容别名 `_meta["openai/outputTemplate"]`、`window.openai.toolInput/toolOutput/callTool/sendFollowUpMessage` 仅作兼容。`window.openai` 只保留标准外能力：`requestCheckout`（Instant Checkout）、`uploadFile`/`selectFiles`/`getFileDownloadUrl`、`requestModal`、`widgetState`/`setWidgetState`。
- **打包/发布（2026 现状）**：2026 年 OpenAI 用语从 “Apps” 转向 **“Plugins”**，统一发布到 **ChatGPT + Codex 共用的 plugin directory**。包结构：根 `plugin.json`（Agent Plugins schema）+ `mcp.json`（MCP 服务器）+ 可选 `skills/`；**`.app.json`（旧 Apps 映射）与 `.codex-plugin/plugin.json` 作为兼容回退**。流程：上传 ZIP → 自动 metadata/skills 检查 → 连接并扫描远程 MCP server（域名验证、OAuth）→ 解决 findings → 提交审核 → 自选发布时机；发布后 **托管 MCP 工具变更自动生效**，仅 metadata/skills 变更需重新上传 ZIP。截图资产日期为 **2026-09-27**。
  - 出处：https://developers.openai.com/plugins/deploy/submission.md；https://developers.openai.com/plugins/build/plugins.md；https://developers.openai.com/plugins/plugin-guidelines.md
  - 注：任务里提到的 `app.json` 对应旧 `.app.json`；2026 主坐标是 `plugin.json`。
- ChatGPT 容器内的设计/字段参考仍存在：display mode、CSP、`_meta.ui.domain` 等（本地 `openai/zh/04-插件UI字段参考.md`、`05-UI设计规范.md`）。

### 3. A2UI —— Google 主导的声明式 JSON 组件协议

- 定位：**Apache 2.0，由 Google 创建，CopilotKit 作为发起/设计伙伴与社区共同贡献**；官网原句：“created by Google with contributions from CopilotKit and the open source community”（https://a2ui.org/，2026-10）。口号 **“safe like data, but expressive like code”**。
- 仓库：**已从 `google/A2UI` 迁到 `github.com/a2ui-project/a2ui`**（本地 shallow clone 的 remote 仍是旧地址；README 与官网均指向 `a2ui-project/a2ui`）。
- 规范版本（https://a2ui.org/#specification-versions，2026-10）：

| 版本 | 状态 | 说明 |
|---|---|---|
| **v1.0** | **Candidate（RC）** | 增加 client→server RPC（`actionResponse`）、action IDs，`theme`→`surfaceProperties`；草案期曾叫 v0.10 |
| **v0.9.1** | **Current 生产版** | 标准化 MIME `application/a2ui+json`，放宽 surfaceId 约束 |
| v0.9 | Stable | “Prompt-First” 转折，引入 `createSurface`、客户端函数、自定义 catalogs、模块化 schema |
| v0.8 | Legacy | 结构化输出优先，基础 surfaces/组件/数据绑定 |

- 三个原语：**`createSurface` → `updateComponents`（组件树）→ `updateDataModel`（JSON Pointer 填数据）**；agent 只能引用 catalog 内预批准组件，因此不可执行任意代码。
- 传输：**A2A 原生、AG-UI day-zero、REST、WebSocket、MCP 全部 ✅ Complete**（roadmap）。README 明确 “via A2A, AG-UI, etc.”。
- 渲染器（roadmap，最后更新 **2026-06**）：Web Core / Lit / Angular / Flutter GenUI / React / Lynx 均 **Stable**；**SwiftUI、Jetpack Compose 计划 Q2 2026（Upcoming 落在 Q3 2026）**；Vue/Svelte/ShadCN 为社区提议。
- npm（渲染器版本，不是规范版本）：`@a2ui/web_core`、`@a2ui/react`、`@a2ui/lit` 均为 **0.13.0（2026-10-09）**。
- 生产采用（https://a2ui.org + `docs/public/ecosystem/a2ui-in-the-world.md`）：
  - **Google Opal**（核心贡献者，动态生成式 UI 底座，负责人 Dimitri Glazkov 背书）；
  - **Gemini Enterprise**（限 A2A 路径注册的 self-serve agents；Vertex `adkAgentDefinition` 暂不支持）；
  - **Flutter GenUI SDK**（`docs.flutter.dev/ai/genui`，A2UI 是其底层协议，Vijay Menon 背书）；
  - **Google ADK Web** 内置 A2UI 渲染（ADK 集成状态 roadmap 标 “In Progress”）。
- CopilotKit 提供 Dynamic Schema / Fixed Schema 两种 A2UI 用法（本地 `copilotkit/showcase/shell-docs/.../generative-ui/a2ui/`）。

### 4. AG-UI —— agent ↔ 前端的事件协议

- 由 **CopilotKit 发起/维护**（`ag-ui-protocol/ag-ui`），是 **Agent↔User Interaction** 协议，不是生成式 UI spec：~16 种标准事件类型 + 多传输（SSE/WS/webhook），定位“任意 agent 后端 ↔ 任意前端”。
- npm `@ag-ui/core`：**1.0.0 于 2026-09-17**，1.0.2 于 2026-10-05；CopilotKit 博客《Introducing AG-UI 1.0》**2026-09-30**：完整 spec + JSON Schema，TS/Python/.NET SDK 由 schema 生成，新增 subagents、metadata、多模态 tool results、HITL interrupts、token usage，**完全向后兼容**。
- 官方把协议分成三层：Agent↔User = **AG-UI**；Agent↔Tools/Data = **MCP**（Anthropic 起源）；Agent↔Agent = **A2A**（Google 起源）。AG-UI 已与 MCP / A2A 做握手，可“front for” MCP/A2A agent。
- 采用方（本地 `notes/generative-ui/00-map.md` 与 CopilotKit 页面）：Google、LangChain、AWS、Microsoft、Mastra、PydanticAI；AWS 在 AgentCore 提供专用 AG-UI endpoint + FAST 模板（CopilotKit blog 索引）。

### 5. 其他方案一句话定位（2026-10 npm 版本）

| 项目 | 定位 | 版本/日期 |
|---|---|---|
| **Vercel AI SDK** | L1 受控生成式 UI：`UIMessage.parts` + `tool-${name}` 类型化 part（自 5.0 起）；`@ai-sdk/rsc` 已实验性、官方建议迁移 | `ai` **7.0.137**、`@ai-sdk/react` **4.0.142**（2026-10-13，本地 submodule） |
| **ai-elements** | Vercel 的现成生成式 UI React 组件库 | `ai-elements` **1.9.0**（2026-03-12） |
| **json-render** | Vercel Labs：`{root, elements}` JSON spec + Zod catalog → 多目标渲染（React/Vue/Svelte/Solid/RN/3D/PDF/email/终端），提供 shadcn 预置组件 | `@json-render/core` **0.21.1**（2026-10-13） |
| **Hashbrown** | BYO 组件库 + 渐进式 JSON 解析器，流式把结构片段交给 React 渲染 | `@hashbrownai/react` **0.7.0**（2026-10-08） |
| **assistant-ui** | 聊天前端组件库/运行时（含生成式 UI 原语） | `@assistant-ui/react` **0.15.28**（2026-10-12） |
| **Thesys OpenUI** | “The Open Standard for Intelligent UI”：流式 **OpenUI Lang**（比 JSON 省 token）→ React/Vue/Svelte/Angular 运行时 | 仓库 v1.0.1；`@openuidev/react-ui` **0.18.0**（2026-10-12） |
| **Open-JSON-UI** | AG-UI 文档列为 OpenAI 的声明式生成式 UI schema 开放标准化 | 出处：AG-UI `generative-ui-specs.mdx`、copilotkit.ai；**未证实** 存在一方规范仓库/版本策略（第三方协议图谱 ag-ui.ai 亦指出无法确认） |
| **MCP-UI** | 社区 iframe/HTML 方案，现为 MCP Apps 的 SDK/试验场 | https://mcpui.dev（2026-07-08） |

---

## 三协议关系（一句话对比表）

| 维度 | **MCP Apps** | **AG-UI** | **A2UI** |
|---|---|---|---|
| 一句话 | UI 由 MCP server 自带、跑在宿主 **sandbox iframe** 里的官方 MCP 扩展 | **agent↔前端**的通用事件流协议（运行时连接层） | agent 用**声明式 JSON**“说 UI”，客户端用自己原生组件渲染 |
| 层 | Transport/沙箱层（MCP 扩展，`io.modelcontextprotocol/ui`） | 交互运行时层（事件/状态同步） | UI schema/内容层 |
| 推动方 | **MCP 官方**（SEP-1865 作者群，融合 MCP-UI + OpenAI Apps SDK）；Anthropic 与 OpenAI 均署名 | **CopilotKit**（Google/AWS/Microsoft/LangChain 等采用） | **Google**（CopilotKit 为发起/设计伙伴） |
| 是否可执行代码 | **是**（HTML/JS/CSS，靠 sandbox + CSP 隔离） | 不涉及（只传事件） | **否**（只允许 catalog 预批准组件） |
| 与其余两者 | 是 UI 的“包装/传输” | 是 A2UI/MCP-UI/Open-JSON-UI 等 UI spec 的**通用传输**，原生支持全部 | 是 AG-UI/A2A 上可承载的**载荷**，也支持 MCP transport |
| 版本状态 | Stable **2026-01-26**（extension） | **1.0**（2026-09-30） | **v0.9.1 Current / v1.0 RC** |

**互补，不是竞争。** 官方说法：
- AG-UI 文档：“Despite the naming similarities, **AG-UI is not a generative UI specification** — it's a User Interaction protocol… AG-UI natively supports all of the above generative UI specs”（https://docs.ag-ui.com/concepts/generative-ui-specs）。
- CopilotKit 专页：“AG-UI is the Agent–User Interaction protocol… A2UI is a Declarative Generative UI spec, originated by Google… CopilotKit is a launch partner with Google of the official A2UI release”（https://www.copilotkit.ai/ag-ui-and-a2ui）。
- A2UI roadmap 把 **AG-UI 标为 day-zero 传输**、A2A 原生。
- 真正常见的“竞争/替代”关系是 **MCP Apps（L3 开放 iframe） vs A2UI（L2 声明式）**：MCP Apps 表达力更强、品牌/安全更难保证；A2UI 安全可控、跨端一致。同一产品里二者常共存（CopilotKit 同时支持两者）。
- 无三方联合公告；但 **MCP-UI 的并入 MCP Apps**（2026-01 起）与 **A2UI↔AG-UI 互认**是可引用的“事实性互操作”。

---

## 官方路线图 / 未定

- **MCP Apps**：spec 中两处标注 deprecated 字段 “will be removed **before GA**”，说明稳定版 2026-01-26 之后仍会有一个 GA 里程碑；`draft/apps.mdx` 持续更新。扩展机制（core 2026-07-28 的 `extensions` 字段）已就位，但 **MCP Apps 未进入核心规范正文**。
- **A2UI**：roadmap（Last Updated **2026-06**）明确 **Q4 2026 finalize v1.0**：稳定性保证、v0.9→v1.0 迁移路径、完整测试套件、**renderer 认证计划（certification program）**。Q3 2026 计划 SwiftUI / Jetpack Compose renderer、性能优化（懒加载/虚拟滚动/记忆化）。长期愿景：full app UIs、multi-agent 协作同一 surface、无障碍、3D/AR-VR。
- **AG-UI**：1.0 已发布（2026-09-30），后续为向后兼容的能力扩展；subagents/metadata/multimodal tool results/HITL 已并入。
- **OpenAI**：未发布“MCP Apps GA 时间表”；2026 重点是 **统一 plugin directory（ChatGPT+Codex）**、自动扫描/审核、发布后工具热更新。
- 未定/待观察：MCP Apps 是否会进入 MCP 核心规范；A2UI 1.0 是否被主流前端框架（Next/React 官方）直接内置；Open-JSON-UI 是否会有官方规范仓库。**均未证实。**

---

## 未来 6–12 个月（可引用判断）

1. **MCP Apps 走向 GA，并成为 MCP 事实标准 UI 层。** 依据：spec 内“will be removed before GA”预留 + `draft` 分支活跃 + 官方 extensions 机制（core 2026-07-28 引入 `extensions` 字段）。SDK 2.0.3（2026-09-25）已把 wire protocol 稳定下来。
2. **A2UI v1.0 落地 + renderer 认证。** 依据：A2UI roadmap 明确 Q4 2026 finalize v1.0，含 stability guarantee 与 certification program；SwiftUI/Compose renderer 在 Q3 2026 计划中。
3. **AG-UI 成为生成式 UI 的默认“传输总线”。** 依据：AG-UI 1.0（2026-09-30）+ A2UI day-zero 兼容 + MCP/A2A 握手 + 多语言 SDK 由 JSON Schema 生成。
4. **OpenAI 双层策略固化：标准层 + ChatGPT 私有扩展层。** 依据：OpenAI 文档明确“use the MCP Apps field/method whenever the shared specification covers the capability”，私有 `window.openai.*` 仅保留 checkout/modal/file/widgetState。
5. **沙箱安全参数被标准化为可审计字段。** 依据：MCP Apps 的 `_meta.ui.csp`（connect/resource/frame domains）、`permissions`、独立 `_meta.ui.domain`（提交插件必填）；A2UI 以 catalog 白名单“免代码”。跨宿主安全基线会继续收敛。
6. **Catalogs / 组件注册表成为落地关键。** 依据：A2UI catalog、json-render Zod catalog、MCP Apps `_meta.ui` 资源；组件库（ai-elements、assistant-ui、`@openai/apps-sdk-ui`）承接协议与产品之间的“最后一公里”。
7. **协议互操作通过桥接实现而非合并。** 依据：MCP-UI 直接转型为 MCP Apps SDK 并用 `a2ui://` 资源承载 A2UI（如 Max-Health `prefab`）；预期出现更多 “A2UI over AG-UI / A2UI over MCP / MCP Apps in any host” 的适配层。
8. **MCP Apps 多宿主扩散。** 依据：Claude/Claude Desktop/VS Code Copilot/M365 Copilot/Goose/Postman/MCPJam + ChatGPT 均已支持；同一 UI 可跨宿主复用是官方卖点。

---

## 链接清单

- MCP Apps 规范（Stable 2026-01-26）：https://raw.githubusercontent.com/modelcontextprotocol/ext-apps/main/specification/2026-01-26/apps.mdx ｜ draft：…/specification/draft/apps.mdx
- MCP Apps 文档：https://modelcontextprotocol.io/docs/extensions/apps ｜ 完整站：https://apps.extensions.modelcontextprotocol.io
- MCP 扩展总览 / 客户端矩阵：https://modelcontextprotocol.io/docs/extensions/overview ｜ https://modelcontextprotocol.io/extensions/client-matrix
- MCP 核心规范 2026-07-28 changelog：https://modelcontextprotocol.io/specification/2026-07-28/changelog
- ext-apps 仓库 / SDK：https://github.com/modelcontextprotocol/ext-apps ｜ https://www.npmjs.com/package/@modelcontextprotocol/ext-apps
- MCP-UI（现 MCP Apps SDK/试验场）：https://mcpui.dev ｜ https://github.com/MCP-UI-Org/mcp-ui
- OpenAI《Add UI to your MCP server》：https://developers.openai.com/apps-sdk/mcp-apps-in-chatgpt.md
- OpenAI 插件打包/提交/审核：https://developers.openai.com/plugins/build/plugins.md ｜ https://developers.openai.com/plugins/deploy/submission.md ｜ https://developers.openai.com/plugins/deploy/app-review.md ｜ https://developers.openai.com/plugins/plugin-guidelines.md
- OpenAI UI/字段参考：https://developers.openai.com/plugins/reference.md ｜ https://developers.openai.com/plugins/concepts/ui-guidelines.md
- OpenAI Apps SDK UI 库：https://openai.github.io/apps-sdk-ui/
- A2UI 官网/规范版本：https://a2ui.org ｜ roadmap：https://a2ui.org/roadmap（本地 `a2ui/docs/public/roadmap.md`）
- A2UI 仓库：https://github.com/a2ui-project/a2ui
- A2UI 采用者/生态：https://a2ui.org/ecosystem/a2ui-in-the-world（本地 `a2ui/docs/public/ecosystem/`）
- AG-UI：https://docs.ag-ui.com ｜ https://github.com/ag-ui-protocol/ag-ui ｜ 生成式 UI spec 关系页：https://docs.ag-ui.com/concepts/generative-ui-specs
- AG-UI 1.0 公告：https://www.copilotkit.ai/blog/ag-ui-1.0（2026-09-30）
- CopilotKit《AG-UI and A2UI》：https://www.copilotkit.ai/ag-ui-and-a2ui ｜ MCP Apps 页：https://www.copilotkit.ai/mcp-apps
- Vercel AI SDK 生成式 UI：https://ai-sdk.dev/docs/ai-sdk-ui/generative-user-interfaces（本地 `ai/content/docs/04-ai-sdk-ui/04-generative-user-interfaces.mdx`）
- json-render：https://github.com/vercel-labs/json-render ｜ https://json-render.dev
- Hashbrown：https://www.npmjs.com/package/@hashbrownai/react
- assistant-ui：https://github.com/assistant-ui/assistant-ui
- ai-elements：https://github.com/vercel/ai-elements
- Thesys OpenUI：https://www.openui.com ｜ https://github.com/thesysdev/openui
