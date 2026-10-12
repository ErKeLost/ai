# OpenAI 官方文章（中文译文 + 英文原文）

来源：`developers.openai.com` 与 `modelcontextprotocol.io`。这些页面的官方 Markdown 版本可以直接在 URL 后加 `.md` 拿到。

- **`zh/` —— 中文译文（建议读这套）**
- `en/` —— 英文原文（对照用，含英文版索引 `en/README.md`）

## 建 UI / Generative UI 主线（推荐按编号顺序读）

| 文件 | 原文 | 为什么读 |
|---|---|---|
| `zh/01-给MCP服务器加上UI.md` | https://developers.openai.com/plugins/build/chatgpt-ui.md | **核心**。OpenAI 的 Generative UI 路线：MCP server 返回 UI 资源，跑在 sandbox iframe 里，用 `postMessage` 上的 `ui/*` JSON-RPC 和宿主通信；含 `window.openai.*` 兼容别名对照表、inline card / carousel / fullscreen 该怎么选 |
| `zh/02-MCP-Apps规范.md` | https://modelcontextprotocol.io/docs/extensions/apps.md | MCP Apps 标准本身。想"跨宿主"而不是绑死 ChatGPT，就得读这份 |
| `zh/03-快速上手MCP服务器与UI.md` | https://developers.openai.com/plugins/build/app-quickstart.md | 动手入口：MCP server + 可选 UI 的最小可跑例子 |
| `zh/04-插件UI字段参考.md` | https://developers.openai.com/plugins/reference.md | 字段级参考：工具 / 资源 / 组件 schema，`window.openai` component bridge 全部签名 |
| `zh/05-UI设计规范.md` | https://developers.openai.com/plugins/concepts/ui-guidelines.md | ChatGPT 容器内的设计规范：display mode（inline / fullscreen / PiP）、颜色、字体、间距、无障碍 |
| `zh/06-扩展-侧边栏与文件查看器.md` | https://developers.openai.com/plugins/build/extensions.md | 进阶形态：侧边栏应用、文件查看器/编辑器、复杂表单 |
| `zh/09-官方示例索引.md` | https://developers.openai.com/plugins/build/examples.md | 官方例子索引（很短） |

## 设计 / 产品视角

| 文件 | 原文 | 为什么读 |
|---|---|---|
| `zh/07-什么样的ChatGPT应用才算好.md` | https://developers.openai.com/blog/what-makes-a-great-chatgpt-app.md | 一个 app 究竟提供什么价值（新知识 / 新动作 / 更好的展示方式）；为什么不该"把产品原样搬进来"；按意图强弱（vague / specific / no brand awareness）设计 |
| `zh/08-打造ChatGPT应用的15条经验.md` | https://developers.openai.com/blog/15-lessons-building-chatgpt-apps.md | **实战坑集合**。"CSP 就是新的 CORS"、"UI 要适配多种 display mode"、"懒加载在 AI 应用里失效"、"小 widget flag 影响巨大" —— L3 级别开放 UI 的真实工程代价 |

## 相关但要另外拿的

- MCP Apps 完整规范站：https://apps.extensions.modelcontextprotocol.io
- 官方 UI 组件库（React）：https://openai.github.io/apps-sdk-ui/ ・本地 submodule `openai-apps-sdk-examples/`
- OpenAI 博客索引：https://developers.openai.com/blog/llms.txt
- 开发文档总索引：https://developers.openai.com/llms.txt

## 一个小技巧

`developers.openai.com` 和 `modelcontextprotocol.io` 的文档页都能在 URL 后加 `.md` 取到干净 Markdown；
每个文档集还有 `llms.txt`（目录）和 `llms-full.txt`（全文单文件），适合整包喂给模型。

## 译文怎么来的

用 `pi -p`（非交互模式）按 H2/H3 分块批量翻译，代码块整体不切分，代码与字段名不翻译。
校验过：代码围栏数量与原文一一对应，无截断、无标记残留。术语保留英文（MCP、A2UI、AG-UI、iframe、postMessage、JSON-RPC、window.openai 等）。
