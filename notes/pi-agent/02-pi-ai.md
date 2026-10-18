# 第 2 章：`pi-ai`——模型、Provider 与流式协议

## 学习目标

理解 Pi 怎样把不同厂商的 API 收敛到一套类型与流事件，知道 Provider、API adapter、Model catalog、Auth 分别做什么，并能写一个最小模型调用。

## 1. 四个核心概念

- **Model**：模型能力和默认参数的描述，如 provider/id、API、上下文窗口、输入模态、费用、推理能力。
- **Provider**：一个厂商或兼容端点的运行时对象，管理认证、模型列表、stream 和可选的分类/图像操作。
- **API adapter**：把统一 Pi 消息转成某个协议的 HTTP/WebSocket 请求，再将响应事件规范化。
- **Models collection**：Provider 注册表与请求协调器，负责模型查找、鉴权、请求选路、动态目录刷新等。

不要把 provider 名称当成协议名称：同一个 provider 可支持多个 API；不同 provider 也可实现同一个 OpenAI-compatible API。

## 2. 标准消息怎样映射成各家请求

Pi 的统一对话由 system、user、assistant、toolResult 组成。一个 assistant 消息可以同时有文本、thinking 和 tool call。以 OpenAI-compatible API 为例，adapter 会把工具声明放进请求，把消息转换为 provider 格式，并从分段 stream 中识别文本、思考和增量 tool arguments。

```text
Pi Context
  { systemPrompt, messages, tools }
       │ normalize / validate / auth
       ▼
API adapter: Pi message → vendor request
       │ SSE/WebSocket chunks
       ▼
Pi events: text_delta / thinking_delta / toolcall_delta / done
```

tool-call arguments 常常分多段 JSON 到达。`partial-json` 解析器让 UI 能展示正在形成的参数；最终参数仍需验证，不能把尚未完成的片段直接当有效调用。

## 3. 最小示例：把一次响应变成事件

```ts
import { createModels } from "@earendil-works/pi-ai";
import { openaiProvider } from "@earendil-works/pi-ai/providers/openai";

const models = createModels();
models.setProvider(openaiProvider());
const model = models.getModel("openai", "gpt-4o-mini");
if (!model) throw new Error("模型目录中没有该模型");

const stream = models.streamSimple(model, {
  systemPrompt: "用一句话回答。",
  messages: [{ role: "user", content: "Pi 的职责是什么？", timestamp: Date.now() }],
});
for await (const event of stream) {
  if (event.type === "text_delta") process.stdout.write(event.delta);
}
```

例中 provider 默认从环境变量解析 key；实际业务应处理 `done`、`error`、abort 和空模型目录，而不能只打印文本增量。

## 4. Stream 不是单个字符串

流开始时有部分 assistant message，后续事件逐步修改它。典型事件序列如下：

```text
start → text_start → text_delta("超时") → text_end → done(stopReason="stop")
```

若模型要调用工具，序列可能是：

```text
start → toolcall_start → toolcall_delta("{\"path\":")
      → toolcall_end({path:"config.json"}) → done(stopReason="toolUse")
```

Pi 将 stop reason、usage、错误消息、诊断和部分结果统一起来。错误通常被编码在 stream 和最终 assistant message 中，而不是让调用方只依赖一个 throw；调用者要区分 `stop`、`toolUse`、`length`、`error`、`aborted` 等结局。

## 5. Model catalog 与动态 Provider

静态 Provider 从生成的模型数据导入目录；动态 Provider 可恢复缓存目录并联网刷新。`Models.getModel()` 是同步读取已知目录，不代表已经网络刷新。登录身份也可能影响模型可用性，所以“目录存在”与“当前凭证可用”是不同判断。

```ts
const cached = models.getModels("openrouter"); // 已知目录，可同步取
await models.refreshModels({ providers: ["openrouter"], allowNetwork: true });
const available = models.getAvailable("openrouter"); // 还会考虑认证/可用性过滤
```

模型数据在 `packages/ai/src/models.generated.ts` 及 `providers/data/` 的生成流程维护；不要手改生成文件。源码也包含 image 与 classifier 两种模型类型，它们有各自的操作接口，并不等同于聊天模型。

## 6. 认证、取消和错误

鉴权由 Provider 的 auth 定义加 `auth/resolve.ts` 等统一逻辑处理。可能来源包括 API key、OAuth、云平台 ambient credentials 或本地无 key 的兼容端点。请求 options 可以传 `signal`、headers、fetch、timeout、retry、telemetry 和 provider-specific 选项。

例：用户按 Ctrl+C 时，signal 往 adapter 传播；adapter 停止读取 SSE，流以 aborted 结束，agent-core 才能走一致的收尾事件。这比只在 UI 隐藏 spinner 更重要，因为底层 HTTP 请求也需要停止。

## 7. 源码导航与设计理由

- 统一类型：[types.ts](../../pi/packages/ai/src/types.ts)
- 集合与路由：[models.ts](../../pi/packages/ai/src/models.ts)
- Provider 注册样例：[providers/openai.ts](../../pi/packages/ai/src/providers/openai.ts)、[providers/all.ts](../../pi/packages/ai/src/providers/all.ts)
- 协议实现：`packages/ai/src/api/*.ts`
- 认证：`packages/ai/src/auth/`
- stream、重试、overflow、解析工具：`packages/ai/src/utils/`
- 公共导出：[index.ts](../../pi/packages/ai/src/index.ts)

统一层减少上层重复逻辑，adapter 层保留厂商差异；如果把所有行为塞进一个“通用 API”，就会丢失各 provider 的缓存、推理参数、鉴权和错误语义。阅读练习：比较 `api/anthropic-messages.ts` 和 `api/openai-responses.ts`，各自找出工具调用结果从哪一个 provider event 被拼出来。

