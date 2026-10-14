# A2UI — 外部动态与活跃度信号（外部核查）

> 采集时间：2026-10-14（UTC 2026-10-13T23:54）
> 来源：`gh api`（GitHub）、a2ui.org / raw.githubusercontent.com 文档、Google 官方博客、PyPI/npm。
> 说明：本文件只做外部核查 + 版本/发布/生态信号，不深读本地 `/Users/work/ai/a2ui` 源码。

---

## 1. GitHub 硬数据（repo: `a2ui-project/a2ui`）

| 指标 | 数值 | 采集时点 |
|---|---|---|
| Stars | **16,688** | 2026-10-13 |
| Forks | 1,328 | 2026-10-13 |
| Watchers / subscribers | 98（watchers_count 同 stars） | 2026-10-13 |
| Open issues | 478 = **366 issues + 112 PRs** | 2026-10-13 |
| Contributors | **99**（`contributors?per_page=100` 返回 99） | 2026-10-13 |
| Created at | 2025-09-24T23:14:02Z | — |
| Pushed at（最后 push） | 2026-10-13T23:52:59Z | — |
| License | Apache-2.0 | — |
| Homepage | https://a2ui.org/ | — |
| Language | TypeScript | — |
| Repo description | 空（组织描述："A Protocol for Agent-Driven User Interfaces"） | — |

### 活跃度
- 最后一次 commit：`4ca7353f`，2026-10-13T23:52:58Z，`feat(v1.0): add optional surfaceId to callRendererFunction (#3110)`。
- 近 30 天 commit 数：**222**（`search/commits`，`committer-date:>2026-09-14`；`commits?since=2026-09-14&per_page=100` 已触顶返回 100，非真实上限）。
- 结论：**日更级别的高活跃**，且 commit 大量围绕 v1.0 收敛（见下）。

### Releases / Tags
- `releases` 接口仅 **4 条**，全部是子包作用域（非协议级）：
  - `python/a2ui-core/v0.3.0` — 2026-10-08T16:32:45Z
  - `python/a2ui-agent-sdk/v0.8.0` — 2026-10-08T16:32:48Z
  - `python/a2ui-core/v0.2.0` — 2026-09-28T17:26:27Z
  - `python/a2ui-agent-sdk/v0.7.0` — 2026-09-28T17:26:29Z
- `git/refs/tags` 共 8 个：`v0.8`、`v0.9`（协议 tag，轻量无日期）+ 6 个 python 子包 tag。
- **注意**：协议主版本（v0.9.1 / v1.0）没有独立 GitHub Release，只有 tag / 文档。

### Milestones
- 仅 1 个：**"October Launch"**，`open`，due **2026-10-29**，open_issues 3 / closed_issues **0**。

### Open issue 标题里的路线信号（`issues?state=open`，按时间倒序）
大量 v1.0 收敛条目，例如：
- `#3186 [MCP] feat(catalog-mcp): build tooling, configureMcpCatalog, the v1.0 entry point and the samples on it`
- `#3183 refactor(dart/a2ui_core)!: align renderer/agent names, EventSource.subscribe, and PayloadValidator APIs`（破坏性）
- `#3176 refactor(python): move A2A and ADK integrations out of the agent SDK`
- `#3175 Cross-platform misalignment on v1.0 ValidationResult truthiness...`
- `#3158 [BUG]: @a2ui/react 0.13.0 throws "HTMLElement is not defined" on import in Node (regression from 0.12.0)`（说明 React renderer 已到 0.13.x）

---

## 2. 官方文档 / Roadmap（原文要点）

来源：`https://raw.githubusercontent.com/a2ui-project/a2ui/main/docs/public/roadmap.md`（文末标注 **Last Updated: June 2026**）

### 状态
- 协议版本：**v0.8 = 🆗 Prior**；**v0.9 = 🆗 Prior**；**v0.9.1 = 🆗 Current（stable release）**；**v1.0 = 📋 Candidate（release candidate）**。
- Renderers：
  - ✅ Stable：Web Core Lib、Web Components (Lit)、Angular、Flutter (GenUI SDK)、React、**Lynx（v0.9）**
  - 📋 Planned：**SwiftUI（iOS/macOS）— Q2 2026**、**Jetpack Compose（Android）— Q2 2026**
  - 💡 Proposed：Vue、Svelte/Kit、ShadCN (React)
- Transports：A2A ✅、AG-UI ✅（"Day-zero compatibility"）、REST ✅、WebSockets ✅、MCP ✅（全部 Complete）
- Agent frameworks：A2A ✅ / AG-UI ✅（day-zero）、**AG2 ✅ Complete**、**ADK 🚧 In Progress**；Genkit、LangGraph、CrewAI、Claude Agent SDK、OpenAI Agent SDK、Microsoft Agent Framework、AWS Strands 均为 💡 Proposed。

### Upcoming Milestones（原文）
- **Q3 2026（v0.9 & v1.0）**：
  - Jetpack Compose Renderer（Android）：Native Compose UI components / Material Design 3 support / Android platform integration
  - SwiftUI Renderer（iOS/macOS）：Native SwiftUI components / iOS design language support / macOS compatibility
  - Performance Optimizations：Renderer performance benchmarks / Lazy loading for large component trees / Virtual scrolling for lists / Component memoization strategies
- **Q4 2026（v1.0）** — "Finalize v1.0 of the protocol with:"：
  - Stability guarantees
  - Migration path from v0.9
  - Comprehensive test suite
  - **Certification program for renderers**
- **Long-Term Vision**：
  - Full App UIs（build-time developer tooling、caching 作为 static UI 的 config layer、full app composition）
  - Multi-Agent Coordination（composition patterns、conflict resolution、shared surface management）
  - Accessibility（ARIA 生成、screen reader、keyboard nav、contrast/color）
  - Advanced UI Patterns（**Drag and drop / Gestures and animations / 3D rendering / AR/VR interfaces (exploratory)**）
  - Ecosystem Growth（更多框架、第三方组件库、agent marketplace、enterprise）

### 发布节奏 / 版本策略
- Major（1.0, 2.0）年度或重大破坏性变更；Minor 季度；Patch 按需。
- 语义化版本：MAJOR=不兼容协议变更，MINOR=向后兼容新增，PATCH=向后兼容修复。

---

## 3. 生态采用 / Google 官方背书

### 3.1 Google 官方博客（一手，含日期）
| 日期 | 标题 | URL | 关键点 |
|---|---|---|---|
| 2025-12-15 | Introducing A2UI: An open project for agent-driven interfaces | https://developers.googleblog.com/en/introducing-a2ui-an-open-project-for-agent-driven-interfaces/ | 项目公开。定位"safe like data, but expressive like code"；A2A/AG-UI 传输；explicitly 与 MCP Apps / OpenAI ChatKit 划界 |
| 2026-04-17 | A2UI v0.9: The New Standard for Portable, Framework-Agnostic Generative UI | https://developers.googleblog.com/en/a2ui-v0-9-generative-ui/ | v0.9 发布；新增 Python Agent SDK + web-core + 官方 React renderer；`pip install a2ui-agent-sdk`；A2A 1.0 已发布；提到 Vercel json-renderer、Oracle Agent Spec、AG2 |
| 2026-05-30 | Developer's guide to Gemini Enterprise and A2UI integration（Google Cloud Blog, Dave Wang / Yuan Tian） | https://cloud.google.com/blog/topics/developers-practitioners/guide-to-gemini-enterprise-and-a2ui-integration | Gemini Enterprise（GE）内置 A2UI renderer；reference 为 ADK + A2A + Gemini 的 restaurant-finder；A2UI 作为 DataPart，MIME `application/json+a2ui` |
| 2026-06-17 | A2UI + MCP Apps: Combining the best of declarative and custom agentic UIs | https://developers.googleblog.com/en/a2ui-and-mcp-apps/ | 三种 A2UI↔MCP Apps 架构模式；MIME `application/a2ui+json`、URI scheme `a2ui://`；原文"We are considering making a MCP extension to support A2UI" |

补充（**不同项目**，勿混淆）：Google Research "Generative UI: A rich, custom, visual interactive user experience for any prompt"（2025-11-18，research.google）——Gemini app 的 dynamic view + Search AI Mode 的"生成整页 UI"研究路线，**不是 A2UI**，但同属 Google 生成式 UI 大方向。

### 3.2 `docs/public/ecosystem/a2ui-in-the-world.md`（线上版，即 adopters 名单）
**Production Deployments（官方/一方）**
- **Google Opal**（opal.google）：Opal 团队是 A2UI "core contributor from the beginning"；"hundreds of thousands of people" 用它构建 AI mini-apps。引述 Dimitri Glazkov（Principal Engineer, Opal）。
- **Gemini Enterprise**：企业 agent 渲染 rich UI（forms / approval dashboards / workflow automation）。引述 Fred Jabbour（PM, Gemini Enterprise）。
  - ⚠️ 原文限制："A2UI rendering in Gemini Enterprise currently requires self-serve agents registered using the Agent-to-Agent (A2A) path (`a2aAgentDefinition`). Managed agents deployed on Vertex AI Agent Engine and registered using the `adkAgentDefinition` path do not currently support A2UI rendering."
- **Flutter GenUI SDK**（docs.flutter.dev/ai/genui）："**GenUI SDK uses A2UI as the underlying protocol** ... When you use GenUI, you're using A2UI under the covers." 引述 Vijay Menon（Eng Director, Dart & Flutter）。
- **Google ADK**：内置 UI **ADK Web**（github.com/google/adk-web）已 native A2UI rendering；集成 v0.8 basic catalog，并做 A2UI↔A2A 消息转换。Python agent SDK 提供 ADK extension。
- **"Google's AI-Powered Products"**（内部规模化）：引述 James Wren（Senior Staff Engineer, AI Powered Google）。

**Partner Integrations**
- **AG-UI / CopilotKit**：day-zero A2UI 兼容。引述 Atai Barkai（CopilotKit/AG-UI 创始人）。
- **AG2**：`A2UIAgent` reference agent，native A2UI，A2A + AG-UI 双传输。引述 Mark Sze（Founding Engineer, AG2）。

**Community / 第三方**
- Vercel `json-render`（React，Zod catalogs）、**OpenClaw Canvas**、Codemate/Rebel App Studio 的 Personal Health Companion。
- `docs/public/ecosystem/community.md` 明确 "Project Partners: Google Opal, Flutter (GenUI SDK), Gemini Enterprise, AG-UI / CopilotKit, and the A2A team"。

### 3.3 社区 renderer 星标（截至 2026-10-13）
| 项目 | Stars | 最近 push | 备注 |
|---|---|---|---|
| AGenUI/AGenUI | 1,197 | 2026-10-08 | iOS/Android/HarmonyOS native，v0.9 |
| shawnwang15/a2ui-vue | 98 | 2026-10-04 | Vue 3 |
| BoteAI/a2ui | 78 | 2026-10-11 | React playground |
| lmee/A2UI-Android | 77 | 2026-04-17 | 唯一 Jetpack Compose（社区） |
| uny/a2ui-compose | —（表中）| — | v1.0，Compose Multiplatform |
| sivamrudram-eng/a2ui-react-native | 30 | 2026-01-05 | 唯一 React Native |

> `docs/public/ecosystem/renderers.md` 明确：这些是社区维护，非官方；官方 React renderer = `@a2ui/react`。

### 3.4 发布量 / 使用量信号
- npm `@a2ui/react`：最新 **0.13.0**，首次发布 2026-03-17，**近 30 天下载 517,581**（2026-09-13 ~ 2026-10-12）。
- PyPI `a2ui-agent-sdk`：最新 **0.8.0**（2026-10-08），累计 13 个 release，首个 2026-03-31。
- PyPI `a2ui-core`：最新 **0.3.0**，累计 8 个 release，首个 2026-06-11。

### 3.5 A2UI Composer / Theater
- **A2UI Composer**：repo `a2ui-project/composer`，**官方组织仓库**（Apache-2.0），**17 stars**，创建 2026-05-08，最近 push **2026-10-13**。定位："Real-Time Visual Authoring, Live-Preview & Debugging Workbench for A2UI"，纯客户端 serverless + Gemini LLM 辅助。线上 demo：https://a2ui-project.github.io/composer/
- **A2UI Theater**：https://a2ui-composer.ag-ui.com/theater（HTTP 200）——由 **AG-UI/CopilotKit 域**托管，用于跨 Lit/React/Angular renderer 回放流式场景。README 把它列为官方入口之一，但域名属 AG-UI。
- 组织 `a2ui-project` 只有 2 个 public repo：`a2ui` 与 `composer`。

---

## 4. 互操作：A2UI vs A2A / AG-UI / MCP Apps / OpenAI

文档：`docs/public/introduction/agent-ui-ecosystem.md`（"How Does A2UI Compare?"）

| | A2UI | MCP Apps | AG-UI |
|---|---|---|---|
| Approach | Declarative component blueprints | Pre-built HTML via `ui://` URIs | High-bandwidth backend↔frontend protocol |
| Rendering | Native components | Sandboxed iframe | Developer-defined |
| Styling | Host app controls（继承 design system） | Isolated: remote server controls | Developer controls |
| Security | Declarative data, no code execution | Sandboxed iframe isolation | Trusted code within your own app |
| Multi-agent | ✅ Across trust boundaries | ✅ Multiple MCP servers | ⚠️ Primarily single-agent |
| LLM generation | ✅ Designed for streaming output | ❌ Pre-built by server | ✅ Via A2UI integration |
| Spec | Open protocol (Apache 2.0) | MCP extension (SEP-1865) | Open source (CopilotKit) |

**官方原文引述**
- AG-UI："AG-UI is a **transport protocol** ... A2UI is a **UI format**: the payload that describes what to render. They're complementary: use AG-UI as the pipe, A2UI as the content." 且 "AG-UI has day-zero A2UI compatibility."
- A2A："A2UI + A2A: A2UI messages sent via the A2A protocol for multi-agent systems." v0.9 blog 亦称 A2A 1.0 是 A2UI 的 transport；Cloud blog 记录 DataPart MIME `application/json+a2ui`。
- MCP Apps："Choose MCP Apps when the server should own the full UI experience; choose A2UI when you want dynamic, cross-platform UI that fits naturally into your app." 以及 "A2UI + MCP: **Upcoming bridge** lets MCP servers provide A2UI blueprints alongside HTML resources."
- MCP Apps 反向集成：`docs/public/guides/mcp-apps-in-a2ui.md` 用 **double-iframe 隔离**（inner iframe 明确 MUST NOT 带 `allow-same-origin`）在 A2UI surface 内安全运行第三方 MCP Apps。
- A2UI-over-MCP：MCP resource/tool 返回 `application/a2ui+json`，URI `a2ui://`（`docs/public/guides/a2ui_over_mcp.md`）。
- **OpenAI**：文档只在 "A2UI vs ChatKit (OpenAI)" 一节对比 ChatKit；MCP Apps 是 "consolidating work from MCP-UI and OpenAI" 的产物。全文无 "OpenAI Apps SDK" 官方互操作声明（repo 内 "Apps SDK" 仅 1 处代码命中）。→ **A2UI 与 OpenAI Apps SDK 无官方直接关系**，只有与 ChatKit 的定性对比。

---

## 5. 不确定 / 需注意
1. **协议主版本没有独立 Release**：`releases` 只有 python 子包；v0.9.1/v1.0 只以 tag + 文档形式存在，无法从 Release 时间线判断协议节奏。
2. **"October Launch" milestone 已 overdue 风险**：due 2026-10-29，当前 0 closed / 3 open，是否按期未知。
3. **ADK 关系口径不一致**：roadmap 仍写 ADK "🚧 In Progress"，但 `a2ui-in-the-world` 称 ADK Web 已内置 A2UI 渲染；"in progress" 可能指 developer ergonomics 而非能力有无。
4. **Gemini Enterprise 支持受限**：仅 A2A 自注册路径（`a2aAgentDefinition`）支持渲染，Vertex AI Agent Engine 托管 `adkAgentDefinition` 路径尚不支持。
5. **OpenAI Apps SDK**：无官方互操作证据，仅 ChatKit 对比与 MCP Apps 生态交集。
6. **A2UI Theater 归属**：域名在 ag-ui.com 下，属 AG-UI/CopilotKit 托管，非 a2ui-project 组织仓库。
7. **star 增长**：repo 2025-09-24 创建，2026-10-13 已 16,688 stars；增速很高，但未取 star history 曲线，无法区分近期斜率。
8. **数据一致性**：`watchers_count` 与 `stargazers_count` 相同（GitHub API 常见别名），真实 watch 数应为 `subscribers_count = 98`。
