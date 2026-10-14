# Catalog（组件目录）是怎么实现的 · 源码取证

> 只读盘点，盘点对象 `/Users/work/open-generative`（0.3.22 全包 lockstep）。
> 用途：给「生成式 UI」分享的幻灯片做底稿。
> **所有数字都是本次在本机跑出来的**，脚本在 `/tmp/catalog-probe*.ts`（临时文件，未入库）。
> 幻灯片未改动；本文件是唯一新增产物。

---

## 0. 先给结论（一句话）

**Catalog 不是「模型自己想出来的组件表」，而是两份互不认识的声明 —— 服务端手写的契约、客户端手写的渲染器 —— 在每次对话开始时被强制对齐、裁剪、并冻结成一个带哈希的「本轮允许的组件清单」；模型能做的只有在这份清单里填参数和拼槽位。**

这就是「填表稳、写作文不稳」的根源：`0/2` 那种失败是**题目太大**（目录全给），而工具通道之所以 `1/1`，是因为**题目被缩小到只剩填空**。

---

## 1. 一份契约（Contract）长什么样

### 1.1 契约的字段全集

`packages/catalog/src/contracts.ts:186-201`（`componentContractBodyShape`）—— 一个组件的完整能力声明：

```ts
const componentContractBodyShape = {
  category,              // layout | content | control | data | extension:*
  resolvedPropsSchema,   // 这个组件接受哪些 props（JSON Schema，已解析、已 strict 化）
  authoringBindings,     // 哪些 props 不是字面量，而是绑到 Host 资源（如 ui.table 的 /columns /rows）
  slots,                 // 能装哪些子组件（selector = 具体契约 或 整个 category）
  events,                // 交互事件端口 → 允许的 Action 契约
  trust,                 // safe | governed
  commitPolicy,          // progressive | atomic
  readiness,             // 必填绑定 + 未就绪时的兜底策略
  placements,            // inline | panel | sheet | dialog | fullscreen (+ 宽高约束)
  accessibility,         // 语义角色 / 可访问名来源 / 键盘交互 / live region
  assets,                // 可选：允许的 MIME + 体积上限
  prompt,                // ★ 给模型看的那一小段：summary / useWhen / avoidWhen
  migrations,            // 旧 revision → 新 revision 的迁移
}
```

契约本体走 Zod 严格解析（`.strict()`），**并且有哈希**：

- `computeComponentContractHash()` — `contracts.ts:449`
- `createComponentContract()` — `contracts.ts:456`（归一化 → 算哈希 → `deepFreeze`）
- `verifyComponentContract()` — `contracts.ts:466`（重算哈希，不一致就抛）
- 契约身份 = `publisher/catalogId/componentType@revision#contractHash`（`contractRefKey()`，`contracts.ts:574`）

### 1.2 真实例子 ①：`ui.card`（最简单的那种）

契约声明只有两处，**非常短**：

```ts
// packages/components/src/ui.ts:224 —— props 形状
const titleDescriptionSchema = z.object({
  title: text(256).optional(),
  description: text(1_024).optional(),
}).strict();

// packages/components/src/ui.ts:407 —— card 在此之上加一个枚举 + 默认值
"card": titleDescriptionSchema.extend({
  tone: z.enum(["default", "muted", "accent"]).default("default"),
}).strict(),
```

```ts
// packages/components/src/ui.ts:627 —— 给模型看的语义元数据
"card": {
  summary: "A bounded content group with optional header and footer.",
  useWhen: "Use to group one coherent unit of content or controls.",
  avoidWhen: "Avoid nesting cards solely for visual decoration.",
  slots: "bodyFooter",
}
```

`bodyFooter` 这个预设展开成（`ui.ts:583-603`）：

```ts
bodyFooter: {
  body:   slot(composableSelectors, 0, 100, "empty"),   // 0..100 个任意内容/控件/数据/布局
  footer: slot(footerSelectors,    0,  12, "omit"),     // 0..12 个，缺省省略
}
```

**注意 `avoidWhen` 里被自动追加的一句**（`ui.ts:702-705`）：

> `Do not provide className, style, HTML, React callbacks, or implementation-specific primitive props.`

也就是说「不许写 HTML/CSS」不是文档里的口头约定，它**写在每一个 ui.\* 契约的提示词字段里**。

### 1.3 真实例子 ②：`layout.stack`（结构根）

`packages/components/src/contracts.ts:207-215`：

```ts
const layoutStack = await createComponentContract(componentContractDefinitionSchema.parse({
  ref: { publisher, catalogId, componentType: "layout.stack", revision: 3 },
  category: "layout",
  resolvedPropsSchema: toStrictJsonSchema(layoutStackPropsSchema),
  authoringBindings: {},
  ...base,                                    // trust:"governed", commitPolicy:"atomic", placements:[fullscreen/inline/panel/sheet]
  slots: { body: { accepts: layoutChildSelectors, min: 0, max: 100, fallback: "empty" } },
  accessibility: { semanticRole: "group", accessibleName: { kind:"host", key:"surface-label" }, ... },
  prompt: {
    summary: "A vertical layout for content, data, controls, and nested layouts.",
    useWhen: ["Use to stack content, metrics, charts, controls, or a Grid of peer items."],
    avoidWhen: ["Avoid unnecessary nested layouts and redundant wrappers."],
    examples: [],
  },
}), provider);
```

`layout.stack` 是 **Host 写死的文档根**（`packages/host/src/catalog-components.ts:10`）：

```ts
export const OPEN_GENERATIVE_DOCUMENT_ROOT_COMPONENT_TYPE = "layout.stack" as const;
export const OPEN_GENERATIVE_FOUNDATION_COMPONENT_TYPES = ["content.text", "layout.stack"] as const;
```

> **实测发现**：如果 slice 里没有 `layout.stack`，`compileOpenGenerativeLanguage()` 会抛一个**很难懂的 `TypeError: Object.entries requires that input parameter not be null or undefined`**（在 `resourceAliasProjectionProfile` 里）。生产路径不会踩到，因为 Host 无条件注入 foundation；但如果有人自己拼 catalog 就会踩。值得记一笔（潜在可改：换成明确的错误信息）。

### 1.4 真实例子 ③：`ui.table`（唯一「受治理」的 ui.\*）

`ui.table` 与其它 59 个 ui.\* 不同，它的两列**不是字面量，而是资源绑定**：

```ts
// packages/components/src/contracts.ts:236-267（ui 契约工厂里）
authoringBindings: definition.name === "table"
  ? tableResourceBindings(resolvedDatasetJsonSchema, resourceSchemaHash)   // { "/columns":…, "/rows":… }
  : definition.name === "record-list"
    ? { "/data": recordsResourcePolicy(...) }
    : {},
...
readiness: definition.name === "table"
  ? { strategy:"all-required", requiredBindings: ["/columns","/rows"], pendingFallback:"loading", failureFallback:"error" }
  : {},
trust: definition.name === "table" || definition.name === "record-list" ? "governed" : "safe",
```

`tableResourceBindings()`（`contracts.ts:391-420`）会去读 `ui.table` 自己的 props schema，把 `/columns`、`/rows` 投影到数据集 schema 上 —— **表格的行和列从模型手里被拿走了，只能引用 Host 给的数据资源**。

> **实测发现**：正因为这条约束，在「结构化（填表）」通道里、且**没有挂任何数据资源**时，`ui.table` 和 `ui.record-list` 会被**主动排除**（连同 `data.metric`、`analysis.insight`、`data.chart`）。见第 5 节实测表。

### 1.5 官方目录 = 60 + 7

```ts
// packages/components/src/ui.ts:14-74 —— 60 个库中立 UI family，手写数组
export const uiComponentFamilies = ["accordion", …, "tooltip"] as const;

// packages/components/src/contracts.ts:270-281 —— 60 ui.* + 7 语义/布局 = 67
const componentContracts = [dataChart, dataMetric, analysisInsight, contentText,
                            layoutStack, layoutGrid, analysisReport, ...uiComponentFamilies.map(n => ui[n])];
```

**实测（本机）**：`createOfficialCatalog()` → `componentContracts.length === 67`，其中 `ui.*` = **60**。

---

## 2. 目录（catalog / manifest）怎么生成：构建时静态产出 + 运行时确定性重建

这是**两件事**，必须分开讲，否则会被问穿。

### 2.1 契约与 manifest：运行时确定性「生成」，不是读文件

源头是**手写的**：

| 内容 | 文件 | 形态 |
| --- | --- | --- |
| 60 个 `ui.*` 的 props schema（Zod） | `packages/components/src/ui.ts`（`uiPropsSchemas`，约 400 行） | 手写 |
| 60 个 `ui.*` 的语义元数据（summary/useWhen/avoidWhen/slots 预设） | `packages/components/src/ui.ts:614+`（`semanticMetadata`） | 手写 |
| 7 个语义/布局契约的 props + 绑定 + 可访问性 | `packages/components/src/contracts.ts:85-235` | 手写 |
| props schema → JSON Schema | `toStrictJsonSchema()`（`packages/components/src/schema.ts`） | 生成 |
| 契约 → 带哈希的冻结对象 | `createComponentContract()`（`packages/catalog/src/contracts.ts:456`） | 生成（运行时） |
| 契约集合 → manifest | `createCatalogManifest()`（`packages/catalog/src/manifest.ts:122`） | 生成（运行时） |

`packages/components/src/ui.ts:692-708` 是「定义 → 契约定义」的装配点：

```ts
export const officialUiComponentDefinitions = deepFreeze(uiComponentFamilies.map((name) => {
  const metadata = semanticMetadata[name];
  return uiComponentDefinitionSchema.parse({
    name,
    componentType: `ui.${name}`,
    propsSchema: toStrictJsonSchema(uiPropsSchemas[name]),
    slots: slotPresets[metadata.slots ?? "none"],
    prompt: {
      summary: metadata.summary,
      useWhen: [metadata.useWhen],
      avoidWhen: [metadata.avoidWhen,
        "Do not provide className, style, HTML, React callbacks, or implementation-specific primitive props."].sort(),
    },
  });
}));
```

**manifest 里装了什么**（`packages/catalog/src/manifest.ts:27-36`）：

```ts
protocolRevision, hashProfile,
dependencyLockHash,   // ← 依赖的其它 catalog 的锁
contractSetHash,      // ← 本轮组件集合的哈希
dependencies[], components[], actions[],
```

三个哈希的算法都在同文件：`computeContractSetHash()`（`:98`）、`computeDependencyLockHash()`（`:107`）、`computeCatalogManifestHash()`（`:118`）。`verifyCatalogManifest()`（`:160`）会把三个都重算一遍，对不上就抛。

> 所以：**没有 manifest.json 文件**。它是每次进程启动时用同一套手写定义**确定性重算**出来的；换一个字节，哈希就变，所有下游缓存与签名检查立刻失效。这是「可审计」的实现基础。

### 2.2 渲染器清单：这个是**构建时**真的写出文件

`packages/adapter-shadcn/scripts/renderer-manifest.ts`（由 `bun run build` 触发，见 `package.json` scripts）：

```ts
// 1) 哈希构建产物：adapter chunk / adapter CSS / core chunk / core CSS
const [adapterChunkHash, adapterStylesheetHash, coreChunkHash, coreStylesheetHash] = ...
// 2) 组装 release
const release = await createOfficialRendererRelease(catalog, artifacts);
// 3) 写文件
Bun.write("../dist/renderer-manifest.json", ...)
Bun.write("../dist/renderer-release.json", ...)
// 4) 立刻回读 + verifyOfficialRendererRelease()，对不上直接 build 失败
```

schema 定义在 `packages/components/src/renderer-integrity.ts:18-70`，其中值得引用的一条：

```ts
contractChunks: z.array(contractChunkSchema).length(officialComponentTypes.length)   // 必须逐个组件一一对应
```

build profile（`renderer-integrity.ts:78-95`）：

```ts
{ rendererId: "open-generative.adapter-shadcn", rendererRevision: "0.4.0",
  conformanceRevision: "0.4.0", peerDependencies: { react: ">=19.0.0" }, … }
```

**一句话**：契约是「运行时确定性生成、带哈希」；渲染器清单是「构建时把 JS/CSS 的哈希钉死、写进 dist 并自校验」。两边通过 `contractRefKey` 对齐。

---

## 3. 怎么进提示词：两条出口，一份契约

同一个 frozen slice 有**两条**出口，给两种模型交互方式用。**不是两份契约**，是同一份契约的两种投影。

### 3.1 出口 B · OGL 文本签名（`写方言` 通道，生产主路径）

编译入口：`packages/compiler/src/language.ts:117 compileOpenGenerativeLanguage()`
内部：`:149 compileOpenGenerativeLanguageWithPromptBudget()` → `contractPromptMetadata()` → `compileLanguagePrompt()`

签名生成器：`packages/compiler/src/schema-signature.ts`

```ts
// :31 描述「完整」签名（给审计/UI 用，8 层深，上限 8192 字符）
export function describeJsonSchemaSignature(schema): string
// :40 描述「给模型看」的子集 —— 这正是进提示词的那份
export function describeModelJsonSchemaSignature(schema): string
```

它是有损压缩，参数写死在文件顶部：

```ts
const MAX_MODEL_SIGNATURE_DEPTH = 6;          // :6  最多 6 层
const MAX_MODEL_OPTIONAL_FIELD_LENGTH = 160;  // :8  单个可选字段签名超过 160 字符就丢
const MAX_MODEL_OBJECT_LENGTH = 768;          // :9  一个对象的签名预算 768 字符，超了按「最长优先」砍可选字段
```

`selectModelFields()`（`:214`）明确写了不可协商的一句：

> **「Required fields are never removed.」** —— 必填字段永远不砍，砍的只有可选子树。

预算钳制（`language.ts:16-21`）：

```ts
export const OPEN_GENERATIVE_LANGUAGE_PROMPT_MAX_BYTES = 96 * 1_024;   // 96 KiB
export const OPEN_GENERATIVE_LANGUAGE_PROMPT_TOKEN_BYTES = 4;          // 粗粒度 token 代理
export const estimateOpenGenerativeLanguagePromptTokens = (p) => Math.ceil(utf8Length(p) / 4);
```

超预算抛错的原文（`language.ts:585-588`）：`Compiled Open Generative Language prompt is ${bytes} bytes …` + 处置建议 `"Reduce the Catalog Slice."`

### 3.2 出口 A · strict JSON Schema 工具（`填表` 通道）

`packages/ai-sdk/src/structured/schema.ts`：

- `buildStructuredCatalog(turn, contracts)` — `:118` 由 frozen slice + language 生成 `render_ui` 工具的 schema + 一段 `instructions` 文本。
- 每个组件变成一个 `anyOf` 分支（`:205-222`），statement 形状固定为 `{ id, component, props, slots }`。
- 资源型 props 被替换成「只能引用别名」的 schema（`:95 resourceRefSchema()`）：
  ```ts
  { type:"object", description:"Bind a Host data resource. Never copy rows or columns.",
    properties:{ resource:{ type:"string", enum:[...aliases] } }, required:["resource"] }
  ```

**关键分层：strict 模式会丢掉一堆校验关键字**，由 Host 编译器二次判定。`DROPPED_KEYWORDS`（`schema.ts:36-45`，共 25 个）：

```
$schema $id $defs default examples title format
pattern minLength maxLength minItems maxItems
minimum maximum exclusiveMinimum exclusiveMaximum multipleOf
uniqueItems propertyNames contains minContains maxContains
minProperties maxProperties prefixItems unevaluatedProperties
```

文件头的注释把设计意图写得很直白：

> *"Validation keywords that strict dialects reject (pattern, lengths, bounds…) are removed here and re-checked by the Host compiler, which stays the single semantic authority."*

而 strict 模式要求「所有 property 都必须出现在 required 里」，所以**可选 props 被转成 `anyOf: [X, {type:"null"}]`**（`schema.ts:88-92`），模型输出 `null`，lowering 阶段再丢掉。这也解释了两点：① 为什么工具通道里「可选参数写成 null」是正常的；② 为什么它比文本通道**贵**（见第 5 节实测）。

---

## 4. Slice 裁剪（重点）

### 4.1 前提：先纠正一个常见误解

**裁剪组件清单的不是「意图」，是「渲染器能力」+「调用方的显式选择」。**

- `packages/host/src/intent-planner.ts:77 planOpenGenerativeTurn()` 输出的 `interactions`（tabs/filter/sort/paginate/form）是**交互能力**，由数据形状 + selector policy + 分页能力决定；`reasons` 是审计理由。它**不筛组件**。
- 真正决定组件清单的是 `packages/host/src/turn.ts:1035`：

```ts
const plannedComponents = input.catalogMode === "full-catalog-benchmark"
  ? [...input.catalog.componentContracts].sort(...)                       // 对照组：全部 67
  : selectOfficialComponents(input.componentContracts, input.input.componentSelection);
```

`selectOfficialComponents()`（`turn.ts:697-762`）：

1. `selection === undefined` → 返回**全部 67**（所以「默认给全部」是事实）；
2. 有 `componentTypes` → 先塞入 foundation（`content.text`、`layout.stack`），再并上请求的类型；
3. 超过 **`OPEN_GENERATIVE_COMPONENT_SLICE_LIMIT = 128`** 直接抛（`catalog-components.ts:3`）；
4. 出现未知组件类型 → 抛。

**然后才做自动裁剪**（`turn.ts:1037-1049`）：

```ts
const rendererContracts = new Set(renderer capability manifest 里的所有 contractKey);
const unavailableComponents = plannedComponents.filter((c) => !rendererContracts.has(contractKey(c.ref)));
// 若是显式选择 → 直接抛错（不静默降级）
const selectedComponents = plannedComponents.filter((c) => rendererContracts.has(contractKey(c.ref)));
```

> **这是真正的自动裁剪**：`plannedComponents ∩ rendererCapabilitySet`。装了 Radix foundation 才有 60 个 `ui.*`；换一个基础库，没实现的全被剔掉。

`rendererContractKey` → `negotiateRendererCapabilitySet()`（`packages/catalog/src/renderer.ts:329`）的拒绝原因是**枚举的**（`:365-390`）：

```
catalog-missing | contract-not-in-manifest | renderer-missing | placement-unsupported | feature-missing
```

### 4.2 冻结：一次 turn 一个 slice，四个哈希

`packages/host/src/turn.ts:1079` → `createCatalogSetSlice()`（`packages/catalog/src/slice.ts:262`）：

```ts
const definition = catalogSetSliceDefinitionSchema.parse({
  manifests,                                    // 参与的 catalog（含版本）
  dependencyLockHash,                           // ← computeDependencyLockHash(manifests)
  contractSetHash,                              // ← computeContractSetHash(components)
  rendererCapabilitySetHash,                    // ← 来自 renderer 协商结果
  components: [...].map((c, i) => ({ sliceComponentId: `component-${String(i+1).padStart(6,"0")}`, contract: c })),
  actions, resources, evidence,
  limits,                                       // maxNodes / maxDepth / maxActions / maxTextBytes / maxOperations
  providerSchemaProfile,
});
const sliceHash = await computeCatalogSetSliceHash(definition, provider);   // ← 第四个哈希
```

三道硬闸门都在 `createCatalogSetSlice` 里：

| 闸门 | 函数 | 行 |
| --- | --- | --- |
| 组件必须真的在参与的 catalog 里 | `assertCatalogMembership()` | `:404` |
| 组件必须通过渲染器协商 | `assertRendererNegotiation()` | `:416` |
| slice-local id 必须是**确定性分配**的（`component-000001`…） | `assertAllocatedIds()` | `:380` |

`verifyCatalogSetSlice()`（`:329`）会把四个哈希全部重算 —— 这就是「冻结 hash + 依赖锁」的实现。

🔑 **这个 sliceHash 会一路传下去**：`slice.sliceHash` → `compiled.catalogSliceHash`（`language.ts:179`）→ 同时 `contractSetHash` / `rendererCapabilitySetHash` 被写进 base document（`turn.ts:1101-1106 createBaseDocument(...)`）。所以**事后可以证明「当时模型看到的到底是哪一份目录」**。这是整个设计里最值钱的一条。

### 4.3 「用户问一句话 → 注入什么目录」五步时序

```
① [Host 组装]  resource schema 注册 + intent plan（数据形状/策略 → interactions）
                          ↓
② [选组件]    selectOfficialComponents(foundation ∪ 调用方 componentTypes)   ← 上限 128
                          ↓
③ [协商]      negotiateRendererCapabilitySet(候选 × renderer manifest)      ← 不支持的剔掉/报错
                          ↓
④ [冻结]      createCatalogSetSlice(components + resources + limits)
              → dependencyLockHash / contractSetHash / rendererCapabilitySetHash / sliceHash
                          ↓
⑤ [投影成提示词]  compileOpenGenerativeLanguage()  → OGL 文本签名
              或 buildStructuredCatalog()          → strict JSON Schema 工具
```

第 ⑤ 步两条路互斥（一个 turn 只用一条），但**用的是同一个 slice**。

### 4.4 实测：裁剪到底省了多少

用官方 67 契约、空资源，本机跑：

| 目录规模 | OGL 提示词字节 | ≈tokens（÷4） |
| --- | --- | --- |
| 生产样板 slice（`apps/compare` 的 16 个） | **8,007 B** | ≈ 2,002 |
| 全部 67 | **30,543 B** | ≈ 7,636 |
| 只算 `ui.*` 60 个 | **29,840 B** | ≈ 7,460 |
| 7 个语义/布局（不含任何 `ui.*`） | **2,639 B** | ≈ 660 |

**16 → 67 是 3.81 倍。** 单组件边际成本：**平均 442 B（≈110 tokens）**，最小 0、最大 760 B。最贵的 8 个：

```
ui.alert-dialog +760   ui.popover +759   ui.sheet +734   ui.drawer +733
ui.dialog +699   ui.dropdown-menu +684   ui.context-menu +673   ui.sidebar +613
```

> 顺带一个「为什么按需要给」的量化理由：**`ui.*` 那 60 个 family 占掉了 97.7% 的提示词体积**（29,840 / 30,543），但它们里绝大多数（dialog/popover/sheet/carousel…）在普通问答里根本不会被用到。

### 4.5 裁剪的粒度是「组件」，不是「参数」

第 3.1 节那套 `MAX_MODEL_*` 常量是**同一逻辑的第二层**：组件级裁剪（slice）之外，还有个字段级裁剪（`selectModelFields`，砍可选字段、必填不砍）。两层叠加，才是「模型看到的题目足够小」的完整答案。

---

## 5. 换一个组件库要做什么（60/60 是怎么被强制的）

### 5.1 两份手写声明的对齐点

| 侧 | 文件 | 内容 |
| --- | --- | --- |
| 服务端契约 | `packages/components/src/ui.ts` + `contracts.ts` | 60 个 `ui.*` 的 props/语义/槽位 |
| 客户端渲染器 | `packages/adapter-shadcn/src/renderers.tsx:935` | 60 个 `ui.*` → React renderer 的映射 |
| 桥 | `packages/adapter-shadcn/src/registry.ts:26 createShadcnRendererRegistrations()` | 把两边 join 起来 |

`renderers.tsx` 的映射本身就是一行机械展开（这点很关键，说明它是**逐组件手写**的）：

```ts
export const officialShadcnRendererComponents: Readonly<Record<UiComponentType, NodeRenderer>> = Object.freeze(
  Object.fromEntries(uiComponentFamilies.map((family) => [`ui.${family}`, createSemanticRenderer(family)]))
);
```

### 5.2 强制「精确覆盖」的三道断言

**(a) 覆盖数必须相等 —— `adapter-shadcn/src/registry.ts:57-66`**

```ts
if (registrations.length !== supported.size) {
  const missing = catalog.componentContracts
    .map((c) => c.ref.componentType)
    .filter((t) => supported.has(t) && !available.has(t));
  throw new TypeError(
    `The shadcn Renderer Bundle does not exactly cover its declared capabilities: ${missing.join(", ") || "cardinality mismatch"}.`
  );
}
```

同一函数里还有一条正向断言（`:41-44`）：`shadcnRendererComponents` 里有、catalog 里没有 → `The official Catalog is missing ${componentType}.`

**(b) 通用断言 —— `packages/react/src/renderer-registry.ts:230 assertExactCoverage()`**

```ts
assertExactCoverage(contracts, label = "Renderer registry"): void {
  const coverage = this.coverage(contracts);
  if (coverage.status === "exact") return;
  const missing = coverage.missing.map(contractRefKey).join(", ") || "none";
  const unexpected = coverage.unexpected.map(contractRefKey).join(", ") || "none";
  throw new TypeError(`${label} coverage is not exact; missing: ${missing}; unexpected: ${unexpected}.`);
}
```

调用点：

- `packages/react/src/foundation.ts:142` — `registry.assertExactCoverage(contractRefs, "React Renderer Foundation")`，紧接着还校验 `contractSetHash`（`:143-146`）。
- `packages/react/src/compose.ts:99` — 多 layer 组合后再断言一次，并校验 provenance（`:105`）。

**含义**：「少一个」和「多一个」都是致命错误。少一个是「用户看得见的东西渲染不出来」；多一个是「未经契约声明的渲染路径」。所以它是双向的。

**(c) 运行时解析失败也不静默 —— `renderer-registry.ts:241 resolve()`**

```ts
const registration = this.get(contract.ref);
if (!registration) return Object.freeze({ status: "unsupported", reason: "renderer-missing" });
if (!placementMatches(...)) return { status: "unsupported", reason: "placement-unsupported" };
return { status: "ready", registration };
```

### 5.3 为什么换 Base UI 不是「改个名字」

`apps/docs/content/docs/theme.mdx:56-67` 原文：

> | Shadcn driver | UI capability set |
> | `radix` | All 60 canonical `ui.*` Contracts. |
>
> *"Base UI and React Aria use different state and composition APIs. They need **independent semantic drivers** and are deliberately not exposed as a component-name substitution. The Host therefore sees all 60 `ui.*` Contracts only when the active Radix Foundation is installed."*
>
> *"A future base driver must publish its own **exact capability manifest and interaction tests** before it is added to the public registry."*

把这句话和第 5.2 节的三道断言对上，就能解释清楚「为什么换库这么贵」：

1. 60 个契约里的每一个，语义元数据是**按照 Radix/Shadcn 的语义**写的（`semanticMetadata` 的 summary/useWhen/avoidWhen、`slotPresets`、`uiInteractionEvents`、`uiAccessibility`）。
2. 交互事件端口（`VALUE_CHANGE_EVENT_PORT`、`PAGE_CHANGE_EVENT_PORT`、select/tabs 的 payload schema）绑的是 Shadcn 的交互模型。
3. Base UI / React Aria 的状态与组合 API 不同 → 同一份契约在那边**语义上就不成立**（不是渲染不出来，是「点一下意味着什么」变了）。
4. 所以必须出一份**自己的能力清单**（哪些契约它真的实现了，`renderer-missing` 的那些必须被 negotiation 剔掉）+ 自己的交互测试。

`registry/` 目录下已经预留了三个 driver 的位置（`registry/radix`、`registry/base`、`registry/aria`、`registry/shared`）—— **只有 `radix` 有实现**（`registry/radix/adapter.tsx` + `open-generative.json`）。`base` / `aria` 是空目录。这是「覆盖面最薄的一块」这个结论的直接证据。

### 5.4 自定义库（不走官方 60）时的同一套约束

`packages/catalog/src/library.ts`：

- `defineComponent()`（`:24`）— 手写 `{ name, props(zod), description, slots?, placements?, useWhen?, avoidWhen? }`；内部 `z.toJSONSchema()` 做合法性检查。
- `createLibrary()`（`:46`）— 1..128 个组件，每个都产出一份**带哈希的契约**，再产出一份 manifest。
- `verifyComponentLibrary()`（`:73`）— manifest 的 `components` 必须和 `componentContracts` **集合完全相等**；且「组件库不许声明可执行 action」。

**所以「换库」这件事，框架层给出的答案是：契约的手写源和渲染器的手写源必须一一对上，多一个少一个都编译不过。** 这就是「填表稳」的另一半原因。

---

## 6. 一句话总结（非技术版）

> **我们把「你能用什么组件、每个组件能填什么」提前写成了一份带防伪码的清单，每次提问只把这次真正需要的那几行发给模型；模型只能在这几行里填空，填完还要过一遍我们的编译器 —— 所以它没有机会乱写，而我们有能力事后证明它当时看到的是哪一行。**

更短一点（适合口播）：

> **不是让模型自由发挥再收拾残局，而是先把题目缩小成一张填空题，再把答案当场验一遍。**

---

## 7. 可画成一张图的流程图（6 个方框）

```
┌─────────────────────────────┐
│ ① 手写契约源                 │   构建时 / 人工
│ ui.ts: 60 个 propsSchema     │   ── 60 个 ui.* + 7 个语义/布局
│ + semanticMetadata           │
│ contracts.ts: 7 个语义契约   │
└──────────────┬──────────────┘
               │ toStrictJsonSchema → createComponentContract → 哈希
┌──────────────▼──────────────┐
│ ② 冻结的官方 Catalog         │   运行时·进程启动（确定性重建，无文件）
│ 67 契约 + manifest           │   contractSetHash / dependencyLockHash
└──────────────┬──────────────┘
               │
┌──────────────▼──────────────┐
│ ③ 每轮选组件                 │   运行时·每次 turn
│ foundation ∪ 调用方指定       │   selectOfficialComponents，上限 128
└──────────────┬──────────────┘
               │
┌──────────────▼──────────────┐
│ ④ 与渲染器协商               │   运行时·每次 turn
│ 候选 ∩ renderer capability   │   不支持 → 剔掉（显式则报错）
│ 未覆盖 → 抛错                │   → rendererCapabilitySetHash
└──────────────┬──────────────┘
               │
┌──────────────▼──────────────┐
│ ⑤ 冻结成本轮 Slice           │   运行时·每次 turn
│ + resources + limits         │   → sliceHash（4 个哈希）
└──────────────┬──────────────┘
               │
        ┌──────┴───────┐
        ▼              ▼
┌───────────────┐ ┌───────────────┐
│ ⑥A OGL 文本签名│ │ ⑥B strict JSON│   运行时·每次 turn
│ 30.5 KB (67)   │ │ Schema 工具    │   ← 二选一，同一份 slice
│ 8.0 KB (16)    │ │ 110 KB (67)   │
└───────────────┘ └───────────────┘
        │              │
        └──────┬───────┘
               ▼
        模型输出 → lowering → normalize → 事务 overlay → 全量校验通过才 commit
```

---

## 8. 上幻灯片用的一页文案草稿

### 标题候选

1. **「目录不是文档，是每次对话现裁的一张清单」**
2. **「60 个组件，我们只给模型 16 个」**
3. **「同一份契约，两条出口：8 KB 的签名 vs 110 KB 的 Schema」**

（推荐 **2**：有数字、有取舍、一句话能听懂；**1** 更准但偏抽象。）

### 正文草稿（≤160 字）

> 我们的 Catalog 就是一张「本轮允许用什么组件」的清单。60 个 Shadcn 组件全塞进提示词，光目录就 30 KB、约 7600 token；而典型一问只要 16 个组件，8 KB 就够了 —— 差 3.8 倍。
>
> 所以每轮开头做四件事：注入两个基础组件、并上这次要用的、跟客户端渲染器对一遍能力（对不上直接剔除）、然后冻结成一个带哈希的 slice。模型拿到的不是「一个库」，是「一张当场的填空题」。
>
> 目录省下来的每一 KB，都是模型想跑偏时少一条路。

---

## 附：口径风险（会被追问，先记下来）

| # | 说法 | 实际情况 | 证据 |
| --- | --- | --- | --- |
| 1 | 「生产 OGL 提示词上限 20 KiB」 | **是 96 KiB**（96 × 1024 = 98,304 B）。20 KiB 找不到对应常量 | `packages/compiler/src/language.ts:16`；`apps/benchmark/README.md` 与之矛盾 |
| 2 | 「生产 Host 有 18 契约上限」 | **没有**。硬上限是 **128**；18 只是测试里的一个断言样本 | `catalog-components.ts:3`；`apps/benchmark/src/runner.test.ts:54` |
| 3 | 「Slice 按意图/数据形状裁组件」 | **不准确**。intent planner 只决定*交互*（tabs/filter/sort/paginate/form）；组件清单由 foundation + 调用方显式指定，再由**渲染器能力协商**裁剪 | `intent-planner.ts:77`；`turn.ts:1035,1037-1049` |
| 4 | 「67 个契约都能走填表通道」 | **不能**。无数据资源时，`ui.table`、`ui.record-list`、`data.metric`、`analysis.insight`、`data.chart` 会被排除（缺 `needs a data resource` / `nested resource binding`），实测只剩 62 | `/tmp/catalog-probe3.ts` 输出 |
| 5 | 「strict schema = 完整校验」 | **不是**。strict 丢掉了 25 个校验关键字（`pattern`/`minimum`/`maxLength`…），语义权威在 Host 编译器 | `packages/ai-sdk/src/structured/schema.ts:36-45` |
| 6 | 「我们只有一个渲染器」 | 精确说：只有 **Radix 一个 driver**，但它是「60/60 全覆盖 + 源码级桥 + 构建时自校验的 release」，不是 demo 级适配 | `theme.mdx:56-67`；`adapter-shadcn/scripts/renderer-manifest.ts` |
| 7 | `registry/base`、`registry/aria` 存在 | **是空目录**，只有 `registry/radix` 有实现 | `ls packages/adapter-shadcn/registry/` |

### 实测数字汇总（本机，`bun`，2026-10）

| 指标 | 数值 |
| --- | --- |
| 官方契约总数 | 67（60 `ui.*` + 7 语义/布局） |
| OGL 提示词 · 16 契约 slice | 8,007 B ≈ 2,002 tokens |
| OGL 提示词 · 全 67 | 30,543 B ≈ 7,636 tokens |
| OGL 提示词 · 仅 60 个 `ui.*` | 29,840 B ≈ 7,460 tokens |
| 放大倍数（16 → 67） | **3.81×** |
| 单组件边际 | 平均 442 B（≈110 tokens），max 760 B |
| 填表通道 · 16 契约 | schema 15,795 B + instructions 3,058 B = 18,853 B ≈ 4,714 tokens |
| 填表通道 · 全 67（实为 62） | schema 100,711 B + instructions 9,666 B = 110,377 B ≈ **27,595 tokens** |
| OpenUI 对照组（`apps/compare` A 列，8 个组件） | 3,996 B ≈ 999 tokens（纯文本，无 JSON Schema） |
| 文本签名 vs JSON Schema | 30.5 KB vs 110 KB ≈ **3.6×** |

> token 数是 `bytes / 4` 的**代理**（`OPEN_GENERATIVE_LANGUAGE_PROMPT_TOKEN_BYTES = 4`），不是真实 tokenizer 计数。口播时说「约」。
