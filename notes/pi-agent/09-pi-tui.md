# 第 9 章：`pi-tui`——终端组件与增量渲染

## 学习目标

理解 TUI 为什么不直接“每次打印完整画面”，如何处理组件布局、焦点、终端输入和差分输出，以及 coding-agent 如何把 Agent 事件映射到界面。

## 1. TUI 的三个核心对象

- **Terminal**：底层终端输入输出、尺寸和能力。
- **Component**：给定宽度后渲染若干文本行，并可接收输入/失效通知。
- **TUI renderer**：管理组件树、焦点、overlay、绘制调度和 terminal mode。

`TuiMainScreen` 保留主屏滚动历史；`TuiAltScreen` 建立固定高度 viewport，Pi 自己管理滚动。两者通过 `TUI` 接口暴露一致的组件操作。

## 2. 最小显示组件

```ts
import { ProcessTerminal, Text, TuiMainScreen } from "@earendil-works/pi-tui";

const terminal = new ProcessTerminal();
const tui = new TuiMainScreen(terminal);
tui.addChild(new Text("Pi 正在准备请求…"));
tui.start();
// 完成后：tui.stop();
```

交互应用还会加入 Editor，调用 `tui.setFocus(editor)`，并订阅终端 input。组件内容变化后调用 `invalidate()` 或 `requestRender()`，让渲染器安排一帧。

## 3. 为什么做差分绘制

每轮都清屏并重印完整 transcript 会闪烁、破坏 scrollback，也浪费终端带宽。Pi 记录前一帧每行显示结果，只重绘变化的行，并可用 synchronized output 减少半帧可见。

```text
上一帧：第 1 行“回答中…”，第 2 行“spinner A”
新一帧：第 1 行相同，第 2 行“spinner B”
输出：只更新第 2 行
```

差分依赖“组件 render 是纯展示结果”这个约定：渲染期间不要执行文件读取、模型请求或永久状态变更。昂贵数据应预先计算并在状态更新时失效。

## 4. 布局、滚动和 overlays

Pi TUI 有 VStack/HStack、Box、Container、ScrollView、Input、Editor、SelectList、Markdown、Image 等组件。Alternate-screen 下可以建立受 terminal height 限制的 layout root，给聊天历史一个可滚动区域，把 editor/status 固定在下面。Overlay 用于 dialog/menu，不替换原内容树。

例：确认对话框可以显示在 chat transcript 上方；用户按 Escape 后 overlay 消失，下面原聊天内容仍在，不必重新创建整个应用。

## 5. 输入是 terminal protocol

Raw mode 下按键由 TUI 收到并匹配 keybinding；Bracketed Paste、鼠标、终端 resize、OSC 超链接和图像协议都需要处理。Ctrl+C 在 raw mode 中可能不是操作系统 SIGINT，所以应用还需显式处理。

例：大段粘贴不能简单按“按键字符逐个输入”处理；终端会发 bracketed-paste 起止标记，editor 才能将这段内容作为一次粘贴插入，保持撤销和光标行为合理。

## 6. Pi 交互层的角色

coding-agent 的 `InteractiveMode` 订阅 AgentSession 事件：message_start 构建消息组件，message_update 更新流式内容，tool_execution_* 显示工具运行状态，session/model/usage 状态更新 footer。它负责终端呈现与交互，不重新实现 Agent loop。

源码入口：[pi-tui README](../../pi/packages/tui/README.md)、[tui.ts](../../pi/packages/tui/src/tui.ts)、[tui-main-screen.ts](../../pi/packages/tui/src/tui-main-screen.ts)、[tui-alt-screen.ts](../../pi/packages/tui/src/tui-alt-screen.ts)、[interactive-mode.ts](../../pi/packages/coding-agent/src/modes/interactive/interactive-mode.ts)。

练习：对照 `TuiMainScreen` 和 `TuiAltScreen`，解释普通 terminal scrollback 与 application-owned viewport 为什么不能用同一套滚动策略。

