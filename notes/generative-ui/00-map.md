# Generative UI · 概念地图

> 整理时间：2026-10 · 面向本仓库（`ai/` submodule 集合 + `app/` 实验项目）的学习笔记

## 一句话定义

**Generative UI = 让模型输出的不再只是 token 流，而是一份能驱动你前端渲染的"结构化意图"。**

传统聊天：模型 → 文本 → Markdown 渲染。
Generative UI：模型 → 结构化输出（工具参数 / JSON 组件树 / HTML） → **你自己的组件**渲染。

所以 Generative UI 的本质不是"让 AI 画界面"，而是 **把 UI 的一部分决策权交给模型**：
界面长什么样、要不要出现、先出现哪块、数据填什么。

## 为什么现在火（三个条件同时成熟）

1. **模型侧**：工具调用（tool calling）稳定了，模型能可靠地输出符合 schema 的参数。
2. **协议侧**：出现了跨框架的标准 —— AG-UI、A2UI、MCP Apps。
3. **前端侧**：现成组件层成熟 —— Vercel `ai-elements`、`assistant-ui`、`@openai/apps-sdk-ui`。

## 核心机制：永远是这 3 步

```
① 模型决定"要什么 UI"
      ↓  结构化输出（tool call args / JSON schema / HTML 字符串）
② 传输
      ↓  流式事件（AI SDK UIMessage.parts / AG-UI events / MCP ui/* JSON-RPC）
③ 前端渲染
      ↓  组件注册表（component registry）或 沙箱 iframe
```

理解这三步之后，市面上所有方案都只是这三步的不同参数组合。

## 谱系：从"可控"到"开放"（最重要的一张表）

| 级别 | 谁决定 UI | 模型提供什么 | 谁提供渲染 | 代表实现 |
|---|---|---|---|---|
| **L0** 文本 | 你 | Markdown / 文本 | Markdown 渲染器 | 所有聊天应用 |
| **L1** 受控 / Controlled | **你写组件** | 只选"用哪个"+"填什么参数" | 你的组件库 | AI SDK `tool-${name}` parts、CopilotKit `useComponent`、Mastra tool + renderer |
| **L2** 声明式 / Declarative | 你定 catalog，**模型拼装** | JSON 组件树（schema） | 你的 catalog 渲染器 | **A2UI**（Google 主导）、json-render、hashbrown |
| **L3** 开放式 / Open-ended | **模型自由生成** | HTML / CSS / JS | 浏览器 **sandbox iframe** | CopilotKit Open Generative UI、**MCP Apps**（OpenAI ChatGPT 官方路线） |

越往下：表现力越强、越灵活；工程成本（安全 / 无障碍 / 品牌一致性 / 可测试性）越高。

**关键判断**：这不是"选一个框架"的问题，而是"**每个功能各自选一级**"的问题。一个产品里 L1 和 L3 通常共存。

## 三种实现形态（L1 内部还要再分）

L1 最容易混淆，其实有 4 种不同数据来源：

| 形态 | 数据从哪来 | 用途 |
|---|---|---|
| **Component as Tool** | 模型**凭空**调一个前端注册的组件当工具 | 天气卡、KPI 卡、图表 —— 组件本身就是答案 |
| **Tool Call Rendering** | 后端**真实存在**的工具调用，前端只是换个皮肤显示 | 展示"正在搜索…""已写入 3 个文件"这类过程 |
| **State Rendering** | 订阅 agent 的**流式 state**，值到了就重渲染 | 进度条、实时草稿、仪表盘 |
| **Reasoning** | 模型的思考 token | 把思维链做成一等公民的 UI |

> 你 `app/` 里的 artifact 机制是 **Component as Tool**：`createChartArtifact` 等 10 个工具就是组件注册表。

## 三大协议（2026 年的格局）

### 1. AG-UI —— "agent ↔ 前端"的事件流协议
- 出处：CopilotKit 主导，Google / LangChain / AWS / Microsoft / Mastra / PydanticAI 采用
- 作用：把后端 agent 的运行过程标准化成一串事件（run started、text delta、tool call、state delta、activity）
- 意义：**换 agent 框架不用重写前端**。你的 `app/` 走的是 Mastra + AI SDK 私有约定，等价物就是 AG-UI。

### 2. A2UI —— "说 UI"的声明式格式（a2ui.org）
- 出处：Google 主导，CopilotKit 是发起 / 设计伙伴，Apache 协议，v0.9 稳定 / v1.0 RC
- 核心思想：agent 发 **JSON 描述意图**，客户端用它**自己的原生组件库**渲染（Flutter / Angular / Lit / React）
- 设计口号：**"safe like data, but expressive like code"** —— 声明式数据，不是可执行代码，所以安全
- 三个原语：`createSurface` → `updateComponents`（组件树）→ `updateDataModel`（JSON Pointer 填数据）
- 两种玩法：
  - **Fixed Schema**：组件树你提前写好，模型只流式填数据 → 快、可控
  - **Dynamic Schema**：模型连 schema 一起生成 → 灵活、多一次 LLM 调用

### 3. MCP Apps —— "UI 跟着工具一起下发"（OpenAI 走的这条路）
- 出处：MCP 官方扩展标准 `modelcontextprotocol.io/docs/extensions/apps`，ChatGPT 已实现
- 机制：MCP server 的工具声明 `_meta.ui.resourceUri` → 宿主把该 UI 资源塞进 **sandbox iframe** → 通过 `postMessage` 上的 `ui/*` JSON-RPC 通信（`ui/initialize`、`ui/notifications/tool-input`、`tools/call`、`ui/message`）
- ChatGPT 兼容别名（新代码应该用左边那列）：`window.openai.toolInput` / `callTool` / `sendFollowUpMessage` / `requestCheckout` / `widgetState`…
- 卖点：**前端零代码** —— UI 由 MCP server 自带；代价是安全和品牌一致性最难保证

## 真正的工程难点（比 API 用法重要）

1. **状态回传**：React 组件不可序列化，但下一轮要发给模型 → 经典解法是拆成 **AI State（可序列化真相） / UI State（渲染结果）** 双状态；或干脆把 UI 意图留在 `messages` 里（AI SDK 5+ 的 `parts` 就是这么做的）。
2. **部分渲染 / 流式**：`input-available` 就该能画骨架，别等 `output-available`。先渲染意图，再渲染数据。
3. **安全**：凡是模型能写 HTML/JS 的，必须 sandbox（不给 `allow-same-origin`），宿主能力用白名单桥接函数暴露。A2UI 用"只允许 catalog 内组件"来避险。
4. **持久化**：生成出来的界面要能随会话恢复 → **存 schema，不存渲染结果**。
5. **可访问性 + 品牌一致性**：L3 几乎无法保证，L1 天然满足。
6. **评测**：UI 生成怎么测？需要"组件选择是否正确""参数是否符合 schema""是否该调工具却没调"这类指标。

## 本仓库的现实映射

| 路径 | 是什么 | 对应级别 |
|---|---|---|
| `app/src/mastra/tools/artifact-tools.ts` | 10 个 artifact 工具（document / code / table / chart / plan / web / schema / terminal / file-tree / test-report），`strict: true` 强约束 schema | L1 数据侧 |
| `app/src/components/artifacts/artifact-tool-ui.tsx` | `toolMetadata` 工具名 → kind/图标/label，`artifactToolComponents` 把工具名映射成组件 | L1 组件注册表 |
| `app/src/components/artifacts/artifact-renderer.tsx` | 按 `kind` 分发到具体渲染器（recharts / shiki / file-tree …） | L1 渲染侧 |
| `app/src/app/api/chat/route.ts` | Mastra `handleChatStream` → AI SDK v6 wire format | ②传输 |
| `ai/`（vercel/ai submodule） | AI SDK 官方实现：`message.parts` + `tool-${name}`；老 RSC 路线 `@ai-sdk/rsc` 已标记实验性、官方建议迁到 UI | L1 参考实现 |
| `app/src/components/ai-elements/*` | 40+ 个现成生成式 UI 组件（artifact / code-block / file-tree / terminal / test-results / web-preview / sandbox …） | L1 组件库 |

**结论**：本仓库已经把 L1 做完了，缺的是 **L2（A2UI）** 和 **L3（Open GenUI / MCP Apps）**。

## 学习路线（建议按顺序动手）

- [ ] **Step 0** 读懂现有 L1 全链路：`artifact-tools.ts` → 工具调用 → `message.parts` → `artifactToolComponents` → `artifact-renderer.tsx`
- [ ] **Step 1** 加一个流式 L1 组件：用 `input-available` 状态先渲染骨架，体会"先有意向再有数据"
- [ ] **Step 2** 加 L2 demo：Fixed Schema A2UI（catalog + createSurface/updateComponents/updateDataModel）
- [ ] **Step 3** 加 L3 demo：sandbox iframe 生成 HTML，配一两个白名单桥接函数
- [ ] **Step 4** 把三个 demo 的**选择标准**写成决策表（什么时候该用哪一级）

## 本仓库已就位的 Generative UI 素材

### 代码 submodule

| 目录 | 上游 | 是什么 | 对应级别 |
|---|---|---|---|
| `copilotkit/` | CopilotKit/CopilotKit | L1/L2/L3 全覆盖的前端栈，AG-UI 发起方，A2UI 设计伙伴。六种原语都在 `showcase/shell-docs/src/content/docs/generative-ui/` 下 | L1+L2+L3 |
| `openui/` | thesysdev/openui | "The Open Standard for Generative UI"，流式 OpenUI Lang → 前端原生组件渲染 | L2 |
| `ag-ui/` | ag-ui-protocol/ag-ui | agent ↔ 前端事件流协议实现（Python / TS / Go …） | ②传输 |
| `a2ui/` | google/A2UI | A2UI 规范 + 多语言 renderer（Flutter / Angular / Lit …） | L2 |
| `openai-apps-sdk-examples/` | openai/openai-apps-sdk-examples | OpenAI Apps SDK（MCP Apps）官方例子 | L3 |
| `app/`（未跟踪，本机） | — | 自己的 L1 实战项目（Mastra + AI SDK + ai-elements） | L1 |

> `copilotkit/` 和 `ag-ui/` 是 **shallow clone**（`--depth 1`），因为这两个仓库全量太大（CopilotKit 下到 847MB 就断）。
> 想补全历史：`git -C copilotkit fetch --unshallow`。
> 另外本机没装 `git-lfs`，两个仓库里的图片/视频（LFS 跟踪）是 pointer 文件；需要真图：`brew install git-lfs && git -C copilotkit lfs pull`。

### 文章（已下载为 Markdown）

- `openai/` —— 9 篇 OpenAI / MCP 官方文章，**已有中文译文**，索引见 `openai/README.md`。
  - 中文：`openai/zh/`（建议读这套）・英文原文：`openai/en/`
  - 最该先读 `openai/zh/01-给MCP服务器加上UI.md` 和 `openai/zh/08-打造ChatGPT应用的15条经验.md`

## 参考资料

- AI SDK 生成式 UI：`ai/content/docs/04-ai-sdk-ui/04-generative-user-interfaces.mdx`（本地）
- AI SDK RSC 状态管理：`ai/content/docs/05-ai-sdk-rsc/03-generative-ui-state.mdx`（本地，已实验性）
- CopilotKit 六种原语总览：https://docs.copilotkit.ai/concepts/generative-ui-overview ・ 本地 `copilotkit/showcase/shell-docs/src/content/docs/generative-ui/`
- A2UI 规范：https://a2ui.org ・ 本地 `a2ui/`
- AG-UI 协议：https://docs.ag-ui.com ・ 本地 `ag-ui/`
- MCP Apps 标准：https://modelcontextprotocol.io/docs/extensions/apps ・ 本地 `notes/generative-ui/openai/mcp-apps-spec.md`
- OpenAI 侧文档：https://developers.openai.com/plugins/build/chatgpt-ui.md（本地 `notes/generative-ui/openai/`）
- DeepLearning.AI 免费短课（CopilotKit CEO 主讲）：Build Interactive Agents with Generative UI
