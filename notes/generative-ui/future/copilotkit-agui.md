# CopilotKit · AG-UI · 协议标准化 —— 汇总与「04 · 未来发展方向」草稿

> 汇总人：copilotkit_agui（2026-10-14）。数据来源：本地 submodule（`copilotkit/`、`ag-ui/`、`a2ui/`、`openai-apps-sdk-examples/`、`openui/`）+ npm registry + 官方 spec/docs/blog。
> 姊妹笔记（同一目录）：`landscape.md`（三协议格局）、`web-trends.md`（Vercel/生态广谱）、`openai-mcp-apps.md`（OpenAI MCP Apps 细节）、`our-roadmap.md`（我们自己的现状）、`copilotkit.md`、`ag-ui.md`。
> **本文件未修改 `slides.md`**，第 5 节是可直接粘贴的替换草稿。

---

## 0. 一句话结论

**协议层已经收敛，且收敛方式不是"谁赢"，而是分层互补：MCP Apps（交付/沙箱层，MCP 官方，Anthropic+OpenAI 合流）· A2UI（声明式载荷层，Google）· AG-UI（agent↔前端运行时事件总线，CopilotKit）。三者都已在 2026 年进入"有版本号、有冻结 schema、有多语言 SDK"的阶段。我们要做的选择不是"接哪一个"，而是"我们在哪一层下注"——而这正好接上我们主动封死 L3（sandbox HTML）的那个取舍。**

---

## 1. 已发布事实

### 1.1 AG-UI（agent ↔ 前端 运行时协议）

| 事实 | 出处 / 日期 |
|---|---|
| **AG-UI 1.0 于 2026-09-17 发布并冻结**（首个"有规范"的版本：schema 是唯一真源，所有 SDK 由 schema 生成） | `ag-ui/docs/migrating-to-1-0.mdx`；npm `@ag-ui/core` 1.0.0 = 2026-09-17 |
| npm `@ag-ui/core` latest **1.0.2（2026-10-05）**，canary 1.0.0-canary（2026-09-16） | registry.npmjs.org（本机核对） |
| 官方公告《Introducing AG-UI 1.0》**2026-09-30** | copilotkit.ai/blog/ag-ui-1.0 |
| **schema 定义 31 种事件**（+ `Event` 联合体、`BaseEvent`）：生命周期 5、文本 4、工具 5、状态 3、活动 2、推理 7、子代理 3、透传 2 | `ag-ui/spec/1.0/schema.json`（本机 `python3` 枚举，共 98 个 definition、33 个 `*Event`） |
| **interrupt 不是事件**：暂停/恢复由 `RUN_FINISHED.outcome` + `RunAgentInput.resume` 表达 | `ag-ui/docs/spec/1.0/changelog.mdx` |
| 1.0 相对 0.x 的 9 条 Major change：规范存在本身、`RUN_FINISHED.outcome`、subagents、`REASONING_*` 取代 `THINKING_*`、activity 事件、unknown-vs-malformed 规范化、chunk 规则、**protobuf 二进制 wire**、`AgentCapabilities` 进 schema | `ag-ui/docs/spec/1.0/changelog.mdx` |
| 传输：**HTTP+SSE 必支持**；**Protobuf 二进制可选**（media type 协商、4 字节长度前缀帧）；WebSocket 属自定义传输 | 同上 §8；`ag-ui/spec/1.0/proto-freeze.txt` |
| 版本策略：1.0 永久冻结；后续改动进 `draft`，站点显示 **"1.1 (draft)"**；`PROTOCOL_VERSION = "1.0"` | `ag-ui/docs/spec/1.0/basic/versioning.mdx` |
| SDK：官方 TS / Python / .NET；社区 C++ / Dart / Go / Java / Kotlin / Ruby / Rust | `ag-ui/sdks/` |
| 集成 20+：LangGraph、MS Agent Framework、Google ADK、Mastra、AWS Strands、Claude Agent SDK、A2A、Bedrock AgentCore… | `ag-ui/integrations/`、`ag-ui/README.md` |
| 兼容 shim 到期日 **2027-09-17**（THINKING_*→REASONING_*、binary→media part） | `ag-ui/DEPRECATIONS.md` |
| 官方立场原话：**"AG-UI is not a generative UI specification"**，它是 User Interaction 协议，原生承载各种 UI spec，也允许自定义 | `ag-ui/docs/concepts/generative-ui-specs.mdx` |
| **它自己的 generative-UI 扩展还只是 Draft**：`generateUserInterface(description, data, output)` → 二级生成器 → 校验后返回用户输入；作者 Markus Ecker | `ag-ui/docs/drafts/generative-ui.mdx`（`Status: Draft`） |

### 1.2 CopilotKit（产品化层）

| 事实 | 出处 / 日期 |
|---|---|
| npm `@copilotkit/react-core` 等 lockstep 包 latest **1.79.0（2026-10-12）**；本地快照 1.78.0（HEAD 2026-10-09） | registry.npmjs.org（本机核对）；`packages/*/package.json` |
| README 自称 "**the company behind the AG-UI Protocol**" | `copilotkit/README.md` |
| **官方三分类**（`concepts/generative-ui-overview.mdx`）：**Controlled / Declarative / Open-Ended**，并明说"同一个前端、同一个 runtime、同一个 AG-UI 协议，**逐功能选，不是逐产品选**" | `copilotkit/showcase/shell-docs/.../concepts/generative-ui-overview.mdx` |
| 六种原语：Components as Tools · Tool Call Rendering · State Rendering · Reasoning · A2UI · MCP Apps | 同上（"What CopilotKit ships" 表） |
| 目录结构（`generative-ui/meta.json`）也按四组组织：Controlled（tool-based / tool-rendering / state-rendering）· Frontend-Driven · Declarative（a2ui / json-render / hashbrown）· Open-Ended（mcp-apps / open-generative-ui） | 本地文件 |
| 官网另有一版四档 Spectrum：Controlled / Declarative / MCP Apps / **Fully Open**；原文把 Open GenUI 形容为 "**realistically still mostly experimental today**"，MCP Apps "today the integration is iframe-only" | copilotkit.ai/generative-ui-spectrum（2026-10-14 抓） |
| API 对应：Controlled = `useComponent` / `useFrontendTool`；Declarative = A2UI（runtime `a2ui:{}` + provider `a2ui={{catalog}}`）；Open-Ended = `OpenGenerativeUIMiddleware` / `MCPAppsMiddleware` | `generative-ui/*.mdx` |
| **同时支持三大 UI spec**：A2UI（Google）· **Open-JSON-UI（OpenAI）** · MCP Apps（MCP 生态） | `snippets/shared/generative-ui-specs-overview.mdx` |
| 组件包 **`@copilotkit/a2ui-renderer` 1.79.0**、**`@copilotkit/mcp-apps-renderer` 1.79.0**（实现 A2UI v0.9） | `packages/a2ui-renderer/`、`packages/mcp-apps-renderer/` |
| v1 SDK 已 deprecated，主线迁 `/v2`（`useCopilotAction→useFrontendTool`、`useCopilotReadable→useAgentContext`） | `copilotkit/CHANGELOG.md`、迁移文档 |
| whats-new 最后一批：**MCP Apps 全支持 + LangGraph Deep Agents 兼容（标注 January 22，年份疑为 2026 的笔误）**；A2UI 发布日 **2025-12-15**；v1.50 同日；A2A/MCP handshake | `docs/whats-new/index.mdx` |
| **WebMCP（实验）**：把前端工具发布到 `document.modelContext`，让浏览器 agent 发现并调用；**Chrome 149 origin trial**，且原文强调 "not a W3C Standard"，不可用时安全 no-op | `docs/webmcp.mdx` |

### 1.3 另两个协议（对照用，详见 `landscape.md`）

| 事实 | 出处 / 日期 |
|---|---|
| **MCP Apps = MCP 第一个官方 extension**，SEP-1865，标识符 `io.modelcontextprotocol/ui`；创建 **2025-11-21**、**Stable 2026-01-26** | MCP 官方 blog 2026-01-26；`ext-apps/specification/2026-01-26/apps.mdx` |
| 作者群是 **Anthropic + OpenAI 的 MCP maintainer + MCP-UI 作者混合署名**（Anton Pidkuiko、Olivier Chafik、Ido Salomon 等 9 人）→ **两条历史路线合流** | MCP blog 2025-11-21 |
| 机制：tool `_meta.ui.resourceUri` → `ui://` 资源（`text/html;profile=mcp-app`）→ host **sandbox iframe** → JSON-RPC over `postMessage`（`ui/initialize`、`tool-input(-partial)`、`tool-result`、`tools/call`、`ui/message`、`ui/update-model-context`）；CSP 由 `_meta.ui.csp` 声明 | 同上 |
| **尚未 GA**：spec 内 deprecated 字段写 "will be removed **before GA**"；它仍是 **extension**，未进核心规范正文（核心 2026-07-28 只加了 `extensions` 字段） | `ext-apps` spec；MCP 2026-07-28 changelog |
| 已支持的 host：Claude（web+desktop）、**ChatGPT**、VS Code（含 GitHub Copilot）、M365 Copilot、Goose、Postman、MCPJam、Alpic… | MCP 官方 client matrix；OpenAI 文档 |
| **A2UI = Google 主导的声明式 JSON 组件协议**，Apache-2.0，CopilotKit 是发起/设计伙伴；口号 "safe like data, but expressive like code"；**不执行代码**，只允许 catalog 白名单组件 | `a2ui/README.md`；a2ui.org |
| A2UI 版本：**v0.9.1 = Current 生产版**，**v1.0 = Release Candidate**，v0.8 = Legacy；roadmap（最后更新 2026-06）定 **Q4 2026 finalize 1.0**，含 renderer **认证计划** | `a2ui/docs/public/roadmap.md`；a2ui.org/#specification-versions |
| A2UI 三原语：`createSurface` → `updateComponents`（组件树）→ `updateDataModel`（JSON Pointer）；`application/a2ui+json` | 同上 |
| A2UI 生产采用：**Google Opal、Gemini Enterprise、Flutter GenUI SDK、ADK Web** | a2ui.org/ecosystem |
| **OpenAI Apps SDK**（2025-11 发布）已把 **MCP Apps 当官方 UI 标准**，原文："ChatGPT implements the open MCP Apps standard… this standards-first foundation lets the same UI run in ChatGPT and other compatible MCP Apps hosts"；私有 `window.openai.*` 只保留标准之外的能力（checkout / modal / file / widgetState） | developers.openai.com/apps-sdk/mcp-apps-in-chatgpt |
| 2026 年 OpenAI 用语从 "Apps" 转 **"Plugins"**，统一发布到 ChatGPT+Codex 共用 plugin directory（`plugin.json` + `mcp.json`，`.app.json` 为兼容回退） | developers.openai.com/plugins/* |
| **Open-JSON-UI**：被 AG-UI / CopilotKit 列为 OpenAI 的声明式 UI schema 开放标准化，但**找不到一方规范仓库 / 版本策略（未证实）** | AG-UI `generative-ui-specs.mdx` |
| Vercel 立场：**AI SDK RSC 仍 experimental，官方推荐 AI SDK UI 做生产**；`json-render`（Vercel Labs）走 "catalog + JSON + 多端渲染器"，并把 AI SDK / A2UI / AG-UI / Adaptive Cards / OpenAPI 全列为官方 integration | `web-trends.md` §1；json-render.dev |

---

## 2. 官方路线图 / 未定

- **AG-UI**：1.0 已冻结，无带日期的公开 roadmap 页；`docs/drafts/` 挂着 4 个提案 —— **Reasoning（加密推理内容续传）、Interrupt-aware run lifecycle、Generative UI、Meta Events**，站点上 1.1 仍标 draft。→ 1.1 是"加能力不改 wire"的节奏。
- **CopilotKit**：**无公开带日期的 roadmap**（`/roadmap` 404）。可引用的"未定"只有 Spectrum 页的成熟度形容词（Open GenUI 仍 mostly experimental；MCP Apps iframe-only、未适配移动/Slack）。近期动向：2026-10-09 Open Intelligent UI（基于 Open Generative UI）、2026-10-13 CLiF early access。
- **MCP Apps**：spec 预留 "before GA" 的移除动作 → **GA 是明确的下一站**，但无官方日期。`draft/apps.mdx` 仍在更新。
- **A2UI**：**Q4 2026 finalize v1.0**（稳定性保证 + v0.9→v1.0 迁移路径 + 完整测试套件 + renderer 认证计划）；Q3/2026 renderer 计划：SwiftUI、Jetpack Compose、性能（懒加载/虚拟滚动）。
- **OpenAI**：无 MCP Apps GA 时间表；2026 重点是 plugin directory 统一与"发布后工具自动生效"。
- **WebMCP**：Chrome 149 origin trial，**明确不是 W3C 标准**（CG draft）。
- 待观察（均未证实）：MCP Apps 是否进 MCP 核心正文；A2UI 1.0 是否被主流框架内置；Open-JSON-UI 是否会有官方规范仓库。

---

## 3. 互操作现状

```
        ┌──────────────── 前端 / 宿主应用 ────────────────┐
        │  CopilotKit · ChatGPT · Claude · VS Code · ...  │
        └───────────────▲───────────────────▲────────────┘
                        │ AG-UI（事件/状态/工具调用）
        ┌───────────────┴────────┐          │
        │  Agent（任意框架）      │          │
        └───────────────┬────────┘          │
                        │ MCP / A2A（握手）  │
        ┌───────────────▼────────┐   ┌──────▼─────────────┐
        │ MCP Apps（iframe 沙箱）│   │ A2UI（声明式 JSON）│
        └────────────────────────┘   └────────────────────┘
```

- **可引用的官方互操作**：
  - AG-UI **原生支持 A2UI / MCP-UI / Open-JSON-UI**，也允许自定义 UI 标准；AG-UI 1.0 增加 **A2A 与 MCP 的 handshake**，子 agent 的 UI 属性可一路透传到前端，且保留安全/策略/可观测控制（`a2a-mcp-handshake.mdx`）。
  - AG-UI 仓库已有 `a2ui-toolkit`、`a2ui-middleware`、`mcp-apps-middleware`（npm `@ag-ui/mcp-apps-middleware` 0.1.2，2026-10-08）。
  - CopilotKit 是 **A2UI launch partner**，提供 **zero-day support**；同为 MCP Apps 提供内置 renderer + middleware。
  - A2UI roadmap 把 **AG-UI 标为 day-zero 传输**、A2A 原生、MCP ⭕ 完整支持。
  - MCP-UI（社区 iframe 方案）**并入 MCP Apps**，转型为其 SDK/试验场。
- **三者关系一句话**：**互补，不是竞争。** MCP Apps = 交付/沙箱层（可执行 HTML，表达力最强、品牌与安全最难保证）；A2UI = 载荷/声明式层（不可执行，安全可控、跨端一致）；AG-UI = 运行时/事件层（不含 UI 语义，负责把它们送到前端）。
- **真正的取舍对立面**是 **MCP Apps（L3 开放）vs A2UI（L2 声明式）**：同一产品里常共存；行业事实标准是 MCP Apps，安全优先的答案常是 A2UI。
- **`window.openai.*` 与标准字段的关系**：OpenAI 明确"标准覆盖到的能力一律用标准字段"，私有 API 只作为标准之外的扩展 → 这是"标准优先"的官方表态，可当作标准化收敛的证据。

---

## 4. 链接清单

**AG-UI**
- 仓库 https://github.com/ag-ui-protocol/ag-ui ｜ 文档 https://docs.ag-ui.com
- 1.0 迁移指南 `ag-ui/docs/migrating-to-1-0.mdx` ｜ Key Changes `ag-ui/docs/spec/1.0/changelog.mdx`
- schema（1.0）https://ag-ui.com/spec/1.0/schema.json ｜ 生成式 UI 关系页 `docs/concepts/generative-ui-specs.mdx`
- generative UI 草案 `docs/drafts/generative-ui.mdx` ｜ 草案总览 `docs/drafts/overview.mdx`
- 1.0 公告 https://www.copilotkit.ai/blog/ag-ui-1.0（2026-09-30）
- npm `@ag-ui/core` https://www.npmjs.com/package/@ag-ui/core

**CopilotKit**
- 仓库 https://github.com/CopilotKit/CopilotKit
- 分类法权威页 https://www.copilotkit.ai/generative-ui-spectrum
- 文档源码：`copilotkit/showcase/shell-docs/src/content/docs/concepts/generative-ui-overview.mdx`、`.../generative-ui/meta.json`、`.../snippets/shared/generative-ui-specs-overview.mdx`、`.../docs/whats-new/index.mdx`、`.../docs/webmcp.mdx`
- AG-UI vs A2UI https://www.copilotkit.ai/ag-ui-and-a2ui ｜ MCP Apps https://www.copilotkit.ai/mcp-apps
- npm `@copilotkit/react-core` https://www.npmjs.com/package/@copilotkit/react-core

**协议对照**
- MCP Apps 规范/博客 https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/ ｜ https://modelcontextprotocol.io/docs/extensions/apps
- OpenAI《Add UI to your MCP server》https://developers.openai.com/apps-sdk/mcp-apps-in-chatgpt
- A2UI https://a2ui.org ｜ roadmap https://a2ui.org/roadmap ｜ 仓库 https://github.com/a2ui-project/a2ui
- 本地同目录姊妹笔记：`landscape.md`、`web-trends.md`、`openai-mcp-apps.md`、`our-roadmap.md`

---

## 5. 「04 · 未来发展方向」替换草稿（Slidev，可直接粘贴；**本文件未写入 `slides.md`**）

> 设计意图：把原来的「边界与治理」整体换成「未来发展方向」，但**不丢掉原来那句最有价值的判断**（模型提案 / 系统裁决）——它挪到第 3 张卡的"我们不改的那一条"。全章 5 张：分隔页 + 协议收敛 + 6 条判断 + 我们下一步 + 收束。
> 视觉沿用现有 class：`gu-grid` / `gu-card` / `gu-card is-accent` / `gu-card is-bad` / `gu-quote` / `gu-em` / `gu-muted`。
> 讲稿备注按现有风格（口语、给数字、给判断标准）写在 `<!-- -->` 里。

### 替换 1：原分隔页（`# 🎀 04 · 边界与治理`）→ 分隔页

```md
---
layout: section
---
# 🚀 04 · 未来发展方向

<div class="gu-muted" style="margin-top:0.4rem">协议正在收敛 · 我们下一步做什么</div>

<!--
最后一部分，不看现在，看接下来。

我花了两周把三条协议线的官方仓库、规范、博客都翻了一遍，结论比我预想的清楚：这个领域已经过了"各做各的"的阶段，开始收敛了。而且收敛的方式不是谁把谁干掉，是分层——每一层都有明确的主导者。
-->
```

### 替换 2：原「点击一下，要不要再问一次模型？」→ 协议收敛（三卡对照 + 结论）

```md
---
layout: default
---
# 协议在收敛：三层，各有主导者

<div class="gu-muted" style="margin-bottom:0.8rem">三条线都在 2026 年交出了「有版本号、有冻结 schema、有多语言 SDK」的答卷</div>

<div class="gu-grid g3">
  <div class="gu-card is-accent">
    <h4>运行时层 · AG-UI</h4>
    <p><strong>CopilotKit 主导</strong>，Google / AWS / Microsoft / LangChain 采用。</p>
    <p><strong>1.0 于 2026-09 冻结</strong>：JSON Schema 成为唯一真源，31 种事件，TS / Python / .NET SDK 全部由 schema 生成。<br/>它自己说得很清楚：<span class="gu-em">「AG-UI 不是生成式 UI 规范，而是 agent ↔ 前端的交互协议」</span>。</p>
  </div>
  <div class="gu-card is-accent">
    <h4>载荷层 · A2UI</h4>
    <p><strong>Google 主导</strong>，CopilotKit 是发起/设计伙伴。</p>
    <p><strong>生产版 v0.9.1，v1.0 是 RC</strong>，roadmap 定 <strong>Q4 2026 finalize</strong>。<br/>只发声明式 JSON，组件必须来自你注册的 catalog，<span class="gu-em">不可执行代码</span>——"safe like data, expressive like code"。</p>
  </div>
  <div class="gu-card is-accent">
    <h4>交付层 · MCP Apps</h4>
    <p><strong>MCP 官方扩展</strong>（SEP-1865），署名者里 <strong>Anthropic 和 OpenAI 的 maintainer 同框</strong>——两条历史路线合流。</p>
    <p><strong>2026-01 转 Stable</strong>：tool 声明 <code>ui://</code> 资源，宿主在 <span class="gu-em">sandbox iframe</span> 里渲染，JSON-RPC 双向通信。已上 Claude、ChatGPT、VS Code、M365 Copilot。</p>
  </div>
</div>

<div class="gu-quote" style="margin-top:1rem">
三者<span class="gu-em">互补而不是竞争</span>：AG-UI 负责把东西送到前端，A2UI 和 MCP Apps 是它能承载的两种载荷。<br/>
真正的路线之争只有一条：<strong>沙箱里跑别人的代码（MCP Apps），还是只渲染白名单组件（A2UI）。</strong>
</div>

<!--
先给结论：这个领域已经收敛了，而且是分层的。

最下面一层是运行时，就是 agent 跟前端之间怎么说话，代表是 AG-UI，CopilotKit 在做，Google、AWS、微软、LangChain 都在用。2026 年 9 月出了 1.0，第一次有了真正的规范文件，三十一种事件，三个官方 SDK 全部从同一份 schema 生成。

中间一层是载荷，就是 UI 到底长什么样，代表是 Google 的 A2UI。它只发声明式 JSON，组件必须是你在 catalog 里预先批准的，模型不能写代码。现在生产版是 0.9.1，1.0 是 RC，官方规划今年第四季度定稿。

最上面一层是交付，MCP Apps，它是 MCP 的第一个官方扩展。这里有个信号很强：这份提案的署名里同时有 Anthropic 和 OpenAI 的 maintainer，也就是说之前两家的路线合并了。2026 年 1 月转 stable，现在已经跑在 Claude、ChatGPT、VS Code 和 M365 Copilot 上。

这三者的关系，官方文档讲得很直白：互补，不是竞争。AG-UI 是管道，A2UI 和 MCP Apps 是两种不同的货。

所以真正要选的其实只有一条：你是愿意在沙箱里跑别人写的代码，还是只渲染你自己白名单里的组件。我们选了后者，一会儿说为什么。
-->
```

### 替换 3：原「什么时候需要治理层」→ 未来 6–12 个月（六条判断）

```md
---
layout: default
---
# 未来 6–12 个月：六条可核查的判断

<div class="gu-grid g2" style="gap:0.7rem">
  <div class="gu-card">
    <h4>① MCP Apps 走向 GA，成为事实上的 UI 层</h4>
    <p>规范里明确预留了 <code>before GA</code> 才移除的废弃字段，draft 分支仍在更新。<br/><span class="gu-muted">依据：MCP ext-apps spec · SDK 2.0.3（2026-09）</span></p>
  </div>
  <div class="gu-card">
    <h4>② A2UI v1.0 定稿 + 渲染器认证计划</h4>
    <p>roadmap 写死 Q4 2026：稳定性承诺、0.9→1.0 迁移路径、完整测试套件，外加 renderer 认证。<br/><span class="gu-muted">依据：a2ui.org/roadmap（2026-06 更新）</span></p>
  </div>
  <div class="gu-card">
    <h4>③ AG-UI 变成生成式 UI 的默认总线</h4>
    <p>1.0 已冻结；A2UI 把它列为 day-zero 传输；又补齐了与 MCP / A2A 的握手，子 agent 的 UI 能一路透传到前端。<br/><span class="gu-muted">依据：AG-UI 1.0（2026-09-30）· a2a-mcp-handshake</span></p>
  </div>
  <div class="gu-card">
    <h4>④ 大厂走「标准层 + 私有扩展层」双层策略</h4>
    <p>OpenAI 文档原话：标准覆盖到的能力一律用标准字段；<code>window.openai.*</code> 只留 checkout / modal / 文件 / widget state。<br/><span class="gu-muted">依据：developers.openai.com · apps-sdk</span></p>
  </div>
  <div class="gu-card">
    <h4>⑤ 沙箱安全参数会被标准化成可审计字段</h4>
    <p><code>_meta.ui.csp</code>（connect / resource / frame domains）、<code>permissions</code>、独立 <code>domain</code> 已经进规范；A2UI 则用 catalog 白名单换"免代码"。<br/><span class="gu-muted">依据：MCP Apps spec（2026-01-26）</span></p>
  </div>
  <div class="gu-card">
    <h4>⑥ 互操作靠桥接，不靠合并</h4>
    <p>预期出现更多「A2UI over AG-UI / A2UI over MCP / MCP Apps 跑在任何宿主」的适配层；MCP-UI 并入 MCP Apps 是第一个范例。<br/><span class="gu-muted">依据：AG-UI 中间件 · mcpui.dev</span></p>
  </div>
</div>

<div class="gu-quote" style="margin-top:0.9rem">
一个容易被忽略的变量：<span class="gu-em">WebMCP</span> 正在把「前端工具」变成浏览器可发现的能力（Chrome 149 origin trial）——
如果它成了，agent 就不必再"猜着点按钮"，界面会反过来变成工具目录。
</div>

<!--
这一页是我的判断，每一条都标了依据，欢迎会后拿依据来反驳我。

第一，MCP Apps 会走向 GA，成为事实上的 UI 层。证据是规范里自己写了有字段会在 GA 前移除，说明 GA 是计划内的里程碑，而且 draft 还在活跃更新。

第二，A2UI 的 v1.0 会在今年第四季度定稿，而且会带一个渲染器认证计划。这条对我们的意义是：以后"我的渲染器符不符合规范"会有第三方答案，不再是自己说自己行。

第三，AG-UI 会成为默认总线。它已经 1.0，A2UI 把 AG-UI 当 day-zero 传输，又补齐了跟 MCP、A2A 的握手。

第四，大厂会走双层策略：标准层加私有扩展层。OpenAI 说得很明白，标准覆盖得到的一律用标准字段，私有的 window.openai 只留结账、弹窗、文件这些标准还没有的能力。这句话反过来读，就是标准正在吃掉私有 API。

第五，沙箱安全参数会变成可审计字段。CSP、权限、独立域名都进规范了。A2UI 选了另一条路，用白名单组件换不用沙箱。

第六，互操作靠桥接，不靠合并。以后会看到越来越多的适配层，而不是某一方统一天下。

最后提一个变量，WebMCP。它把前端工具变成浏览器可以发现的接口，Chrome 已经在做 origin trial。如果它成了，agent 就不用再猜着点按钮，界面本身会变成一份工具目录。这条我标成变量，因为它还只是个社区组草案，不是标准。不过我建议我们保持关注，它可能是我们"工具化"路线的免费放大器。
-->
```

> 注：若幻灯片字太多，⑥ 与 WebMCP 那条可合并；六条也可压成 3×2 的纯小卡（去掉依据行，依据只在备注里讲）。

### 替换 4（新页）：我们下一步做什么（内部视角，素材来自 `our-roadmap.md`）

```md
---
layout: default
---
# 我们下一步：六件事，其实是一件事

<div class="gu-muted" style="margin-bottom:0.7rem">协议层我们没输，差的是<strong>覆盖面</strong>和<strong>运营能力</strong>——把「协议中立」从自证变成他证</div>

<div class="gu-grid g3">
  <div class="gu-card">
    <h4>① 第二个 UI library driver</h4>
    <p>现在只有 Radix/Shadcn 一个适配器。Base UI 或 React Aria 做出来，"协议中立"第一次有<strong>外部证据</strong>。</p>
  </div>
  <div class="gu-card">
    <h4>② chart 通道补完</h4>
    <p>17 个 recipe 已就绪，但 structured 通道 v1 明确排除了 chart。图表恰好是最像杀手场景、又唯一被排除的组件。</p>
  </div>
  <div class="gu-card">
    <h4>③ 增量 Surface 事件 / patch 模式</h4>
    <p>现在预览事件全量重发，体积是 O(n²)（15 次推送 749KB）。这条同时解"贵"和"多面板"两个未来需求。</p>
  </div>
  <div class="gu-card">
    <h4>④ 评测从一次性 CLI 变成 CI 门禁</h4>
    <p>指标已经打得很全，缺的是常态回归阈值——否则一次 catalog 改动就能让提示词悄悄涨 30%。</p>
  </div>
  <div class="gu-card">
    <h4>⑤ Inspector 产品化（Studio）</h4>
    <p>审计数据都在，但没有读接口、没有界面。讲"可审计"的时候，观众会想看那个审计界面。</p>
  </div>
  <div class="gu-card is-accent">
    <h4>⑥ MCP 出口 <span class="gu-muted">（最便宜的一步）</span></h4>
    <p><code>render_ui</code> 本身就是 tool schema，天然可封装成 MCP。<strong>这是分发问题，不是能力问题</strong>——成本最低、曝光最高。</p>
  </div>
</div>

<div class="gu-quote" style="margin-top:0.9rem">
这一章我们一直在讲"谁兜底"。外部的答案已经明朗了：<span class="gu-em">主流把兜底交给沙箱和宿主，我们把兜底留在自己的 Host 里做成事务。</span><br/>
接下来最值得做的一件事，是把这个取舍<strong>变成别人能验证的事实</strong>——第二个 driver、第三个通道、CI 里的数字。
</div>

<!--
说回我们自己。刚才那六条外部判断，其实对应我们手上的六件事。我快速过。

第一，第二个 UI library driver。我们现在只有 Radix 这一套适配器。上一章我一直说"协议中立"，但只有自己一个适配器的时候，这句话是自证的。做出第二个 driver，"中立"才第一次有外部证据。

第二，chart 通道补完。我们准备了 17 个图表 recipe，但 structured 通道这一版明确把 chart 排除了。而图表恰好是生成式 UI 最像杀手功能的场景，也是唯一被排除的组件。这个缺口有点尴尬。

第三，增量 patch。现在预览事件是全量重发，体积是平方级的，实测十五次推送七百多 KB。这条同时解决"贵"和"以后要多面板"两个需求，属于一举两得。

第四，把评测从一次性 CLI 变成 CI 门禁。我们的指标打得很全，token 分类、首事件、首屏、成本都有，但只有人肉跑。没有常态回归，一次 catalog 改动就可以让提示词悄悄涨三分之一，没人知道。

第五，Inspector 产品化。审计数据都在，但只有一个写接口，没有读、没有界面。我们讲"可审计"，观众第一反应就是想看那个界面。

第六，也是我最想推的：MCP 出口。我们的 render_ui 本身就是 tool schema，天然就能封装成 MCP。这不是能力问题，是分发问题——成本最低，曝光最高。别人在 ChatGPT 里能看到的东西，我们也能送上去。

最后一句总结：外部世界把兜底交给沙箱和宿主，我们把兜底留在自己的 Host 里做成事务。这个取舍是对的，但需要证据。第二个 driver、第三个通道、CI 里的数字，就是证据。
-->
```

### 替换 5：原「三句话带走 ✨」→ 保留结构，只换第 ③ 条

```md
---
layout: center
---
# 三句话带走 ✨
```
① 与 ② 原文不动；③ 改为：

```md
  <div class="gu-card is-accent">
    <h4>③ 未来比的不是「能不能生成」</h4>
    <p>协议已经收敛成三层：运行时（AG-UI）、载荷（A2UI）、交付（MCP Apps）。<br/>
    真正的分歧只剩一条：<strong>兜底放在沙箱里，还是放在你自己的 Host 里。</strong><br/>
    我们选了后者——接下来要做的是让这条取舍可被验证。</p>
  </div>
```

底部 `gu-quote` 保留原文不变：

```md
所有方案的差别，最后都能收敛成一个问题：<br/>
<strong>这个功能里，我打算把哪些决定权交给模型，又由谁来兜底？</strong>
```

### 附：原 04 章的处置建议
- 原「点击一下，要不要再问一次模型？」「什么时候需要治理层」两张卡的内容**不必删**，它们是最有说服力的取舍论证；建议前移到 **03 · 怎么接进现有产品**（第 15 页「一个必须知道的坑」之后），不要跟着 04 一起消失。
- 若空间不够，至少把其中"**把模型当提案者、把系统当裁决者**"这一句保留到新 04 的某张卡里（已在替换 4 的 `gu-quote` 中体现）。
- 讲稿里凡是"后面我会反复用"这类承诺，需检查是否指向被移动的页面（第 12 页备注结尾即为一例）。
