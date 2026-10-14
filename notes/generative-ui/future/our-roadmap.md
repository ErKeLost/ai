# 我们自己的现状 · 能力盘点与下一步

> 面向「04 · 未来发展方向」章节的素材。只读盘点，盘点对象：`/Users/work/open-generative`（版本 0.3.22 全包 lockstep）、`notes/generative-ui/00-map.md`、`slides-generative-ui/slides.md`。
> 盘点时间：2026-10 · 幻灯片未改动。

## 0. 一句话结论

**协议 / 治理 / 编译器 已经是「做完了」的状态（17 个包、可发布、有 changeset、有测试）；没做完的是「覆盖面」和「运营能力」——适配器只有 Radix 一个、通道只有 2 条（第三条 HTML 被架构明确封死）、评测是一个需要真 key 的 CLI、可观测性只到日志、多 Surface / patch 只有设计没有代码。**

我们和 OpenUI / CopilotKit / OpenAI 的差别不是"能不能生成"，而是**我们把「谁说最后一句」放在了 Host 侧并做成了可审计的事务** —— 这部分别人基本没有。

---

## 1. 能力 → 状态 → 证据路径

### 1.1 协议与契约层（成熟）

| 能力 | 状态 | 证据路径 |
| --- | --- | --- |
| 版本化 wire 协议、事件分类（Proposal/Commit/Surface/Diagnostic/Effect）、显式限额 | ✅ 已发布 | `packages/protocol/src/{streams,document,diagnostics,policy}.ts`、`apps/docs/content/docs/protocol.mdx` |
| 67 个官方 Contract = 60 个库中立 `ui.*` + 7 个语义/布局 | ✅ 已发布 | `packages/components/src/{contracts,ui}.ts`、`apps/docs/content/docs/components.mdx` |
| 17 个图表 recipe + ChartSpec + 无障碍 fixture + 覆盖率校验 | ✅ 已发布 | `packages/components/src/{chart-recipes,chart-fixtures,coverage.test}.ts` |
| 契约哈希 / manifest / Renderer Release 验证 | ✅ 已发布 | `packages/catalog/src/{contracts,manifest,renderer,slice}.ts`、`packages/compiler/src/schema-signature.ts` |
| 自定义组件库 API（`defineComponent` + `createLibrary`，两侧同库） | ✅ 已发布 | `packages/catalog/src/library.ts`、`.changeset/custom-component-libraries.md`、`apps/renderer/src/lib/component-library.ts` |
| Catalog Slice 协商（按数据形状/意图/策略裁剪，冻结 hash + 依赖锁） | ✅ 已发布 | `packages/catalog/src/slice.ts`、`packages/host/src/intent-planner.ts` |

### 1.2 通道层：三条路我们只做了两条（★ 与幻灯片第 11 页直接对齐）

| 通道 | 实现位置 | 状态 | 证据 |
| --- | --- | --- | --- |
| **A · 填表**：`render_ui` 工具 + provider 约束解码（strict JSON Schema），语句流式 lowering 成 OGL IR | `packages/ai-sdk/src/structured/{schema,lowering,json-stream,integration}.ts`（901 行） | ✅ 已实装，`apps/compare` 可选 `mode: "structured"` | `apps/compare/src/app/api/chat/route.ts:2,64,126,147`；`design/next-generation.md`（"已实装"） |
| **B · 写方言**：OGL 行式文本 → 增量 scanner → compiler → preview → commit | `packages/compiler/src/language-session.ts`、`packages/ai-sdk/src/{server,client}.ts` | ✅ 已实装，生产主路径 | `apps/compare` `mode: "generative"`；`apps/openui-mastra`；`.changeset/incremental-renderer-stream.md` |
| **C · 写网页**：模型吐 HTML/CSS/JS → sandbox iframe | — | ❌ **架构上被明确封死**，不是"没做" | `architecture.mdx`："No raw model HTML, iframe, tool-specific UI payload, or `present_ui` shortcut bypasses it." `apps/docs/content/docs/index.mdx`："The model does not emit JSX, HTML, CSS, SQL…" |

> 也就是说：**我们主动放弃了光谱的 L3**，把它定义为"不可交付"。这是分享里最该讲的一句取舍。

### 1.3 治理 / 执行层（我们的护城河，成熟）

| 能力 | 状态 | 证据路径 |
| --- | --- | --- |
| 流式提案 → 隔离事务 overlay → 全量拒绝或原子提交（无部分副作用） | ✅ | `packages/compiler/src/{turn,normalize}.ts`、`packages/runtime/src/{transaction,revision-dag}.ts` |
| 提交期 Host 绑定交互（Tabs/Input/Select/Pagination），状态 schema 不来自模型 | ✅ | `packages/host/src/interaction-binder.ts`、`architecture.mdx` §3/§5 |
| 交互是 Surface command 而非新 Agent turn（永不进对话记忆） | ✅ | `packages/host/src/command-handler.ts`、`packages/client/src/surface-controller.ts` |
| 资源治理：grant / window / 加密 cursor 绑定 tenant+actor+policy | ✅ | `packages/resources/src/{gateway,cursor,schema-registry}.ts` |
| 变更治理：`Event → ActionIntent → CapabilityBroker → EffectReceipt`（审批、幂等、凭证） | ✅ | `packages/capabilities/src/{broker,store}.ts` |
| Supabase 租户绑定 RPC 适配器（拒绝表名/SQL/别名来自浏览器或模型） | ✅ | `packages/supabase/src/{adapter,bridge,cursor}.ts` |
| 生产 fail-closed 组装根（journal / policy / documentState / lifecycle 全显式注入） | ✅ | `packages/host/src/index.ts` + `packages/host/src/turn.ts`（`createOpenGenerativeHost`）、`packages/host/README.md` |
| Inspector 侧信道（redacted OGL/AST/slice/事件/receipt） | ⚠️ 有，但 server-only、默认关、无 UI、无回放器 | `packages/host/src/inspector.ts`、`packages/host/README.md` |
| 确定性 replay + 迁移（`migrations.ts` / `revision-dag.ts`） | ✅ | `packages/runtime/src/{replay,migrations,dag-migrations.test}.ts` |

### 1.4 渲染与适配层（覆盖面最薄的一块）

| 能力 | 状态 | 证据路径 |
| --- | --- | --- |
| 库中立 Core React 渲染器 + `OpenGenerativeRenderer` | ✅ | `packages/ui/src/open-generative-renderer.tsx`、`packages/react/src/{foundation,library,renderer-registry}.ts` |
| Radix base 的 Shadcn 适配器（60/60 契约覆盖，源码级 registry bridge，非私有运行时） | ✅ 唯一一个 | `packages/adapter-shadcn/src/registry.ts`、`apps/docs/content/docs/theme.mdx` |
| Base UI / React Aria 等第二、第三个 driver | ❌ 明确未做 | `theme.mdx`："A future base driver must publish its own exact capability manifest and interaction tests before it is added to the public registry." |
| 设计系统预设 / token codec（给 Theme Studio 用） | ⚠️ 程序包就绪，**消费端是空壳** | `packages/design-system/src/*` 就绪；`apps/studio/**` **零文件**（只有空目录 `src/client/components`） |

### 1.5 集成层（3/4 已做，缺 MCP）

| 集成 | 状态 | 证据 |
| --- | --- | --- |
| AI SDK v7 processor + client transport | ✅ | `packages/ai-sdk/src/{server,client,wire}.ts` |
| Mastra Processor（request-local session，不写 working memory） | ✅ | `packages/mastra/src/index.ts`、`architecture.mdx` §2 |
| AG-UI 事件适配（server + client） | ✅ | `packages/ag-ui/src/{server,client,wire}.ts` |
| MCP 封装（`render_ui` 本身就是 tool schema，天然可封装；也是 OpenAI/ChatGPT 路线） | ❌ 无 | `packages/` 下无 mcp 包；`design/next-generation.md` §6 只写了"天然可被 MCP 封装" |

### 1.6 评测 / 可观测（有骨架，缺常态运营）

| 能力 | 状态 | 证据路径 |
| --- | --- | --- |
| 真实 provider 压测 CLI（无 offline/模拟模式） | ✅ 但门槛高 | `apps/benchmark/src/{index,runner,transports,config}.ts` |
| 指标：non-cached/cached input、output、reasoning tokens；`firstSurfaceEventMs` / `firstRenderableSurfaceMs`（首次 preview-applied 或 revision-committed）/ `firstScreenMs`（客户端观测）/ `committedSurfaceMs` / `elapsedMs`；Supabase receipt、compiler 结果、committed 契约、resource 引用等确定性校验；按显式价格估算 cost | ✅ | `packages/host/src/benchmark.ts:82,122-135,411-436`、`apps/benchmark/README.md` |
| 对比臂：`kind: "full-catalog"`（67 契约，benchmark-only 96 KiB 预算）vs `kind: "catalog-slice"`（生产 18 契约 / 20 KiB） | ✅ | `apps/benchmark/README.md` "Strategy scope"、`packages/host/src/turn.ts:229,1031` |
| 常态 CI 评测 / 回归阈值门禁 / 离线 fixture 模式 | ❌ 无（需真 key + 真 Supabase + 真 token） | 同上；`README.md`："Offline fixture usage is useful for regression tests but is not reported as a production benchmark." |
| 变更类 workload 压测（mutation） | ❌ 明确不支持 | `apps/benchmark/README.md`："A direct RPC mutation followed by a fabricated Surface receipt … intentionally unsupported here." |

---

## 2. 明确的未完成项（来自代码/文档的原文标记）

先说一个反直觉的发现：**全仓几乎没有 `TODO/FIXME`**（`rg -i "todo|fixme|not implemented|planned|roadmap|wip"` 在非 vendor、非 dist 范围内只命中 7 个文件，其中 4 个是 `plannedComponents/plannedComponents` 这类变量名、3 个是 `experimental_transform` 这个 AI SDK 官方 API 名）。真正的"未来工作"全部写在文档的固定小节里，应该是刻意的：

1. **`design/next-generation.md` §八「遗留与后续」**（4 条，逐字对应）：
   - ① `data.chart` 的 recipe spec 体积大且含嵌套资源绑定，**v1 排除**，需要专门的 chart 工具或 recipe 选择器；
   - ② 扁平语句 + id 引用**已为 patch 模式铺路**（更新已有 Surface 而非重建）；
   - ③ 资源绑定目前**仅支持顶层 `@alias`**，`ui.table` / `data.metric` 需配合业务工具产出的数据资源演示；
   - ④ 预览事件**全量重发导致 wire 体积 O(n²)**（本设计 15 次推送 749KB），增量事件下发是下一步优化点。
2. **`apps/docs/content/docs/theme.mdx`**：第二 / 第三个 UI driver（Base UI、React Aria）必须各自发布精确能力清单与交互测试，才能进公共 registry —— 现在只有 Radix。
3. **`apps/benchmark/README.md`**：mutation workload 需要走生产 Capability Broker 才能产出真实 intent/authorization/receipt，当前 read-only。
4. **`packages/adapter-shadcn/README.md`**：适配器 "does not install a private Shadcn runtime"；bridge 依赖消费方 CLI 重跑，风格/图标/别名变化需手动。
5. **`architecture.mdx`**：Inspector "is disabled in the demo Host and by default in production"；`capture: "full"` 必须显式开启。
6. **结构性别名约束**：`packages/ai-sdk/src/structured/schema.ts` 的 `DROPPED_KEYWORDS` 说明约束解码会**丢弃 `pattern/minLength/minimum/...` 等校验关键字**，改由 Host compiler 二次判定 —— 这是设计上的分层，不是缺陷，但意味着"strict schema"不等于"完整校验"。

---

## 3. 从代码结构看出的下一步候选（每条给出代码依据）

### 候选 1 · 第二条渲染通道（真·多端）—— 把 `ui.*` 契约绑到 Shadcn 以外的库
- 依据：`theme.mdx`（"Base UI and React Aria use different state and composition APIs. They need independent semantic drivers"）；`packages/adapter-shadcn/src/registry.ts:45,62-65` 里 `assertExactCoverage` 是硬断言，说明每换一个库就要一个完整 driver + capability manifest + interaction 测试。
- 价值：这是"协议中立"这句话第一次被**外部证据**验证。现在是自证。
- 最小切片：只做 10 个最高频 `ui.*` 契约的 Base UI driver + 一份 coverage 报告，不追求 60/60。

### 候选 2 · 补齐通道 A 的最后两块拼图：chart 工具 + 资源绑定深化
- 依据：`design/next-generation.md` §8.1（`data.chart` 被 v1 排除）、§8.3（资源绑定仅顶层 `@alias`，`ui.table`/`data.metric` 待演示）；已经有的半成品是 `packages/compiler/src/chart-recipe-selector.ts`（按数据形状筛 recipe，按 `OFFICIAL_RECIPE_COMPATIBILITY` 匹配）—— **它有实现但没有接进 structured 通道**（`schema.ts` 的 `StructuredCatalog` 里只有 `resourceProps` 和 `slots`，没有 chart）。
- 价值：图表是"生成式 UI 最像杀手功能"的场景，现在恰好是唯一被排除的组件。

### 候选 3 · 增量 Surface 事件 + patch 模式（成本与延迟的下一档）
- 依据：`design/next-generation.md` §8.4（15 次推送 749KB，O(n²)）；§8.2（扁平语句已为 patch 铺路）；`rg "surfaceId" packages/protocol/src` **零命中** —— 协议层还没有多 Surface 概念，patch 所需的事件种类也尚未定义。
- 价值：这条同时解"贵"和"多面板/多窗口"两个未来需求；也是把 `revision-dag.ts`（已有 DAG 基础设施）真正用起来的机会。

### 候选 4 · 把评测从"一次性 CLI"变成"常态门禁"
- 依据：`packages/host/src/benchmark.ts` 的 observer 已经把指标打得很全（token 分类、首次事件/可渲染/首屏/提交时间、cost、确定性 check），但入口只有 `apps/benchmark/src/index.ts`，且必须真 provider + 真 Supabase + 真 token，`README.md` 明说 offline 结果不许当作生产 benchmark。
- 下一步：把同一套 observer 接到 CI 的固定 workload 上（用录制/回放 fixture 做趋势回归），只在"发布前"那一次跑真 provider 出正式数字。
- 价值：目前"我们跑出来的数字"只能靠人跑，无法防止一次 catalog 改动让提示词悄悄涨 30%。

### 候选 5 · 观测与调试产品化（Inspector → Studio）
- 依据：`packages/host/src/inspector.ts` + `host/README.md`（已有 policy/capture/store 三件套、独立授权、序列队列、redaction）；`packages/design-system` 已有 registry/preset/token codec；但 `apps/studio` **一个文件都没有**（空目录 `src/client/components`）。
- 价值：Inspector 现在只有 `write()` 接口，没有读、没有 UI。分享里讲"可审计"时，观众会想看那个审计界面。

### （备选 6）MCP 出口
- 依据：`design/next-generation.md` §6 明写 `render_ui` 即 tool schema、"天然可被 MCP 封装"，但 `packages/` 无 mcp 包；同期 MCP Apps 已是 OpenAI/ChatGPT 官方路线（`notes/generative-ui/00-map.md` 三大协议一节）。
- 定位：这是**分发**问题不是能力问题，成本最低、曝光最高，适合作为"下一个季度最便宜的动作"。

### （备选 7）mutation 压测
- 依据：`apps/benchmark/README.md` "must be wired through a production Host Capability Broker"。治理侧 `packages/capabilities/src/broker.ts` 已完整，缺的是 benchmark 的 workload 接线。

---

## 4. 与幻灯片口径的一致性检查（未修改 `slides.md`）

| 幻灯片说法 | 代码事实 | 是否一致 |
| --- | --- | --- |
| 第 11 页"三条路：填表 / 写小程序 / 写网页" | A 通道 = `packages/ai-sdk/src/structured/*`；B 通道 = OGL/compiler；C 通道 = 架构上被禁止 | ⚠️ 幻灯片把三条并列讲成"可选"，但代码里 C 是**红线**。建议在 04 章明确"C 我们不做" |
| 第 11 页"三条路的可靠性差了整整一个数量级" | `design/next-generation.md` 首表：0/2、时成时败、1/1 | ✅ 有出处 |
| 第 14 页"1.3k / 5.2k / 6.5k / 9.0k tokens" | 无仓内可复现脚本；口径接近 `packages/compiler/src/language.test.ts:839,884`（"keeps the maximum official component Slice inside explicit byte and token proxy budgets"）的 token *proxy* 预算，但页面上是实测值 | ⚠️ 9.0k 那档（82 组件 + 6 例子）**在官方库里找不到对应组件集**（官方是 67）。若被追问会答不上 |
| 第 14 页"data.chart 一个参数把 40 种图表模板全展开 = 8,256 字符" | `packages/components/src/chart-recipes.ts` 是正式 recipe 源；而 structured 通道 v1 **排除** chart（§8.1），说明这块正是我们已知的痛点 | ✅ 一致，且可直接引用为"未来方向"的动机 |
| 封面"真实测试数据" | 唯一可复现的真实测试入口是 `bun run benchmark:real`（需真 key/Supabase/token） | ⚠️ 建议在 04 章给出这个命令，把"真实"变成观众可验证的东西 |

---

## 5. 附：可直接进分享的一页草稿（三句话）

1. **我们做完了"谁说了算"**：67 契约、隔离事务、全量拒绝、签名事件、租户 RLS、变更凭证 —— 别人比的是"能生成什么"，我们比的是"生成错了怎么办"。（`architecture.mdx`）
2. **我们主动封死了一条路**：不做 sandbox HTML —— 表现力换不来品牌一致性和可测试性。（`index.mdx` 原文禁 JSX/HTML/CSS/SQL）
3. **接下来是覆盖面，不是核心**：第二个 UI library driver、chart 通道补完、增量 patch、评测门禁、Inspector 产品化、MCP 出口 —— 六件都在等同一件事：把协议中立从自证变成他证。（`theme.mdx` / `design/next-generation.md` §8 / `apps/benchmark/README.md` / `apps/studio` 空目录）
