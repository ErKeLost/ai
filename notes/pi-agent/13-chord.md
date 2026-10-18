# 第 13 章：Chord——可热更新的类型化对象运行时

## 学习目标

理解 Chord 如何让对象跨进程被引用、调用和观察；掌握 contract、host、object、reference、principal、context、state 和 reload 的关系。

## 1. 为什么需要 Chord

一个应用的 server、worker 和 browser tab 可能都要操作同一份状态。手写方案往往需要分别解决对象定位、RPC、schema validation、引用生命周期、状态订阅、重连和代码更新。Chord 把这些抽象放进一个 runtime：实现对象留在 host，调用方只拿引用；本地引用和远程引用使用相同接口。

```text
浏览器：reference + state subscription
                 │ JSON frames / link
服务端：object implementation + state
```

## 2. Contract 是运行时协议

Contract 是带 TypeBox schema 的 runtime value，不只是 TS interface。它定义名称、版本、对象定位输入、variant state/method、方法参数和返回 schema。Remote contract 的 wire 内容必须可验证；local contract 可在 host 内使用更灵活值。

```ts
const Counter = remote("demo.counter", {
  version: 1,
  input: Type.Object({ name: Type.String() }),
  host: hostNamed("server"),
  variants: {
    default: {
      state: { count: Type.Number() },
      methods: { increment: method(Type.Object({ by: Type.Number() })) },
    },
  },
});
```

`version` 用于协议兼容，不是 npm package version。breaking contract change 需要有版本迁移/accept logic，不能只更新 TS type。

## 3. Host、Factory、Reference

Host 注册 contract 的 factory；对象按需创建。Factory 收到 normalized input、principal 和 `self` 声明 API，返回实现。调用方在 `host.root()` 中 `ctx.get()` 到引用；引用使对象活跃，root 结束时可释放。调用方不会直接拿 implementation 对象。

```ts
host.serve(Counter, ({ name }, _principal, self) => {
  const count = self.state("count", Type.Number(), 0);
  return {
    variant: "default",
    count,
    increment: ({ by }, ctx) => count.change(ctx, (n) => n + by),
  };
});

await host.root(async (ctx) => {
  const counter = await ctx.get(Counter, { name: "visits" });
  await counter.increment({ by: 1 }, ctx);
});
```

对象 identity 与 canonical input/principal 相关；同一对象对 owner 与 guest 可以提供不同 variant 和能力。权限判断应放在 contract/host principal policy，不能因为方法名叫 `readOnly` 就假设安全。

## 4. State 与 link

State 是 strict JSON 的 observable revision。一次 `change()` 原子地产生一版状态；local subscriber 可读完整值，remote replica 可收到 snapshot 后的 delta。Chord 有 memory、Node IPC、WebSocket link 等实现。

```ts
const counter = replicatedState({ count: 0 });
counter.change(ctx, (draft) => { draft.count += 1; });
// 一个成功的 change 对订阅者表现为一份完整的新 revision。
```

这不是自动同步任意 JS 对象：JSON 所有权、可变 alias、订阅队列和 backpressure 都有明确合同。已交给 replicated state 的 mutable 对象不应再被调用者修改。

## 5. Hot reload 与代码版本

Chord reload 新的 facets/implementation，保留对象状态和稳定引用。reload 期间已开始的 root 继续运行其开始时绑定的代码版本；兼容性检查或 adapter 在安全点完成迁移。这样可以避免一半调用跑旧方法、一半跑新方法导致单次工作内部语义断裂。

例：todo object 正在执行旧版 `rename()` 时加载新版 factory。旧调用完成在旧代码版本；之后新 root 经 late-bound reference 进入新版实现，state 保持原有值或通过 migration 更新。

## 6. 源码地图

- Contract/版本兼容：[contract.ts](../../pi/packages/chord/src/contract.ts)
- Host/对象装配：[host.ts](../../pi/packages/chord/src/host.ts)、[object.ts](../../pi/packages/chord/src/object.ts)
- Link/远程引用：[link.ts](../../pi/packages/chord/src/link.ts)、[remote.ts](../../pi/packages/chord/src/remote.ts)
- JSON delta：[delta/](../../pi/packages/chord/src/delta/)
- reload：[reload.ts](../../pi/packages/chord/src/reload.ts)
- 教程/规范：[tutorial.md](../../pi/packages/chord/docs/tutorial.md)、`docs/guide.md`、`docs/spec.md`

练习：按 tutorial 的 todo 示例，找出 `host.serve()` 首次调用前对象何时创建、`ctx.get()` 返回何种东西，以及 subscriber 第一次会不会先看到 snapshot。

