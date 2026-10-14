# 已从 deck 移除的第 17 页（备份，可随时加回）

> 用法：把下面的块按原样粘回 slides.md 中「接入生成式 UI，要多花多少 token？」之后即可。
> 移出时间：2026-10-14（当时 deck 共 24 页）
> 备注：这页讲 catalog 的四步实现（手写契约 → 两层裁剪 → 冻结 slice → 两条出口）。讲稿里对应的口播也一并存在本文件里。

## 原第 17 页 · catalog 是怎么实现的：67 个契约，按需给模型

```markdown
---
layout: default
---
# catalog 是怎么实现的：67 个契约，按需给模型

<div class="gu-flow">
  <div class="gu-node"><b>①</b>手写契约<br/>props + renderer</div>
  <div class="gu-arrow">→</div>
  <div class="gu-node is-accent"><b>②</b>两层裁剪<br/>组件级 + 字段级</div>
  <div class="gu-arrow">→</div>
  <div class="gu-node is-violet"><b>③</b>冻结 slice<br/>4 个哈希</div>
  <div class="gu-arrow">→</div>
  <div class="gu-node"><b>④</b>两条出口<br/>文本签名 / 工具</div>
</div>

<div class="gu-grid g3" style="margin-top:0.9rem">
  <div class="gu-card is-accent">
    <h4>契约是双向锁死的</h4>
    <p>服务端的 props schema 和客户端的 renderer 映射必须<strong>一一对应</strong>：多一个、少一个都编译不过。</p>
    <p class="gu-small">所以「模型能写的，前端一定能渲染」。</p>
  </div>
  <div class="gu-card is-accent">
    <h4>裁剪是两层的</h4>
    <p><strong>组件级</strong>：和渲染器能力清单求交集，不支持的直接剔除。<br/><strong>字段级</strong>：可选属性按 768 字符/个的预算砍，<strong>必填永不砍</strong>。</p>
    <p class="gu-small">整本 67 契约 = 7.8k token</p>
  </div>
  <div class="gu-card is-accent">
    <h4>同一份 slice，两个出口</h4>
    <p>「写方言」通道拿文本签名；「填表」通道拿 strict JSON Schema。</p>
    <p class="gu-small">JSON Schema 里故意丢掉 <span class="gu-mono">pattern</span> / <span class="gu-mono">minLength</span> 等 25 个校验关键字 —— 语义校验的权威留在自己编译器的 Host 侧。</p>
  </div>
</div>

<div class="gu-quote" style="margin-top:0.9rem">
目录不是塞进提示词的一篇文档，而是一份<strong>带哈希的冻结契约</strong>：模型只能从这份清单里<strong>选组件、填参数</strong> —— 想乱写也没有词。
</div>

<!--
这一页回答「catalog 到底是怎么做出来的」，四步。

第一步，契约是手写的，而且是两份：服务端写 props 的 schema，客户端写这个契约对应的 renderer。两份必须一一对应，多一个少一个都编译不过。我们的目录一共六十七个契约：六十个 UI、七个语义和布局。这条硬约束换来一句话：模型能写的，前端一定能渲染。

第二步，裁剪。分两层：组件级，跟渲染器的能力清单求交集，渲染器不支持的组件直接从目录里剔除；字段级，可选属性按一个对象的字符预算往下砍，但必填属性永远不砍。整本六十七个契约是七千八百 token，按需给十八个是三千。

第三步，冻结。裁完的这份目录会被算出一组哈希，连同依赖锁一起冻结下来。所以同一轮对话里，模型看到的目录是稳定的、可复算的——出问题能复现。

第四步，同一份冻结目录有两个出口：「写方言」那条通道拿的是文本签名，「填表」那条通道拿的是严格 JSON Schema。这里有个细节值得说：JSON Schema 里我们故意丢掉了 pattern、minLength 这类校验关键字，因为这个通道只负责「结构别写错」，真正的语义校验回到我们自己的编译器里做，权威留在 Host 侧。

最后一句总结：我们的目录不是一篇塞进提示词的长文档，它是一份带哈希的冻结契约。模型能做的事只有两件——从清单里选一个组件、把参数填进去。它想乱写，也没有词可用。

这也解释了为什么加一个组件不是「改一行提示词」这么简单：你得同时给服务端和客户端各写一份声明，否则编译期就过不去。
-->
```
