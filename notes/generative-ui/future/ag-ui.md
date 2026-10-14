# AG-UI 协议：可引用事实（生成式 UI 分享素材）

> 核对时间：2026-10-14。本地仓库 `/Users/work/ai/ag-ui` 快照 HEAD `2aabfc8`（提交日期 2026-10-09）。
> 除特别标注外，出处为仓库内路径；联网来源为 npm / PyPI / docs.ag-ui.com。
> GitHub Releases API 当日被限流（403），据 npm/PyPI 版本代替。

## 已发布事实

- **定位**：AG-UI 是"开放的、轻量的事件协议，标准化 AI agent 如何连接面向用户的应用"，形态是"一个请求进、一条有序的强类型事件流出来"，承载文本、工具调用、推理、共享状态、进度。出处：`README.md`；`docs/spec/1.0/index.mdx`。
- **不是生成式 UI 规范**：AG-UI 自称"User Interaction protocol"，提供 agent ↔ 应用之间的双向运行时连接；A2UI/MCP-UI/Open-JSON-UI 才是生成式 UI 规范，AG-UI 原生支持它们，也允许自定义 UI 标准。出处：`docs/concepts/generative-ui-specs.mdx`；`docs/agentic-protocols.mdx`。
- **协议栈定位**：MCP 给 agent 工具、A2A 连接 agent 与 agent、AG-UI 把 agent 带进用户界面；三者互补、可同时使用。出处：`README.md`（"Where does AGUI fit in the agentic protocol stack?"）；`docs/agentic-protocols.mdx`。
- **1.0 已发布/冻结**：1.0 于 **2026-09-17** 发布。出处：`DEPRECATIONS.md`（"shipped in 1.0, released on 2026-09-17"）。第三方旁证：npm `@ag-ui/core@1.0.0` 发布 2026-09-17；PyPI `ag-ui-protocol@1.0.0` 发布 2026-09-17。
- **最新版本**：npm `@ag-ui/core` `dist-tags.latest = 1.0.2`（2026-10-05），另有 `canary = 1.0.0-canary.*`、`alpha = 0.0.50-alpha.0`。来源：`https://registry.npmjs.org/@ag-ui/core`（2026-10-14 抓取）。
- **事件类型共 31 个**（`spec/1.0/schema.json` 的 `EventType` enum 与 `Event` oneOf 一一对应）：
  - **生命周期**：`RUN_STARTED`、`RUN_FINISHED`、`RUN_ERROR`、`STEP_STARTED`、`STEP_FINISHED`
  - **文本消息**：`TEXT_MESSAGE_START`、`TEXT_MESSAGE_CONTENT`、`TEXT_MESSAGE_END`、`TEXT_MESSAGE_CHUNK`
  - **工具调用**：`TOOL_CALL_START`、`TOOL_CALL_ARGS`、`TOOL_CALL_END`、`TOOL_CALL_CHUNK`、`TOOL_CALL_RESULT`
  - **状态**：`STATE_SNAPSHOT`、`STATE_DELTA`、`MESSAGES_SNAPSHOT`
  - **活动/进度**：`ACTIVITY_SNAPSHOT`、`ACTIVITY_DELTA`
  - **推理**：`REASONING_START`、`REASONING_MESSAGE_START`、`REASONING_MESSAGE_CONTENT`、`REASONING_MESSAGE_END`、`REASONING_MESSAGE_CHUNK`、`REASONING_END`、`REASONING_ENCRYPTED_VALUE`
  - **子代理**：`SUBAGENT_STARTED`、`SUBAGENT_FINISHED`、`SUBAGENT_ERROR`
  - **透传/自定义**：`RAW`、`CUSTOM`
  - 出处：`spec/1.0/schema.json`（`$defs.EventType`、`$defs.Event`）。注意：`README.md` 与 `docs/concepts/architecture.mdx` 仍写"~16 个标准事件类型"，是 0.x 时代的旧数字，1.0 已是 31。
- **"interrupt" 不是事件类型**：1.0 中中断通过 `RUN_FINISHED` 的 `outcome`（`RunFinishedInterruptOutcome`/`RunFinishedCancelledOutcome`）+ `Interrupt` 类型表示，客户端用 `RunAgentInput.resume: ResumeEntry[]` 恢复。出处：`docs/spec/1.0/changelog.mdx`；`docs/concepts/interrupts.mdx`；`spec/1.0/schema.json`（`RunFinishedOutcome`、`Interrupt`、`ResumeEntry`）。属 schema 定义但非 `EventType`。
- **每个事件结构规范**：共同基字段 `type`/`timestamp`/`rawEvent`/`metadata`，多数事件可带 `subagentRunId`。出处：`docs/concepts/events.mdx`。
- **SDK 一致性**：`spec/RECONCILIATION.md` 自动生成，快照显示 TypeScript / Python / .NET 与 schema 在 required 上"**0 处不一致**"。出处：`spec/RECONCILIATION.md`（仓库快照 2026-10-09）。

### draft vs 1.0（版本策略）

- `spec/1.0` 与 `docs/spec/1.0` 是**冻结版本，永不改动**；`spec/harness/publishing.test.ts` 用 digest（`FROZEN`）锁定，改动即构建失败。出处：`docs/spec/README.md`。
- 下一次变更进入工作草稿 `spec/draft/` + `docs/spec/draft/`；文档站版本下拉显示为 **"1.1 (draft)"**，与 "1.0 (current)" 并列。出处：`docs/spec/README.md`；`docs/docs.json`（"1.0 (current)" / "1.1 (draft)"）。
- **SDK 只从最新冻结版本生成，绝不从 draft 生成**；`PROTOCOL_VERSION` 与包清单在 draft 被"cut"前一直写 `1.0`。出处：`docs/spec/README.md`；代码 `sdks/typescript/packages/core/src/generated/version.ts`（`PROTOCOL_VERSION = "1.0"`）。
- **1.1 目前尚无已定变更**：`docs/spec/draft/changelog.mdx` 的 "Changes in 1.1" 下 Major/Minor/Schema changes 均为 "None yet"；1.1 是 minor，只能**新增**且必须对 1.0 peer 安全。出处：`docs/spec/draft/changelog.mdx`。
- 冻结上线流程仍为手工（脚本列为 follow-up），要点：copy draft → 改 `$id`/去 draft notice → 更新 generator/harness 路径 → 写 `PROTOCOL_VERSION` → 登记 schema digest → 更新 `docs.json`。出处：`docs/spec/README.md`。
- 版本协商在带内：consumer 在 `RunAgentInput.protocolVersion` 声明，producer 在 `RUN_STARTED.protocolVersion` 应答，缺失即 pre-versioning peer。出处：`docs/spec/1.0/changelog.mdx`（Minor #10）；`spec/1.0/proto-freeze.txt`（`RunAgentInput.protocol_version`、`RunStartedEvent.protocol_version`）。

### 传输层

- **HTTP + SSE 是标准绑定，HTTP 实现 MUST 支持**；请求为 HTTP POST 送 `RunAgentInput`，事件以 SSE 帧返回 JSON。出处：`docs/spec/1.0/basic/transports/index.mdx`、`.../http-sse.mdx`。
- **HTTP + Protobuf 是 OPTIONAL 二进制绑定**：同一 POST，`Accept: application/vnd.ag-ui.event+proto`（显式声明才准入，通配符也算准入），响应 `Content-Type: application/vnd.ag-ui.event+proto`；帧格式为 4 字节无符号大端长度头 + 该长度的单个事件，帧间无分隔符。出处：`docs/spec/1.0/basic/transports/http-protobuf.mdx`；`docs/spec/1.0/basic/transports/index.mdx`。
- **WebSocket**：不是标准绑定，但允许作为 **custom transport**（自定义传输 MUST 满足绑定契约：有序完整投递、先送输入、可区分截断的终止信号、拒绝输入的错误路径）。`TransportCapabilities` 提供 `websocket` / `httpBinary` / `pushNotifications` / `resumable` / `streaming` 布尔标志。出处：`docs/spec/1.0/basic/transports/index.mdx`（Custom transports）；`spec/1.0/schema.json`（`TransportCapabilities`）；`docs/concepts/capabilities.mdx`。
- **protobuf 线格式由 schema 生成，非第二真源**：`spec/1.0/proto-freeze.txt` 是**只追加的线格式冻结表**，新 slot 拿下一个空闲号，字段被删即变 `reserved`，号码永不复用、无人手写号码；`spec/generator/protobuf.ts` 负责从 schema 生成 .proto / freeze / TS 翻译层，union 的线上渲染策略必须显式声明（envelope/merge/oneof/flatten/tagged），无策略则生成失败。出处：`spec/1.0/proto-freeze.txt` 头部；`spec/generator/protobuf.ts`。
- protobuf 线格式里有 31 个 `Event.event.*` 槽位（1..31，含未使用的编号间距），与事件类型对应。出处：`spec/1.0/proto-freeze.txt`。

### SDK 语言覆盖与官方集成

- **官方 SDK**：TypeScript、Python、.NET（`sdks/typescript`、`sdks/python`、`sdks/dotnet`）。
- **社区 SDK**：C++、Dart、Go、Java、Kotlin、Ruby、Rust（`sdks/community/`）。文档站 `docs/sdk/` 覆盖：js、python、dotnet、go、java、kotlin、dart、ruby、rust。出处：`sdks/`、`docs/sdk/`。
- **A2UI 工具包**：`@ag-ui/a2ui-toolkit`（TS，版本 **0.0.5**）与 Python `ag-ui-a2ui-toolkit`，框架无关，被 LangGraph/ADK/Mastra 等各适配器复用。出处：`sdks/typescript/packages/a2ui-toolkit/package.json`；`sdks/typescript/packages/a2ui-toolkit/README.md`。
- **官方集成（`integrations/` 目录）**：LangGraph、LangChain、Microsoft Agent Framework、Google ADK（js/python/ts）、Google Antigravity、AWS Strands、Mastra、Pydantic AI、Agno、LlamaIndex、CrewAI、AG2、Claude Agent SDK、Claude Managed Agents、Langroid、A2A、Oracle Agent Spec、Vercel AI SDK、watsonx、server-starter，社区含 Cloudflare Agents / Genkit / Spring AI。出处：`integrations/` 目录树。
- **文档站集成清单**另列基础设施 **Amazon Bedrock AgentCore**（原生支持 AG-UI 运行时，AWS 公告日期 2026-03）。出处：`docs/integrations.mdx`（链接 `aws.amazon.com/.../2026/03/amazon-bedrock-agentcore-runtime-ag-ui-protocol/`）。
- **中间件层**：`middlewares/` 含 `a2a-middleware`、`a2ui-middleware`、`event-throttle-middleware`、`mcp-apps-middleware`、`mcp-middleware`。

### DEPRECATIONS.md（协议仍在快速演化）

- 登记了 1.0 仍携带的 pre-1.0 兼容 shim，每个 shim **2027-09-17 到期**（1.0 发布日 +12 个月），到期后下一版本可移除。出处：`DEPRECATIONS.md`。
- 主要废弃：
  - `THINKING_START/END`、`THINKING_TEXT_MESSAGE_START/CONTENT/END` → `REASONING_*`（inbound 边界与 `BackwardCompatibility_0_0_45` 转换）。
  - `{ type: "binary" }` 输入内容块 → 媒体块（`image`/`audio`/`video`/`document`）+ `source`。
  - `InputContent` / `...InputContent` 类型与校验名 → `ContentPart`、`TextPart`、`ImagePart`、`AudioPart`、`VideoPart`、`DocumentPart`、`PartSource`、`DataSource`、`UrlSource`（TS 与 Python 保留旧名别名）。
  - `SubAgentInfo`（Python）→ `SubagentInfo`（wire key 只用 `subagents`）。
  - 大量 `xxx: null` 的"可选 null"读作字段缺失（`parentMessageId: null`、`outcome: null`、`result: null` 等）。
  - `BackwardCompatibility_0_0_47` 类与公开导出**已移除**，二进制转换改由常开 `CompatibilityBoundary` 处理。
- 出处：`DEPRECATIONS.md`（全表）。

## 官方路线图 / 未定

- **官方 Roadmap 页**只指向公开 GitHub Projects：`https://github.com/orgs/ag-ui-protocol/projects/1`。出处：`docs/development/roadmap.mdx`。
- **1.0 已知但未进 schema 的预留**：`ReasoningPart`、`ToolCallPart`、`AssistantPart` 保留给"assistant 消息也带 parts"的那个版本。出处：`docs/spec/1.0/changelog.mdx`（Major #10）。
- **Draft 提案（Status: Draft，可能修改或撤回）**，出处 `docs/drafts/`：
  - `docs/drafts/generative-ui.mdx` — "Generative User Interfaces"，作者 Markus Ecker。核心是两步：agent 调 `generateUserInterface`（description/data/output）表达"要什么"，再由次级 LLM 生成实际 UI（JSON Schema、React 等）表达"怎么做"；列明挑战：OpenAI tool 描述 1024 字符限制、参数 JSON Schema 不支持 class/嵌套/`$ref`/`oneOf`、上下文窗口挤压。
  - `docs/drafts/meta-events.mdx` — "Meta Events"，新增 `META` 类型事件（`metaType` + `payload`），用于点赞/点踩/标签等与 run 无关的旁路标注。
  - `docs/drafts/overview.mdx` — 状态定义：Draft / Under Review / Accepted / Implemented / Withdrawn；"Interrupt-Aware Run Lifecycle"（已进 1.0 概念页）与 Reasoning、Generative UI、Meta Events 并列。
- `docs/concepts/events.mdx` 的 "Draft Events" 章节把 **Meta Events 标为 DRAFT**，并列出 "Modified Lifecycle Events"（草稿）。
- **内部设计稿**：`docs/superpowers/specs/2026-07-29-a2ui-maf-python-design.md`（A2UI × Microsoft Agent Framework Python 评估/完成计划，2026-07-29）。其中记录 A2UI 归属原则："A2UI 属于拥有该框架 AG-UI 桥接的一方"；MAF-Python 侧由微软在 `agent_framework_ag_ui` 内以 `_a2ui/` 子模块交付，复用 `ag-ui-a2ui-toolkit`；含"尚未对真实 LLM 验证"等 gap。
- **未证实**：没有发现带日期里程碑的官方路线图（Roadmap 页只有 GitHub Projects 链接），也未发现 RFC 编号体系；`docs/drafts/overview.mdx` 的 "Current Drafts" 只列 4 项且无排期。

## 互操作现状

- **AG-UI 与生成式 UI 规范的关系（官方表述）**：AG-UI **原生支持** A2UI、MCP-UI、Open-JSON-UI，并允许自定义规范；AG-UI 本身不是生成式 UI 规范。出处：`docs/concepts/generative-ui-specs.mdx`（含对比表：A2UI=Google，JSONL 流式、平台无关渲染；**Open-JSON-UI=OpenAI**；**MCP-UI=Microsoft + Shopify**，iframe 方案）；`docs/agentic-protocols.mdx`。
- **A2UI 实际落地**：`sdks/typescript/packages/a2ui-toolkit`、`sdks/python/a2ui_toolkit`（框架无关工具包）+ `middlewares/a2ui-middleware` + 各框架适配（LangGraph、ADK、Mastra、Strands 等）与 .NET 的 A2UI。出处：`sdks/...`、`middlewares/a2ui-middleware`、`docs/superpowers/specs/2026-07-29-a2ui-maf-python-design.md`。
- **MCP Apps 实际落地**：`@ag-ui/mcp-apps-middleware`（`middlewares/mcp-apps-middleware/README.md`）——发现并在 agent 工具列表注入 MCP UI-enabled 工具，仅对带 UI resource URI 的工具发出 activity snapshot；支持 `_meta.ui.visibility` 控制模型可见性，app-only 工具经 iframe 代理；支持工具链续跑（上限 10 轮）。文档站集成清单也列出 MCP Apps，链接到 2025-11-21 的 MCP 官方博文。出处：`middlewares/mcp-apps-middleware/README.md`；`docs/integrations.mdx`。
- **OpenAI Apps SDK**：仓库与文档站**未出现 "Apps SDK" 字样**（grep 无命中）。OpenAI 对应的生成式 UI 规范在 AG-UI 文档中记作 **Open-JSON-UI**（`docs/concepts/generative-ui-specs.mdx`）。**未证实** AG-UI 与 OpenAI Apps SDK 的直接互操作。
- **A2A / MCP 握手**：文档称 AG-UI 贡献者已加"handshake"，让 AG-UI 前台代理 MCP 与 A2A 的 agent；`integrations/a2a/typescript`、`middlewares/a2a-middleware`、`middlewares/mcp-middleware`。出处：`docs/agentic-protocols.mdx`、`integrations/`。

## 链接清单

- 官网/文档：<https://ag-ui.com>（重定向到 <https://docs.ag-ui.com>）
- Dojo 演示站：<https://dojo.ag-ui.com/>
- 仓库：<https://github.com/ag-ui-protocol/ag-ui>
- 公共路线图：<https://github.com/orgs/ag-ui-protocol/projects/1>
- 1.0 规范页：<https://docs.ag-ui.com/spec/1.0>；schema：<https://ag-ui.com/spec/1.0/schema.json>
- draft（1.1）schema：<https://ag-ui.com/spec/draft/schema.json>
- npm `@ag-ui/core`：<https://www.npmjs.com/package/@ag-ui/core>（latest 1.0.2，2026-10-05）
- PyPI `ag-ui-protocol`：<https://pypi.org/project/ag-ui-protocol/>（1.0.0，2026-09-17）
- 生成式 UI 规范对比：<https://docs.ag-ui.com/concepts/generative-ui-specs>
- MCP Apps 博文（2025-11-21）：<https://blog.modelcontextprotocol.io/posts/2025-11-21-mcp-apps/>
- A2UI 仓库：<https://github.com/google/A2UI>
- Roadmap 页：<https://docs.ag-ui.com/development/roadmap>
- 本地关键文件：`spec/1.0/schema.json`、`spec/1.0/proto-freeze.txt`、`spec/RECONCILIATION.md`、`docs/spec/README.md`、`docs/spec/draft/changelog.mdx`、`DEPRECATIONS.md`、`docs/drafts/*.mdx`、`docs/concepts/generative-ui-specs.mdx`、`middlewares/mcp-apps-middleware/README.md`、`docs/superpowers/specs/2026-07-29-a2ui-maf-python-design.md`
