# Pi Agent 源码精读课程

这套课程按 Pi 当前源码的依赖方向讲解实现：先弄清各层边界，再跟一条请求从输入走到模型、工具、持久化和界面。每章都会给出源码入口、核心机制、最小例子、一次执行轨迹和设计理由。示例优先短小；它们用于理解接口，不要求复制成生产配置。

## 版本基准

本文档对应仓库 [pi](../../pi) 的官方 `origin/main`：提交 `4954d760504c11df9b2cbdc040346107b6a8153d`，提交日期 2026-10-15。该提交后的包版本为 `1.3.0`；这表示最新主线源码基于 1.3.0 发布线继续开发，不代表已经发布了 1.3.1。superproject 中的 `pi` 子模块 gitlink 已推进到该远端主线提交。

## 建议学习顺序

1. [整体架构与源码阅读法](01-整体架构.md)：画出包依赖和一条完整请求路径。
2. [pi-ai：模型、Provider 与流式协议](02-pi-ai.md)：了解 Pi 如何统一不同模型 API。
3. [pi-agent-core：Agent Loop](03-agent-core.md)：理解状态、工具调用、队列和事件。
4. [coding-agent：启动、信任与运行时](04-coding-agent-runtime.md)：看 CLI 怎样装配上面几层。
5. [工具、上下文与系统提示词](05-tools-context.md)：看模型究竟收到什么，以及工具如何被验证和执行。
6. [Session：JSONL、分支与上下文投影](06-sessions.md)：理解聊天记录为什么是树而不是单纯数组。
7. [Compaction：上下文压缩和分支摘要](07-compaction.md)：理解有限上下文如何继续工作。
8. [Extensions 与资源系统](08-extensions-resources.md)：学习 Pi 的可定制边界。
9. [pi-tui：终端渲染](09-pi-tui.md)：理解增量绘制、组件和终端输入。
10. [CLI、JSON、RPC 与 SDK](10-interfaces-sdk.md)：从一个运行时理解四种接入方式。
11. [MCP 与 Codemode](11-mcp-codemode.md)：理解外部工具协议和代码批处理工具。
12. [pi-durable：可恢复 Agent](12-pi-durable.md)：学习另一种以持久任务为中心的 Agent 运行时。
13. [Chord：对象、契约与热更新](13-chord.md)：读懂 Durable 的底层运行时。
14. [pi-env：远程执行环境](14-pi-env.md)：理解本地工具怎样映射到远程环境。
15. [Telemetry、Evals 与测试](15-observability-evals.md)：学习如何观察和评价 Agent 行为。
16. [安全边界、构建和阅读练习](16-security-build-test.md)：把权限模型、源码工作流和验证方法串起来。

## Pi 的源码包

主仓库是 npm workspaces monorepo，源码集中在 `pi/packages/`：

| 包 | 在整套系统里的职责 |
|---|---|
| `ai` | 模型类型、Provider、鉴权、API 适配、流式事件和模型目录 |
| `agent` | 通用 Agent 状态、事件流、工具调用循环和消息队列 |
| `coding-agent` | Pi CLI、会话、上下文、内建工具、扩展、交互/JSON/RPC 模式 |
| `tui` | 通用终端组件、输入编辑器和增量渲染 |
| `mcp` | 可复用 MCP 客户端、JSON-RPC 和传输 |
| `codemode` | 受限 JavaScript 执行运行时；Durable 和 coding-agent 可复用 |
| `durable` | 以不可变记录、原子提交和持久任务为中心的 Agent harness |
| `chord` | 类型化对象运行时、契约、状态复制、进程链接和热更新 |
| `env` | Durable 的本地/SSH 远程执行环境与 daemon |
| `telemetry` | 后端无关的 tracing 契约和测试适配器 |
| `evals` | Pi coding-agent 的行为评估与文档对照运行器 |

“所有原理”在这套课里指覆盖每个 package 的公开职责、核心子系统、端到端数据流和关键设计取舍；具体 provider 的重复适配代码、每一个 TUI 小组件、平台兼容分支和低层工具函数，建议沿章节中的源码入口继续逐个读。源码每天会变化，遇到实现与说明不一致时，以当前工作树的 TypeScript 和测试为准。

## 每章怎么学

建议先用例子预测运行结果，再读源码验证。遇到类型定义先问“谁构造它、谁消费它、它会不会进持久化”；遇到异步函数则画出事件顺序、取消信号和错误路径。每章末尾的练习只需要读代码，不会调用真实模型或消耗 API 额度。

