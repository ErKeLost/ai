# 已从 deck 移除的两页（备份，可随时加回）

> 用法：把下面的块按原样粘回 slides.md 的对应位置即可。

## 原第 7 页 · OpenAI 的 ChatGPT Apps：6 个真实示例

```markdown
---
layout: default
---
# OpenAI 的 ChatGPT Apps：6 个真实示例

<div class="gu-grid g3">
  <div class="gu-card is-accent">
    <h4>Pizzaz（披萨店）</h4>
    <p>官方主力示例：菜单、下单、购物车等一整套小部件，演示工具如何带 UI 一起返回。</p>
  </div>
  <div class="gu-card is-accent">
    <h4>Shopping Cart（购物车）</h4>
    <p>用 <span class="gu-mono">widgetSessionId</span> + <span class="gu-mono">widgetState</span> 让状态<strong>跨对话轮次</strong>保留：用户改了数量，下一轮还在。</p>
  </div>
  <div class="gu-card is-accent">
    <h4>Solar System（3D 太阳系）</h4>
    <p>直接在对话里渲染 3D 场景 —— 证明沙箱里能跑真正的富交互应用。</p>
  </div>
  <div class="gu-card is-accent">
    <h4>Cards Against AI</h4>
    <p>卡牌游戏：模型与界面<strong>实时同步</strong>，模型看不到的牌只在 UI 显示。</p>
  </div>
  <div class="gu-card is-accent">
    <h4>MCP App Basics</h4>
    <p>11 个渐进式交互示例，每个演示一个 SDK API，附带可展开的代码讲解 —— 最好的入门教材。</p>
  </div>
  <div class="gu-card is-accent">
    <h4>Authenticated Server</h4>
    <p>完整 OAuth 登录流程：在 ChatGPT 里就能完成第三方账号授权。</p>
  </div>
</div>

<div class="gu-small" style="margin-top:0.9rem">
源码在 <span class="gu-mono">github.com/openai/openai-apps-sdk-examples</span>，想自己跑的同学找我要步骤
</div>

<!--
这一页是想让大家放心：这不是实验室里的概念，已经产品化了。

我不逐个讲，一次讲六个等于一个都没讲。挑两个说透。

第一个是购物车那个示例。它解决的是最难的问题，状态跨对话轮次保留。用户改了数量，下一轮对话里数量还在。靠的是 widgetSessionId 加 widgetState 这套机制。为什么我最在意它？因为我们做表单、做配置页面，一定会遇到用户改了一半又聊了两句的情况，它是最接近我们需求的参考。

第二个是 MCP App Basics，里面有十一个渐进式示例，每个演示一个 API，还带可展开的代码讲解。想自己动手的同学，从这个开始最好。

剩下的我一句带过：Pizzaz 是官方主力示例，一整套披萨店的小部件；Solar System 在对话里直接渲染三维场景；Cards Against AI 是卡牌游戏，模型和界面实时同步；Authenticated Server 演示 OAuth 登录。

这几个示例我试着跑过两个，需要 ChatGPT 的开发者模式。会后想试的同学找我，我把步骤给你。
-->
```

## 原第 8 页 · 官方演示：同一个 App，多种宿主入口

```markdown
---
layout: default
---
# 官方演示：同一个 App，多种宿主入口

<div class="gu-grid g2">
  <div>
    <div class="gu-clip">
      <img src="/videos/sidebar-entrypoint.jpg" alt="sidebar entrypoint" />
      <video src="/videos/sidebar-entrypoint.mp4" poster="/videos/sidebar-entrypoint.jpg" autoplay loop muted playsinline></video>
    </div>
    <div class="gu-clip-cap">① <strong>侧边栏入口</strong>：从 ChatGPT 的插件目录直接全屏启动 App</div>
  </div>
  <div>
    <div class="gu-clip">
      <img src="/videos/file-viewer.jpg" alt="file viewer" />
      <video src="/videos/file-viewer.mp4" poster="/videos/file-viewer.jpg" autoplay loop muted playsinline></video>
    </div>
    <div class="gu-clip-cap">② <strong>文件查看器</strong>：用户打开 CAD 文件时，App 在线程侧栏里打开</div>
  </div>
  <div>
    <div class="gu-clip">
      <img src="/videos/image-picker.jpg" alt="image picker" />
      <video src="/videos/image-picker.mp4" poster="/videos/image-picker.jpg" autoplay loop muted playsinline></video>
    </div>
    <div class="gu-clip-cap">③ <strong>宿主原生组件</strong>：在 App 的表单里直接调用宿主的选图器</div>
  </div>
  <div>
    <div class="gu-clip">
      <img src="/videos/excalidraw.gif" alt="excalidraw in Claude" />
    </div>
    <div class="gu-clip-cap">④ <strong>换宿主也能跑</strong>：同一个 MCP App（Excalidraw）在 Claude 里直接画出可编辑画布</div>
  </div>
</div>

<div class="gu-quote" style="margin-top:0.8rem">
这说明 <strong>MCP Apps 的 UI 是"服务自带、宿主托管"</strong>：同一份界面，既能在 ChatGPT 的三种入口出现，也能搬到别的宿主里跑。
</div>

<!--
光说不够。我找了官方文档里的四段演示，直接放给你们看。

看这四段的时候，请你们注意一件事：不要看它好不好看，看它的入口在哪。

前三个是同一个 App，一个 CAD 插件。它能在三个不同的地方出现：从插件目录的侧边栏全屏启动；用户打开 CAD 文件的时候，在线程侧栏里打开；还有在它自己的表单里，直接调用宿主原生的选图器。

第三个这里有个细节值得单独点出来：那个选图器不是这个 App 自己画的，是宿主提供的原生组件。也就是说，能力由宿主提供，App 只负责组装。这一点对我们做设计系统很有参考价值，我们也可以考虑哪些能力由宿主给，哪些由组件自己实现。

第四段更有意思。这是 Excalidraw，一个画图应用，它作为 MCP App 跑在 Claude 里，直接在对话里画出了可编辑的画布。同一个应用，既能跑在 ChatGPT，也能跑在 Claude，说明这套东西不绑定单一平台。但反过来也意味着，界面长什么样要受宿主的限制。

看完这四段，大家应该有个感觉：这不是概念，是已经在跑的东西。而且它们的界面都是服务自带、宿主托管。
-->
```


## 原第 9 页 · OpenAI 踩坑后总结的三条

```markdown
---
layout: default
---
# OpenAI 踩坑后总结的三条

<div class="gu-grid g3">
  <div class="gu-card is-violet">
    <h4>① 「最好的应用出奇地小」</h4>
    <p>不要把现有产品整套搬进对话。用户不是来「逛你的应用」的，他是正在聊天时<strong>顺手用到你的一项能力</strong>。<br/>→ 只暴露少数几个高价值能力。</p>
  </div>
  <div class="gu-card is-violet">
    <h4>② 并非所有上下文都该共享</h4>
    <p>界面需要的数据往往远超模型所需（图片、价格档位、预选项），全发给模型只会烧 token、加延迟。<br/>有些信息<strong>设计上就必须不对称</strong>：推理游戏里模型知道答案，而界面绝不能泄露。</p>
  </div>
  <div class="gu-card is-violet">
    <h4>③ 「CSP 是新的 CORS」</h4>
    <p>因为小部件跑在沙箱域名（<span class="gu-mono">&lt;你的域名&gt;.web-sandbox.oaiusercontent.com</span>）下，网络白名单、能否回调工具（<span class="gu-mono">callTool</span>）都要在清单里显式声明。</p>
  </div>
</div>

<div class="gu-quote" style="margin-top:1.1rem">
三条都指向同一件事：<span class="gu-em">生成式 UI 的难点不在「画得出来」，而在边界划得清不清楚。</span>
</div>

<!--
这三条是 OpenAI 官方"十五条经验"里我挑出来的，都是他们上线之后回头总结的教训，含金量比一般博客高。我建议逐条过一遍。

第一条，最好的应用出奇地小。不要把现有产品整套搬进对话。用户不是来逛你的应用的，他正在聊天，只是顺手用到你的一项能力。这条直接决定我们第一批只放几个能力。我们现在后台功能几十个，如果照搬进去，结果一定是模型什么都想做、什么都做不好。

第二条，并非所有上下文都该共享。界面需要的数据往往远超模型所需，图片、价格档位、预选项，全发给模型只会烧钱、加延迟。而且有些信息，设计上就必须不对称。官方举的例子是推理游戏：模型必须知道凶手是谁才能扮演好角色，而界面和用户绝不能知道。这条我特别有感触，因为我们数据里有手机号、有金额，这些天然不该进模型上下文，只该进界面。这也是我们想做生成和执行分离的动机。

第三条，CSP 是新的 CORS。翻译成人话就是：界面跑在别人的沙箱里，能访问哪些域名、能不能回调工具，都要提前报备。这个在我们接入之前必须过一次安全评审。

三条其实指向同一件事：难点不在画得出来，而在边界划得清不清楚。
-->
```
