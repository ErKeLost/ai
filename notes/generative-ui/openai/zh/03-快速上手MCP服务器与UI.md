# MCP 服务器与 UI 快速入门

> 完整的文档索引请参阅 [llms.txt](/llms.txt)。在页面 URL 末尾追加 `.md` 即可获取对应文档页面的 Markdown 版本。

## 简介

插件使用 [Model Context Protocol（MCP）](https://developers.openai.com/plugins/concepts/mcp-server) 向 ChatGPT 和 Codex 暴露由服务器支撑的能力。本教程将用到：

1. 一个 MCP 服务器，用于定义工具并将其暴露给 ChatGPT 和 Codex。
2. 一个可选的 web 组件，在 ChatGPT 内部的 iframe 中渲染。

ChatGPT 实现了开放的 MCP Apps UI 标准，因此你只需构建一次 UI，就可以在所有兼容 MCP Apps 的宿主中运行。

在本快速入门中，我们将构建一个基础的待办事项（to-do）工作流，其 UI 包含在单个 HTML 文件中，标记、CSS 和 JavaScript 都放在同一个文件里。

如需查看使用 React 的更多进阶示例，请参阅 [GitHub 上的示例仓库](https://github.com/openai/openai-apps-sdk-examples)。

## 构建 web 组件

这一步是可选的。如果你只需要工具而不需要 ChatGPT UI，请跳转到[构建 MCP 服务器](#build-an-mcp-server)，并且不要注册 UI 资源。

首先，在一个新目录中创建名为 `public/todo-widget.html` 的文件。当关联的 MCP 工具返回该 UI 时，ChatGPT 会将其渲染出来。这个文件将包含会在 ChatGPT 界面中渲染的 web 组件。

添加以下内容：

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Todo list</title>
    <style>
      :root {
        color: #0b0b0f;
        font-family:
          "Inter",
          system-ui,
          -apple-system,
          sans-serif;
      }

      html,
      body {
        width: 100%;
        min-height: 100%;
        box-sizing: border-box;
      }

      body {
        margin: 0;
        padding: 16px;
        background: #f6f8fb;
      }

      main {
        width: 100%;
        max-width: 360px;
        min-height: 260px;
        margin: 0 auto;
        background: #fff;
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
      }

      h2 {
        margin: 0 0 16px;
        font-size: 1.25rem;
      }

      form {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
      }

      form input {
        flex: 1;
        padding: 10px 12px;
        border-radius: 10px;
        border: 1px solid #cad3e0;
        font-size: 0.95rem;
      }

      form button {
        border: none;
        border-radius: 10px;
        background: #111bf5;
        color: white;
        font-weight: 600;
        padding: 0 16px;
        cursor: pointer;
      }

      form button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }

      input[type="checkbox"] {
        accent-color: #111bf5;
      }

      ul {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      li {
        background: #f2f4fb;
        border-radius: 12px;
        padding: 10px 14px;
        display: flex;
        align-items: center;
        gap: 10px;
      }

      li span {
        flex: 1;
      }

      li[data-completed="true"] span {
        text-decoration: line-through;
        color: #6c768a;
      }

      li[data-busy="true"] {
        opacity: 0.7;
      }
    </style>
  </head>
  <body>
    <main>
      <h2>Todo list</h2>
      <form id="add-form" autocomplete="off">
        <input id="todo-input" name="title" placeholder="Add a task" />
        <button type="submit">Add</button>
      </form>
      <ul id="todo-list"></ul>
    </main>

    <script type="module">
      const listEl = document.querySelector("#todo-list");
      const formEl = document.querySelector("#add-form");
      const inputEl = document.querySelector("#todo-input");
      const addButtonEl = formEl.querySelector('button[type="submit"]');
      const addButtonText = addButtonEl.textContent;

      let tasks = [];
      let isAdding = false;
      const busyTodoIds = new Set();

      const render = () => {
        listEl.innerHTML = "";
        tasks.forEach((task) => {
          const li = document.createElement("li");
          li.dataset.id = task.id;
          li.dataset.completed = String(Boolean(task.completed));
          li.dataset.busy = String(busyTodoIds.has(task.id));

          const label = document.createElement("label");
          label.style.display = "flex";
          label.style.alignItems = "center";
          label.style.gap = "10px";

          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.checked = Boolean(task.completed);
          checkbox.disabled = busyTodoIds.has(task.id);

          const span = document.createElement("span");
          span.textContent = task.title;

          label.appendChild(checkbox);
          label.appendChild(span);
          li.appendChild(label);
          listEl.appendChild(li);
        });
      };

      const updateFromResponse = (response) => {
        if (response?.structuredContent?.tasks) {
          tasks = response.structuredContent.tasks;
          render();
        }
      };

      // MCP Apps standard bridge: JSON-RPC messages over postMessage.
      //
      // - Initialize the bridge with `ui/initialize`.
      // - Confirm readiness with `ui/notifications/initialized`.
      // - Call tools with `tools/call`.
      // - Listen for `ui/notifications/tool-result` to react to model-initiated tool calls.
      let rpcId = 0;
      const pendingRequests = new Map();

      const rpcNotify = (method, params) => {
        window.parent.postMessage({ jsonrpc: "2.0", method, params }, "*");
      };

      const rpcRequest = (method, params) =>
        new Promise((resolve, reject) => {
          const id = ++rpcId;
          pendingRequests.set(id, { resolve, reject });
          window.parent.postMessage(
            { jsonrpc: "2.0", id, method, params },
            "*"
          );
        });

      window.addEventListener(
        "message",
        (event) => {
          if (event.source !== window.parent) return;
          const message = event.data;
          if (!message || message.jsonrpc !== "2.0") return;

          // Responses
          if (typeof message.id === "number") {
            const pending = pendingRequests.get(message.id);
            if (!pending) return;
            pendingRequests.delete(message.id);

            if (message.error) {
              pending.reject(message.error);
              return;
            }

            pending.resolve(message.result);
            return;
          }

          // Notifications
          if (typeof message.method !== "string") return;
          if (message.method === "ui/notifications/tool-result") {
            updateFromResponse(message.params);
          }
        },
        { passive: true }
      );

      const initializeBridge = async () => {
        const appInfo = { name: "todo-widget", version: "0.1.0" };
        const appCapabilities = {};
        const protocolVersion = "2026-01-26";

        try {
          await rpcRequest("ui/initialize", {
            appInfo,
            appCapabilities,
            protocolVersion,
          });
          rpcNotify("ui/notifications/initialized", {});
        } catch (error) {
          console.error("Failed to initialize the MCP Apps bridge:", error);
          throw error;
        }
      };

      const bridgeReady = initializeBridge();

      const callTodoTool = async (name, payload) => {
        await bridgeReady;
        const response = await rpcRequest("tools/call", {
          name,
          arguments: payload,
        });
        updateFromResponse(response);
      };

      formEl.addEventListener("submit", async (event) => {
        event.preventDefault();
        const title = inputEl.value.trim();
        if (!title || isAdding) return;

        isAdding = true;
        addButtonEl.disabled = true;
        addButtonEl.textContent = "Adding…";

        try {
          await callTodoTool("add_todo", { title });
          inputEl.value = "";
        } catch (error) {
          console.error("Failed to add todo:", error);
        } finally {
          isAdding = false;
          addButtonEl.disabled = false;
          addButtonEl.textContent = addButtonText;
        }
      });

      listEl.addEventListener("change", async (event) => {
        const checkbox = event.target;
        if (!checkbox.matches('input[type="checkbox"]')) return;
        const id = checkbox.closest("li")?.dataset.id;
        if (!id) return;

        if (!checkbox.checked) {
          checkbox.checked = true;
          return;
        }

        if (busyTodoIds.has(id)) return;
        busyTodoIds.add(id);
        checkbox.disabled = true;
        const rowEl = checkbox.closest("li");
        if (rowEl) rowEl.dataset.busy = "true";

        try {
          await callTodoTool("complete_todo", { id });
        } catch (error) {
          console.error("Failed to complete todo:", error);
        } finally {
          busyTodoIds.delete(id);
          render();
        }
      });

      render();
    </script>
  </body>
</html>
```

### 在你的 web 组件中使用 MCP Apps

对于新 UI，请使用 MCP Apps 的 host bridge（宿主桥接）：通过 `postMessage` 传输 JSON-RPC，并使用 `ui/*` 通知以及 `tools/call` 等方法。

在共享的 MCP Apps 流程跑通之后，只有当标准未覆盖某些能力时，才通过 `window.openai` 添加可选的 ChatGPT 扩展。详情请参阅[为 MCP 服务器添加 UI](https://developers.openai.com/plugins/build/chatgpt-ui#layer-on-chatgpt-extensions)。

## 构建 MCP 服务器

安装官方的 Python 或 Node MCP SDK，即可创建服务器并暴露一个 `/mcp` 端点。

在本快速入门中，我们将使用 [Node SDK](https://github.com/modelcontextprotocol/typescript-sdk)。

如果你使用的是 Python，请参阅我们在 GitHub 上的[示例仓库](https://github.com/openai/openai-apps-sdk-examples)，查看使用 Python SDK 的 MCP 服务器示例。

使用以下命令安装 Node SDK、MCP Apps 辅助工具以及 `zod` 包：

```bash
npm install @modelcontextprotocol/sdk @modelcontextprotocol/ext-apps zod
```

### 带 UI 资源的 MCP 服务器

为你的组件 bundle 注册一个资源，并注册模型可以调用的工具（例如 `add_todo` 和 `complete_todo`），以便 ChatGPT 能够驱动 UI。

创建一个名为 `server.js` 的文件，并粘贴以下使用 Node SDK 的示例：

```js





const todoHtml = readFileSync("public/todo-widget.html", "utf8");

const addTodoInputSchema = {
  title: z.string().min(1),
};

const completeTodoInputSchema = {
  id: z.string().min(1),
};

const todoOutputSchema = {
  tasks: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      completed: z.boolean(),
    })
  ),
};

let todos = [];
let nextId = 1;

const replyWithTodos = (message) => ({
  content: message ? [{ type: "text", text: message }] : [],
  structuredContent: { tasks: todos },
});

function createTodoServer() {
  const server = new McpServer({
    name: "todo-plugin-server",
    version: "0.1.0",
  });

  registerAppResource(
    server,
    "todo-widget",
    "ui://widget/todo.html",
    {},
    async () => ({
      contents: [
        {
          uri: "ui://widget/todo.html",
          mimeType: RESOURCE_MIME_TYPE,
          text: todoHtml,
        },
      ],
    })
  );

  registerAppTool(
    server,
    "add_todo",
    {
      title: "Add todo",
      description: "Creates a todo item with the given title.",
      inputSchema: addTodoInputSchema,
      outputSchema: todoOutputSchema,
      _meta: {
        ui: { resourceUri: "ui://widget/todo.html" },
      },
    },
    async (args) => {
      const title = args?.title?.trim?.() ?? "";
      if (!title) return replyWithTodos("Missing title.");
      const todo = { id: `todo-${nextId++}`, title, completed: false };
      todos = [...todos, todo];
      return replyWithTodos(`Added "${todo.title}".`);
    }
  );

  registerAppTool(
    server,
    "complete_todo",
    {
      title: "Complete todo",
      description: "Marks a todo as done by id.",
      inputSchema: completeTodoInputSchema,
      outputSchema: todoOutputSchema,
      _meta: {
        ui: { resourceUri: "ui://widget/todo.html" },
      },
    },
    async (args) => {
      const id = args?.id;
      if (!id) return replyWithTodos("Missing todo id.");
      const todo = todos.find((task) => task.id === id);
      if (!todo) {
        return replyWithTodos(`Todo ${id} was not found.`);
      }

      todos = todos.map((task) =>
        task.id === id ? { ...task, completed: true } : task
      );

      return replyWithTodos(`Completed "${todo.title}".`);
    }
  );

  return server;
}

const port = Number(process.env.PORT ?? 8787);
const MCP_PATH = "/mcp";

const httpServer = createServer(async (req, res) => {
  if (!req.url) {
    res.writeHead(400).end("Missing URL");
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);

  if (req.method === "OPTIONS" && url.pathname === MCP_PATH) {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "content-type, mcp-session-id",
      "Access-Control-Expose-Headers": "Mcp-Session-Id",
    });
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/") {
    res.writeHead(200, { "content-type": "text/plain" }).end("Todo MCP server");
    return;
  }

  const MCP_METHODS = new Set(["POST", "GET", "DELETE"]);
  if (url.pathname === MCP_PATH && req.method && MCP_METHODS.has(req.method)) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");

    const server = createTodoServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless mode
      enableJsonResponse: true,
    });

    res.on("close", () => {
      transport.close();
      server.close();
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res);
    } catch (error) {
      console.error("Error handling MCP request:", error);
      if (!res.headersSent) {
        res.writeHead(500).end("Internal server error");
      }
    }
    return;
  }

  res.writeHead(404).end("Not Found");
});

httpServer.listen(port, () => {
  console.log(
    `Todo MCP server listening on http://localhost:${port}${MCP_PATH}`
  );
});
```

这段代码还会响应 `GET /` 用于健康检查，为 `/mcp` 处理 CORS 预检请求，并对尚未用到的 OAuth 发现路由返回 `404 Not Found`。这样，在尚未添加身份验证的阶段进行迭代时，可以避免 ChatGPT 抛出 502 错误。

## 本地运行

如果你使用的是 React 这类 web 框架，需要将组件构建为静态资源，以便 HTML 模板能够内联它们。通常，你可以运行 `npm run build` 之类的构建命令，生成包含编译后资源的 `dist` 目录。

在本快速入门中，由于我们使用的是原生 HTML（vanilla HTML），因此不需要任何构建步骤。

在包含 `server.js`（或 `server.ts`）的目录下启动 MCP 服务器，监听 `http://localhost:<port>/mcp`。

请确保你的 `package.json` 文件中包含 `"type": "module"`：

```json
{
  "type": "module",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.20.2",
    "@modelcontextprotocol/ext-apps": "^1.0.1",
    "zod": "^3.25.76"
  }
}
```

然后使用以下命令运行服务器：

```bash
node server.js
```

服务器就绪后，应输出 `Todo MCP server listening on http://localhost:8787/mcp`。

### 使用 MCP Inspector 进行测试

你可以使用 [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector) 在本地测试你的服务器。

```bash
npx @modelcontextprotocol/inspector@latest
```

这会打开 MCP Inspector 界面。选择 **Streamable HTTP**，输入 `http://localhost:8787/mcp`，然后连接，即可测试你的服务器并查看其工具响应。

![MCP Inspector](https://developers.openai.com/images/apps-sdk/mcp_inspector.png)

### 将你的服务器暴露到公网

要让 ChatGPT 在开发期间访问你的服务器，需要将其暴露到公网。你可以使用 [ngrok](https://ngrok.com/) 之类的工具，为本地服务器开一条隧道。

```bash
ngrok http <port>
```

这会为你生成一个类似 `https://<subdomain>.ngrok.app` 的公网 URL，你可以用它从 ChatGPT 访问你的服务器。

在 ChatGPT 中连接 MCP 服务器时，请提供带有 `/mcp` 路径的公网 URL（例如 `https://<subdomain>.ngrok.app/mcp`）。

## 在 ChatGPT 中连接你的 MCP 服务器

当 MCP 服务器和 Web 组件在本地都能正常运行后，就可以在 ChatGPT 中连接该服务器：

1. 前往 [ChatGPT Plugins](https://chatgpt.com/plugins)，点击加号按钮，然后选择 **Add custom MCP server**（添加自定义 MCP 服务器）。
2. 粘贴来自隧道或部署的 HTTPS + `/mcp` URL（例如 `https://<subdomain>.ngrok.app/mcp`），为连接命名，并配置身份验证。
3. 阅读风险提示，选择 **I understand and want to continue**（我已了解并希望继续），然后选择 **Create as a plugin**（创建为插件）。
4. 安装生成的插件，打开一个新会话，在提示框中输入 `@` 并选择该插件。向模型下达指令（例如 "Add a new task to read my book"，为我的阅读添加一个新任务）。ChatGPT 会以流式方式展示工具载荷，方便你确认输入和输出。

## 后续步骤

接下来，你可以持续迭代 UI/UX、提示词（prompts）、工具元数据（tool metadata）以及整体体验。

每次修改 MCP 服务器（工具、元数据及相关配置）后，都需要刷新插件连接。你可以在 [chatgpt.com/plugins](https://chatgpt.com/plugins) 的详情页面完成这一操作。

在准备公开发布时，请查阅[提交插件](https://developers.openai.com/plugins/deploy/submission)、[插件指南](https://developers.openai.com/plugins/plugin-guidelines)以及[头脑风暴插件用例](https://developers.openai.com/plugins/plan/use-case)。如果你要构建 UI，还可以参考 [UI 指南](https://developers.openai.com/plugins/concepts/ui-guidelines)。

在掌握基础之后，你可以[构建更丰富的 UI](https://developers.openai.com/plugins/build/chatgpt-ui)、在需要时[对用户进行身份验证](https://developers.openai.com/plugins/build/auth)，以及[管理状态](https://developers.openai.com/plugins/build/chatgpt-ui#manage-state)。
