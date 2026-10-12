# 为你的 MCP server 添加 UI

> 完整的文档索引请参阅 [llms.txt](/llms.txt)。在页面 URL 末尾加上 `.md` 即可获取该文档页面的 Markdown 版本。

## 概述

自定义 UI 是可选的。当插件的使用场景需要用户检查、比较、编辑、确认或浏览结构化信息时，再添加它。即使没有组件，也要保证 MCP 工具本身可用，这样 ChatGPT 和 Codex 在没有 UI 的情况下也能完成整个工作流。

MCP server 会为选定的工具返回 UI 资源。组件在 ChatGPT 内的 iframe 中运行，通过 MCP Apps bridge（基于 `postMessage` 的 JSON-RPC）与宿主通信，并渲染在对话旁边。开放的 MCP Apps 标准让这套 UI 能够运行在所有兼容的宿主上。

## 从 MCP Apps 开始

ChatGPT 实现了开放的 [MCP Apps 标准](https://modelcontextprotocol.io/docs/extensions/apps)，用于处理 MCP server 返回的 UI。MCP Apps 定义了你的 server 如何将工具与 UI 资源关联，以及 iframe 如何与宿主通信。

对于新 UI：

1. 使用 `_meta.ui.resourceUri` 声明 UI 资源。
2. 使用基于 `postMessage` 的 `ui/*` JSON-RPC bridge 处理初始化、通知、工具调用、消息以及模型可见的上下文。
3. 即使没有 UI，也要保持工具可用，这样模型才能在不渲染组件的客户端中完成工作流。

这种"标准优先"的基础，让同一套 UI 既能运行在 ChatGPT 中，也能运行在其他兼容的 MCP Apps 宿主上。

当你准备实现该标准时，请参考 [MCP Apps 规范](https://modelcontextprotocol.io/docs/extensions/apps)。

关于侧边栏应用、文件查看器以及更丰富的表单，请参阅 [Extensions](https://developers.openai.com/plugins/build/extensions)。

## 在此之上叠加 ChatGPT 扩展

在 MCP Apps 流程跑通之后，仅在共享规范未覆盖的能力上才使用 `window.openai`。这些可选扩展可以改善 ChatGPT 中的体验，同时又不会影响可移植的 UI 基础。

### 优先使用共享字段和方法

只要共享规范已覆盖某项能力，就应使用 MCP Apps 对应的字段或方法：

| 目标 | MCP Apps 标准 | ChatGPT 兼容别名 |
| --- | --- | --- |
| 将工具与 UI 资源关联 | `_meta.ui.resourceUri` | `_meta["openai/outputTemplate"]` |
| 接收工具输入 | `ui/initialize` + `ui/notifications/tool-input` | `window.openai.toolInput` |
| 接收工具结果 | `ui/notifications/tool-result` | `window.openai.toolOutput` |
| 从 UI 调用工具 | `tools/call` | `window.openai.callTool` |
| 发送后续消息 | `ui/message` | `window.openai.sendFollowUpMessage` |

这些兼容别名对现有集成依然可用。新 UI 应使用中间列中的共享字段和 bridge 方法。

例如：

- 通过 `window.openai.requestCheckout` 实现 Instant Checkout。
- 通过 `window.openai.uploadFile`、`window.openai.selectFiles` 和 `window.openai.getFileDownloadUrl` 处理 ChatGPT 文件。
- 通过 `window.openai.requestModal` 实现由宿主控制的模态框。
- 通过 `window.openai.widgetState` 和 `window.openai.setWidgetState` 实现 widget 状态持久化。

对每个扩展做特性检测（feature detection），并在可行时提供降级方案：

```js
const openai = typeof window !== "undefined" ? window.openai : undefined;

if (openai?.requestModal) {
  await openai.requestModal({
    /* ... */
  });
} else {
  // Fallback behavior for hosts without this extension.
}
```

避免基于宿主或产品名称做分支判断，而应检测你的 UI 实际需要的能力。

关于扩展的签名和示例，请参阅 [`window.openai` 组件 bridge 参考](https://developers.openai.com/plugins/reference#windowopenai-component-bridge)。

### 可选的 OpenAI 组件库

[`@openai/apps-sdk-ui`](https://openai.github.io/apps-sdk-ui/) 组件库提供了与 ChatGPT 容器风格一致的现成按钮、卡片、输入控件和布局原语。当你希望获得一致的样式又不想重新构建基础组件时，可以使用它。

你也可以浏览 [GitHub 上的 UI 示例仓库](https://github.com/openai/openai-apps-sdk-examples)。

## 选择呈现方式

从内联 UI 开始，只有当工作流确实需要时才申请更多空间。选择能让用户理解结果或完成任务的最小呈现方式。

### 内联卡片

内联卡片适合展示聚焦的结果、确认操作或少量操作。保持卡片自成一体，避免深层次的导航。

![内联卡片示例](https://developers.openai.com/images/apps-sdk/inline_cards.png)

### 内联轮播

当用户需要在少量视觉丰富的相似选项中浏览并做出选择时，可使用内联轮播。

![内联轮播示例](https://developers.openai.com/images/apps-sdk/inline_carousel.png)

### 全屏

全屏适合需要更大空间的内容丰富的任务，例如地图、编辑画布或详细浏览。设计体验时要与 ChatGPT 的 composer（输入区）良好配合，它在全屏模式下依然可用。

![全屏 UI 示例](https://developers.openai.com/images/apps-sdk/fullscreen.png)

### 画中画

画中画适合在对话继续进行时应保持可见的持续性活动，例如直播会话、游戏或视频。

![画中画 UI 示例](https://developers.openai.com/images/apps-sdk/pip.png)

关于布局、交互、视觉设计和无障碍访问的详细指南，请参阅 [UI 指南](https://developers.openai.com/plugins/concepts/ui-guidelines)。

## 将数据处理与 UI 渲染分离

### 解耦模式

如果你在每次工具调用上都附加 widget 模板，ChatGPT 可能会过于频繁地重新渲染你的 iframe。更好的模式是将数据处理工具与渲染工具分离：

- **数据工具**：负责获取、计算或修改数据，只返回工具结果。
- **渲染工具**：接收最终数据并返回 widget 模板。

这样模型可以先对自己获取的数据进行智能处理，再决定是否向用户渲染 UI，从而更有可能达成用户明确表达的目标。

该模式是 MCP Apps 架构的一部分。

在实践中，许多 UI 集成都采用这种拆分方式：

- **搜索/获取工具（数据优先）：** 返回 ID 和元数据，不附加任何 widget 模板。
- **渲染工具（例如 `render_listings_widget`）：** 接收准备好的 ID 列表并渲染 widget。

只有渲染工具才应包含 `_meta.ui.resourceUri`。

### 解耦的调用流程（Decoupled call flow）

推荐的调用流程：

1. 模型调用数据工具（例如 `roll_dice`）。
2. 模型从数据工具接收 `structuredContent`。
3. 模型用这些数据调用渲染工具。
4. widget 只渲染一次，使用的是经模型校验后的最终上下文。

### 示例：房产后续查询

假设你的插件展示房源卡片和地图，但服务端的 `search` 工具只支持粗粒度的筛选条件（城市、价格、卧室数、浴室数），无法按学区（school zone）筛选。

如果用户问："这些房源里哪些在 Richmond Primary School 的学区内？"，解耦就能派上用场：

1. `search` 进行宽泛查询，返回候选房源 ID 及元数据。
2. 模型针对该后续问题对候选集做进一步筛选。
3. 模型只把筛选后的 ID 传给 `render_listings_widget`。
4. widget 渲染最终筛选后的结果。

最佳实践：

- 保持数据工具的可复用性。返回完整的 `structuredContent` 以便链式调用。
- 让渲染工具专注于展示。不要把业务逻辑混入渲染处理逻辑中。
- 在渲染工具的描述中说明依赖关系（例如"必须先调用 `roll_dice`"）。
- 让重新执行（rerun）始终是有意为之。对于"Re-roll"这类本地交互，让 UI 直接调用数据工具，而无需重新挂载 widget。

### 解耦示例

示例（解耦的骰子工具）：

```ts



const TEMPLATE_URI = "ui://widget/dice.html";

const server = new McpServer(
  { name: "Decoupled dice", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// The widget only renders the latest tool result.
// Re-roll calls the data tool directly to avoid remounting the widget.
const widgetHtml = `
  <div style="font-family: system-ui; padding: 8px;">
    <div style="font-size: 20px; margin-bottom: 6px;">
      Result: <span id="out">—</span>
    </div>
    <button id="reroll">Re-roll</button>
  </div>

  <script>
    const outputEl = document.getElementById("out");
    const rerollButton = document.getElementById("reroll");
    const pendingRequests = new Map();
    let nextRequestId = 1;
    let latestToolInput;
    let latestToolOutput;

    function render(result) {
      outputEl.textContent = String(result?.value ?? "—");
    }

    function request(method, params) {
      const id = nextRequestId++;
      window.parent.postMessage({ jsonrpc: "2.0", id, method, params }, "*");
      return new Promise((resolve, reject) => {
        pendingRequests.set(id, { resolve, reject });
      });
    }

    window.addEventListener(
      "message",
      (event) => {
        if (event.source !== window.parent) return;
        const message = event.data;
        if (!message || message.jsonrpc !== "2.0") return;

        if (message.id !== undefined && pendingRequests.has(message.id)) {
          const pending = pendingRequests.get(message.id);
          pendingRequests.delete(message.id);
          if (message.error) pending.reject(message.error);
          else pending.resolve(message.result);
          return;
        }

        if (message.method === "ui/notifications/tool-input") {
          latestToolInput = message.params;
        }

        if (message.method === "ui/notifications/tool-result") {
          latestToolOutput = message.params?.structuredContent;
          render(latestToolOutput);
        }
      },
      { passive: true }
    );

    rerollButton.onclick = async () => {
      const sides = latestToolOutput?.sides ?? latestToolInput?.sides ?? 6;
      const next = await request("tools/call", {
        name: "roll_dice",
        arguments: { sides },
      });
      if (next?.structuredContent) {
        render(next.structuredContent);
      }
    };
  </script>
`.trim();

server.registerResource("dice-widget", TEMPLATE_URI, {}, async () => ({
  contents: [
    {
      uri: TEMPLATE_URI,
      mimeType: "text/html;profile=mcp-app",
      text: widgetHtml,
      _meta: { ui: { prefersBorder: true } },
    },
  ],
}));

// 1) Data tool: no output template, returns chainable structuredContent.
server.registerTool(
  "roll_dice",
  {
    title: "Roll dice",
    description: "Roll an N-sided die and return { sides, value }.",
    inputSchema: { sides: z.number().int().min(2) },
    outputSchema: {
      sides: z.number().int().min(2),
      value: z.number().int().min(1),
    },
    _meta: {
      "openai/toolInvocation/invoking": "Rolling…",
      "openai/toolInvocation/invoked": "Rolled.",
    },
  },
  async ({ sides }) => {
    const value = 1 + Math.floor(Math.random() * sides);
    return {
      structuredContent: { sides, value },
      content: [{ type: "text", text: `Rolled ${value} on ${sides} sides.` }],
    };
  }
);

// 2) Render tool: owns the template and requires data from roll_dice.
server.registerTool(
  "render_dice_widget",
  {
    title: "Render dice widget",
    description:
      "Render the dice widget from roll data. First call roll_dice, then pass its sides and value to this tool.",
    inputSchema: {
      sides: z.number().int().min(2),
      value: z.number().int().min(1),
    },
    outputSchema: {
      sides: z.number().int().min(2),
      value: z.number().int().min(1),
    },
    _meta: {
      ui: { resourceUri: TEMPLATE_URI },
      "openai/toolInvocation/invoking": "Rendering…",
      "openai/toolInvocation/invoked": "Rendered.",
    },
  },
  async ({ sides, value }) => ({
    structuredContent: { sides, value },
    content: [
      {
        type: "text",
        text: `Showing a ${sides}-sided roll: ${value}.`,
      },
    ],
  })
);

export default server;
```

## 状态管理

来自 MCP 服务器的 UI 需要处理三类状态：

| 状态类型 | 归属方 | 生命周期 | 示例 |
| --------------------------------- | ------------------------------ | ------------------------------------ | ---------------------------------------- |
| **业务数据（authoritative，权威数据）** | MCP 服务器或外部服务 | 长期存在 | 任务、工单、文档 |
| **UI 状态（ephemeral，临时状态）** | UI 实例 | 活跃的 UI 实例存续期间 | 选中的行、展开的面板、排序方式 |
| **跨会话状态（durable，持久状态）** | 由你掌控的存储 | 跨会话、跨对话 | 保存的筛选条件、视图模式、工作区 |

每种状态值都应交由拥有它的系统来管理。UI 应基于工具结果渲染权威数据，并在其上叠加临时性的展示状态。

```text
MCP server or external service
│
├── Authoritative business data
│
▼
UI
│
├── Ephemeral presentation state
│
└── Rendered view = business data + UI state
```

### 将业务数据保存在服务端

业务数据是唯一的事实来源（source of truth）。不要把它只存储在 UI 中。当用户执行某个操作时：

1. UI 调用一个 MCP 工具。
2. 服务端校验请求并更新数据。
3. 服务端返回更新后的权威快照。
4. UI 渲染该快照，同时保留兼容的展示状态。

返回足够多的结构化内容，让模型和 UI 都能理解新的状态。这样即使 UI 无法加载，对话依然保持可用。

### 将临时 UI 状态保留在 UI 中

对于只影响展示效果的值（例如选中的条目、展开的面板或草稿筛选条件），应使用框架状态（framework state）。每个渲染出的 UI 实例都拥有自己独立的状态。

当模型需要知道某个选择或暂存的编辑时，通过 `ui/update-model-context` 把这些信息发送出去。这是 MCP Apps 中用于更新模型可见上下文的可移植机制。

ChatGPT 还提供了可选的 widget 作用域持久化：

- 从 `window.openai.widgetState` 读取当前快照。
- 通过 `window.openai.setWidgetState(state)` 写入新的快照。

`setWidgetState` 是同步的。在每次有意义的 UI 状态变化之后调用它即可；没有任何需要 `await` 的操作。

```tsx


export function TaskList({ tasks }) {
  const [state, setState] = useState(
    window.openai?.widgetState ?? { selectedId: null }
  );

  function selectTask(selectedId) {
    const nextState = { ...state, selectedId };
    setState(nextState);
    window.openai?.setWidgetState?.(nextState);
  }

  return (
    <ul>
      {tasks.map((task) => (
        <li key={task.id}>
          <button
            type="button"
            aria-pressed={state.selectedId === task.id}
            onClick={() => selectTask(task.id)}
          >
            {task.title}
          </button>
        </li>
      ))}
    </ul>
  );
}
```

Widget 状态只属于某一个渲染出的 UI 实例。不要把它当作业务数据的事实来源，也不要把它当作持久化存储。

#### 让模型能够看到图像

对于处理图像的 UI，请使用结构化的 widget 状态格式：

- `modelContent`：模型应当看到的文本或 JSON。
- `privateContent`：仅供 UI 使用的状态，模型不应看到。
- `imageIds`：模型应在后续轮次中收到的文件 ID。

```tsx
window.openai.setWidgetState({
  modelContent: "Review the currently selected images.",
  privateContent: {
    currentView: "image-viewer",
    filters: ["crop", "sharpen"],
  },
  imageIds: ["file_123", "file_456"],
});
```

只包含通过 `window.openai.uploadFile` 上传、通过 `window.openai.selectFiles` 选择、通过工具输入中的文件参数接收，或通过工具结果中的文件引用返回的文件 ID。

### 将跨会话状态存储在你的服务端

必须跨对话、设备或会话保留的偏好设置和数据，应存储在你自己控制的存储中。对用户进行身份验证，使 MCP 服务器能够把每个请求映射到正确的账户。

在添加持久化存储时：

- 保持足够低的延迟，以支撑交互式 UI。
- 通过服务端授权保护私密数据。
- 提前规划数据驻留（data residency）与合规要求。
- 对来自重试或并发 UI 实例的流量应用限流。
- 为存储的对象引入版本号，以便在不破坏现有对话的前提下进行迁移。

避免把 `localStorage` 用于核心状态。UI 运行在隔离的 iframe 中，浏览器存储无法提供可靠的跨设备或跨会话数据层。

## 搭建组件项目

既然你已经理解了 MCP Apps 桥接层（以及可选的 ChatGPT 扩展），接下来就该搭建你的组件项目了。

作为最佳实践，应将组件代码与服务端逻辑分开。一种常见的目录结构如下：

```
plugin-ui/
  server/            # MCP server (Python or Node)
  web/               # Component bundle source
    package.json
    tsconfig.json
    src/component.tsx
    dist/component.js   # Build output
```

创建项目并安装依赖（推荐 Node 18 及以上版本）：

```bash
cd plugin-ui/web
npm init -y
npm install react@^18 react-dom@^18
npm install -D typescript esbuild
```

如果你的组件需要拖拽（drag-and-drop）、图表或其他库，现在就把它们加上。保持依赖精简，以减小打包体积。

## 编写 React 组件

你的入口文件应当把组件挂载到 `root` 元素上，并根据通过 MCP Apps 桥接层传来的最新工具结果进行渲染（例如 `ui/notifications/tool-result`）。

[示例页面](https://developers.openai.com/plugins/build/examples)中包含示例 UI，例如 Pizzaz 披萨餐厅列表。

### 探索 Pizzaz 组件画廊

[UI 示例](https://developers.openai.com/plugins/build/examples)中包含若干示例组件。在设计自己的 UI 时，可以把它们当作蓝本：

- **Pizzaz List：** 带收藏功能和行动号召（call-to-action）按钮的排名卡片列表。  
  ![Pizzaz 列表组件截图](https://developers.openai.com/images/apps-sdk/pizzaz-list.png)
- **Pizzaz Carousel：** 基于 Embla 的横向滚动组件，展示了以媒体为主的布局。  
  ![Pizzaz 轮播组件截图](https://developers.openai.com/images/apps-sdk/pizzaz-carousel.png)
- **Pizzaz Map：** 集成 Mapbox 的地图组件，带全屏检查器和宿主状态同步。  
  ![Pizzaz 地图组件截图](https://developers.openai.com/images/apps-sdk/pizzaz-map.png)
- **Pizzaz Album：** 为深入浏览单个地点而设计的堆叠式画廊视图。  
  ![Pizzaz 相册组件截图](https://developers.openai.com/images/apps-sdk/pizzaz-album.png)
- **Pizzaz Video：** 带遮罩层和全屏控制的脚本化播放器。

每个示例都展示了如何打包资源、对接宿主 API，以及为真实对话组织状态结构。复制与你的用例最接近的那个，并根据你的工具响应调整其数据层。

### React 辅助 hooks

一个用于订阅 `ui/notifications/tool-result` 的小型辅助 hook：

```tsx
type ToolResult = { structuredContent?: unknown } | null;

export function useToolResult() {
  const [toolResult, setToolResult] = useState<ToolResult>(null);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== window.parent) return;
      const message = event.data;
      if (!message || message.jsonrpc !== "2.0") return;
      if (message.method !== "ui/notifications/tool-result") return;
      setToolResult(message.params ?? null);
    };

    window.addEventListener("message", onMessage, { passive: true });
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return toolResult;
}
```

基于 `toolResult?.structuredContent` 进行渲染，并将其视为不可信输入。

## Widget 本地化

宿主环境会将当前语言区域（locale）同步到 `document.documentElement.lang`。请使用该 locale 来加载翻译文本，并格式化日期和数字。以下是使用 `react-intl` 的常见模式：

```tsx




const messages: Record<string, Record<string, string>> = {
  "en-US": en,
  "es-ES": es,
};

export function PluginUI() {
  const locale = document.documentElement.lang || "en-US";
  return (
    

{/* Render UI with <FormattedMessage> or useIntl() */}


  );
}
```

## 为 iframe 打包

编写完 React 组件后，你可以将其构建为单个 JavaScript 模块，供服务器内联（inline）到响应中：

```json
// package.json
{
  "scripts": {
    "build": "esbuild src/component.tsx --bundle --format=esm --outfile=dist/component.js"
  }
}
```

运行 `npm run build` 即可生成 `dist/component.js`。如果 esbuild 报错提示缺少依赖，请确认你已在 `web/` 目录下运行过 `npm install`，并且导入语句中的包名与实际安装的包名一致（例如，是 `@react-dnd/html5-server-side` 还是 `react-dnd-html5-server-side`）。

## 将组件嵌入服务器响应

将组件作为 MCP 资源（resource）暴露出去，并使用 MCP Apps UI 的 MIME 类型（`text/html;profile=mcp-app`）。如果你使用 `@modelcontextprotocol/ext-apps/server`，建议优先使用 `RESOURCE_MIME_TYPE`，而不是直接内嵌该字符串：

```ts



const component = readFileSync("web/dist/component.js", "utf8");

registerAppResource(
  server,
  "project-board",
  "ui://project-board/v1.html",
  {},
  async () => ({
    contents: [
      {
        uri: "ui://project-board/v1.html",
        mimeType: RESOURCE_MIME_TYPE,
        text: `<div id="root"></div><script type="module">${component}</script>`,
        _meta: {
          ui: {
            prefersBorder: true,
            domain: "https://example.com",
            csp: {
              connectDomains: ["https://api.example.com"],
              resourceDomains: ["https://static.example.com"],
            },
          },
        },
      },
    ],
  })
);
```

只应将该资源 URI 关联到需要渲染此组件的工具。为了获得更广泛的 MCP Apps 兼容性，请使用 `_meta.ui.resourceUri`。ChatGPT 也兼容 `_meta["openai/outputTemplate"]` 这一别名。

请将资源 URI 视为缓存键（cache key）。当你对 HTML、JavaScript 或 CSS 做出破坏性变更时，应发布新的 URI，并更新所有引用它的工具。

### 内容安全策略（CSP）

声明组件将要连接或从中加载资源的具体域名：

- `connectDomains`：用于 API 请求。
- `resourceDomains`：用于脚本、样式、图片及其他资源。
- `frameDomains`：仅当组件必须嵌入特定 iframe 来源（origin）时使用。

嵌套 frame 默认会被阻止。每个允许列表都应尽量收窄。插件审核流程会将声明的策略与实际 UI 行为进行比对核查。

你可以嵌入来自 MCP 服务器自身可注册域名（registrable domain）下的现有编辑器或管理界面。例如，位于 `https://api.example.com/mcp` 的服务器可以在 `frameDomains` 中声明 `https://app.example.com`。提交时需提供必要的理由说明，并遵守 [iframe 政策](https://developers.openai.com/plugins/plugin-guidelines#iframes-and-embedded-pages)，包括其对共享托管的限制以及审核要求。

组件 UI 模板是面向生产环境的推荐方案。

在开发阶段，只要 React 代码发生变更，你就可以重新构建组件 bundle，并对服务器进行热重载（hot-reload）。

## 在 UI 中提供结账功能

如果你希望用户能够通过插件的 UI 流程完成结账，可以使用组件在确认之前展示商品、价格、条款和支付选项。同时应保证底层的商品目录和订单工具在没有 UI 的情况下依然可用，然后选择外部结账流程，或在可用时选择嵌入式支付方案。

### 默认使用外部结账

外部结账是推荐且普遍可用的方式。从组件链接到你自己的域名上由商家托管的结账流程，由你自行处理：

- 定价与收款。
- 税费、折扣与手续费。
- 配送与履约。
- 退款、客服与合规。

目前的批准仅限于实物商品购买类插件。除非 OpenAI 已为你的插件明确开通，否则请勿提供其他电商类目。

### 使用已保存的支付方式

对于符合条件的实物商品购买，可选的 UI 可以让客户选择之前在你的服务中保存过的支付方式。该流程可以展示符合条件的已保存支付方式，但不能收集新的支付凭据。由你的 MCP 服务器处理购买并返回权威的订单结果。

### 使用 ChatGPT 支付面板


基于 ChatGPT 支付面板的嵌入式结账功能目前处于私密测试（private beta）阶段，仅面向特定市场开放，并非所有开发者或用户都可用。


对于已开通此能力的集成，`window.openai.requestCheckout` 会打开 ChatGPT 支付面板：

```tsx
const order = await window.openai.requestCheckout(checkoutSession);
```

结账流程包含四个部分：

1. MCP 工具在 `structuredContent` 中返回结账会话（checkout session）。
2. 组件展示订单明细、总额、条款以及履约选项。
3. 用户选择支付后，组件调用 `requestCheckout(checkoutSession)`。
4. ChatGPT 将选定的支付令牌（payment token）发送给 MCP 服务器的 `complete_checkout` 工具，由该工具对支付方式扣款并返回已完成的订单。

结账会话必须包含：

- 唯一的会话 ID。
- 订单明细及数量。
- 以货币最小单位整数表示的总额。
- 支付服务商与商家元数据。
- 必需的法律、隐私、退款和客服支持链接。

请将服务器视为价格和订单状态的唯一可信来源（source of truth）。要验证支付令牌、保证操作幂等、持久化订单，并返回权威的收据。绝不要信任仅在组件中计算得出的总额。

使用 `payment_mode: "test"` 可以在不发生真实资金流转的情况下演练端到端流程。请在组件中处理好取消、支付被拒以及支付服务商报错等情况。

有关完整的结账会话字段、支付服务商行为、`complete_checkout` 的结果结构以及委托支付（delegated payment）要求，请参阅 [checkout API 参考](https://developers.openai.com/plugins/build/monetization)。
