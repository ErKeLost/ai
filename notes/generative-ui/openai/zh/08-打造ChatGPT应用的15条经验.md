# 构建 ChatGPT Apps 的 15 条经验教训

> 完整的文档索引请参见 [llms.txt](/llms.txt)。在页面 URL 后追加 `.md` 即可获取相应文档页面的 Markdown 版本。

在 [Alpic](https://alpic.ai)，我们相信下一代产品和服务将围绕 **AI-first 体验**构建：一种用户与模型协作的界面，而不是在传统、预先设定的 UI 工作流中导航。

当 OpenAI 发布 **Apps SDK** 时，我们立即着手基于它进行开发。在三个月里，我们为内部使用以及 B2B 和 B2C 领域的客户（涵盖**旅游、零售和 SaaS** 等行业）开发了二十多个 ChatGPT Apps。

我们很早就发现：**构建 ChatGPT Apps 与构建传统 Web 或移动应用有着本质区别**。在 Web 上行之有效的模式（按需数据获取、由 UI 驱动的状态、显式的用户配置等），在 agentic 环境中往往会失效，甚至直接损害体验。

本文提炼了我们构建真实 ChatGPT Apps 过程中总结出的 **15 条最重要的经验教训**，随后介绍我们如何把这些经验融入面向社区的开源框架 [**Skybridge**](https://github.com/alpic-ai/skybridge)，以及一个 [**Codex Skill**](https://github.com/alpic-ai/skybridge/tree/main/skills/chatgpt-app-builder)，帮助开发者大幅加快构思、构建、测试和上线 Apps 的速度。

## 三体问题

对传统 Web 应用来说，事情很简单：系统中只有**用户**和 **UI** 两个主体。而在 ChatGPT 应用中，第三个主体加入了系统：**模型**。

为 ChatGPT 构建应用最困难的部分之一，就是管理信息在这三者之间如何流动。如果用户点击了 widget 中的“选择”按钮，UI 会在视觉上更新，但作为对话大脑的模型却对此一无所知，除非你显式地把这部分上下文暴露给它。当用户接着问 _“给我更多关于这个产品的细节”_ 时，模型根本不知道用户实际在看的是什么。

我们把这种情况称为 **context asymmetry（上下文不对称）**：每个主体只掌握系统的局部知识，没有任何一个能看清全貌。构建优秀的 ChatGPT Apps，关键不在于让所有东西保持同步，而在于决定_哪些_信息应该共享、_何时_共享，以及_谁_需要了解它。能否解决这个问题，正是“笨重的应用”与“流畅的 agentic 体验”之间的分水岭。

### 1. 并非所有上下文都应该共享

我们最初的直觉是“把所有信息共享到所有地方”。事实证明，这是我们最早犯下的错误之一。

在实践中，ChatGPT 应用的不同部分往往需要_有意不同_的同一状态视图。为什么？

- **为了性能：** widget 通常需要的数据量远超模型所需：比如在一个旅游预订应用中，可能是图片、价格档位、预加载的选项。把这些全部发给模型只会增加 token 消耗、延迟和认知噪音。
- **为了逻辑：** 某些信息在设计上就必须保持不对称。在我们最早的应用之一——_Murder in the Valleys_（山谷谋杀案）推理游戏中，模型必须知道凶手是谁才能正确扮演角色，而 UI 和用户绝不能知道。在 _Time's Up_ 类游戏中，情况正好反过来：UI 把秘密单词展示给用户，而模型必须保持不知情。

我们学到的教训不是“总是同步一切”，而是：**明确决定谁需要知道什么**。我们用不同的 _tool output_ 字段把这件事形式化：

| 字段              | 用途                                 | 可见范围                                                       |
| :---------------- | :----------------------------------- | :------------------------------------------------------------ |
| structuredContent | 供 widget 和模型使用的类型化数据     | widget 和模型均可（通过 toolOutput 和 callTool 函数）         |
| \_meta            | 响应元数据                           | 仅 widget 可见，对模型隐藏                                    |

例如，在 Time's Up 游戏中，我们只把秘密单词通过 \_meta 字段传给 widget，让模型根据用户的提示来猜这个词。

### 2. 懒加载并不适用于 AI 应用

由于出身 Web 开发，我们默认采用懒加载（lazy-loading）：用户点击时才获取数据、按需加载详情、把初始负载压到最小。

而在 ChatGPT 中，范式正好相反：工具调用意味着等待，由于安全沙箱和模型推理，往往要耗费数秒。

在实践中，我们学会了激进地前置加载：把尽可能多的数据放进首次工具响应中，并通过 _window.openai.toolOutput_ 来水合（hydrate）widget。这几乎总能带来更快、更灵敏的体验。

当然，如果 widget 能安全地从公共 API 端点获取数据，而且不需要和模型共享信息，那么在 widget 内部使用经典的 XHR 调用完全没问题；但大多数时候，你仍希望模型能够自主调用工具，以保持对话式的体验。

### 3. 模型需要可见性

一个微妙但关键的问题随之而来：当用户与 widget 交互（例如，在列表中选中某个具体产品）之后在聊天中提问，如果模型不知道用户指的是 UI 的哪个部分，它就无法正确回答。

为此我们使用了 `window.openai.setWidgetState(state)`，它允许你存储特定的状态数据，这些数据会在下一次用户与模型交互时被加入模型上下文。

随着应用复杂度的增长，我们发现为了追踪导航状态，不得不在很多地方调用 `setWidgetState`。于是我们决定引入一种声明式的方式来描述 UI 上下文：不再在每次交互时命令式地更新模型，而是直接在组件上附加 `data-llm` 属性：

```jsx
<div
  data-llm={
    selectedTab === "details"
      ? "User is viewing product details"
      : "User is viewing reviews"
  }
>
```

为了让这一切在幕后生效，我们构建了一个 Vite 插件，它会抓取这些属性并自动更新 widgetState。从模型的视角看，它只是在恰当的时机收到相关的 UI 上下文，而开发者无需手动同步每一次交互。

你可以在我们创建的、用于与社区分享经验的[开源框架](https://github.com/alpic-ai/skybridge)中找到这个 Vite 插件（以及本文分享的许多其他技巧）。

### 4. 不同的交互需要不同的 API

ChatGPT Apps 涉及 widget（小部件）、服务器与模型之间的多条交互路径。这些路径不可互换：每条路径的存在都是为了支持某种特定的交互。

构建 ChatGPT Apps 的一条关键经验，就是让这些通信路径清晰明确，并有意识地决定由哪种机制负责体验中的哪个部分。

这条路径大致如下所示：

![widget、服务器与模型之间不同交互的示意图](/images/blog/diagram-alpic.jpg)

这些经验奠定了 ChatGPT App 的基础：上下文如何共享、模型如何获得可见性，以及不同的交互如何在系统中传播。下一节将在此基础上，聚焦这些机制对 UI 设计的影响。

## 为 AI 重新发明 UI

ChatGPT Apps 是一个全新的环境，因此我们很快学会了放下对 UI 的固有观念，充分运用新的能力。本节介绍为了构建高效应用，我们需要学习（以及摒弃）的界面设计假设。

### 5. UI 必须适应多种显示模式及其约束

ChatGPT Apps 并不存在于单一的布局中。根据调用的方式和时机，同一个 widget 可能以三种不同的显示模式呈现。

应用可以**内联**显示在对话中，以**画中画**的形式悬浮在对话之上，或在需要更多空间时进入**全屏**模式。虽然 PiP 和全屏模式支持更丰富的界面，但它们也带来了 widget 无法控制的 UI 覆盖层。必须考虑设备特定的安全区域，例如移动端上始终存在的关闭按钮，以避免内容被裁剪并优化交互。

随着时间推移，我们总结出了关于显示模式及其适用时机的规律：

|                        | 呈现效果                                                             | 适用场景                                                                          |
| :--------------------- | :------------------------------------------------------------------- | :-------------------------------------------------------------------------------- |
| **Inline**             | 默认显示模式，widget 保留在对话历史中。                              | 适用于快速交互                                                                     |
| **Fullscreen**         | widget 占据整个屏幕，聊天栏位于底部。                                | 当你的 widget 较复杂且需要大量空间时（例如地图）                                   |
| **Picture-in-Picture** | 与内联模式大小相同，但 widget 会悬浮在对话之上                       | 当生成结果后用户继续追问时，你的 widget 仍然有用                                   |

### 6. 在嵌入式环境中，UI 一致性至关重要

早期我们遇到的一个不确定问题是：ChatGPT App 应该拥有多大的视觉自由度。作为面向用户的新界面，它需要给人熟悉、一致的感觉，无论是在我们自己的应用内部，还是在整个 ChatGPT 生态中。与独立产品不同，widget 存在于一个既有的界面之中，任何视觉上的不一致都会立刻显得突兀。

幸运的是，[OpenAI Apps SDK UI Kit](https://github.com/openai/apps-sdk-ui) 为我们提供了明确的基准。

它基于 Tailwind CSS 构建，提供了开箱即用的组件、图标和 design token（设计令牌），与 ChatGPT 的设计系统保持一致。借助它，我们得以快速推进，同时确保 widget 拥有原生质感，并在视觉上与周围界面保持一致，即使是在构建自定义组件时也是如此（例如我们的 Mapbox 集成）。

### 7. 语言优先的筛选

传统仪表盘建立在塞满复选框和区间滑块的侧边栏之上。在 agentic UI（智能体 UI）中，这往往是一种倒退。当用户能够直接用自然语言表达意图时——例如"欧洲 200 美元以内的阳光目的地"——强迫他们操作多个 UI 控件只会增加摩擦。他们应该能够直接说出来。

因此，我们决定在大部分应用中走"无筛选"路线。我们不再提供带筛选和排序选项的侧边栏，而是针对工具参数向模型提供一份 **List of Values (LOV，取值列表)**。

这样，模型可以直接以用户的消息作为输入，而不必去"猜测"有哪些可选项。换言之，它使模型能够把自然语言直接映射到我们后端的 API 要求上。当用户说 "sunny" 时，模型就知道要以 weather="sunny" 来调用工具。

### 8. 文件可以解锁更丰富的交互

在构建更复杂的应用过程中，我们得到的一条经验是：文件不应被视为次要输入。在 ChatGPT Apps 中，文件可以解锁全新的交互方式。体验不必从表单或筛选器开始，而可以从用户已有的东西出发。

例如，在一个电商应用中，用户可以在聊天中上传一张商品照片，让模型识别它，然后直接在 widget 中继续进行商品匹配或探索。

之所以能做到这一点，是因为我们让文件在系统的两侧都能流转。在模型侧，工具可以通过 `openai/fileParams` 直接使用聊天中上传的文件，让模型能够对图像或其他用户提供的素材进行推理。在 UI 侧，widget 也可以通过 `window.openai.uploadFile` 和 `window.openai.getFileDownloadUrl` 直接处理文件，从而把上传请求融入 UI 流程，或生成可供用户下载和复用的文件。

## 走向生产环境

接下来，当应用走出本地开发，安全、配置和工具链等方面就需要另一套考量。这正是第三组经验要讲的内容。

### 9. CSP 是新的 CORS

出于安全考虑，OpenAI 在双层嵌套的 iframe 中渲染应用。Content Security Policy（CSP，内容安全策略）是 iframe 隔离的原生机制，而这种部署方式会严格执行它们，问题常常表现为经典的"本地正常、上线就挂"综合征。

与传统 Web 开发中宽松的策略或许还能蒙混过关不同，Apps SDK 要求你做到精准无误。

在应用清单中，这意味着要仔细声明每种交互类型分别允许哪些域名：

| 字段                | 用途                                   | 示例                                                 | 常见错误                                                               |
| :------------------ | :------------------------------------- | :--------------------------------------------------- | :-------------------------------------------------------------------- |
| **connectDomains**  | API 与 XHR 请求                        | [https://api.weather.com](https://api.weather.com)   | 忘记区分预发布 API 与生产环境。                                        |
| **resourceDomains** | 图片、字体、脚本                       | [https://cdn.jsdelivr.net](https://cdn.jsdelivr.net) | 使用 delivr.net 这类通用 CDN 却未将其加入白名单                        |
| **frameDomains**    | 嵌入 iframe                            | [https://www.youtube.com](https://www.youtube.com)   | 嵌入 YouTube 视频或 Mapbox 实例却未将其加入白名单。                    |
| **redirectDomains** | 无警告打开的外部链接                   | [https://app.alpic.ai](https://app.alpic.ai)         | 忘记结账或 OAuth 回调域名。                                            |

尽早把 CSP 配置当作头等大事来对待，为我们在后期省去了大量生产环境调试工作。

### 10. 小小的 widget 标志位影响巨大

除了 CSP 之外，少量 widget 级别的设置决定了 widget、模型和宿主环境之间如何分配控制权。这些标志位很容易被忽视，但它们为导航、工具访问和发布划定了关键边界。

#### 宿主与导航边界

- **`widgetDomain`** 是提交时的必填项。它定义了全屏模式下“Open in \<App\>”按钮默认指向的位置，并参与 origin 白名单校验，因为 widget 渲染在 `<widgetDomain>.web-sandbox.oaiusercontent.com` 域名下。我们使用 `setOpenInAppUrl` 根据上下文将用户引导至合适的路径。

#### 模型与工具边界

- **工具注解（Tool annotations）** 必须遵循发布指南。`readOnly`、`destructiveHint` 和 `openWorldHint` 等标志位为必填项，并会在提交时进行校验。
- **工具可见性（Tool visibility）** 很重要：不应被模型调用的工具必须显式标记为私有（private）。

#### Widget 执行边界

- **`widgetAccessible`** 控制 widget 是否可以通过 `callTool` 自行调用工具。

这些设置单独看都很小，但组合在一起，它们决定了应用发布后能否正确运行。

## 为快速迭代而优化

Apps SDK 正在快速演进，我们也很高兴能伴随它一起构建。为了支持顺畅高效的开发工作流，我们决定开发自己的开源框架并与社区分享。以下是一些经验总结，希望能帮助大家避开我们在早期遇到的一些开发者体验问题。

### 11. 快速迭代离不开热重载（hot reload）

我们最先着手解决的问题之一就是迭代速度。长 TTL 的资源缓存与使用 JSON-RPC 转发资源这两种机制叠加，使得标准的模块热替换（hot module reload，例如 Vite 或 Next.js 中提供的那种）在开箱即用的情况下无法与 ChatGPT Apps 兼容。

在花了不少时间研究 Vite 的内部实现之后，我们构建了一个 Vite 插件，可以在 ChatGPT 内部直接实时重载 widget。该插件会拦截发往 MCP 服务器的资源请求，并将实时更新注入到 ChatGPT 的 iframe 中。在 IDE 里做出的修改能立即反映到 ChatGPT 内部，这大大缩短了我们的反馈回路。

### 12. 并非所有测试都适合放在 ChatGPT 中进行

在 ChatGPT 上测试是黄金标准，但对于最初的几轮迭代，本地模拟器（emulator）能帮你推进得更快，尤其是当你在编写工具定义、而它需要在 ChatGPT 中[刷新自定义 MCP 服务器连接](/plugins/deploy/connect-chatgpt#refresh-metadata)时。

为了加快早期迭代，我们构建了一个轻量级的本地模拟器，用于 mock ChatGPT 的宿主环境，并附带调试工具和应用专属的日志。这让我们能在毫秒级迭代 React 状态和布局，而把真实的 ChatGPT 测试留给模型交互和边缘用例的验证。

### 13. 移动端测试需要显式支持

移动端测试带来了另一个挑战：虽然要在 ChatGPT 中测试就必须将本地服务器通过隧道暴露出去，但 Vite 默认使用 localhost，导致同一 URL 无法从其他设备访问。

我们通过扩展 Vite 插件、使其支持在隧道端口上进行域名转发解决了这个问题，从而打通了 iOS 和 Android 设备上的测试，并把移动端验证纳入了日常工作流。

### 14. 熟悉的抽象（如 React hooks）能加速前端开发

Apps SDK 提供了强大的能力，但主要是通过底层 JavaScript API 暴露的。作为多年的 React 用户，我们希望贴近自己已经掌握的概念。

因此我们引入了一些对 React 友好的抽象——诸如 `useCallTool`、`useWidgetState` 和 `useLocale` 这样的 hooks，以及像基于 Zustand 构建的 `createStore` 这样面向复杂数据流的更高级状态管理。重新引入这些熟悉的前端模式减少了样板代码，让 widget 开发的体验更接近现代 Web 工作流。

## 把经验沉淀为 Codex Skill

### 15. 把经验转化为可复用的工具

随着这些模式在多个应用中反复出现，我们逐渐意识到，不断重复地重新发现它们正在拖慢我们的进度。为了让 ChatGPT App 开发更快、更可预测，我们决定把这些经验直接固化到工具中——不仅是为了我们自己，也是为了社区。

由此产生了两项相辅相成的工作：

1. **[Skybridge Framework](https://github.com/alpic-ai/skybridge)：** 一个开源 React 框架，把本文描述的许多模式打包成可复用的构建模块，包括我们的 hooks（`useCallTool`、`useToolInfo`）、开发工具（HMR 和本地模拟器），以及 data-llm 属性。
2. **chatgpt-apps-builder [Codex Skill](https://github.com/alpic-ai/skybridge/tree/main/skills/chatgpt-app-builder)：** 在框架之上，我们构建了一个专门的 Codex Skill，覆盖应用的完整生命周期：
   - **创意构思（Ideation）：** 头脑风暴如何让应用真正具备 agentic 能力，而不只是网页的简单移植。
   - **代码生成（Code generation）：** 同时编写 React 前端和 MCP 服务器后端，并预置所有恰当的 UX 与 UI 模式。
   - **本地测试（Local testing）：** 启动开发服务器，并将本地应用连接到 ChatGPT，通过热重载进行实时迭代。
   - **QA 与发布（QA and publishing）：** 按照 OpenAI 的提交指南执行结构化检查，包括 CSP 校验、safe-zone（安全区）考量以及生产环境测试。
   - **应用部署（Deployment）：** 协助完成应用上线及后续迭代所需的最后步骤。

要安装并使用该 Skill，只需运行以下命令：

```
npx skills add alpic-ai/skybridge
```



  <video
    class="w-full rounded-lg border border-default"
    controls
    playsinline
    preload="metadata"
    poster="/images/blog/alpic-skill.jpg"
  >
    <source
      src="https://cdn.openai.com/devhub/blog/alpic-skill.mp4"
      type="video/mp4"
    />
    Your browser does not support the video tag.
  </video>

## 结语

构建 ChatGPT Apps 需要重新思考上下文（context）如何流动、界面如何表现，以及用户与模型如何协作。本文中的许多经验教训，都源自熟悉的 Web 模式与智能体系统（agentic systems）的现实之间的落差。

通过分享这些经验，并将它们沉淀到我们的开源框架和 Codex skill 中，我们希望帮助团队少花些时间重复踩同样的坑，多花些时间探索这种全新交互模式所能实现的可能。最出色的 ChatGPT Apps 不会是对现有产品的简单移植，而是围绕这种全新的 AI-first 体验精心设计的体验。
