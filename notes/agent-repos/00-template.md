# Agent 仓库横向分析 · 统一模板

> 目标：用同一把尺子量每个仓库，最终能拼成一张可比较的矩阵。
> 读者：要为自己的 GenUI / agent 平台做技术选型与设计借鉴的工程师。
> 语言：中文；术语保留英文原名；**每条结论必须有代码证据**（`path/to/file.ts:123` 或目录 + 关键符号名）。

## 0. 硬性要求

- 只写**读代码得出**的事实。营销话术（README 里的 "world's best"）不算结论。
- 不确定就标 `未验证`，不要猜。
- 代码证据优先给**入口/循环/工具/权限**这四处，它们是判断架构的关键。
- 不要贴大段源码，最多 3–8 行关键片段。
- 已有笔记可复用但**必须抽查验证**（见各仓库备注）。

## 1. 每仓库必须产出的一张"卡片"

```yaml
repo: <目录名>
url: <git remote>
commit: <短 hash> (<日期>)
license:
language: <主语言 + 占比估算依据，如 crates/ 数量、ts 包数量>
loc_estimate: <用 git ls-files + wc -l 粗估有效代码行，注明排除项>
build: <cargo / pnpm / bun / bazel ...>
install: <用户怎么装>
interface: [CLI-TUI | CLI-headless | IDE-ext | Web | SDK | Server | Protocol | Library | Desktop]
model_access: <自带登录 / API key / 本地模型 / 网关>
```

## 2. 固定章节（顺序不变，缺项写"无/不适用"并说明）

### 2.1 一句话定位
它到底解决谁的什么问题；和同类比**取舍在哪**（不是功能列表）。

### 2.2 仓库结构与分层
顶层目录 → 各自职责 → 依赖方向（谁 import 谁，有没有刻意隔离的 core/sdk）。
给一张分层图（ASCII 即可）。

### 2.3 核心抽象
列出 5–10 个真正的领域对象（如 Session / Turn / Tool / Provider / Workspace），
每个给定义文件路径。**这是最能体现设计水平的一节。**

### 2.4 主循环（Agent Loop）
- 入口函数（`file:line`）
- 循环体伪代码（10 行内）
- 工具调用是并发还是串行？失败如何回灌模型？
- 停止条件、最大步数、人工中断（abort/steering）怎么实现
- 流式事件如何产出（事件类型清单）

### 2.5 工具系统
- 工具注册方式（静态表 / 动态发现 / MCP / 插件）
- 单个工具的定义契约（schema 用什么校验）
- 内置工具清单（按类别，不用全列）
- 工具输出如何截断/摘要（context budget 处理）

### 2.6 权限、安全与沙箱
- 审批模型（allow/ask/deny、规则粒度、持久化）
- 文件系统边界、命令执行的沙箱手段（seatbelt/landlock/容器/无）
- 密钥与凭据处理、prompt injection 防护
- **这是判断能否上生产的关键，写细一点**

### 2.7 上下文工程
- 系统提示词在哪、怎么拼（模板/分层/动态注入）
- AGENTS.md / 规则文件的发现与合并顺序
- 压缩（compaction）策略：触发阈值、摘要方式、丢什么保什么
- 缓存策略（prompt caching / 前缀稳定）
- 子 agent / 任务分解机制（有就写，没有就写"刻意不做"）

### 2.8 记忆与会话
持久化格式（文件/DB）、恢复语义、跨会话记忆、分支/fork、回放。

### 2.9 扩展机制
MCP、插件、skills、hooks、自定义命令、SDK/headless API 各自的实现位置与能力边界。
**扩展点是否稳定（有没有版本化 contract）**。

### 2.10 模型与协议适配
provider 抽象、多模型路由、reasoning/thinking 参数、缓存、协议（ACP / AG-UI / MCP / OpenAI-compatible）。

### 2.11 UI 层（有则写）
TUI 框架选型、渲染模型（增量 diff / 全量重绘）、富内容（图片/图表/组件）、
与 core 的耦合方式（事件总线 / 直接调用）。若是 Web/组件库，写渲染注册表与流式协议。

### 2.12 工程质量
测试（单测/集成/e2e 数量与形态）、CI、类型严格度、lint、发布流程、可观测性（日志/trace/eval）。

### 2.13 值得偷的设计（3–6 条）
每条：**机制 → 为什么好 → 迁移到我们平台要改什么**。要具体到接口形状。

### 2.14 明显弱点 / 风险
架构债、过度设计、锁定、维护风险、安全缺口。要有证据。

### 2.15 关键文件索引
10–20 条 `path — 为什么值得读`。

## 3. 横向对比要用的字段（务必在卡片里可机器读）

`agent_loop_style`（单线程 ReAct / 事件驱动 / 图编排 / RLM）、
`tool_protocol`（内置 / MCP / 代码模式）、`permission_model`、
`context_strategy`、`extension_surface`、`persistence`、
`ui_surface`、`multi_agent`、`production_readiness`（1–5 分 + 一句理由）。
