# A2UI (Agent-to-User Interface) — raw research notes

> Research date: **2026-10-14**. All facts below are from the local submodule
> `/Users/work/ai/a2ui` (checked out at commit `ce03d005`, 2026-10-10) and live
> web/API queries made on that date. Uncertainty tagged with ❓.

---

## 0. Positioning — 逐字引用（README + docs）

- README 首句 (逐字):
  > "A2UI is an open-source project, complete with a format optimized for representing updatable agent-generated UIs and an initial set of renderers, that allows agents to generate or populate rich user interfaces."
- 核心 slogan (逐字): **"safe like data, but expressive like code"**
- AGENTS.md §1 定义 (逐字):
  > "**A2UI (Agent-to-User Interface)** is a platform-agnostic, streaming-first UI protocol designed specifically to allow Large Language Models (LLMs) and autonomous agents to generate user interfaces."
- README Architecture 原文: 四步 —— **Generation**（LLM 生成 A2UI JSON）→ **Transport**（A2A / AG-UI / MCP）→ **Resolution**（renderer 解析）→ **Rendering**（映射到宿主原生组件）。
- docs 站点: `site_description: "A2UI, a streaming protocol for Agent-Driven User Interfaces"`, author = Google.

### 是不是「声明式 UI 描述语言」？→ **是**
README 逐字: "Agents send a **declarative JSON format** describing the *intent* of the UI. The client application then renders this using its own native component library."
关键点：**不是 executable code**，是 declarative data。客户端维护一个可信 `catalog`（预批准组件），agent 只能请求 catalog 里的组件。

---

## 1. 状态与版本（README⚠️ 块逐字）

> "A2UI's current production release is **v0.9.1**, a patch release in the stable v0.9 protocol family. The **v1.0 specification is a release candidate**, while **v0.8 is legacy**."

版本表（roadmap.md，Last Updated: June 2026）：

| 版本 | 状态 | 备注 |
|---|---|---|
| v0.8 | 🆗 Prior | 初始公开版，最小支持 |
| v0.9 | 🆗 Prior | 功能完整，legacy 支持 |
| **v0.9.1** | 🆗 **Current** | **stable release** |
| **v1.0** | 📋 **Candidate** | release candidate（draft 时叫 v0.10）|

- `specification/v1_0/README.md` 逐字: "This version was previously known as **version 0.10** when it was in draft." + "Once a sufficient number of renderers are ported … this will become the stable 1.0 release … **There is a high bar for accepting breaking changes to a candidate specification.**"
- AGENTS.md 权威规则 (逐字): "**Default to version v0.9.1 as the primary authority** when working on SDKs or adapters."

### GitHub 仓库事实（`gh api repos/a2ui-project/a2ui`，2026-10-14）
- 仓库已从 `google/A2UI` **迁移到 `a2ui-project/a2ui`**（`google/A2UI` 现在 301 redirect 到这里）。
- **16,688 stars** / **1,328 forks** / **478 open issues**。
- created **2025-09-24**，pushed **2026-10-13T23:52Z**（昨天，非常活跃）。
- license **Apache-2.0**，homepage **https://a2ui.org/`。
- 近 30 天 commit 数 ≈ **234**（`gh api commits?since=2026-09-14` 的 last page = 234），约 8 commits/天。
- 唯一 milestone: **"October Launch"，due 2026-10-29，3 open / 0 closed** —— 三条都是 v1.0 收尾/多版本 catalog（#3097 统一 v1.0 版本号写法、#3062 跨 v0.9/v1.0 的 catalog API、#3061 catalog format 按 ProtocolVersion 收口）。❓ 推测：**v1.0 stable 目标是 2026 年 10 月底**（milestone 名 + 日期很明确，但仓库里没有逐字写 "v1.0 ships Oct 29"）。

### 官方博客（developers.googleblog.com，sitemap 定位，逐字标题+日期）
1. **2025-12-15** — "Introducing A2UI: An open project for agent-driven interfaces"
   URL: https://developers.googleblog.com/introducing-a2ui-an-open-project-for-agent-driven-interfaces/
2. **2026-04-17** — "A2UI v0.9: The New Standard for Portable, Framework-Agnostic Generative UI"
   URL: https://developers.googleblog.com/a2ui-v0-9-generative-ui/
3. **2026-06-17** — "A2UI + MCP Apps: Combining the best of declarative and custom agentic UIs"
   URL: https://developers.googleblog.com/a2ui-and-mcp-apps/

（v0.9 blog 逐字: "A2UI v0.9 is our answer; a **framework-agnostic standard for declaring UI intent**."）

---

## 2. 协议设计（v1.0 spec 深读）

### 2.1 消息模型（v1.0，`specification/v1_0/docs/a2ui_protocol.md`）
- **Agent → Renderer**（单向下行流 + 可选回传通道）:
  `createSurface` → `updateComponents`（可多次，流式）→ `updateDataModel`（可随时）→ … → `deleteSurface`
  另加 **`callRendererFunction`**（v1.0 新增，agent 主动调 renderer 侧函数）→ 返回 `rendererFunctionResponse` / `agentFunctionResponse`。
- **Renderer → Agent**（事件）: `action`、`callAgentFunction`、`rendererFunctionResponse`、`error`。
- v0.9→v1.0 breaking 变化（evolution_guide.md）:
  - `callFunction` → 拆成 **`callRendererFunction` + `callAgentFunction`**（双向 RPC，角色区分）。
  - **单个 surface 可混用多个 catalog**（`supportedCatalogIds` mixable，同一 version）。
  - 术语重命名：**"client" → *renderer*，"server" → *agent***（`server_to_client` schema 改名 `agent_to_renderer`）。
  - 数据绑定前缀：`"path":` → **`"@path":`**，`"call":` → **`"@call":`**（`@index` 用于模板迭代）；`@` 前缀成为保留指令命名空间。
  - 官方 MIME type: **`application/a2ui+json`**。
  - `theme` / `primaryColor` 从 catalog 与 createSurface 中**移除**（layout 与 branding 分离）。
  - `createSurface` 可直接内联 `components` + `dataModel`（一条消息建整个 UI）。

### 2.2 组件模型 / UI composition
- **Adjacency list model**：flat list of components + ID references（"easy for LLMs to generate incrementally"）→ 支持 progressive rendering。
- 根类型保留名 **`Surface`**（规范强制，`propertyNames: {not: {const: "Surface"}}`）。
- Catalog 可声明 **composition constraints**（`allowedParents` / `allowedChildren`）—— 因为 JSON Schema 无法约束 flat adjacency list 的父子类型，所以用 catalog 级元数据表达。
- **Accessibility**：v1.0 强制 `AccessibilityAttributes`（`label`/`description` + WAI-ARIA `live` off/polite/assertive + `hidden`），要求 renderer 把可见文本推断为默认 screen reader 语义，并在 SDK linter 里检查。

### 2.3 Basic Catalog 组件清单（`catalogs/basic/v1/catalog.json`，protocolVersion `1.0`）
- **18 个组件**：Text, Image, Icon, Video, AudioPlayer, Row, Column, List, Card, Tabs, Modal, Divider, Button, TextField, CheckBox, ChoicePicker, Slider, DateTimeInput
- **14 个函数**：required, regex, length, numeric, email, formatString, formatNumber, formatCurrency, formatDate, pluralize, openUrl, and, or, not
- 命名哲学（v0.9 blog 逐字）: 从 'Standard' 改名 '**Basic**' —— "Frontend developers don't want new components. They already have a design system … Agents should respond dynamically, using existing front ends."

### 2.4 传输层（roadmap.md，**全部 ✅ Complete**）
A2A Protocol ✅ / AG-UI ✅ / **REST API ✅ / WebSockets ✅ / MCP ✅**。
- Transport contract 要求：reliable ordered delivery、message framing、metadata（capabilities 交换 + data model 同步）、可选双向。
- A2A 有专用 extension（Agent Card metadata + 双向 data model sync）。
- docs 另有 3 篇 MCP 指南：`a2ui_over_mcp.md`、`mcp-apps-in-a2ui.md`（**double-iframe 隔离**：内层 iframe **必须不含 `allow-same-origin`**，防 sandbox escape / frame-busting / clickjacking）、`a2ui-in-mcp-apps.md`。

### 2.5 SDK 架构（`specification/v1_0/docs/sdks_spec.md`）三层
1. **A2UI Core SDK**（`a2ui_core` / `@a2ui/core`）—— 每个语言都有（TS, Dart, Python, Kotlin, Swift, C++）：协议模型、SurfaceState、`MessageProcessor`、校验、catalog linter。
2. **Inference SDK**（`a2ui_inference` / `@a2ui/inference`）—— 引导 LLM 生成合法 payload：prompt 构造、流式 JSON 解析/修复、错误重试。
3. **Framework Adapters** —— 把 Core 的 SurfaceModel 画到原生像素。

---

## 3. 生态 / 采用（`docs/public/ecosystem/a2ui-in-the-world.md`）

**Google 内部生产部署：**
- **Google Opal**（opal.google，"hundreds of thousands of people"）—— A2UI 是其生成式 UI 的底层。Opal 团队是 **core contributor**。Dimitri Glazkov (Principal Engineer) 逐字 quote: "A2UI is foundational to our work … Its declarative nature and focus on security allow us to experiment quickly and safely."
- **Gemini Enterprise** —— 企业 agent 渲染富 UI。⚠️ 限制（逐字）: "A2UI rendering in Gemini Enterprise **currently requires self-serve agents registered using the Agent-to-Agent (A2A) path (`a2aAgentDefinition`)**. Managed agents deployed on Vertex AI Agent Engine … using the `adkAgentDefinition` path **do not currently support A2UI rendering**."
- **Google ADK / ADK Web** —— 内置 native A2UI 渲染（v0.8 basic catalog），并做 A2UI↔A2A 转换。

**其他：**
- **Flutter GenUI SDK**（`flutter/genui`，**1,782 stars**，created 2025-07-18，pushed 2026-10-13）**用 A2UI 作为底层协议**。Vijay Menon (Engineering Director, Dart & Flutter) quote 在册。docs.flutter.dev/ai/genui 返回 200。
- **AG-UI / CopilotKit**：**day-zero A2UI 兼容**。AG-UI repo 16,507 stars（created 2025-05-07）；CopilotKit repo 38,003 stars。Atai Barkai (Founder) quote 在册。

**Renderers（roadmap 状态）：**
- ✅ Stable: Web Core Lib、**Web Components (Lit)**、**Angular**、**Flutter (GenUI SDK)**、**React**（官方 `@a2ui/react`）、**Lynx**（ReactLynx，v0.9）
- 📋 **Planned Q2 2026: SwiftUI (iOS/macOS)、Jetpack Compose (Android)**
- 💡 Proposed: Vue、Svelte/Kit、ShadCN (React)
- 社区还有：easyops-cn/a2ui-sdk、BBC6BAE9/a2ui-swift（v0.8/0.9/0.9.1）、AGenUI/AGenUI（iOS/Android/HarmonyOS，自定义 catalog）、uny/a2ui-compose（**v1.0**，Compose Multiplatform）、a2ui-ink（终端 Ink）等。

**Agent frameworks：**
- ✅ Complete: 任何支持 A2A / AG-UI 的 agent（day-zero）、**AG2**（官方 A2UIAgent）
- 🚧 In Progress: **ADK**（"still designing developer ergonomics"）
- 💡 Proposed: Genkit、LangGraph、CrewAI、Claude Agent SDK、OpenAI Agent SDK、MS Agent Framework、AWS Strands

---

## 4. ⭐ 关键 future direction：**「声明式语言路线」正在往哪走**

**这是我认为对「未来发展方向」最重要的一条线索：**
A2UI 正在把「**模型面语法**」和「**线上协议**」解耦 —— 协议保持规范 JSON（v1.0，`application/a2ui+json`），但在其之上并行试验**多个超紧凑的声明式推理 DSL**，由本地/远端 Gemini 生成、宿主侧编译器编译成标准 v1.0 JSON。全部放在 `specification/proposals/` 下，用环境变量 gate。

### 三个候选 DSL（都在 `specification/proposals/`）
| DSL | 语法 | Token 收益 | 状态/出处 |
|---|---|---|---|
| **Express** | `var = Component(args, param=value)`，`<a2ui>` sentinel | **比原生 JSON 少 55–70% 输出 token** | `proposals/express/a2ui_express.md` |
| **Atom** | **S-expression** (Lisp 风格) `(Card (Column :align "center" …))`，`;` 注释 | **比 Express/Elemental 再少 25–50%** | `proposals/atom/a2ui_atom.md` |
| **Elemental** | HTML5/JSX 风 `<body>` block，JSX `{{...}}` 属性表达式 | （未标数字）| `proposals/elemental/implementation_plan.md` |

Express 设计目标（逐字）：
- "reducing output tokens by **55% to 70%** compared to native A2UI wire payloads"
- 面向端侧小模型：**Gemma 4 E2B / E4B**
- streaming：line-oriented grammar，逐行 parse → 边生成边渲染
- **协议对齐**：完全语义兼容 v1.0（data binding / validation / local event）

Atom 设计目标（逐字）：25–50% 再降 token、**TTFC（time-to-first-component）**（父节点先于子节点发出，token index 0 即可画骨架）、**100% schema resilience**（加可选参数不破坏 payload）、**deterministic auto-healing**（流中断时自动补齐未闭合 `)` 得到可渲染 partial UI）。

**最新动作（2026-10-13，说明这已从 experiment 转正）：**
- `#3185 refactor(python): **move express inference format out of experimental**`
- `#3190 refactor(ts_agent): decompose ExpressDecompiler into focused collaborator modules`
- `#3177–#3181` 一批 commit 给 Express 加 **multi-catalog resolution**（配合 v1.0 的多 catalog 混用）
- Python **Atom inference format** 也已支持 multi-catalog（`#3067`，commit 2026-10-08）

**Direction 一句话（可上幻灯片）**：声明式语言路线接下来的方向 = **"协议稳定、语法爆炸"** —— wire format 冻结成 v1.0 canonical JSON，同时为 LLM 造出越来越省 token、越来越抗流式截断的「编译到 A2UI 的源语言」（Express → Atom），把 token 成本与 TTFC 当成一等优化目标。

❓ 不确定：Express/Atom/Elemental 三者最终会不会合并成一个、或哪个会成为官方唯一推荐，仓库里没有说明；它们仍标注为 proposal / 由 `A2UI_EXPRESS_ENABLED` 之类 env gate 控制。Atom 的 `A2UI_ATOM` 是否同样 gate —— 未逐字确认。

---

## 5. 互操作与协议关系

docs/public/introduction/agent-ui-ecosystem.md 的对照表（逐字要点）：

| | **A2UI** | **MCP Apps** | **AG-UI** |
|---|---|---|---|
| Approach | Declarative component blueprints | Pre-built HTML via `ui://` URIs | High-bandwidth protocol backend↔frontend |
| Rendering | **Native components** (Angular/Flutter/Lit/React…) | Sandboxed `iframe` | Developer-defined |
| Styling | **Host app controls: inherits design system** | Isolated: remote server controls appearance | Developer controls |
| Security | **Declarative data, no code execution** | Sandboxed iframe isolation | Trusted code in your app |
| Multi-agent | ✅ Across trust boundaries | ✅ Multiple MCP servers | ⚠️ Primarily single-agent |
| Cross-platform | ✅ Web/mobile/desktop/native | ⚠️ Web-focused (iframe) | ✅ framework-agnostic |
| LLM generation | ✅ Designed for streaming output | ❌ Pre-built by server | ✅ via A2UI integration |
| Spec | **Open protocol (Apache 2.0)** | MCP extension (**SEP-1865**) | Open source (CopilotKit) |

- **A2UI vs MCP Apps**：MCP Apps 把 UI 当 *resource*（server 提供预构建 HTML，sandbox iframe）。A2UI 是 *declarative*（agent 发 blueprint，宿主控样式）。选择标准逐字：*"Choose MCP Apps when the server should own the full UI experience; choose A2UI when you want dynamic, cross-platform UI that fits naturally into your app."*
- **A2UI vs AG-UI**：AG-UI 是 **transport**，A2UI 是 **format/payload**；互补 —— *"use AG-UI as the pipe, A2UI as the content."*
- **A2UI vs OpenAI ChatKit**：逐字 —— "A2UI shares some design philosophy with ChatKit: both define a set of basic components and use a configurable, declarative abstraction layer. A2UI is **platform-agnostic** …" （**注意：官方只对比了 ChatKit，没有对比 OpenAI Apps SDK。** OpenAI Apps SDK examples repo 2,369 stars，最后 push 2026-04-15 —— 近期不活跃。）
- **可以叠加**：A2UI+AG-UI（管道）、A2UI+A2A（多 agent）、A2UI+MCP（"Upcoming bridge lets MCP servers provide A2UI blueprints alongside HTML resources" —— 该 bridge 现在已经实现，见下）。

### MCP 三种集成形态（2026-06-17 blog，逐字）
blog 明确 "We are **considering making a MCP extension to support A2UI**"，并给出 3 个 pattern：
1. **A2UI over MCP servers** —— 替代 MCP Apps，绕过 iframe，原生渲染。"write-once, render-natively anywhere"。
2. **MCP Apps in A2UI** —— 用 A2UI 的 double-iframe 隔离去安全承载第三方 MCP App HTML。
3. **A2UI in MCP Apps** —— 在 MCP App 里渲染 A2UI。
- 代码事实：`docs/public/guides/a2ui_over_mcp.md` 里 MCP tool 带 `_meta.ui` 指向 `a2ui://` resource；A2UI 消息可作 `a2ui://` resource 或 embedded resource。`samples/community/mcp/a2ui-over-mcp-recipe`。

---

## 6. A2A 关系（要点）
- A2UI **不是** A2A 的一部分，而是 A2A 之上的一层 UI payload；官方提供 **A2A Extension**（`specification/v1_0/extensions/a2a/docs/a2ui_extension_specification.md`）：Standardize metadata placement、renderer↔agent capability negotiation、**bidirectional data model synchronization**。
- A2A extension 最初在 **a2asummit.ai** 上 teased（roadmap.md 逐字提到 "thanks Google A2A team! teased at a2asummit.ai"）。❓ 我只验证到 a2asummit.ai 返回 200，未逐字确认 A2UI 首发演讲日期。
- `a2aproject.org` 首页我抓取时**未**用 grep 匹配到 "a2ui" 字样（页面可能是 JS 渲染）——❓ 不能断言 A2A 官网是否提及 A2UI。

---

## 7. 成熟度信号
- **conformance/ + eval/** 目录存在（`conformance/` 含 10 个子目录；`eval/` 17 个），2026-10-09 有 commit "port Express TS unit tests to **language-agnostic YAML suites**" → 走规范驱动的跨语言一致性测试。
- `specification/v1_0/test/cases/*.json` 有 17+ 个 schema 校验用例。
- **SDD（Spec-Driven Development）**：仓库有 `blueprints/`（language-agnostic blueprints）+ `codebase.blueprint.md` 按 commit hash 追踪各语言实现合规度；AGENTS.md 逐字: "To scale development across multiple programming languages and UI frameworks, the A2UI repository adopts Spec-Driven Development (SDD)."
- 仍在演进（逐字）: "Expect changes." / "functional but are still evolving."

---

## 8. 链接清单
- 站点: https://a2ui.org/
- 仓库: https://github.com/a2ui-project/a2ui （旧 `google/A2UI` 301 到此）
- 博客 1 (2025-12-15 首发): https://developers.googleblog.com/introducing-a2ui-an-open-project-for-agent-driven-interfaces/
- 博客 2 (2026-04-17, v0.9): https://developers.googleblog.com/a2ui-v0-9-generative-ui/
- 博客 3 (2026-06-17, + MCP Apps): https://developers.googleblog.com/a2ui-and-mcp-apps/
- Roadmap: https://a2ui.org/roadmap/ （源 `docs/public/roadmap.md`）
- 生态对照: docs/public/introduction/agent-ui-ecosystem.md
- 采用案例: docs/public/ecosystem/a2ui-in-the-world.md
- Flutter GenUI SDK: https://docs.flutter.dev/ai/genui · https://github.com/flutter/genui
- AG-UI: https://ag-ui.com/ · https://docs.ag-ui.com/introduction · CopilotKit https://www.copilotkit.ai/
- MCP Apps 官方: https://blog.modelcontextprotocol.io/posts/2025-11-21-mcp-apps/ （SEP-1865）
- A2A: https://a2aproject.org/ · https://a2a-protocol.org
- Composer (可视化生成 A2UI JSON): https://a2ui-project.github.io/composer/
- PyPI: `a2ui-agent-sdk` **0.8.0** (2026-10-08)、`a2ui-core` **0.3.0** (2026-10-08)
  - npm: `@a2ui/react` **0.13.0**、`@a2ui/web_core` **0.13.0**、`@a2ui/lit` **0.13.0**、`@a2ui/angular` **0.12.0**、`@a2ui/markdown-it` **0.2.1**（全部 modified 2026-10-09）
  - Dart: `a2ui_core` **0.2.2**

---

## 9. 存疑 / 未验证
- ❓ v1.0 stable 的确切发布日期：仅从 milestone "October Launch"（due 2026-10-29）推断，仓库无逐字声明。
- ❓ Atom / Elemental 目前是否已从 experimental 转正：只有 Express 有明确的 #3185 "move out of experimental" commit；Atom 的 gate 变量未逐字确认。
- ❓ Express/Atom/Elemental 最终取舍与官方推荐：仓库未说明。
- ❓ a2aproject.org 是否提及 A2UI：页面 JS 渲染，grep 未命中，不能断言。
- ❓ A2UI 首发演讲（a2asummit）的确切日期/演讲人。
- ❓ OpenUI（Thesys）与 A2UI 是否有官方协同：本次未做（属另一 worker 范围）；A2UI 官方文档只对比了 ChatKit，没提 Thesys OpenUI。
- ❓ star/fork 数、commit 数为抓取瞬时值（2026-10-14），会变。
