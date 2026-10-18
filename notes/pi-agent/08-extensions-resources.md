# 第 8 章：Extensions 与资源系统

## 学习目标

理解 Pi 为何提供多种定制方式，extension 的生命周期、事件和工具 API 如何工作，以及它与 skill、prompt template、theme 和 package 的差别。

## 1. 先选最小可用的定制方式

| 需求 | 机制 | 例子 |
|---|---|---|
| 复用一段输入文本 | Prompt template | `/review security` |
| 按某类任务加载说明/脚本 | Skill | PDF 工作流的 `SKILL.md` |
| 增加代码行为、工具、hook、provider 或 UI | Extension | 注册 `/hello` 或自定义 tool |
| 分发一组 extension/skills/themes/prompts | Pi package | npm/git 包 |

把一切都做成 extension 会带来可执行代码和生命周期负担；如果只需步骤说明，skill 更合适。

## 2. 一个最小扩展

扩展导出 default factory，Pi 提供 `ExtensionAPI`：

```ts
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.registerCommand("hello", {
    description: "展示问候",
    handler: async (name, ctx) => {
      ctx.ui.notify(`你好，${name || "朋友"}`, "info");
    },
  });
}
```

保存为 `~/.pi/agent/extensions/hello.ts` 后运行 `/hello`；开发时可用 `pi --extension ./hello.ts`。源码 loader 使用 Jiti 处理本地 TS/JS extension。

## 3. 生命周期和事件语义

扩展 factory 负责注册能力，不适合无条件启动 watcher/process/socket，因为有些 CLI 仅列模型或检查 auth，并不创建 session。session-scoped 资源应在 `session_start` 创建，在 `session_shutdown` 幂等清理。

`pi.on(event, handler)` 允许观察或转换资源、session、agent、message、provider、tool 等生命周期。不同事件的返回值语义不同：有些只能通知，有些可替换 prompt/message、改写 tool call、阻止执行或请求继续生成。tool calls 可能并行，不能假设相邻事件的 sibling tool 已完成。

例：一个危险命令 guard 在 `tool_call` 中检查工具参数，遇到删除数据库的 bash 指令时返回 block；它不应等到命令已产生副作用后再尝试停止。

## 4. Context 与 prompt 的 hook 选择

`before_agent_start` 可以修改 prompt / systemPromptOptions。优先只改需要的 section、工具或规则，让 Pi 写入结构化 prompt delta；只有确实需要完全重建 system message 才整体替换。`context` 与 `context_with_system` 修改请求 transcript，后者必须保留 index 0 的 system message。

例：临时加入当前 issue 编号属于 request-specific context；应让这条信息只作用于该次请求，不能把“给模型看的临时辅助信息”意外永久追加到 session。

## 5. ResourceLoader 负责发现，不等于沙箱

ResourceLoader 扫描用户/项目的 extensions、skills、prompt templates、themes、context files，并提供诊断。项目级资源加载受 trust 流程控制，但 extension 进程内执行，可访问 Pi 进程权限。信任控制“是否加载资源”，不是隔离资源执行能力。

一个 Skill 通常在 system prompt 中仅以名字、描述和路径提示，模型需要时再读取完整 SKILL.md。Prompt template 则在输入阶段展开；Theme 只进入渲染层。

## 6. Extension 的边界和源码

- API 类型：[extensions/types.ts](../../pi/packages/coding-agent/src/core/extensions/types.ts)
- loader/runner：[extensions/loader.ts](../../pi/packages/coding-agent/src/core/extensions/loader.ts)、`extensions/runner.ts`
- 编排入口：[core/extensions/index.ts](../../pi/packages/coding-agent/src/core/extensions/index.ts)
- 资源发现：[resource-loader.ts](../../pi/packages/coding-agent/src/core/resource-loader.ts)
- 官方例子：[extensions.md](../../pi/packages/coding-agent/docs/extensions.md)、`packages/coding-agent/examples/extensions/`

练习：从 `pi.registerTool()` 的注册点找到 extension tool 如何进入 coding-agent 的 definitions，再追到 AgentSession 把它传给 `Agent` 的位置。分别标记“声明给模型”“执行实现”“UI 展示”三个环节。

