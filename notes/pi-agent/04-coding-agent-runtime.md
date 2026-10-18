# 第 4 章：`pi-coding-agent`——从 CLI 到可运行会话

## 学习目标

看懂 coding-agent 如何把配置、认证、信任、资源、工具、SessionManager 和 Agent 组装成一个 Pi session；理解模式选择与安全边界。

## 1. CLI 启动不是 Agent loop 本身

入口 `src/cli.ts` 很薄，真正的启动和控制流位于 [main.ts](../../pi/packages/coding-agent/src/main.ts)。Pi 先解析参数、stdin/stdout TTY 和显式模式，再决定 interactive、print、JSON、RPC 或仅打印元信息。模式共用模型/会话机制，但输出和交互方式不同。

```text
argv + stdin + TTY
   → parse args
   → resolve mode
   → config / auth / project trust
   → ModelRuntime + ResourceLoader + SessionManager
   → createAgentSession()
   → InteractiveMode | print | JSON events | RPC
```

例：`echo "解释这个函数" | pi` 的 stdin 不是 TTY，所以 CLI 可选择 print workflow；`pi --mode rpc` 则把 stdin/stdout 当 JSONL 控制通道。

## 2. AgentSession 是 coding-agent 的装配中心

[sdk.ts](../../pi/packages/coding-agent/src/core/sdk.ts) 的 `createAgentSession()` 解析 cwd 和 agentDir，构造 `ModelRuntime`、SettingsManager、SessionManager、ResourceLoader，恢复 session 中的模型/思考级别，加载可用工具和 extensions，再创建 AgentSession。交互模式在这一基础上绑定 UI；SDK 调用者也可直接控制 session。

这层做“应用策略”，不是通用 Agent 核心：默认 system prompt、read/bash/edit/write、Pi 的 session 格式、设置优先级以及扩展生命周期都属于 coding-agent。

## 3. 配置和资源有加载顺序

用户级与项目级 settings、provider 认证、项目资源、环境变量及命令行参数会影响最终模型和可用功能。项目资源加载前需要处理信任策略，因为 extension 是可执行代码，skill/template 也可携带会影响工具使用的指令。

例：在一个陌生 git 仓库里运行 `pi`，项目里有 `.pi/extensions/`。用户选择信任之前，Pi 必须避免把该目录当成无害文本直接执行。信任项目只允许 Pi 加载这些资源，不会把后续 bash/read/write 限定在沙箱内。

设置 `--no-tools` 等选项改变的是模型看见和 agent 注册的 tool loadout；它不是操作系统权限控制。章节 [安全边界](16-security-build-test.md) 会把这一区别展开。

## 4. 关键目录

| 源码目录 | 职责 |
|---|---|
| `src/cli/` | argv 解析、文件参数、session 选择、trust 提示等 |
| `src/core/` | AgentSession、模型运行时、配置、session、资源和 tool 定义 |
| `src/core/tools/` | bash/read/write/edit/grep/find/ls 等 coding tools |
| `src/core/compaction/` | 上下文压缩和分支摘要 |
| `src/core/extensions/`、`src/extensions/` | 扩展 API 与内置扩展 |
| `src/modes/` | interactive、print、JSON、RPC 运行形态 |
| `src/utils/` | 路径、终端、图片、子进程等支持设施 |
| `docs/`、`examples/` | 产品用法和可运行参考，不等于运行时实现 |

核心入口：[main.ts](../../pi/packages/coding-agent/src/main.ts)、[sdk.ts](../../pi/packages/coding-agent/src/core/sdk.ts)、[agent-session.ts](../../pi/packages/coding-agent/src/core/agent-session.ts)、[agent-session-runtime.ts](../../pi/packages/coding-agent/src/core/agent-session-runtime.ts)。

## 5. 一个可嵌入的最小流程

```ts
import { createAgentSession } from "@earendil-works/pi-coding-agent";

const { session } = await createAgentSession({ cwd: process.cwd() });
await session.prompt("只读检查仓库入口，列出三个关键文件");
console.log(session.getLastAssistantText());
await session.dispose();
```

真实应用还需订阅 events、传入模型/认证/runtime、处理 session 生命周期。这个例子表明 interactive terminal 只是一个消费者，AgentSession 并不要求必须显示 TUI。

## 6. 设计取舍

启动层集中装配，Agent loop 保持 provider/界面无关；同一个 AgentSession 可被多种外部接口复用。相应代价是 `main.ts` 和 session factory 有大量策略分支。阅读时先追一个实际入口（比如 `createAgentSession`），不要逐行从 CLI 开始硬啃全部辅助函数。

练习：在 `main.ts` 找到 `resolveAppMode()`，分别给“stdin 是管道”“显式 rpc”“终端双向连接”预测 mode，再检查分支是否与本章一致。

