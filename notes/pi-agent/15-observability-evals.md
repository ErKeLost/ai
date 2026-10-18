# 第 15 章：Telemetry、Evals 与测试

## 学习目标

理解运行 trace 与模型质量评测是两个问题；学习 Pi 如何让 telemetry 可替换、eval 运行可复现，以及测试中如何避免真实 provider 造成不稳定或费用。

## 1. `pi-telemetry` 是显式契约

`TelemetryContext.startSpan()` 包裹一段操作，span 可记录 attributes、events 和 status，也可作为 child span 的 parent。Pi 不固定绑定某个 exporter，也不维护必须依赖 ambient global state 的 current span；调用方显式传递 context。

```ts
await telemetry.startSpan({
  name: "pi.model.request",
  attributes: { provider: "openai", operation: "chat" },
}, async (span) => {
  span.addEvent("pi.model.stream_started");
  const response = await requestModel();
  span.setAttributes({ stop_reason: response.stopReason });
});
```

`NOOP_TELEMETRY_CONTEXT` 可在不需要观测的程序中保持 API 一致；`InMemoryTelemetryContext` 可做本地测试。业务逻辑不能因为 exporter 写日志失败而丢失执行。

## 2. Typed schema 和隐私

Telemetry 可以定义稳定的 domain schema 和属性类型，避免不同版本把 `provider` 一会儿叫 `model_host` 一会儿叫 `vendor`。属性应记录回答问题所需的最少数据；不要默认把完整 prompt、文件内容、工具输出或 credential 写入 spans。

例：记录 `{provider:"anthropic", model:"…", tool_count:2}` 足以比较模型路由或调用量；记录整个 prompt 则可能泄露项目内容，而且会带来高 cardinality 和存储成本。

## 3. `pi-evals` 的比较方法

Pi evals 包含 host eval 与 documentation-lift eval。后者对照 `without_docs` 和 `with_docs` 两个容器变体，固定 case cohort，隔离 home/session/workspace，保存原生 Vitest JSON、session transcript 和配对报告。

```text
same eval case × same model × same run number
     ├── without_docs arm
     └── with_docs arm
              ↓ pair exact results → compare scores
```

例：文档说明是否帮模型正确使用 extension API。只有两边都恰有一个有效 score 的 pair 才进入 pass-rate 比较；如果一个 arm 缺失/报错/skip，结果被标为 blocked，不应悄悄当成 0 分。

一次运行不足以说明统计稳定。重复次数应明确设置，并检查方差/饱和分、负 lift 与失败 arm。测试 artifact 可能包含 prompt、response、代码和 tool output，应按敏感数据对待。

## 4. 传统测试与 Faux provider

`pi-ai` 提供 faux provider，让 Agent loop 测试确定性的流事件和工具结果，而不发真实 HTTP 请求。coding-agent 测试也有 faux provider/harness。这样可以验证事件顺序、abort、error、session entry，而不是赌在线模型每次都选择相同行为。

例：测试一条“工具调用后应该再生成一次”的行为时，faux provider 先给 `toolCall`，下一次给固定 final message；断言 tool result 和请求次数即可，无需 API key。

## 5. 关键目录与运行提示

- Telemetry：[index.ts](../../pi/packages/telemetry/src/index.ts)、`memory.ts`、`testing/conformance.ts`
- Evals：[README](../../pi/packages/evals/README.md)、`src/cli.ts`、`src/plan.ts`、`src/docker.ts`、`src/report.ts`
- Pi coding-agent faux tests：`packages/coding-agent/test/suite/`
- Agent/AI tests：各自 `packages/<name>/test/`

真实 eval 需要 provider/model 配置且会产生模型调用；普通单元测试优先使用 faux provider。练习：读 `report.ts`，找出 blocked pair 与 0 分的区别，再说明这种报告为何能避免把测试基础设施故障误报为模型能力。

