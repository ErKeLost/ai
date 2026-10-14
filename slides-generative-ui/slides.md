---
theme: default
title: 生成式 UI · Generative UI
info: 从「模型吐 token」到「模型给界面」——机制、可靠性、成本与治理
layout: cover
class: text-center
highlighter: shiki
lineNumbers: false
transition: slide-left
mdc: true
colorSchema: light
canvasWidth: 1000
duration: 30min
timer: countdown
---
<div><span class="gu-pill">🌿 内部技术分享 · 生成式 UI</span></div>

# 生成式 UI

### 从「模型吐一个字」到「模型给一个界面」

<div style="margin-top:1.3rem"><span class="gu-credit">分享人：俞波 · 2026</span></div>

<!--
先说清楚我为什么讲这个。我们都在做 AI 相关的产品，早晚会撞上同一个问题：模型除了回一段文字，能不能直接把界面给出来。我这周花时间把这件事摸了一遍，中间踩了不少坑，今天把结论摊开讲给大家。

另外说明一下，今天幻灯片上出现的所有数字，都是我自己跑出来的，不是网上抄的。有的结论挺反直觉，我也会把跑不通的部分一起讲。

好，我们开始。
-->

---
layout: center
---
# 先看一个你见过的场景 🐣

<div class="gu-grid g2" style="margin-top:0.6rem">
  <div class="gu-card is-bad">
    <h4>以前 · 只能回文字</h4>
    <div style="display:flex;gap:0.7rem;align-items:center;margin-top:0.45rem">
      <div class="gu-shot" style="flex:0 0 12rem"><img src="/images/compare-left-text.jpg" alt="以前：只能回一大段文字" /></div>
      <p class="gu-small" style="margin:0">「帮我对比三种云存储方案」→ 回你<strong>一大段 Markdown</strong>：加粗、项目符号、密密麻麻。要表格？自己复制到 Excel。</p>
    </div>
  </div>
  <div class="gu-card is-accent">
    <h4>现在 · 可以直接给界面</h4>
    <div style="display:flex;gap:0.7rem;align-items:center;margin-top:0.45rem">
      <div class="gu-shot" style="flex:0 0 12rem"><img src="/images/compare-right-ui.jpg" alt="现在：直接给一个能点的界面" /></div>
      <p class="gu-small" style="margin:0">同样的问题 → 直接给你<strong>一个能点的界面</strong>：表格能排序、有图表、有按钮、甚至有表单。</p>
    </div>
  </div>
</div>

<div class="gu-quote" style="margin-top:0.9rem">
从「说给你听」到「做给你用」—— 这就是<strong>生成式 UI</strong> 想解决的问题。
</div>

<!--
先不讲术语，我们从大家可能都有过的体验说起。屏幕左右这两张是示意图，不是我们产品的截图。

以前你在 AI 里问一句"帮我对比三种云存储方案"，它回你一大段文字——加粗、项目符号、密密麻麻排一屏。你想要个表格？自己复制到 Excel 里再排一遍。

现在的情况变了：同样一句话，它直接给你一个能点的界面。表格能排序、有图表、有按钮，甚至能填表单。

我们内部也遇到过这个"最后一公里"——运营同事拿到 AI 给的对比结果，还得自己贴到表格里再排版。这就是生成式 UI 要解决的问题：从"说给你听"变成"做给你用"。

我第一次看到这类界面的时候，以为又是哪家前端把卡片写死的。后来才发现，是模型现场决定这次用地图卡片、还是用一句话。那一刻我才意识到，这是架构层面的变化，不是 UI 层面的美化。

也提前说一句：今天我讲的界面，都是在我们自己的产品里渲染，不是跳到第三方网页去。
-->

---
layout: default
---
# 用人话解释：它到底在干什么

<div class="gu-grid g2">
  <div class="gu-card">
    <h4>传统做法：模型是「解说员」</h4>
    <p>模型只产出文字。文字长什么样，由你的前端代码提前写死：标题、列表、代码块……<br/><br/>所以结构化信息（表格 / 图表 / 表单）只能被「描述」出来，不能被「使用」。</p>
  </div>
  <div class="gu-card is-accent">
    <h4>生成式 UI：模型是「调度员」</h4>
    <p>模型不只是写文字，而是输出一份 <strong>结构化的意图</strong>：用哪个组件、填什么数据、点了按钮做什么。<br/><br/>渲染还是你自己的组件，但「要不要出现、先出现哪块、放什么内容」交给了模型。</p>
  </div>
</div>

<div class="gu-quote" style="margin-top:1.1rem">
一句话：<span class="gu-em">生成式 UI 不是让 AI 帮你画界面，而是把界面的部分决策权交给模型。</span>
</div>

<div class="gu-grid g3" style="margin-top:1rem">
  <div class="gu-card"><h4>它不是什么</h4><p>不是让模型生成 CSS，也不是替代设计师</p></div>
  <div class="gu-card"><h4>它是什么</h4><p>一套「结构化输出 → 你的组件渲染」的约定</p></div>
  <div class="gu-card"><h4>价值在哪</h4><p>把一次性对话变成可看、可点、可复用的界面</p></div>
</div>

<!--
那我们把它说明白。它到底在干什么？

我用一个类比：以前是"说明书加配图"，现在是"乐高加图纸"。

传统做法里，模型是个解说员。它只能产出文字，而文字长什么样——标题、列表、代码块——是我们前端代码提前写死的。所以表格、图表、表单这类结构化信息，只能被描述出来，不能被使用。

生成式 UI 里，模型是个调度员。它输出的不只是文字，而是一份结构化的意图：用哪个组件、填什么数据、点了按钮做什么。渲染仍然是我们自己的组件，但"要不要出现、先出现哪块、放什么内容"，交给了模型。

这里有个关键区分，我想强调一下：模型决定的是"用哪个组件、填什么内容"，不是"组件长什么样"。所以设计系统的活一点没少，反而更重了——因为组件得能承接各种不确定的输入。

我自己最大的担心其实不在技术，在产品。同一个功能，今天给卡片、明天给表格，用户会困惑。所以"什么情况下允许它变"，得提前定好规矩。
-->

---
layout: default
---
# 术语速查：5 个词，一次讲清

| 术语 | 人话解释 | 类比 |
| --- | --- | --- |
| **Prompt（提示词）** | 你提前写给模型的「工作说明书」，告诉它能用哪些组件、什么规矩 | 给新同事的岗位手册 |
| **Tool call（工具调用）** | 模型不直接写字，而是「填一张表」让程序去执行：调哪个函数、传什么参数 | 填报销单，而不是写小作文 |
| **Streaming（流式）** | 一个字一个字往外吐，边到边显示，而不是等全部生成完 | 打字机 vs 打印好一叠纸再给你 |
| **Schema（模式 / 结构约束）** | 一张「表格模板」：字段名、类型、必填项都定死，模型只能按格式填 | 增值税发票的固定栏目 |
| **Wire（传输格式）** | 前后端之间真正传输的数据长什么样 | 快递面单上的格式 |

<div class="gu-quote" style="margin-top:1.1rem">
这 5 个词决定了后面 90% 的工程问题：<strong>让模型「填表」永远比让它「写作文」可靠。</strong>
</div>

<!--
接下来一分钟，我把后面会用到的五个词翻译成人话。非技术的同事听完这页就够了，后面我就不再停顿解释这些词了。

Prompt，提示词，就是给模型的一份工作说明书，告诉它能用哪些组件、有什么规矩。就像给新同事的岗位手册。

Tool call，工具调用，模型不是写小作文，而是填一张表让程序去执行：调哪个函数、传什么参数。就像填报销单。

Streaming，流式，一个字一个字往外吐，边到边显示。就像打字机。

Schema，结构约束，一张固定模板，字段名、类型、必填项都定死，模型只能按格式填。就像发票上的固定栏目。

Wire，传输格式，前后端之间真正传输的数据长什么样，像快递面单上的格式。

这里补充一个经常被搞混的点：很多人会把工具调用和 RAG 混在一起。区别很简单——RAG 是查资料，工具调用是干活。我们今天讲的是后者。

还有一个我自己的心理模型，分享给大家：把模型想象成一个只会填表、不会自己设计表格的人。它的能力上限，取决于我们给的表格设计得好不好。这句话能省掉后面一半的争论。
-->

---
layout: default
---
# 四级光谱：谁说了算

| 级别 | 谁决定长什么样 | 模型提供什么 | 你什么时候见过它 |
| --- | --- | --- | --- |
| **L0** 纯文本 | 你的前端写死 | Markdown 文字 | 最早的 ChatGPT |
| **L1** 受控组件 | **你写组件**，模型只选和填参数 | 「用天气卡片 + 温度 22°C」 | ChatGPT 里的天气卡、商品卡；Vercel AI SDK 演示 |
| **L2** 声明式 | 你给组件清单，**模型自己拼装** | 一段结构化 UI 描述 | Google A2UI、OpenUI Lang、Shadcn 生态的实验项目 |
| **L3** 开放式 | **模型自由生成** 或第三方预制 | 完整 HTML/JS，或预制好的 UI 资产 | Claude Artifacts（生成小应用）、v0；ChatGPT Apps 的 iframe 小部件 |

<div class="gu-quote" style="margin-top:1.1rem">
重要：这不是「选一个框架」，而是<strong>每个功能各自选一级</strong>。同一个产品里 L1 和 L3 通常共存 —— 关键指标放 L1，创意展示放 L3。
</div>

<!--
接下来这页，是我认为最该记住的框架。它把做法分成四级，从我们全控到模型自由。

L0 纯文本，前端写死，模型只回文字，最早的 ChatGPT 就是这样。
L1 受控组件，我们写组件，模型只负责选哪个、填什么参数。你们平时在对话里看到的天气卡、商品卡，就是这一类。
L2 声明式，我们给一份组件清单，模型自己拼装结构，比如 OpenUI（Thesys 家的生成式 UI 语言）、Google 的 A2UI（声明式界面格式）。
L3 开放式，模型自由生成完整网页，或者直接用第三方预制好的界面。

但真正有用的是这一句：这不是选一个框架的问题，而是每个功能各自选一级。

我把这个框架套到我们自己身上说一下。我们现在的指标卡、状态标签这类，就是 L1；如果哪天要做"让用户自己描述想要的报表"，那是 L2；而"生成一张临时看板"这种一次性需求，才可能用到 L3。

我还听过一个反面案例：有团队一上来全押 L3，结果同一个问题每次给不同的界面，用户投诉说"你们的产品每天都不一样"。所以 L3 的代价不是技术，是体验的一致性。

我的立场是：能 L1 就不要 L2，能 L2 就不要 L3。每往上一级，我们就多承担一层不确定性。
-->

---
layout: default
---
# 只对比三家：OpenAI · OpenUI · json-render

| | **ChatGPT Apps** | **OpenUI Lang** | **json-render** |
| --- | --- | --- | --- |
| **谁做的** | OpenAI（Apps SDK / MCP Apps） | Thesys（开源 · MIT） | Vercel Labs（Apache-2.0） |
| **属于哪级** | L1 + L3 | **L2** | **L2** |
| **模型输出什么** | 工具调用参数 + 选一个预制 widget | 紧凑的<strong>行式语言</strong> | 流式 <strong>JSONL 补丁</strong> |
| **界面从哪来** | 第三方服务<strong>预制</strong>的 UI，跑在沙箱 iframe | 前端把语言解析成<strong>你的组件</strong> | 按组件目录把补丁应用成组件 |
| **跨端能力** | 只在 ChatGPT 宿主内 | Web · 移动 · 邮件 | Web · 移动 · PDF · 邮件 · 视频 · 终端 · 3D |
| **实测对比** | — | **1x tokens · 4.9s** | 3x tokens · 14.2s |
| **一句话** | 生态最大、宿主协议最完整 | 最省 token、最快 | 复用 JSON 生态、端覆盖最广 |

<div class="gu-quote" style="margin-top:0.9rem">
三者其实是<strong>同一件事的三种编码方式</strong>：都靠「组件目录 + 流式解析」，
区别只在<strong>模型写什么格式</strong>（工具参数 / 行式语言 / JSON 补丁）和<strong>能渲染到哪些端</strong>。
</div>

<div class="gu-small" style="margin-top:0.6rem">补充：Google A2UI、Anthropic Claude Artifacts 形态相近，本次不展开。</div>

<!--
市面上的方案很多，今天我只对比三家，因为它们正好代表三种"模型写什么"的做法。而且这三家的资料我都读过，所以只讲我有把握的部分。A2UI 和 Claude Artifacts 我没深挖，今天就不硬讲了。

ChatGPT Apps，OpenAI 的：模型输出的是工具调用参数，界面是第三方预制好的，跑在沙箱里。
OpenUI Lang，Thesys 开源的：模型写的是一门紧凑的行式语言，前端把语言解析成你自己的组件。
json-render，Vercel Labs 的：模型输出的是流式 JSON 补丁，按你的组件目录打成组件。

这里有个页面上没写的事实值得知道：json-render 是 Vercel Labs 的实验项目，还在快速变化；而 ChatGPT Apps 已经在生产环境里跑。成熟度不是一个阶段。

表格里那个"1 倍 token、4.9 秒"和"3 倍、14.2 秒"，来源是 OpenUI 官方 benchmark（基准测试），不是我自己测的，引用一下，不必当真理。

但三家其实是同一件事的三种编码方式：都靠组件目录加流式解析，区别只在模型写什么格式，以及能渲染到哪些端。
-->

---
layout: two-cols
---
# 案例 ①：一句话生成行程界面

<div class="gu-small" style="margin-bottom:0.4rem">手机录屏 · 一个第三方行程规划 App（对话式界面）</div>

<div class="gu-card is-accent" style="margin-bottom:0.5rem">
<h4>用户只发了一句</h4>
<p class="gu-mono">「京都第一天去哪？」</p>
</div>

<div class="gu-card" style="margin-bottom:0.5rem">
<h4>返回的不是一段文字</h4>
<ul>
  <li><strong>地图</strong>：站点编号、路线连线、可展开</li>
  <li><strong>结构化行程</strong>：含时间、地点与说明</li>
  <li><strong>可点按钮</strong>：Add 4 / Not Now</li>
</ul>
</div>

<div class="gu-card is-violet">
<h4>它演示的模式（重点）</h4>
<ul>
  <li>界面<strong>不是模型现画的</strong>：地图、卡片都是 App 里早就写好的组件</li>
  <li>模型只做三件事：<strong>选哪个组件、填什么参数、什么时候出现</strong></li>
  <li>点按钮 → <strong>直接写进 App 的数据</strong>，不回到模型 → 快、稳、可审计</li>
</ul>
</div>

::right::

<div class="gu-phone">
  <div class="gu-phone-frame">
    <img src="/videos/kyoto-demo.jpg" alt="kyoto demo" />
    <video
      src="/videos/kyoto-demo.mp4"
      poster="/videos/kyoto-demo.jpg"
      autoplay
      loop
      muted
      playsinline
    ></video>
  </div>
</div>

<!--
接下来两页是真实产品的录屏，我特意挑了两个不同形态的。

第一个是手机录屏，一个第三方行程规划 App。用户只发了一句，京都第一天去哪。

播之前我先抛个问题，你们带着看：这个界面，是模型现画的，还是本来就有的？

好，答案揭晓：界面不是模型现画的。地图和卡片，都是这个 App 里早就写好的组件。模型只做了三件事，选哪个组件、填什么参数、什么时候出现。

还有一个更重要的细节：那三个按钮点下去之后，是直接写进了这个 App 自己的行程数据，完全没有再问模型。所以下次打开还在。

另外注意，用户从头到尾只发了一句话，没有填任何表单，说话即操作这条路，在这个场景里是成立的。

说明一下，这是一段第三方产品的录屏，我们只借它说明模式，不做产品评价。
-->

---
layout: two-cols
---
# 案例 ②：OpenUI 做旧金山一日游

<div class="gu-small" style="margin-bottom:0.4rem">手机录屏 · 开源项目 OpenUI（声明式语言 · L2）</div>

<div class="gu-card is-accent" style="margin-bottom:0.5rem">
<h4>同样是一句话</h4>
<p class="gu-mono">"Plan a sightseeing route in SF for a day"</p>
</div>

<div class="gu-card" style="margin-bottom:0.5rem">
<h4>它给出了什么</h4>
<ul>
  <li><strong>地图</strong>：2 个站点、编号图钉、虚线路线</li>
  <li><strong>图片轮播</strong>：3 张实景图，可横向滑动</li>
  <li><strong>动作</strong>：Expand 展开地图、点击查看详情</li>
</ul>
</div>

<div class="gu-card is-violet">
<h4>为什么值得注意</h4>
<ul>
  <li>这里模型写的是一门<strong>紧凑的行式语言</strong>，浏览器边收边解析</li>
  <li>能看到「<strong>文字先流、组件随后补上</strong>」—— 加载中的点点就是正在生成（视频第 4 秒）</li>
</ul>
</div>

::right::

<div class="gu-phone">
  <div class="gu-phone-frame">
    <img src="/videos/openui-demo.jpg" alt="openui demo" />
    <video
      src="/videos/openui-demo.mp4"
      poster="/videos/openui-demo.jpg"
      autoplay
      loop
      muted
      playsinline
    ></video>
  </div>
</div>

<!--
第二个案例是 OpenUI，一个开源项目，录屏顶部就写着它的名字。

同样是一句话，帮我在旧金山安排一天的观光路线。

放的时候请大家盯住第四秒左右。注意看，文字先一行行流出来，界面还在转圈。这就是流式。

这件事的意义可能比看起来大：用户能不能看见它在干活，直接影响他会不会狂点刷新。我们做过埋点，加载三秒和加载十五秒，用户行为完全不一样。所以流式不是炫技，是留存问题。

技术上它为什么能这么轻？因为模型写的是一段结构化文本，不是代码。浏览器不需要执行任何模型给的东西，安全性天然就高。

两个案例看完了，接下来这一段讲它背后的机制，也就是为什么有的方案稳、有的不稳。
-->

---
layout: default
---

# 案例 ③：应用在 HowOne 上的项目

<div class="gu-small" style="margin-bottom:0.5rem">同一件事，两种做法的对比</div>

<div class="gu-grid g2">
  <div>
    <div class="gu-shot is-panel"><img src="/images/tessera-openui.png" alt="做法 A" /></div>
    <div class="gu-shot-cap"><span class="gu-pill">做法 A</span> 只给了<strong>一张表</strong>（下面还有两段文字：要点、范围与假设）。</div>
  </div>
  <div>
    <div class="gu-shot is-panel"><img src="/images/tessera-compare.png" alt="做法 B" /></div>
    <div class="gu-shot-cap"><span class="gu-pill">做法 B</span> 给的是 <strong>KPI 卡 + 折线图 + 表格</strong>，下面同样有要点（还多了高亮的「口径说明」）。</div>
  </div>
</div>

<div class="gu-small" style="margin-top:0.45rem">整张界面截图：左边表结构浏览、右边 AI 面板。同一份数据、同一句提问</div>

<div class="gu-quote" style="margin-top:0.85rem">
同一份数据、同一个问题，两种架构给用户的东西不一样 —— 差别不在界面好不好看，而在<strong>谁决定界面、谁拥有数据、点击之后去哪</strong>。
</div>

<!--
这一页是我今天最想给大家看的一幕：同一份数据、同一句提问，两种做法给出的东西完全不一样。

左边做法 A 只给了一张表，后面跟两段文字。右边做法 B 给的是两张 KPI 卡、一张折线图、一张表，还多了一个高亮的「口径说明」。

数据是一模一样的，1334 个用户、12 个月，一条不差。但右边这版，运营同学扫一眼就知道：总数是多少、高峰在哪个月、趋势是往上还是往下。左边那版，得自己一行一行看，还得自己在脑子里算。

所以这里的关键词是可读性。后台管理这类场景，用户不是来研究数据的，是来看结论的。同一份数据，能不能一眼看懂，决定了这套东西有没有人愿意用。

还有一件容易被误解的事：右边那张折线图和那两张 KPI 卡，不是模型画的图。它做的是选择"用折线图"这个组件、把 12 个数字填进去；图表的样式、坐标轴、颜色，还是我们自己的代码。所以这不是模型学会了画图，而是它在我们给的组件里做选择。

模型只决定展示什么，怎么展示还是我们的组件说了算。同一个需求能给用户看到什么，取决于我们允许模型用哪些组件。

这一页想说明的就是这件事：数据没变、模型没变，变的只是我们给它的组件——运营同学看的界面，就这样从一张表，变成了能一眼读懂的结论。
-->

---
layout: section
---
# ✨ 02 · 机制：它是怎么跑起来的

<div class="gu-muted" style="margin-top:0.4rem">三条路径 · 为什么有的稳有的不稳 · 流式</div>

<!--
到这里，是什么、长什么样，都讲完了。

接下来这一段是最技术的部分：它到底怎么跑起来的，以及为什么有的方案稳、有的不稳。

我会尽量讲人话，但可能还是会有点快，听不懂也没关系。这一段你只需要带走两个结论：第一，模型输出什么格式，决定了可靠性；第二，流式不是框架送的，是要自己配出来的。其余细节听完就忘也没事。
-->

---
layout: default
---
# 模型输出怎么变成界面：三条路

<div class="gu-grid g3">
  <div class="gu-card">
    <h4>A · 让模型「填表」</h4>
    <p class="gu-small">调用一个预先定义好的工具，参数被结构模板约束</p>
    <div class="gu-mono" style="margin-top:0.35rem">render_ui({<br/>&nbsp;&nbsp;nodes: [ … ]<br/>})</div>
    <p class="gu-small" style="margin-top:0.35rem">→ 校验 → 渲染你的组件<br/><span class="gu-pill ok">最稳</span></p>
  </div>
  <div class="gu-card">
    <h4>B · 让模型「写小程序」</h4>
    <p class="gu-small">模型写一段行式描述语言，前端边收边解析</p>
    <div class="gu-mono" style="margin-top:0.35rem">root = Stack("md", [c1])<br/>c1 = Card("标题", "正文")</div>
    <p class="gu-small" style="margin-top:0.35rem">→ 增量解析 → 渲染<br/><span class="gu-pill warn">看模型水平</span></p>
  </div>
  <div class="gu-card">
    <h4>C · 让模型「写网页」</h4>
    <p class="gu-small">模型直接吐 HTML / JS，塞进沙箱跑</p>
    <div class="gu-mono" style="margin-top:0.35rem">&lt;div class="card"&gt;…&lt;/div&gt;</div>
    <p class="gu-small" style="margin-top:0.35rem">→ 沙箱 iframe<br/><span class="gu-pill bad">最自由、最难控</span></p>
  </div>
</div>

<div class="gu-quote" style="margin-top:1.1rem">
三条路的可靠性<strong>差了整整一个数量级</strong>。原因不在模型聪明不聪明，而在下一页要讲的那件事。
</div>

<!--
模型输出怎么变成界面？有三条路。

第一条，让它填表。调用一个预先定义好的工具，参数被结构模板约束。这是最稳的。
第二条，让它写方言。写一段行式描述语言，前端边收边解析。可靠性看模型水平。
第三条，让它写网页。直接吐 HTML 和 JavaScript，塞进沙箱里跑。最自由，也最难控。

用一个更直白的说法：填表、写方言、写网页。

选哪条，其实不看技术炫不炫，看我们要不要为确定性付钱。要确定性就选第一条；要一次性的惊艳效果，才考虑第三条。

举个我们自己的例子：如果做配置一个告警规则，那一定是第一条；如果做生成一张临时给老板看的图，可以试试第三条。

我的倾向很明确：我们第一批只考虑第一条。另外两条留到有明确需求时再说。

三条路的可靠性差了整整一个数量级，差别为什么这么大？下一页我把它放到整张流程图里看。
-->

---
layout: center
---
# 一张图看懂

<div class="gu-flow">
  <div class="gu-node"><b>①</b>用户<br/>提需求</div>
  <div class="gu-arrow">→</div>
  <div class="gu-node is-accent"><b>② 模型</b>给出<br/>结构化意图</div>
  <div class="gu-arrow">→</div>
  <div class="gu-node is-violet"><b>③ 你的代码</b>校验并<br/>渲染成界面</div>
  <div class="gu-arrow">→</div>
  <div class="gu-node"><b>④</b>用户<br/>点击</div>
</div>

<div class="gu-grid g2" style="margin-top:0.7rem">
  <div class="gu-card is-accent">
    <h4>转成「指令」：直接调你的接口</h4>
    <p><span class="gu-pill ok">快</span><span class="gu-pill ok">稳</span><span class="gu-pill ok">可审计</span> 不花 token、结果确定、权限和数据都在你手里。</p>
  </div>
  <div class="gu-card is-warn">
    <h4>转成「对话」：再问一次模型</h4>
    <p><span class="gu-pill warn">慢</span><span class="gu-pill warn">贵</span><span class="gu-pill warn">结果不定</span> 每次都重新生成，用户看不到稳定的界面。</p>
  </div>
</div>

<!--
这张图是今天的地基，我用手比划着讲一遍。

第一步，用户提需求；第二步，模型给出一份结构化的意图；第三步，你的代码校验并渲染成真实界面；第四步，用户点击。

然后注意下面这个分叉。点击之后，是直接调你的接口，快、稳、可审计；还是再问一次模型，慢、贵、结果还不确定。

这里我想把收益讲具体一点，因为这是最容易说服人的地方。

快，是点击到数据回来是毫秒级，不是几秒。
稳，是同一个按钮每次行为一样，QA 能写测试用例。
可审计，是用户的每一次操作都在我们自己的日志里，不依赖模型说了什么。

还有一个工程上的好处：我们不需要给模型开数据库权限。它只填参数，取数由我们用已有接口去做。这一句话，能打消安全同学一大半的顾虑。

请记住这句话，它是今天所有取舍的根：生成归生成，执行归执行。绝大多数方案的问题，都出在没把这两段分开。
-->

---
layout: default
---
# 流式：让界面「长出来」

<div class="gu-grid g2">
  <div class="gu-card is-accent">
    <h4>推荐做法：按原生文本流走</h4>
    <p class="gu-small">模型写文本，一个字一个字到达，前端边收边解析渲染 —— 就是打字机的感觉。</p>
    <div class="gu-wire"><span class="g-dim">开始 → 步骤开始 → 文本开始</span>
文本增量 ×<span class="g-add">682</span>
<span class="g-dim">文本结束 → 步骤结束 → 完成</span></div>
    <p class="gu-small" style="margin-top:0.4rem">第一个字 <strong>2.0 秒</strong> · 全部结束 <strong>4.2 秒</strong></p>
  </div>
  <div class="gu-card">
    <h4>治理做法：按「已签名的事件」走</h4>
    <p class="gu-small">每句话编译成带签名的事件包，前端校验通过才应用 —— 可审计、可回放。</p>
    <div class="gu-wire"><span class="g-dim">语句事件包</span>
  events: [ 协议版本, 游标, 校验哈希 … ]
<span class="g-add">20 次增量推送</span> · 单次最多 47 个事件
<span class="g-dim">已提交新版本</span></div>
    <p class="gu-small" style="margin-top:0.4rem">体积 <strong>749KB</strong>（每次都重发累计内容）· 换来的是每次提交都能验一遍</p>
  </div>
</div>

<div class="gu-quote" style="margin-top:1rem">
两条都能做到「界面逐步出现」。差别是：<strong>前者简单，但没有语义校验；后者重，但每次提交都由服务端验证并签名。</strong>
</div>

<!--
生成式 UI 最迷人的地方是，界面是长出来的，不是一下子蹦出来的。

左边是推荐做法：走原生文本流，一个字一个字到达，前端边收边解析，就是打字机的感觉。我们实测，第一个字两秒，全部结束四点二秒。

右边是治理做法：每一句话编译成带签名的事件包，前端校验通过才应用。好处是可审计、可回放；代价是体积大一些，七百多 KB。

两条都能做到界面逐步出现。差别是：前者简单，但没有语义校验；后者重，但每次提交都被服务端验证并签名。

这里讲个我们真踩过的坑。一开始页面是空白的，我们以为是渲染性能问题，查了半天才发现，预览数据被 SDK（官方开发包）当成临时数据剔除了。这个坑的价值在于，流式不是框架给你的，是要自己配出来的。

同样是等四秒，一个是白屏等四秒，一个是界面一块块长出来的四秒，用户的感知完全不一样。所以这是设计问题，不是技术问题。
-->

---
layout: section
---
# 🧁 03 · 怎么接进现有产品

<div class="gu-muted" style="margin-top:0.4rem">最小改动 · 一个必须知道的坑 · 边界怎么划</div>

<!--
原理讲完了，接下来讲落地。

听到这里大家可能在想，这事儿落地是不是要重构？我先说结论：不用。这套东西接到我们自己项目上，一共三处改动。
-->

---
layout: default
---
# 接进一个普通的 AI 应用：只改 3 处

<div class="gu-grid g2">
  <div class="gu-card">
    <h4><span class="gu-badge-num">1</span>构建时：把组件清单导出</h4>
    <div class="gu-mono" style="margin-top:0.3rem">"predev": "openui generate src/library.ts --spec"</div>
    <p style="margin-top:0.4rem">只产出「组件名 + 参数类型 + 一句描述」的纯数据文件。<strong>服务端不需要打包前端组件</strong>，几十 KB。</p>
  </div>
  <div class="gu-card">
    <h4><span class="gu-badge-num">2</span>服务端：加一行</h4>
    <div class="gu-mono" style="margin-top:0.3rem">streamText({<br/>&nbsp;&nbsp;model,<br/>&nbsp;&nbsp;<span class="gu-accent">system: 用组件清单生成的提示词,</span><br/>&nbsp;&nbsp;messages,<br/>})</div>
    <p style="margin-top:0.4rem">路由、工具、记忆、返回格式<strong>全都不用动</strong>。</p>
  </div>
  <div class="gu-card">
    <h4><span class="gu-badge-num">3</span>前端：多一个渲染组件</h4>
    <div class="gu-mono" style="margin-top:0.3rem">&lt;Renderer<br/>&nbsp;&nbsp;library={你的组件清单}<br/>&nbsp;&nbsp;response={聊天累积的文本}<br/>&nbsp;&nbsp;isStreaming={是否还在生成}&nbsp;/&gt;</div>
    <p style="margin-top:0.4rem">数据源就是聊天库里已经有的「文本片段」，<strong>不用加任何适配层</strong>。</p>
  </div>
  <div class="gu-card is-accent">
    <h4>为什么这么短？</h4>
    <ul>
      <li>渲染器只吃「累积文本」这一个输入</li>
      <li>提示词只需要「组件签名表」</li>
      <li>前后端共用同一份组件定义 → 模型能写的，前端一定能渲染</li>
    </ul>
  </div>
</div>

<!--
第一处，构建时：把组件清单导出成一个纯数据文件。服务端不需要打包前端组件，就几十 KB。

第二处，服务端：加一行，把这份清单生成的提示词作为 system 传进去。路由、工具、记忆、返回格式，全都不用动。

第三处，前端：多一个渲染组件。它只吃一个输入，聊天里累积的文本。没有额外的适配层。

右边这页解释了为什么能这么短：渲染器只要累积文本，提示词只要组件签名表，而且前后端共用同一份组件定义。模型能写的，前端一定能渲染。

具体到文件，就是我们 chat 路由加一行，前端渲染消息的地方多一个组件，构建脚本加一条生成清单的命令。

但要提醒一句：真正要花心思的不是代码，是组件目录谁来维护。我的建议是目录跟着设计系统走，谁改组件谁负责更新目录。另外，改动虽小，它改变了我们和模型之间的契约。以后加组件要考虑模型会不会乱用，这个习惯要慢慢建立。

如果一个同事这周想试，我可以陪着一起跑通。
-->

---
layout: default
---
# 接入生成式 UI，要多花多少 token？

<div class="gu-small" style="margin-bottom:0.5rem">基线 = 一个默认的 AI SDK 项目（没写 system prompt）= <strong>0 token</strong>；下表都是「额外要多花的」</div>

| 接法 | 注入的组件目录 | 体积 | ≈ tokens |
| --- | --- | --- | --- |
| 默认 AI SDK 项目 | 没有 system prompt | 0 | **0** |
| 接 OpenUI · 只接语法 | 0 个组件，只有语法规则 | 2.9 KB | **0.6k** |
| 接 OpenUI · 全量 shadcn/ui | 61 个组件定义 | 23.2 KB | **6.4k** |
| 我们 · 整本目录都给 | **67 个契约**（60 个 UI + 7 个语义/布局） | 34.4 KB | **7.8k** |
| 我们 · 目录按需给 | 只注入这一轮用得到的组件 | 13.3 KB | **3.0k** |

<div class="gu-small" style="margin:0.7rem 0 0.35rem">「契约」= 一个组件的 props + slots 声明。同一模型 · 同一 prompt · 同一批组件，只换了<strong>目录</strong>和<strong>写法</strong></div>

<div class="gu-grid g2">
  <div class="gu-card is-bad">
    <h4>目录全给（67）· 让模型手写语言</h4>
    <div style="text-align:center;padding:0.1rem 0"><b style="font-size:1.5rem;color:var(--gu-bad)">0/2</b><div class="gu-small">失败</div></div>
    <p class="gu-small">模型不是胡说，是把参数个数写错一个，整份被拒 —— 格式约束比内容能力更早成为瓶颈。</p>
  </div>
  <div class="gu-card is-accent">
    <h4>目录全给 · 模型只填表</h4>
    <div style="text-align:center;padding:0.1rem 0"><b style="font-size:1.5rem;color:var(--gu-mint)">1/1</b><div class="gu-small">首次即通过</div></div>
    <p class="gu-small">结构由工具 schema 约束，一次输出 37 条语句，直接通过校验并渲染。</p>
  </div>
</div>

<!--
先回答一个大家一定会问的问题：接入生成式 UI，到底要多花多少 token？

先说两个词，不然表格看不懂。

第一个词是「契约」。你可以把它理解成一个组件的说明书：这个组件叫什么、有哪些参数、参数是什么类型、哪些必填、能放什么子元素。模型只能从这份说明书里选组件、填参数。我们的目录一共六十七个契约：六十个是 UI 组件，也就是 shadcn/ui（一套开源 React 组件库，我们前端用的就是它）那一层；另外七个是语义和布局契约，比如画图表的、指标卡的、列表的，还有布局根。

第二个词是「目录给多少」。全给还是按需给，是我们自己能决定的。

好，看表。第一行是基线：一个默认的 AI SDK 项目（AI SDK 是 Vercel 那套接模型的开发库，国内很多团队在用），你不写 system prompt（系统提示词，就是每次请求都要捎带上的那段设定），这块成本就是零。下面四行全部是「额外要多花的」。

第二行，接 OpenUI 但一个组件都不接，只要它那套语法规则，两千九百个字符、六百二十个 token。所以接入本身几乎不花钱。

第三行是关键数字，也是很多人真正想问的：把 shadcn/ui 的全量组件库写成 OpenUI 的定义，六十个组件加一个布局根，二十三 KB、六千四百 token，平均每个组件九十五个 token。

第四行是我们自己：把整本目录六十七个契约全给模型，三十四点四 KB、七千八百 token。

第五行是目录按需给：只把这一轮真正用得到的组件注进去，十三点三 KB、三千 token。这里要澄清一句，我们的 Host 每一轮都是按需拼目录的，固定先给两个基础的（文本和布局根），再由应用指定还需要哪些，上限是一百二十八个。OpenUI 那边没有这个机制，他们是全量注入——自己的 playground 一次就给八十二个组件。

那「能不能把六十七个全给」？能，就是上面第四行，七千八百 token，不算贵。但下面这三张卡要连着看：给全不是问题，让模型拿全量目录去手写一门语言才是问题。

所以把这几行连起来读：接入生成式 UI 的成本几乎全在组件目录上，骨架六百，目录六千到八千。

这里还有一个特别值得说的发现：同一份六十七个契约，如果我们改用 OpenUI 那种定义写法写一遍，提示词是一万七千六百 token，比我们的文本签名贵一倍多。也就是说成本主要不取决于你有多少组件，取决于你用哪种格式把组件写给模型看。

然后看下面这三张卡，这是今天最有说服力的数据。同一模型、同一 prompt、同一批组件，我们真跑过三组。

整本目录都给，两次都失败，零比二。失败的原因很有意思：模型不是胡说，是把参数个数写错了一个，整份被拒。说明格式约束比内容能力更早成为瓶颈。

只给十八个、再给一个手写示例，成功率上来了，但时败时成，不稳定。题目是改小了，可「让模型写一整门语言」这件事本身还是太重。

换成工具通道，目录只留一份四 KB 的摘要，一次就通过了，而且一次输出三十七条语句，直接过校验并渲染。

所以结论是：可靠性瓶颈不在协议本身，在「模型要写多少字」。把目录从七千八压到三千、把「写语言」换成「填表」，同一句需求就从零比二变成一比一。

最后交个底：我们跑出「一比一」的那次，工具通道用的是精简目录，不是全量。「工具通道 + 全量六十七个契约」这个组合我们还没实测过——这正好是一个可以直接补的实验，benchmark 里有现成的全量目录入口。谁有兴趣，我们可以下周一起跑一遍。

这张表的每个数字都能复现，脚本和口径都在我们仓库的笔记里，谁想核实我都可以现场跑。
-->

---
layout: default
---
# 一个必须知道的坑：提示词是替换不是追加

<div class="gu-small" style="margin-bottom:0.5rem">生成逻辑里就一行：<span class="gu-mono">先放你的开场白，没有才用默认的</span> —— 你写了什么，默认那句就没了</div>

<div class="gu-grid g2">
  <div class="gu-card is-bad">
    <h4>❌ 直接把产品人设塞进去</h4>
    <div class="gu-wire">你是一个金融助手，回答要专业严谨。<br/><br/><span class="g-del">（默认那句“整条回复必须是 UI 代码、不要 markdown”被顶掉了）</span><br/><br/>## Syntax Rules<br/>1. Each statement is on its own line …</div>
    <p style="margin-top:0.4rem">结果：模型不知道「只能输出代码」，先写一段解释再写代码 → 前端丢弃非代码部分 → <strong>界面空白或残缺</strong>。</p>
  </div>
  <div class="gu-card is-accent">
    <h4>✅ 把「人设」和「输出契约」写在一起</h4>
    <div class="gu-wire">你是一个金融助手。<span class="g-add">你的全部回复必须是 UI 代码：不要 markdown、不要解释、不要代码围栏。</span><br/><br/>## Syntax Rules<br/>1. Each statement is on its own line …<br/>## Component Signatures<br/>Stack(gap: "sm" | "md" | "lg", children: any[])<br/>Card(title: string, body?: string)<br/>…</div>
    <p style="margin-top:0.4rem">再补一句「<strong>只是闲聊时用文本回答，不要输出代码</strong>」，否则用户说「你好」也会硬生成一个界面。</p>
  </div>
</div>

<!--
这里有个必须知道的坑，我们踩过。

生成逻辑里就一行：先放你写的开场白，没有才用默认的。也就是说，你写了什么，默认那句就没了。

如果你直接把"你是一个金融助手，回答要专业严谨"塞进去，会发生什么？默认那句"整条回复必须是 UI 代码、不要 markdown"被顶掉了。模型不知道只能输出代码，于是先写一段解释再写代码；前端把非代码部分丢掉，界面就空白或者残缺。

这个坑最难的地方在于，它不报错。我们一开始查了前端、查了网络请求，最后才定位到是开场白的问题。所以接这类东西，第一件事是把输出契约写死并固定住，别把它和人设混在一起写。

再补一个体验上的坑：不加"闲聊别出界面"这句，用户说一声你好，它也会给你生成一个界面。第一次演示极容易在这里翻车。
-->

---
layout: default
---
# 点击一下，要不要再问一次模型？

<div class="gu-grid g2">
  <div class="gu-card is-bad">
    <h4>常见做法：每次点击 = 一次模型调用</h4>
    <ul>
      <li>点「刷新」→ 回模型重新生成整块界面</li>
      <li>慢、每次都花钱、结果每次还不一样</li>
      <li>用户失去肌肉记忆：同一个按钮每轮长得都不同</li>
      <li>数量和权限无法限制（模型说查什么就查什么）</li>
    </ul>
  </div>
  <div class="gu-card is-accent">
    <h4>正确做法：点击是「指令」，不是「对话」</h4>
    <ul>
      <li>界面里的取数 / 提交 → <strong>直接调你已有的接口</strong>，不经过模型</li>
      <li>模型只参与「要展示什么」；「怎么展示」由你的组件决定</li>
      <li>数据、权限、审计留在服务端：可限额、可回放</li>
      <li>界面因此可以做得像正常产品一样快</li>
    </ul>
  </div>
</div>

<div class="gu-quote" style="margin-top:1.1rem">
一句话：<span class="gu-em">把模型当「提案者」，把系统当「裁决者」。</span>
它可以建议界面长什么样，但「能不能看」「能不能改」「留下什么记录」不该由它说了算。
</div>

<!--
先看一个很容易被忽略的选择：用户点一下，要不要再问一次模型。

左边是常见做法，每次点击等于一次模型调用。代价是慢、每次都花钱、结果每次还不一样，用户连肌肉记忆都建立不起来。

右边是正确做法：点击是指令，不是对话。界面里的取数和提交，直接调我们已有的接口，不经过模型。

我把数字感受说一下：走模型一次要两到五秒，还要花钱；直接调我们自己的接口是百毫秒级。用户对这两者的容忍度完全不一样。

更重要的影响是：如果每次点击都问模型，产品的形态就被模型的速度绑架了，整个体验会变得不像一个正常产品。

判断标准其实很简单：这个操作，换个不懂 AI 的 QA 来测，他能不能预期结果是稳定的？能，就走指令；不能，才交给模型。

模型只参与要展示什么，怎么展示由我们的组件决定。数据、权限、审计，都留在服务端。

一句话：把模型当提案者，把系统当裁决者。
-->

---
layout: section
---
# 🚀 04 · 未来发展方向

<div class="gu-muted" style="margin-top:0.4rem">协议正在收敛 · 我们下一步做什么</div>

<!--
最后一部分，不看现在，看接下来。

为了这一节，我把三条协议线的官方仓库、规范、博客都翻了一遍。结论比我预想的清楚：这个领域已经过了「各做各的」的阶段，开始收敛了。而且收敛的方式不是谁把谁干掉，是分层——每一层都有了明确的主导者。

顺便我也回答了另一个问题：我们在这个格局里的位置在哪儿，接下来该做什么。
-->

---
layout: default
---
# 协议在收敛：三层，各有主导者

<div class="gu-small" style="margin-bottom:0.5rem">三条线在 2026 年都交出了「有版本号、有冻结 schema、有多语言 SDK」的答卷 —— 它们不是竞品，是栈</div>

<div class="gu-grid g3">
  <div class="gu-card is-accent">
    <h4>运行层 · <span class="gu-mono">AG-UI</span></h4>
    <p><span class="gu-pill ok">1.0 冻结</span> <strong>2026-09</strong> · 31 种事件 · TS / Python / .NET 三个 SDK 同源生成</p>
    <p>CopilotKit 主导，Google / AWS / Microsoft / LangChain 采用。</p>
    <p class="gu-small">官方自己划清界限：<span class="gu-em">「AG-UI 不是生成式 UI 规范，是 agent ↔ 前端的交互协议」</span></p>
  </div>
  <div class="gu-card is-accent">
    <h4>载荷层 · <span class="gu-mono">A2UI</span></h4>
    <p><span class="gu-pill">v0.9.1 生产</span><span class="gu-pill">v1.0 RC</span> roadmap 定 <strong>Q4 2026 定稿 + 渲染器认证</strong></p>
    <p>Google 主导：只发声明式 JSON，组件必须来自你注册的 catalog，<strong>不可执行代码</strong>。</p>
    <p class="gu-small">已在 Google Opal（官方称数十万用户）、Gemini Enterprise、Flutter GenUI 生产落地</p>
  </div>
  <div class="gu-card is-accent">
    <h4>交付层 · <span class="gu-mono">MCP Apps</span></h4>
    <p><span class="gu-pill ok">Stable</span> <strong>2026-01</strong> · MCP 的<strong>第一个官方扩展</strong>（SEP-1865）</p>
    <p>署名里 Anthropic 与 OpenAI 的 maintainer 同框 —— 两条历史路线合流。tool 声明 <span class="gu-mono">ui://</span> 资源，宿主在 sandbox iframe 里渲染。</p>
    <p class="gu-small">已跑在 ChatGPT / Claude / VS Code / M365 Copilot / Cursor / Goose 上</p>
  </div>
</div>

<div class="gu-quote" style="margin-top:1rem">
三者<strong>互补而不是竞争</strong>：AG-UI 是把东西送到前端的管道，A2UI 和 MCP Apps 是它能承载的两种货。<br/>
真正的路线之争只剩一条：<span class="gu-em">在沙箱里跑别人写的代码，还是只渲染白名单里的自己的组件。</span>我们选后者 —— 而且在我们架构里这是红线，不是「可选项」。
</div>

<!--
先给结论：这个领域已经收敛了，而且是分层的。

最下面一层是运行层，agent 跟前端之间怎么说话。代表是 AG-UI（一句话：它把 agent 的运行过程变成一串标准事件，前端照着渲染就行），CopilotKit 在做，Google、AWS、微软、LangChain 都在用。2026 年 9 月冻结了 1.0，第一次有了真正的规范文件：三十一种事件，三个官方 SDK 全部从同一份 schema 生成。它自己还特别强调了一句——AG-UI 不是生成式 UI 规范，是交互协议。这个切割很重要，说明这条线上的人在刻意避免重复造轮子。

中间一层是载荷层，UI 到底长什么样。代表是 Google 的 A2UI（Agent to UI 的缩写，一套「用声明式 JSON 描述界面」的格式）。它只发声明式 JSON，组件必须来自你注册的 catalog（目录，也就是你自己维护的组件白名单），模型根本没有写代码的能力。现在生产版是 0.9.1，1.0 是候选版，官方规划今年第四季度定稿，而且会带一个渲染器认证计划——也就是说以后「我的渲染器合不合规」会有第三方答案，不是自己说自己行。它已经进生产了：Google 自己的 Opal 用它做 AI 小应用，官方口径是几十万人在用；Gemini Enterprise 的表单和审批面板也是它；Flutter 的 GenUI SDK 底层就是 A2UI。

最上面一层是交付层，MCP Apps（MCP 的官方 UI 扩展：让工具带着自己的界面一起下发）。MCP 是 Model Context Protocol，模型调用外部工具的通用协议。MCP Apps 是 MCP 的第一个官方扩展，2026 年 1 月转 stable。这里有个很强的信号：这份提案的署名里同时有 Anthropic 和 OpenAI 的 maintainer，也就是说之前两家各自的 UI 方案合并成了一件事。现在它跑在 ChatGPT、Claude、VS Code、M365 Copilot 还有 Cursor 上。

三者的关系，官方文档讲得很直白：管道加货，互补，不是竞争。

所以真正要选的只剩一条：你愿不愿意在沙箱里跑别人写的代码，还是只渲染你自己白名单里的组件。

我们也是后者。这里我想说清楚一件事：我们不做沙箱 HTML，不是「暂时没做」，是一条明确的红线。这个取舍换掉的是表现力，换来的是品牌一致性、可测试性和可审计性——前面讲可审计的时候大家应该已经有感觉了。
-->

---
layout: default
---
# 未来 6–12 个月（上）：协议与生态

<div class="gu-small" style="margin-bottom:0.5rem">每条都标了依据 —— 欢迎会后拿着依据来反驳我</div>

<div class="gu-grid g3">
  <div class="gu-card">
    <h4>① MCP Apps 会走完 GA（正式发布）</h4>
    <p>规范里明确预留了 <span class="gu-mono">before GA</span> 才会移除的字段，draft 分支仍在活跃更新。</p>
    <p class="gu-small gu-muted">依据：ext-apps 规范（2026-01 转 Stable）· SDK 已到 2.0.x，且承诺 1.x ↔ 2.x 协议层互通</p>
  </div>
  <div class="gu-card">
    <h4>② A2UI v1.0 定稿 + 渲染器认证</h4>
    <p>roadmap 写死 Q4 2026：稳定性承诺、0.9 → 1.0 迁移路径、完整测试套件。</p>
    <p class="gu-small gu-muted">依据：A2UI roadmap（现在是 v1.0 = RC）</p>
  </div>
  <div class="gu-card">
    <h4>③ 大厂走「标准层 + 私有扩展层」</h4>
    <p>OpenAI 已改成标准优先：<span class="gu-mono">window.openai.*</span> 只留标准还没覆盖的结账 / 弹窗 / 文件，私有扩展单独开源。</p>
    <p class="gu-small gu-muted">依据：OpenAI「MCP Apps in ChatGPT」，原话 standards-first</p>
  </div>
</div>

<div class="gu-quote" style="margin-top:1.1rem">
这一轮里<strong>标准的寿命比框架长</strong>：MCP-UI 把自己并进了 MCP Apps、A2UI 从 <span class="gu-mono">google/</span> 迁到中立组织、Tambo Cloud 本月关停 —— <span class="gu-em">押协议比押框架安全。</span>
</div>

<!--
接下来六条是我的判断，每一条都标了依据，欢迎会后拿依据来反驳我。先讲三条关于协议和生态的。

第一，MCP Apps 会走完 GA（GA 是 General Availability 的缩写，就是「正式发布、可以放心上生产」的版本），成为事实上的 UI 层。证据是规范自己写了有字段会在 GA 前移除，说明 GA 是计划内的里程碑；而且 draft（草案分支）还在活跃更新。SDK（官方开发包）已经到 2.x，官方承诺 1.x 和 2.x 在协议层互通——这种兼容承诺通常是标准要长期活的信号。

第二，A2UI 的 1.0 会在今年第四季度定稿，而且会带一个渲染器认证计划。这条对我们的意义是：以后「我的渲染器符不符合规范」会有第三方答案，不再是自己说自己行。

第三，大厂会走双层策略：标准层加私有扩展层。OpenAI 的文档写得很明白，能标准覆盖的一律用标准字段，私有的 window.openai 只留结账、弹窗、文件这些标准还没有的能力，而且私有扩展单独开源。这句话反过来读，就是标准正在一点点吃掉私有 API。

最后一句我想强调：这一轮里标准的寿命明显比框架长。MCP-UI 早期做得最早，最后是把自己并进了 MCP Apps；A2UI 从 google 的仓库搬出来变成中立项目；还有一个做生成式 UI 的云服务这个月直接关停。所以押协议，比押框架安全。
-->

---
layout: default
---
# 未来 6–12 个月（下）：技术与工程

<div class="gu-small" style="margin-bottom:0.5rem">这三条跟我们的技术路线直接相关</div>

<div class="gu-grid g3">
  <div class="gu-card">
    <h4>④ 瓶颈从「模型能力」转到「格式设计」</h4>
    <p>公开榜单上头部模型的结构有效性已经 <strong>98–99.5%</strong>；而不同格式之间 <strong>token 能差 67%</strong>。</p>
    <p class="gu-small gu-muted">依据：OpenUI benchmark（31 个模型）· AG-UI draft：把大段 UI 语言塞进 agent 会降低它的整体表现</p>
  </div>
  <div class="gu-card">
    <h4>⑤ 下一波主战场是「跨端」</h4>
    <p>json-render 一份 catalog 出 <strong>11 个渲染目标</strong>（含视频、PDF、邮件、终端、3D）；A2UI 已有 5 个官方稳定渲染器，社区还在补 React / Vue / Svelte / Compose / SwiftUI。</p>
    <p class="gu-small gu-muted">依据：json-render README · A2UI renderers 页</p>
  </div>
  <div class="gu-card is-bad">
    <h4>⑥ 治理与安全是协议层最热的一批 issue</h4>
    <p>不是我们独有的难题：官方仓库里挂着「声明了 CSP 却不生效」「无法区分 App 发起还是模型发起的 <span class="gu-mono">tools/call</span>」「多 MCP server 下命名空间直接崩」。</p>
    <p class="gu-small gu-muted">依据：ext-apps #761 / #746 / #753 / #745</p>
  </div>
</div>

<div class="gu-quote" style="margin-top:1.1rem">
评测也在变成标配：A2UI 把 eval 与 conformance <strong>接进了 CI</strong>，还会自动产出「每周合规审计报告」。<br/>
也就是说：<span class="gu-em">「跑出来的数字」这件事，正在从各家自己说，变成规范层面的基础设施。</span>
</div>

<!--
再讲三条跟技术直接相关的。

第四条我觉得对我们最有启发：瓶颈已经从模型能力转到格式设计。公开榜单上头部模型的结构有效性已经 98% 到 99.5%，也就是说「模型不会写」基本不成立了；但不同格式之间的 token 能差 67%。AG-UI 的草案里还有一句很狠的话：把大段 UI 语言塞进 agent，会降低这个 agent 的整体表现，只做 UI 生成的 agent 比兼做其他事的 agent 表现更好。这跟我们前面「把题目改简单」的结论完全同构，只是现在有外部证据了。

第五条，下一波主战场是跨端。一份 catalog 出十一个渲染目标，包括视频、PDF、邮件、终端和 3D；A2UI 有五个官方稳定渲染器，社区还在补 React、Vue、Svelte、Compose、SwiftUI。对我们的意思是：多端复用会从加分项变成入场券。

第六条我特意标红了，因为它和前面那一章呼应：治理与安全不是我们独有的难题，是协议层最热的一批 issue。官方仓库里挂着「声明了 CSP（CSP 是浏览器的内容安全策略，规定页面能加载哪些外部资源）却不生效」这种实现缺口，挂着「无法区分是 App 发起的调用还是模型发起的调用」这种审计缺口，还有多 server 下工具命名空间直接崩。我们做的那套事务和凭证，正面回答的恰好就是这几个问题。

最后一个趋势，跟我们在做的评测直接相关：A2UI 已经把评测和一致性测试接进 CI，还会自动产出每周合规审计报告。也就是说，「跑出来的数字」这件事，正在从各家自己说，变成规范层面的基础设施。我们这条路走得不算偏——剩下的时间留给大家提问，我们直接聊。
-->

---
layout: center
---
# 🎀 Q &amp; A

<div class="gu-grid g3" style="margin-top:1rem">
  <div class="gu-card">
    <h4>数据来源</h4>
    <p>本机实测：首字延迟、流式事件数、提交体积（见第 13 页「流式」）· 行业数字引自各家官方 benchmark</p>
  </div>
  <div class="gu-card">
    <h4>延伸阅读</h4>
    <p>OpenAI Apps SDK 示例仓库 · Google A2UI · OpenUI Lang 文档 · CopilotKit 的生成式 UI 分类 · Vercel AI SDK</p>
  </div>
  <div class="gu-card">
    <h4>想自己试</h4>
    <p>给我们现有的聊天应用加一个渲染组件即可：服务端一行提示词、前端一个组件。半小时能跑通。</p>
  </div>
</div>

<div class="gu-small" style="margin-top:1.4rem">谢谢 · 欢迎提问</div>

<!--
我讲完了，剩下时间咱们一起聊聊。

我先抛三个我自己也没想清楚的问题，估计大家关心的也是这几个。

第一，组件目录长期谁来维护？会不会变成第二个没人看的设计文档？
第二，如果我们以后要做移动端，同一套目录能不能复用？还是得再来一遍？
第三，模型换代之后，比如换成更强的新模型，我们今天这套提示词和约束，还有多少价值？

这三个问题我都没有答案，但我觉得它们比技术选型更早需要想清楚。

如果大家想问别的，我们直接聊。谢谢。
-->
