# 生成式 UI · 未来发展方向：OpenUI（Thesys）与 A2UI（Google）

> 为 30 分钟内部技术分享《生成式 UI》的「未来发展方向」一节准备的可引用素材。
> 采集日期：**2026-10-14**。数据源：本地 submodule 只读 + `gh api` + 官方文档站/博客（`curl`）。
> star / commit / 发布数均为 **2026-10-13 ~ 10-14 快照**，会继续变化——引用时带上日期。
> 原始逐条笔记（含大量原文摘录与 URL）见同目录 `raw/`：`openui.md`、`a2ui.md`、`a2ui-web.md`、`interop.md`、`ecosystem.md`。

---

## 0. 一页速览

| | **A2UI**（Google） | **OpenUI / OpenUI Lang**（Thesys） |
|---|---|---|
| 一句话 | 声明式 JSON 协议，让 agent「说 UI」，客户端用**自己的原生组件**渲染 | 声明式**语言**（不是 JSON），模型写一次，运行时执行交互 |
| 仓库 | `a2ui-project/a2ui`（旧 `google/A2UI` 301 至此） | `thesysdev/openui` |
| License | Apache-2.0 | MIT |
| Stars | **16,688**（created 2025-09-24） | **10,854**（created 2024-12-02） |
| Contributors | 99 | 52 |
| 版本 | **v0.9.1 = Current stable**；**v1.0 = Candidate（RC）**；v0.8 legacy | **OpenUI 1.0 于 2026-10-12 发布**（`lang-core`/`react-lang` 1.0.0） |
| 最新活动 | 2026-10-13，近 30 天 **222 commits**（日更级） | 2026-10-13；共 **72 个 release** |
| 官方 slogan | "safe like data, but expressive like code" | "The Open Standard for Generative UI" |
| 主要采用方 | Google Opal、Gemini Enterprise、Flutter GenUI SDK（底层即 A2UI）、ADK Web、AG-UI/CopilotKit、AG2 | Thesys C1（托管层）、assistant-ui、Lynx、LangChain/LangGraph、Mastra 官方集成 |
| 核心数字 | Basic Catalog **18 个组件**；v1.0 6 种 wire message | **比 JSON 省 up to 67% token**（7 场景总省 ~52.8%） |

---

## 1. 已发布事实

### 1.1 A2UI — 协议与规格

- **定位（官方逐字）**：*"Agents send a **declarative JSON format** describing the *intent* of the UI. The client application then renders this using its own native component library."*
  - 关键：**不是可执行代码**，是 declarative data。客户端维护一份可信 `catalog`（预批准组件），agent 只能请求 catalog 内的组件 → "safe like data, but expressive like code"。
- **架构四步**：Generation（LLM 生成 A2UI JSON）→ Transport（A2A / AG-UI / MCP）→ Resolution（renderer 解析）→ Rendering（映射到宿主原生组件）。
- **版本状态**（README ⚠️ 块逐字）：
  > "A2UI's current production release is **v0.9.1**, a patch release in the stable v0.9 protocol family. The **v1.0 specification is a release candidate**, while **v0.8 is legacy**."
  - v1.0 在 draft 期叫 **v0.10**；`specification/v1_0/README.md`：*"There is a high bar for accepting breaking changes to a candidate specification."*
  - `AGENTS.md` 权威规则：*"Default to version **v0.9.1** as the primary authority."*
- **v1.0 wire protocol 只有 6 种消息**（`specification/v1_0/json/agent_to_renderer.json`）：
  `CreateSurfaceMessage` / `UpdateComponentsMessage` / `UpdateDataModelMessage` / `DeleteSurfaceMessage` / `CallRendererFunctionMessage` / `AgentFunctionResponseMessage`。
- **Basic Catalog v1 = 18 个组件**（`catalogs/basic/v1/catalog.json`）：
  `Text, Image, Icon, Video, AudioPlayer, Row, Column, List, Card, Tabs, Modal, Divider, Button, TextField, CheckBox, ChoicePicker, Slider, DateTimeInput`。
- **传输层全部标 ✅ Complete**：A2A、AG-UI（day-zero）、REST、WebSockets、MCP。
- **公开 commit 历史最早可追到 2025-10-03**（`#2 [web] Add GULF 0.7 UI + demo`，`4c10ef52`）—— 当时内部代号是 **GULF**；仓库 `created_at` = **2025-09-24**。→ 项目 2025 年 9–10 月才立项，一年涨到 1.6 万 star。
- **近 30 天（2026-09-14 起）222 commits**（`gh api` 分页实测）；99 contributors。

### 1.2 A2UI — renderer 与生态（路线图状态，roadmap 文末 "Last Updated: June 2026"）

| 客户端 | 状态 | 备注 |
|---|---|---|
| Web Core Lib / Web Components (Lit) / Angular / **Flutter (GenUI SDK)** / **React**（`@a2ui/react`） / **Lynx** | ✅ Stable | Flutter 版跨 mobile/web/desktop |
| **SwiftUI (iOS/macOS)** / **Jetpack Compose (Android)** | 📋 Planned（Q2 2026） | 尚未发布 |
| Vue / Svelte-Kit / ShadCN (React) | 💡 Proposed | 社区在推（社区已有 `a2ui-vue`、`svelte-a2ui`、`a2ui-compose` 等） |

- **发布量信号**：npm `@a2ui/react` **0.13.0**，近 30 天下载 **517,581**（2026-09-13 ~ 10-12）；PyPI `a2ui-agent-sdk` **0.8.0**（2026-10-08）、`a2ui-core` **0.3.0**（2026-10-08）。
- **⚠️ 协议主版本没有独立 GitHub Release**：releases 接口只有 4 条，全是 python 子包（`a2ui-core/v0.3.0`、`a2ui-agent-sdk/v0.8.0`…）。v0.9.1 / v1.0 只以 git tag + 文档形式存在。
- **一方采用（官方背书强）**：
  - **Google Opal**：Opal 团队自称 A2UI 的 core contributor，"hundreds of thousands of people" 用它做 AI mini-apps。引述 Dimitri Glazkov（Principal Engineer, Opal）。
  - **Gemini Enterprise**：内置 A2UI renderer；引述 Fred Jabbour（PM）。**限制**：目前只有 A2A 自注册路径（`a2aAgentDefinition`）支持渲染，Vertex AI Agent Engine 托管的 `adkAgentDefinition` 路径**尚不支持**。
  - **Flutter GenUI SDK**（`flutter/genui`，1,782★）逐字：*"GenUI SDK uses **A2UI as the underlying protocol** … When you use GenUI, you're using A2UI under the covers."* 引述 Vijay Menon（Engineering Director, Dart & Flutter）。
  - **Google ADK**：内置开发 UI **ADK Web** 已原生渲染 A2UI（v0.8 basic catalog），并做 A2UI↔A2A 消息转换。
  - **Google 内部**：引述 James Wren（Senior Staff Engineer, AI Powered Google）：*"Much like A2A lets any agent talk to another agent … A2UI standardizes the user interface layer."*
  - 伙伴：**AG-UI / CopilotKit**（day-zero 兼容）、**AG2**（官方 `A2UIAgent` reference agent，A2A + AG-UI 双传输）。
- **Google 一手博客（4 篇）**：
  | 日期 | 标题 | 关键点 |
  |---|---|---|
  | 2025-12-15 | Introducing A2UI: An open project for agent-driven interfaces | 项目公开；与 MCP Apps / ChatKit 划界 |
  | 2026-04-17 | A2UI v0.9: The New Standard for Portable, Framework-Agnostic Generative UI | v0.9 + Python Agent SDK + 官方 React renderer；A2A 1.0 已发布 |
  | 2026-05-30 | Developer's guide to Gemini Enterprise and A2UI integration（Cloud Blog） | GE 内置 renderer；DataPart MIME `application/json+a2ui` |
  | 2026-06-17 | A2UI + MCP Apps: Combining the best of declarative and custom agentic UIs | 三种叠加架构；MIME `application/a2ui+json`、URI `a2ui://`；原文 *"We are considering making a MCP extension to support A2UI"* |

### 1.3 OpenUI（Thesys）— 项目与语言

- **OpenUI 1.0 于 2026-10-12 发布**（PR #1348）。
  - 发布包：`@openuidev/lang-core@1.0.0`、`@openuidev/react-lang@1.0.0`、`react-ui@0.18.0`、`react-headless@0.18.0`、`server@0.3.0`、`a2ui@0.5.0`、`assistant-ui@0.2.0`、`devtools@0.3.0`、`react-email@0.4.0`。
  - 1.0 新增：**裸 action step**（`Button("Ask", @ToAssistant("Tell me more"))`）、**自定义 action**（`defineAction`）、**库函数**（`defineFunction`）、三元 `root` 入口、消息协议（`parseMessage`/`buildMessage`）。
  - ⚠️ **只有 React 升到 1.0**。CHANGELOG 逐字：*"vue-lang, svelte-lang and angular-lang **stay on 0.4** (OpenUI Lang 0.x)."*
- **本地 checkout 落后于远端**：本地 `/Users/work/ai/openui` HEAD `9c5c43e7`（2026-10-11），全部包仍是 0.4.x；远端 main 已是 1.0（2026-10-12，最新 commit `2b2e22b3` 2026-10-13）。→ 分享时若讲「OpenUI 1.0」，以远端为准。
- **"framework-agnostic" 的真相**：
  - ✅ `lang-core` 确实**无框架依赖**（依赖只有 `ci-info`、`@modelcontextprotocol/sdk`、`zod`），它有 parser / prompt 生成 / runtime 求值 / 类型层。
  - ⚠️ 但 **React 是不折不扣的一等公民**：`react-headless`、`react-ui`、`react-email`、`assistant-ui`、`browser-bundle`、`devtools` 全是 React-only；Vue/Svelte/Angular parity 仍是 open issue（#765 vue-headless、#678 Svelte parity）。
  - ⚠️ 官方博客宣称 "React, Vue, Svelte, and React Native"，但**快照里没有任何第一方 React Native 包**；ADOPTERS.md 把跨平台交给第三方 **Lynx**（`@lynx-js/genui`）。
- **OpenUI Lang 语法要点**（`docs/content/docs/openui-lang/`）：
  - **行式赋值**：`identifier = Expression`；第一条语句是入口（默认 `root = Stack(...)`）；**允许前向引用**（→ 可先渲染骨架）。
  - **位置参数**按 **Zod schema 的 key 顺序**映射到 props（这就是省 token 的关键：不写字段名）。
  - 表达式：组件调用 `Type(a1,a2)`、字符串/数字/布尔/null、数组 `[a,b]`、对象 `{k:v}`、引用 `identifier`。
  - **v0.5 起加反应式能力**：状态 `$name = default`（双向绑定）、数据 `Query(...)` / `Mutation(...)`、内置函数 `@Count/@Sum/@Avg/@Filter/@Sort/@Each(...)`、action step `@Run/@Set/@Reset/@ToAssistant/@OpenUrl`、三元与成员访问。
  - **增量编辑**：模型只输出变化的语句，parser 按名字合并，last definition wins；官方例子 20 行/~400 token → 3 行/~60 token（省 ~85%）。

### 1.4 OpenUI — 基准：token 优势到底怎么测的

**宣称**："OpenUI Lang uses **up to 67% fewer tokens** than JSON."

**方法（`benchmarks/README.md`，第一方且已披露）**：
1. 固定 **7 个 prompt**（simple-table / chart-with-data / contact-form / dashboard / pricing-page / settings-panel / e-commerce-product）。
2. 用 **gpt-5.2, temperature 0, streaming** 只生成一次 **OpenUI Lang**。
3. 用 `createParser(schema)` 解析成 AST。
4. **把同一个 AST** 再序列化成另外三种格式：C1 JSON、Vercel json-render JSONL（RFC 6902 patch）、YAML。
5. 用 **tiktoken（gpt-5 encoder）** 统一数 token；延迟按**固定 60 tok/s 推算**（不是实测端到端）。

**结果**：

| 场景 | YAML | Vercel json-render | C1 JSON | **OpenUI Lang** |
|---|---:|---:|---:|---:|
| simple-table | 316 | 340 | 357 | 148 |
| chart-with-data | 464 | 520 | 516 | 231 |
| contact-form | 762 | 893 | 849 | **294**（vs Vercel **-67.1%**） |
| dashboard | 2128 | 2247 | 2261 | 1226 |
| pricing-page | 2230 | 2487 | 2379 | 1195 |
| settings-panel | 1077 | 1244 | 1205 | 540 |
| e-commerce-product | 2145 | 2449 | 2381 | 1166 |
| **总计** | **9122** | **10180** | **9948** | **4800** |
| **省幅** | **-47.4%** | **-52.8%** | **-51.7%** | — |

→ **"up to 67%" = 最优单场景（contact-form）；全场景总计省 ~52.8% vs Vercel / ~51.7% vs C1 / ~47.4% vs YAML。**

**⚠️ 讲这个数字时必须说的三条 caveat**：
1. **第一方基准**（`data.json` 里 `first_party_disclosure` 自认）。
2. 四种格式是**同一个 OpenUI AST 的四种序列化**，不是让模型分别自然地用四种格式生成 → 它测的是**格式冗长度**，不等于「模型写 JSON 会多花 67% token」。
3. 延迟表是按 60 tok/s 的**模型推算**，不是实测。

**可靠性基准（另一套，`generative-ui-bench`，2026-08-17）**：
- 同样 **46 个 prompt × 6 个前沿模型 × 4 次 = 每格式 1,104 次**，三种格式（OpenUI / A2UI / json-render）。
- 结构有效率：**OpenUI 96.5%** vs **A2UI 95.7%** vs json-render 80.2%。
- **空白屏**：OpenUI **1/1104**、json-render 4、**A2UI 35**（A2UI 的默认 renderer 只要有一个组件非法就丢弃整条 `updateComponents`）。
- 系统提示 token：OpenUI **5,031** vs json-render 7,651 vs A2UI **12,610**；平均输出：1,362 vs 3,258 vs 2,823。
- 成本：同样 46 个界面，Claude Opus 4.8 单次 **$2.27（OpenUI） vs $5.85（A2UI）**。
- 生产数据（第一方）：约 **7% 的首轮生成校验失败**（no valid root 44% / reference graph 36% / enum-type-arg 16% / 截断 4%），修复层能救回 **约 9/10** → 最终 **<1%** 的界面以破损状态到达用户。

### 1.5 OpenUI — 公司战略（Thesys）

- **open-core**：OpenUI 完全开源（MIT）做生态标准；**C1 / OpenUI Cloud Gateway** 是变现的托管层。官方逐字：*"For teams who need production-grade orchestration, reliability at scale, and enterprise support, Thesys C1 is the managed layer we've built on top of OpenUI. **That's where our business is.**"*
- **核心论断 "Your LLM is not a query engine"**（2026-07-23）：tool-calling 循环让每轮数据都穿过模型 → 历史膨胀、数据摄入（500 行聚合 ≈ 10–20k token）、每次重算查询、**"every number the user reads was retyped by the model"**。
  - GenUI 替代方案：模型**只编译一次** intent 成 spec，之后运行时直接对工具层执行 `Query`（~100 ms，改参数**零 token**）。
  - 估：一个 7 轮代表会话可从 **70k → 4k token（约 -94%）**，且自认估算偏向 loop 一方。
- **OUI-1**（2026-09-08，Apache-2.0，HuggingFace `thesysdev/OUI-1`）：基于 DiffusionGemma（26B-A4B，4B active）微调，**"world's first model for Generative UI"**；GenUI Benchmark **71.7%**（base DiffusionGemma 仅 13.0%）。训练用 **parser 作为可验证奖励的自蒸馏**（rejection sampling + repair），速度 4.3s → 1.9s。
  - 下一步明确写了三件：端侧/个人设备、**OpenUI Lang 0.5**（状态/查询/变更交给运行时）、**"reliable, locally generated interfaces that arrive in under a second"**。
- **对 ChatGPT「Intelligent UI」的公开拆解**（2026-10-08）：认为 OpenAI 的 **DIL**（Markdown + JSX + JS，服务端编译成 JS 程序 + 常量，sandbox Worker 执行）问题在：状态重载即丢、追问整屏重生成、**"resent programs made up 83% of 275 KB of patches for 6.3 KB of text"**、逻辑错误静默。→ 用来论证「开放、可移植的跨厂商替代」。配套仓库 `open-intelligent-ui`（★359）。
- 官方对标表（`docs/content/docs/openui-lang/comparison.mdx`）：

  | | OpenUI | json-render | A2UI | CopilotKit OpenGenUI |
  |---|---|---|---|---|
  | Tokens | 1× | 3× | 3× | 4× |
  | 流式 | Yes | Yes | Yes | Partial |
  | 设计系统 | Yes | Yes | Yes | No |
  | 组件 | Library + custom | Library + custom | **Custom only** | None |
  | 内置取数 | **Yes** | No | No | No |
  | License | MIT | Apache-2.0 | Apache-2.0 | MIT |

> ⚠️ 这张表是 **Thesys 的自我评测框架**，不是中立第三方结论；上幻灯片时建议标「厂商自评」。

---

## 2. 路线图 / 未定

### 2.1 ⭐ A2UI：「协议稳定、语法爆炸」——未来方向最硬的一条线索

A2UI 正在**把「模型面语法（inference format）」和「线上协议（wire protocol）」解耦**：
wire protocol 冻结为 v1.0 规范 JSON（`application/a2ui+json`），在其之上**并行试验多个超紧凑的声明式推理 DSL**，由（本地或远端）Gemini/Gemma 生成，宿主侧编译器再**编译成标准 v1.0 JSON**。三个提案都在 `specification/proposals/`，用环境变量 gate。

| 提案 | 语法 | 官方 token 宣称 | 目标 |
|---|---|---|---|
| **Express** | Python 风程序：`root = Card(col)`，`<a2ui>` sentinel 包裹 | **比原生 A2UI JSON 省 55%–70% 输出 token** | **端侧小模型 Gemma 4 E2B / E4B**；line-oriented 逐行解析 → 边生成边渲染 |
| **Atom** | **S-expression**（Lisp 风）：`(Card (Column :align "center" (Text "hi")))` | **比 Express / Elemental 再省 25%–50%** | **TTFC（time-to-first-component）**：父容器先于子节点输出，token index 0 即可画骨架；**100% schema resilience**（加可选参数不破坏旧 payload）；**deterministic auto-healing**（流被截断时自动补齐未闭合 `)`，产出可渲染的 partial UI） |
| **Elemental** | **HTML5 自定义元素**：`<ui-card><ui-text text="..."/></ui-card>`，JSX 式 `{...}` 表达式 | 未标数字（论证「HTML 标签常被 tokenizer 合成单 token」） | 利用 **LLM 在 HTML/XML 上的预训练**，减少 system prompt 开销；用 Web Components 描述 catalog |

**主仓库里的证据（已 merge，2026-10-08 ~ 10-09）**：
- `#3063`（docs）/ `#3065`（python，`feat(python/agent): support multi-catalog in Express inference format [3/5]`）/ `#3074` / `#3075`（python，parser / prompt generator / inference format API 对齐 blueprint）—— Express 已进入主仓库的正式代码路径。
- `#3067`：`feat(python/agent): support multi-catalog in Atom inference format and evals [5/5]` —— Atom 同样。
- ⚠️ 主分支上 `specification/proposals/*` 仍**未被移除**，且 README 里 `A2UI_EXPRESS_ENABLED` 这个 env gate 依然存在（逐字理由：*"To prevent pollution of the stable v1.0 baseline workspace during development"*）→ **截至 2026-10-14，三个 DSL 在制度上仍是 proposal，不是 v1.0 的一部分。**

**正在飞的在途 PR（截至 2026-10-14 全部 open、未 merge）** —— 这本身就是「正在激烈迭代」的信号：
| PR | 标题 | 状态 |
|---|---|---|
| #3185 | `refactor(python): move express inference format **out of experimental**` | open（2026-10-13 创建） |
| #3177–#3181 | `feat(ts_agent): Express multi-catalog resolution` [1/5]…[5/5] | 5 个全 open |

> 引用时务必区分：**「已 merge 进主仓库」= 有代码路径；「PR open」= 意图，不代表已发布。** #3185 只是**打算**移出 experimental。

**还有一条更有意思的：A2UI 在自动优化自己的语法。**
`eval/iterative_format_optimizer/` 是一个**自主 agent**，任务是 *"systematically optimizing and improving an A2UI inference format … to maximize LLM generation pass rates (accuracy) while minimizing latency and token footprints"*，用复合分 `S_opt` 自动 KEEP / REVERT 每次改动（跑在 `google/gemini-3.5-flash`）。真实历史记录（`history_summary.md`）：
- `atom #003`：压缩语法规则 → reasoning tokens **-13.3%**、输出 token **-31.6%**、延迟 **-16.0%**，KEEP。
- `atom #014`：精简 catalog 签名描述 → **输入 token -46.3%**，但 **Schema 准确率 100% → 75%**，REVERT。
- `atom #028`：reasoning -43.5% 但输出 token +40.1%，**超出 5% 上限**，REVERT。

配套 eval 框架（`eval/`）：基于 **Inspect AI**；数据集**在仓库里加密存放（Transcrypt）以对抗模型训练爬取造成的 contamination**；策略可切 `direct` / `express` / `elemental`；CI 用 `google/gemini-3.6-flash`，Gemma 走 Ollama。
→ 可以讲成：**「他们不只让模型写 UI，还让模型去改『写 UI 的语言』。」**

**A2UI 官方 roadmap 的下一步（`docs/public/roadmap.md`，Last Updated June 2026）**：
- **Q3 2026**：SwiftUI renderer（iOS/macOS）、Jetpack Compose renderer（Android，Material 3）；性能优化（renderer benchmarks、大树懒加载、列表虚拟滚动、组件 memoization）。
- **Q4 2026：定稿 v1.0** —— stability guarantees、v0.9→v1.0 迁移路径、完整测试套件、**renderer 认证计划（certification program）**。
- **长期愿景**：① **Full App UIs**（build-time 工具链、把 A2UI 当**静态 UI 的配置层**缓存下来、完整 app 组合范式）② **Multi-Agent Coordination**（多 agent 贡献同一 surface、冲突消解、shared surface 管理）③ **可访问性**（ARIA 生成、屏幕阅读器、键盘导航）④ **高级 UI 模式**（拖放、手势与动画、3D、**AR/VR（探索性）**）⑤ 生态（第三方组件库、**agent marketplace**、企业能力）。
- 版本策略：MAJOR 年度（或重大破坏性变更）、MINOR 季度、PATCH 按需；semver。

### 2.2 A2UI 的开放问题

- **v1.0 稳定版没有确切日期**：唯一 milestone 是 **"October Launch"，due 2026-10-29，当前 0 closed / 3 open** → 有延期风险。
- **三个 DSL 最终谁会胜出、会不会合并、会不会成为官方唯一推荐 —— 仓库里没有说明**；它们仍标注为 proposal，由 env gate（`A2UI_EXPRESS_ENABLED` 等）控制。
- **ADK 口径矛盾**：roadmap 仍写 ADK "🚧 In Progress"，但 adopters 页称 ADK Web 已原生渲染。
- **Gemini Enterprise 支持受限**（仅 A2A 自注册路径）。
- **A2UI 官方从未提到 Thesys / OpenUI**：文档的对照只有 MCP Apps、AG-UI、ChatKit。二者**无官方协同声明**。

### 2.3 OpenUI 的开放问题

- 本地 checkout 与远端差一个 1.0 版本（见 §1.3）——分享前若要演示，需先更新。
- **Thesys 的公开 roadmap 仓库已停更**（`thesysdev/roadmap`，最后 push **2025-10-06**），Projects 「Now / Next / Later」看板本次未能取到 → **近期真实排期不可知**。
- Vue / Svelte / Angular 的 1.0 parity 仍是 open issue（#765、#678）。
- 官方博客里提的 "React Native renderer" 在本快照**没有对应包**。
- OUI-1 的完整 31 模型榜单与 HF model card 本次未逐条核对。

---

## 3. 互操作与协议关系

### 3.1 分层（这是「未来」一节的骨架）

| 层 | 协议 / 项目 | 官方自述定位 |
|---|---|---|
| **传输 / 事件流** | **AG-UI**（CopilotKit） | *"event-based protocol that standardizes how AI agents connect to user-facing applications"*；~16 种标准事件；任意 transport（SSE/WS/webhook）。**不是 UI 组件格式** |
| **工具 / 能力 + UI 资源挂载** | **MCP** + **MCP Apps** | MCP Apps 是 **MCP 官方第一个扩展**；`ui://` 资源 + sandbox iframe + `postMessage` 上的 JSON-RPC |
| **声明式 UI 格式** | **A2UI** | 客户端用**自己的原生组件库**渲染；declarative data，无代码执行 |
| **UI 语言** | **OpenUI Lang** | 紧凑、streaming-first 的模型输出语言；**可产出 A2UI v1.0 payload**（`@openuidev/a2ui`），也可走 AG-UI 传输 |
| **运行时** | MCP Apps sandbox iframe、CopilotKit、GitHub Copilot **canvases** | 承载上面这些格式/语言 |

> 一句话格局：**「收敛」只发生在同一层内** —— 开放 UI 运行时/标准层 → **MCP Apps 赢了**；事件传输层 → AG-UI；声明式格式/语言 → A2UI 与 OpenUI Lang 仍在竞争。

### 3.2 执行层的收敛：MCP Apps 吸收 MCP-UI 与 OpenAI Apps SDK

- **SEP-1865**（2025-11-21 官方博客）：*"Introducing the MCP Apps Extension proposal (SEP-1865) … developed with the MCP-UI creators and maintainers from **OpenAI and Anthropic**."*
- 仓库 `modelcontextprotocol/ext-apps`：created 2025-11-21，**2,950★**，最新 **v2.0.3（2026-09-25）**；规范版本目录 `specification/2026-01-26/`。
- **2026-01-26** VS Code 博客宣布 MCP Apps 为 *"the first official MCP extension"*，VS Code 是**首个完整支持的 AI 代码编辑器**。
- **MCP-UI 被吸收而非改名**：`MCP-UI-Org/mcp-ui`（5,210★）站点横幅 *"🎉 MCP-UI is now standardized into MCP Apps!"*；README：*"the patterns developed here directly influenced the MCP Apps specification"*。
- **OpenAI 放弃了私有 UI 协议**（对「未来」一节很有冲击力）：
  - `developers.openai.com/apps-sdk` 现在 **302 → `/plugins`**，产品叙述改为 *"Build and publish plugins with skills, MCP servers, and optional UI."*
  - changelog **2026-02-22**：*"MCP Apps compatibility — ChatGPT is now fully compatible with the MCP Apps spec."*
  - **2026-07-21** 弃用 `_meta["openai/visibility"]`，改用标准的 **`_meta.ui.visibility`**。
  - 官方给出**新旧字段对照表**，`window.openai.*` 被降级为 *"compatibility alias"*：`_meta.ui.resourceUri` ← `_meta["openai/outputTemplate"]`、`ui/notifications/tool-result` ← `window.openai.toolOutput`、`tools/call` ← `window.openai.callTool`、`ui/message` ← `window.openai.sendFollowUpMessage`。
  - 官方原话：*"This standards-first foundation lets the same UI run in ChatGPT and other compatible MCP Apps hosts."*
- **agents 侧标志**：`@modelcontextprotocol/ext-apps@2.0.3`；能力名 `io.modelcontextprotocol/ui`；资源 MIME `text/html;profile=mcp-app`。

### 3.3 A2UI 官方给出的分层对照（逐字，可直接放幻灯片）

| | **A2UI** | **MCP Apps** | **AG-UI** |
|---|---|---|---|
| Approach | Declarative component blueprints | Pre-built HTML via `ui://` URIs | High-bandwidth backend↔frontend protocol |
| Rendering | **Native components**（Angular/Flutter/Lit/React…） | Sandboxed `iframe` | Developer-defined |
| Styling | **Host app controls（继承 design system）** | Isolated：remote server controls | Developer controls |
| Security | Declarative data, **no code execution** | Sandboxed iframe | Trusted code in your app |
| Multi-agent | ✅ Across trust boundaries | ✅ Multiple MCP servers | ⚠️ Primarily single-agent |
| LLM generation | ✅ Designed for streaming output | ❌ Pre-built by server | ✅ via A2UI integration |
| Spec | Open protocol (Apache-2.0) | MCP extension (**SEP-1865**) | Open source (CopilotKit) |

- A2UI vs AG-UI 逐字：*"AG-UI is a **transport protocol** … A2UI is a **UI format**: the payload that describes what to render. They're complementary: **use AG-UI as the pipe, A2UI as the content.**"*
- A2UI vs MCP Apps 逐字：*"Choose MCP Apps when the server should own the full UI experience; choose A2UI when you want dynamic, cross-platform UI that fits naturally into your app."*
- **A2UI + MCP 的三种叠加形态**（2026-06-17 blog，已实现）：
  1. **A2UI over MCP**：MCP server 直接返回 A2UI 蓝图，**绕过 iframe 原生渲染**（"write-once, render-natively anywhere"）；tool 带 `_meta.ui` → `a2ui://` resource；MIME `application/a2ui+json`。例：`samples/community/mcp/a2ui-over-mcp-recipe`。
  2. **MCP Apps in A2UI**：用 A2UI 的 **double-iframe 隔离**（inner iframe **MUST NOT** 带 `allow-same-origin`，防越狱 / frame-busting / 点击劫持外泄）安全承载第三方 MCP App 的 HTML。
  3. **A2UI in MCP Apps**：在 MCP App 里渲染 A2UI。
  - 官方还留了口子：*"We are **considering making a MCP extension** to support A2UI."*
- **A2A**：A2UI 不是 A2A 的一部分，而是跑在 A2A 之上的 UI payload；官方提供 **A2A Extension**（metadata 放置规范、renderer↔agent capability 协商、**双向 data model 同步**），MIME `application/json+a2ui`。

### 3.4 OpenUI 与这些协议的接口

- `@openuidev/a2ui`（**0.5.0**）实现 A2UI v1.0 生命周期，但把 `updateComponents.components` 从 A2UI JSON 换成**一个 OpenUI Lang 语句数组** → 即 **OpenUI 是 A2UI 的一种「源语言」**。
- `lang-core` 依赖 `@modelcontextprotocol/sdk` → 工具走 **MCP 或函数表**。
- `@openuidev/langchain` 依赖 `@ag-ui/core`、`@langchain/langgraph` → 走 **AG-UI** 传输。
- Thesys 自己的框架（state-of-generative-ui blog）把空间切为两轴：**Transport**（AG-UI 自有 app vs MCP Apps 宿主 app）× **Generation**（Static / Declarative / Open-Ended），并判断 **Declarative 是当前生产落地的主战场**；同时承认 MCP Apps + declarative 还缺一环：*"what's missing is **host-side support for rendering a shared catalog**."*

### 3.5 GitHub Copilot 在做什么（提问里点名的对象）

- **VS Code 里的 GitHub Copilot 是 MCP Apps host**（官方 client matrix ✓；2026-01-26 那篇 VS Code 博客）。→ 它能渲染第三方 MCP server 下发的 `ui://` UI。
- **Copilot app 的 "canvases" 是 GitHub 自研的运行时概念**，不是开放跨厂商格式：
  - 2026-06-02 Copilot app（agent-native 桌面客户端）发布。
  - 2026-07-21 / 2026-08-17 / 2026-09-24 / 2026-09-25 一连串官方博客。逐字：*"Chat is great for intent, but weak for durable execution."*；*"chat is the wrong UI … in the GitHub Copilot app, this is called a **canvas**. A canvas is a **little full-stack application that runs inside of the GitHub Copilot app with no browser chrome**."*
  - docs.github.com：*"A canvas extension is a shared, interactive surface for a work artifact, such as a plan, triage board, browser session, release checklist, dashboard, incident, or spreadsheet."* / *"the **agent generates capabilities based on your prompt and workflow**"* / 可 *"be included in a plugin alongside other capabilities, such as skills or MCP servers."* 入口是会话内 `/create-canvas`。
- **未找到** GitHub 发布公开、跨厂商的 canvas UI schema/spec；也没有官方声明把 canvases 与 MCP Apps / A2UI 打通。→ 可以讲：**GitHub 选了「MCP Apps 做宿主 + 自研 canvas 做体验」的双轨，而不是加入某个声明式格式阵营。**

---

## 4. 可上幻灯片的「未来方向」结论（8 条）

1. **声明式 UI 已成主流路线**：A2UI 16,688★（2025-09 才立项，2026-10 已 v0.9.1 stable + v1.0 RC）；OpenUI 10,854★，2026-10-12 发 1.0。
2. **执行层已经收敛：MCP Apps 赢了**（SEP-1865，2025-11-21，OpenAI+Anthropic+MCP-UI 共造；MCP 官方第一个扩展）。**OpenAI 把 `apps-sdk` 302 到 `/plugins`，并把 `window.openai.*` 降级为兼容别名** —— 私有 UI 协议时代结束。
3. **格式/语言层还在三足鼎立**：A2UI（JSON 协议，18 个基础组件）、OpenUI Lang（紧凑语言，行式赋值+位置参数）、json-render（Vercel）。
4. **下一场竞争不是「谁赢」，而是「语法压缩到多小」**：A2UI 同时试验 **Express（-55~70% token）/ Atom（再 -25~50%，抗截断）/ Elemental（HTML）** 三个 DSL，并把 Express 移出了 experimental。
5. **A2UI 的杀手级机制：TTFC + 抗截断**。Atom 让父容器先出、token index 0 就能画骨架；流断了自动补齐括号，产出可渲染的部分 UI。→ 「流式 + 结构约束」是未来两年的主战场。
6. **A2UI 在让 agent 改自己的语言**：`iterative_format_optimizer` 自动跑 KEEP/REVERT 循环优化「通过率 / 延迟 / token」，历史里有一次把输入 token 砍 46.3% 但准确率 100%→75% 被回滚。**格式设计正在变成一个可自动优化的目标函数。**
7. **OpenUI 的核心论断会重塑架构**：*"Your LLM is not a query engine"* —— 模型只生成一次 UI，交互与取数交给运行时执行，**交互路径零 token**（估 7 轮会话 -94%）。配套 OUI-1 端侧模型（71.7%，Apache-2.0）指向 **<1s 的本地生成界面**。
8. **未解的两个大问题**：① A2UI v1.0 定稿（milestone "October Launch" due 2026-10-29，0 closed，有延期风险）+ **renderer 认证计划**；② 宿主侧如何渲染「共享 catalog」——这是 Declarative 格式与 MCP Apps 之间最后缺的一环（Thesys 自认）；A2UI 的路是 `a2ui://` resource + 原生渲染。

**一句话总结未来方向**：
> **协议层正在「冻结」——wire format 定成 canonical JSON，UI 交付收敛到 MCP Apps；而模型面上的「源语言」正在「爆炸」——越来越省 token、越来越抗流式截断，甚至由 agent 自己迭代优化。** 三家的分歧不在「要不要声明式」，而在「声明式用什么语法写、谁来渲染」。

---

## 5. 链接清单

**A2UI**
- 站点 <https://a2ui.org/> · Roadmap <https://a2ui.org/roadmap/>（源 `docs/public/roadmap.md`，Last Updated June 2026）
- 仓库 <https://github.com/a2ui-project/a2ui>（旧 `google/A2UI` 301 至此）
- 本地 submodule：`/Users/work/ai/a2ui`（HEAD `ce03d005`，2026-10-10）
- 关键文件：`catalogs/basic/v1/catalog.json`（18 组件）、`specification/v1_0/json/agent_to_renderer.json`（6 消息）、`specification/proposals/{express,atom,elemental}/`、`eval/iterative_format_optimizer/history_summary.md`、`docs/public/introduction/agent-ui-ecosystem.md`、`docs/public/ecosystem/a2ui-in-the-world.md`、`docs/public/guides/{a2ui_over_mcp,mcp-apps-in-a2ui}.md`
- 博客：[2025-12-15 首发](https://developers.googleblog.com/en/introducing-a2ui-an-open-project-for-agent-driven-interfaces/) · [2026-04-17 v0.9](https://developers.googleblog.com/en/a2ui-v0-9-generative-ui/) · [2026-05-30 Gemini Enterprise](https://cloud.google.com/blog/topics/developers-practitioners/guide-to-gemini-enterprise-and-a2ui-integration) · [2026-06-17 + MCP Apps](https://developers.googleblog.com/en/a2ui-and-mcp-apps/)
- Composer（可视化生成 A2UI JSON）<https://a2ui-project.github.io/composer/> · Flutter GenUI SDK <https://docs.flutter.dev/ai/genui>
- PyPI `a2ui-agent-sdk` 0.8.0 / `a2ui-core` 0.3.0 · npm `@a2ui/react` 0.13.0

**OpenUI（Thesys）**
- 站点 <https://www.openui.com/> · 仓库 <https://github.com/thesysdev/openui>
- 本地 submodule：`/Users/work/ai/openui`（HEAD `9c5c43e7`，2026-10-11，**落后远端一个 1.0**）
- 关键文件：`benchmarks/README.md`、`docs/content/docs/openui-lang/{syntax,specification-v05,evolution-guide,comparison,architecture,reliability}.mdx`、`ADOPTERS.md`
- 博客：[Stop making AI write JSON](https://www.openui.com/blog/stop-making-ai-write-json) · [State of Generative UI 2026](https://www.openui.com/blog/state-of-generative-ui-report) · [Your LLM is not a query engine](https://www.openui.com/blog/the-llm-is-not-your-query-engine) · [Introducing OUI-1](https://www.openui.com/blog/oui-1)（权重 <https://huggingface.co/thesysdev/OUI-1>） · [How ChatGPT Intelligent UI works](https://www.openui.com/blog/how-chatgpt-intelligent-ui-works) · [Why we're open sourcing OpenUI](https://www.thesys.dev/blogs/openui)
- 基准数据：<https://www.openui.com/benchmarks/data.json> · 可靠性基准 <https://github.com/thesysdev/generative-ui-bench> · 对标 demo <https://github.com/thesysdev/open-intelligent-ui>

**协议与互操作**
- MCP Apps：官方博客 <https://blog.modelcontextprotocol.io/posts/2025-11-21-mcp-apps/>（SEP-1865） · 规范 <https://modelcontextprotocol.io/docs/extensions/apps> · 仓库 <https://github.com/modelcontextprotocol/ext-apps>
- OpenAI 侧：<https://developers.openai.com/plugins/build/chatgpt-ui> · changelog <https://developers.openai.com/plugins/changelog> · 仓库 <https://github.com/openai/mcp-extensions>
- AG-UI <https://ag-ui.com/> / <https://github.com/ag-ui-protocol/ag-ui> · CopilotKit <https://www.copilotkit.ai/>
- A2A <https://a2a-protocol.org> / <https://a2aproject.org>
- GitHub Copilot canvases：[VS Code × MCP Apps](https://code.visualstudio.com/blogs/2026/01/26/mcp-apps-support) · [Copilot app](https://github.blog/news-insights/product-news/github-copilot-app-the-agent-native-desktop-experience/) · [How to build canvases](https://github.blog/ai-and-ml/github-copilot/how-to-build-interactive-experiences-with-canvases/) · [When chat is the wrong UI](https://github.blog/ai-and-ml/github-copilot/when-chat-is-the-wrong-ui/)

**同目录其他笔记**（其他 agent 产出，可交叉引用）
- `raw/openui.md`（OpenUI 逐条原文，310 行）· `raw/a2ui.md`（A2UI 逐条原文）· `raw/a2ui-web.md`（A2UI 外部动态）· `raw/interop.md`（协议分层与 MCP Apps）· `raw/ecosystem.md`（生态横向对比）
- `landscape.md` · `openai-mcp-apps.md` · `ag-ui.md` · `copilotkit.md` · `web-trends.md` · `our-roadmap.md`

---

## 6. 核实状态（哪些是我自己一手验的）

> 本节的每一条都用本地文件或 `gh api` 亲自重现过，不依赖其他 agent 的转述。上幻灯片时可以用这些。

**✅ 一手核实（本地文件 / 命令可重现）**

| 事实 | 验证方式 |
|---|---|
| Basic Catalog = **18 组件 + 14 函数** | `python3 -c` 读 `catalogs/basic/v1/catalog.json` → `len(components)=18, len(functions)=14` |
| v1.0 wire protocol = **6 种消息** | `specification/v1_0/json/agent_to_renderer.json` → `len(oneOf)=6`：CreateSurface / UpdateComponents / UpdateDataModel / DeleteSurface / CallRendererFunction / AgentFunctionResponse |
| Express 省 **55–70%** token | `specification/proposals/express/a2ui_express.md` 逐字：*"reducing output tokens by 55% to 70% compared to native A2UI wire payloads"* |
| Atom 再省 **25–50%** | `atom/a2ui_atom.md` 逐字：*"achieving a **25% to 50% token footprint reduction** compared to A2UI Express and Elemental"*；+ TTFC（父节点先于子节点）+ auto-healing（EOF 补齐 `)`） |
| Atom 面向端侧小模型 | Express 文档逐字提到 **Gemma 4 E2B / E4B**（用于 on-device） |
| 三个 DSL 仍被 env gate 锁着 | `proposals/express/README.md`：`A2UI_EXPRESS_ENABLED`，理由是 *"prevent pollution of the stable v1.0 baseline"* |
| 「agent 自动改语法」确实存在 | `eval/iterative_format_optimizer/history_summary.md` 实存：`atom #014` 输入 token **-46.3%** 但 Schema 准确率 **100%→75%** → **REVERT**；`atom #028` reasoning **-43.5%** 但输出 token **+40.1%** 超 5% 上限 → REVERT；`atom #003` reasoning -13.3% / 输出 -31.6% / 延迟 -16.0% → KEEP。模型 `google/gemini-3.5-flash` |
| OpenUI 把 A2UI 当「源语言」 | `packages/a2ui/package.json` 描述逐字：*"A2UI v1.0 protocol support **with OpenUI Lang component updates**"*；`src/protocol-schema.ts`：`components: langComponentsSchema`（数组里是语言语句，不是组件对象） |
| React 1.0 / Vue 留在 0.4 | `gh api .../releases`：`lang-core@1.0.0`、`react-lang@1.0.0`（2026-10-12）vs `vue-lang@0.4.1`（2026-10-10）；`@openuidev/a2ui@0.5.0`（2026-10-12） |
| Star / 活跃度数字 | `gh api repos/*`：A2UI **16,688★** / OpenUI **10,854★** / AG-UI **16,507★** / CopilotKit **38,003★**；a2ui 99 contributors、30 天 **222 commits**、`pushed_at` 2026-10-13 |
| A2UI 路线图逐字 | `docs/public/roadmap.md`：Q4 2026 定稿 v1.0 + **renderer 认证计划**；长期 = Full App UIs（把 A2UI 当静态 UI 的配置层）/ Multi-Agent / 可访问性 / 拖放·手势·3D·AR-VR |
| milestone 真实状态 | `gh api .../milestones`：唯一 milestone **"October Launch" due 2026-10-29，open=3 closed=0** |
| A2UI 官方分层对照表 | `docs/public/introduction/agent-ui-ecosystem.md` 逐字（A2UI vs MCP Apps vs AG-UI）；*"use AG-UI as the pipe, A2UI as the content"* |

**⚠️ 已修正 / 不能照抄的两处**

1. **「Express 已移出 experimental」是错的**——PR **#3185 截至 2026-10-14 仍 open、未 merge**；`#3177–#3181`（TS Express multi-catalog）也全部 open。已 merge 的只是 `#3063–#3067`（2026-10-08/09，multi-catalog + API 对齐）。
2. **「首 commit 是 2025-09-26 *Add initial GULF protocol spec*」未能核实**——公开历史最早追到 **2025-10-03**（`#2 [web] Add GULF 0.7 UI + demo`）。已按可核实版本改写。

**❓ 仍未核实（不要上幻灯片或必须标注）**

- A2UI **v1.0 定稿日期**（仅由 milestone 推断）。
- 三个 DSL 的**最终取舍**、以及是否会成为官方唯一推荐语法。
- OpenUI 的 token / 可靠性基准**全部是第一方**，且四格式是**同一 AST 的四种序列化**（≠ 模型自然生成成本）。
- OpenAI「Apps SDK 首发 blog 日期」未直接核到；`apps-sdk` → `/plugins` 的**切换日期**无 changelog 条目。
- SEP-1865 是否已进 MCP core spec 正文（目前是独立 extension 仓库）。
- **A2UI 与 OpenUI 之间无官方协同声明**——A2UI 文档只对比过 ChatKit，从未提到 Thesys。两家在名片上互不承认，但技术上已经互通（`@openuidev/a2ui`）。
- 本地 `/Users/work/ai/openui` 是 **0.4.x**（HEAD 2026-10-11），落后远端一个 1.0 版本；1.0 事实均取自 npm/GitHub 远端，未 fetch。

---

## 7. 不确定 / 引用时需标注

- 所有 star / fork / issue / release 数为 **2026-10-13~14 快照**。
- **A2UI v1.0 稳定版日期未知**（只有 milestone "October Launch" due 2026-10-29，0 closed）。
- **三个 A2UI DSL 的最终取舍未定**；它们在制度上仍是 `specification/proposals/` 下的 proposal，仍由 env gate 控制。「Express 移出 experimental」目前**只是一个 open PR（#3185），没有 merge**——不要说成「已经移出」。
- **OpenUI 本地 checkout 是 0.4.x，远端已是 1.0**（本笔记按远端陈述 1.0 事实，未 fetch）。
- **OpenUI token 基准与对标表都是第一方**，且是同一 AST 的多格式序列化，不等于模型的自然输出成本。
- **Thesys 公开 roadmap 已停更（2025-10）**，近期排期不可知。
- **OpenAI Apps SDK 首发 blog 的准确日期未直接核到**（以示例仓库 created 2025-10-06 / DevDay 2025 推断）。「Apps SDK 已废弃」是产品改叙述与实际重定向的推断表述，谨慎说法是「UI 层已对齐 MCP Apps 标准」。
- **SEP-1865 是否已进 MCP core spec 正文未确认**（目前是独立 extension 仓库）。
- **GitHub canvases 无公开跨厂商 schema**（倾向「无」，未穷尽）。
- **A2UI 与 OpenUI 之间无官方协同声明**；A2UI 文档只与 ChatKit 做过定性对比。
- `docs/public/ecosystem/renderers.md` 里列的大量 renderer 是**社区**项目（非官方）。
