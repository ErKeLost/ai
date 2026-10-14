# Catalog 注入提示词的实测 token 数字

> 目的：给「生成式 UI」幻灯片提供**可上投影、可复现**的硬数据。
> 口径统一：**1 token ≈ 4 字节（UTF-8）**，这是仓库自己写死的代理口径，不是真实 tokenizer。
> 测量时间：2026-02（工作区状态，见 §5「未提交改动」）。
> 只读测量：**未修改任何仓库文件**；脚本持久化在 `catalog-tokens-runs/`（临时中间产物在 `/tmp`）。

---

## 0. 结论速览（可直接上幻灯片）

| 模式 | 契约数 | 注入字符数 | 字节数 | 估算 tokens（字节 ÷ 4） | 出处 |
|---|---|---|---|---|---|
| **全部 67 契约**（60 `ui.*` + 7 核心）· 无数据资源 | 67 | 30,548 | 30,548 | **≈ 7,637** | README.md:10 + `createOfficialCatalog()` |
| **全部 67 契约** · 带 1 个数据资源 | 67 | 34,471 | 34,471 | **≈ 8,618** | 同上 |
| **仅 60 个 `ui.*`**（即"所有 shadcn 类组件"）· 带 1 资源 | 60 | 30,623 | 30,623 | **≈ 7,656** | README.md:10 |
| **仅 7 个核心契约** · 带 1 资源 | 7 | 6,550 | 6,550 | **≈ 1,638** | README.md:10 |
| **生产裁剪 18 契约** · 无数据资源 | 18 | 9,834 | 9,834 | **≈ 2,459** | language.test.ts:839 |
| **生产裁剪 18 契约** · 带 1 数据资源 | 18 | 13,275 | 13,275 | **≈ 3,319** | language.test.ts:839 |
| 全部 67 契约 + **全部 17 个 chart recipe** 都命中 | 67 | 46,304 | 46,304 | **≈ 11,576** | 见 §3 构造方法 |
| 生产 18 契约 + 全部 17 个 recipe | 18 | 25,087 | 25,087 | **≈ 6,272** | 同上 |

**一句话**：把整本目录全塞进提示词 ≈ **8.6k token**；裁剪到生产用的 18 个契约只要 **3.3k token**，
**省掉约 62%**。而目录本身（组件清单）占了全量提示词的 **80%**。

对比 OpenUI（同样是全量注入）：**8,618 vs 8,959** —— 两家几乎一样重（差 4%）。
详见 **§6.4 对比表**（可直接上幻灯片）。

**若要用真实 tokenizer 口径**（e.g. 7,835 而不是 8,618）：见 **§2.1 / §6.4.1** ——
仓库的「字节÷4」稳定高估约 10%，但它是仓库自己的官方口径，对外最好防守。

> **「catalog 如何实现」的讲解要点在 §1 的「关键实现细节」**：
> 契约 → `describeModelJsonSchemaSignature()` 有损压缩成 TypeScript 风格签名（主动砍掉昂贵可选子树）→
> 每条契约一行 canonical JSON → chart recipe 按资源形状动态筛选 → 超预算**抛错**而非截断。

字数 = 字节数，因为整份提示词是纯 ASCII（组件类型名、JSON 键、英文语法规则），无中文。

**持久化的复现脚本**（不依赖 /tmp）：`notes/generative-ui/future/catalog-tokens-runs/`
（`final.ts` 主测量、`verify.ts` 交叉验证、`tsconfig.json` 解析垫片、`oui_prompt_reproduce.sh` OpenUI 测量）。

---

## 1. 这些数字是怎么来的：catalog → 提示词 的真实代码链路

唯一的生成函数是 **`compileLanguagePrompt`**（`packages/compiler/src/language.ts:370`，约 224 行），
被 `compileOpenGenerativeLanguage`（:119）与 `compileOpenGenerativeLanguageForFullCatalogBenchmark`（:135）调用。

链路：

```
createOfficialCatalog()                        packages/components/src/contracts.ts:92
  └─ 67 个 ComponentContract（60 ui.* + 7 语义/布局）
        ↓
createCatalogSetSlice({ components: [...] })   packages/catalog/src/slice.ts:296   ← 生产裁剪发生在这里
        ↓
createCompilerCatalog({ slice, components })   packages/compiler/src/catalog.ts:80
        ↓
compileOpenGenerativeLanguage({ catalog })     packages/compiler/src/language.ts:119
        ↓
compileLanguagePrompt(...)                     packages/compiler/src/language.ts:370
        ↓
systemPrompt（这就是真正注入模型的那段文本）
```

### 提示词的结构（按行归属，字节数）

用「按行归属」统计（组件行 = `"Catalog components:"` 与 `"Governed resources:"` 之间的整行；
每行恰好是一个 canonical JSON 对象）：

| 模式 | 固定语法骨架 | chart recipe 行 | **组件行** | 资源行 | 合计 |
|---|---|---|---|---|---|
| 全量 67 · 带 1 资源 | 4,604 | 1,753 | **27,672**（60 行） | 144 | 34,471 |
| 全量 67 · 无资源 | 2,825 | 0 | **27,681**（60 行） | 3 | 30,548 |
| 生产 18 · 带 1 资源 | 3,410 | 1,753 | **7,670**（17 行） | 144 | 13,275 |
| 生产 18 · 无资源 | 2,122 | 0 | **7,670**（17 行） | 3 | 9,834 |

→ **组件目录行 = 全量提示词的 80.3%（27,672 / 34,471）**；固定语法骨架只有 ~4.6 KB。

### 关键实现细节（讲「catalog 如何实现」时可讲的点）

1. **契约 → 模型可见签名是有损压缩的**，不是把 JSON Schema 原样塞进去：
   - `describeModelJsonSchemaSignature()`（`schema-signature.ts:35`）把 JSON Schema 压成
     TypeScript 风格签名（`?` 可选、`|` 枚举、`readonly T[]`），
     并且**主动砍掉昂贵可选子树**：`MAX_MODEL_SIGNATURE_DEPTH = 6`、
     `MAX_MODEL_OPTIONAL_FIELD_LENGTH = 160`、`MAX_MODEL_OBJECT_LENGTH = 768`，
     而契约本身的完整签名上限是 `MAX_SIGNATURE_DEPTH = 8` / `MAX_SIGNATURE_LENGTH = 8_192`。
   - 注释原话（`schema-signature.ts:28-34`）：
     > "Required fields are never removed. Expensive optional subtrees stay available in the
     > canonical Contract but are intentionally omitted from prompt metadata."
2. **每条契约被压成一行 canonical JSON**：`{"type","summary","useWhen","avoidWhen","propsSignature",...}`，
   空字段直接省略（`language.ts` 的 `componentLines` map）。`useWhen` / `avoidWhen` 会被
   recipe 专属规则分桶（`nonRecipeGuidance`），避免重复。
3. **chart recipe 是按资源形状动态筛选后注入的**（`selectCompatibleChartRecipes`，
   `chart-recipe-selector.ts`）——17 个 recipe 里每次只注入"能对上当前数据结构"的几个。
   例：`date + number` 两列的数据集只命中 2 个 recipe（`revenue-smooth-area`、`contributions-heatmap`）。
4. **超预算直接抛错，不是截断**：`promptBytes > min(slice.limits.maxTextBytes, promptMaxBytes)` 时
   `throw new TypeError(... "Reduce the Catalog Slice.")`（`language.ts` 末尾）。
   错误信息里会附带 token 代理值。
5. **静态契约元数据带缓存**：`CONTRACT_PROMPT_METADATA_CACHE_LIMIT = 64`，
   避免每轮重算 67 条契约的签名。

---

## 2. token 口径（重要：必须和别的数字对齐时说明）

仓库**明确写死**的代理口径，`packages/compiler/src/language.ts:19-20`：

```ts
export const OPEN_GENERATIVE_LANGUAGE_PROMPT_MAX_BYTES = 96 * 1_024;
export const OPEN_GENERATIVE_LANGUAGE_PROMPT_TOKEN_BYTES = 4;   // ← token 代理 = 4 字节
export const OPEN_GENERATIVE_LANGUAGE_PROMPT_MAX_TOKEN_PROXY =
  Math.ceil(OPEN_GENERATIVE_LANGUAGE_PROMPT_MAX_BYTES / OPEN_GENERATIVE_LANGUAGE_PROMPT_TOKEN_BYTES);
```

```ts
export function estimateOpenGenerativeLanguagePromptTokens(prompt: string): number {
  return Math.ceil(utf8Length(prompt) / OPEN_GENERATIVE_LANGUAGE_PROMPT_TOKEN_BYTES);
}
```

- **口径 = UTF-8 字节数 ÷ 4，向上取整**。不是 tiktoken / 任何真实 tokenizer。
- `packages/compiler/src/language.test.ts:839` 的测试名就叫
  "keeps the maximum official component Slice inside explicit byte and token proxy budgets"，
  断言的就是 `bytes ≤ OPEN_GENERATIVE_LANGUAGE_PROMPT_MAX_BYTES` 与
  `estimateOpenGenerativeLanguagePromptTokens(...) ≤ ...MAX_TOKEN_PROXY`。
- 因为提示词是纯 ASCII，这个代理对英文/JSON 文本大致靠谱（真实 tokenizer 通常 3.5–4.5 字节/token），
  **但对外报数时不要写成"实测 token"，应写"字节数 ÷ 4 估算"**。

### 2.1 用真实 tokenizer 复核过（**这是新增的交叉验证**）

仓库内**没有** tokenizer 依赖，但我们可以在 /tmp 里装 tiktoken 来复核代理口径：

```bash
python3 -m pip install --target /tmp/tkenv tiktoken   # 不写入任何仓库
python3 catalog-tokens-runs/count-tokens.py
```

| 我们的变体 | 字节 | 仓库口径（字节÷4） | **tiktoken `o200k_base` 真值** | 偏差 |
|---|---|---|---|---|
| 全量 67 契约 + 1 资源 | 34,430 | 8,607 | **7,835** | 代理高估 **+9.9%** |
| 全量 67 契约 · 无资源 | 30,537 | 7,634 | **6,948** | +9.9% |
| 仅 60 个 `ui.*` + 1 资源 | 30,659 | 7,664 | **6,982** | +9.8% |
| 生产裁剪 18 契约 + 1 资源 | 13,286 | 3,321 | **3,004** | +10.6% |
| 仅 7 个核心契约 + 1 资源 | 6,509 | 1,627 | **1,437** | +13.2% |

**结论：仓库的 `字节÷4` 口径是保守上界，稳定高估约 10%。**
好处是它比真实值更严（预算判定不会漏放行）；坏处是**对外说"约 8.6k tokens"时，
真实 tokenizer 只有约 7.8k**。幻灯片上建议**只用一个口径并注明**，
推荐直接写「**字节 ÷ 4 估算 ≈ 8.6k**」，因为那是仓库自己的官方口径、也最好防守。

> 上表字节数基于 `slice.limits = { maxOperations: 64, maxTextBytes: 64_000 }`（仓库自带测试的取值）。
> 提示词里有一行 `Limits: {...}` 会随配置变化（16 MiB 取值下同一提示词为 34,471 字节，差 41 字节），
> 所以不同脚本跑出的绝对字节数会有 ~40 字节级差异，属正常。

---

## 3. 复现方法

### 3.1 一次性准备（不写入仓库）

```bash
mkdir -p /tmp/ogmeasure
# 生成 tsconfig：把仓库 tsconfig.base.json 的 paths 全部改写成绝对路径
cd /Users/work/open-generative && node -e '
const fs=require("fs");
const base=JSON.parse(fs.readFileSync("tsconfig.base.json","utf8"));
const paths={};
for(const [k,v] of Object.entries(base.compilerOptions.paths))
  paths[k]=v.map(p=>"/Users/work/open-generative/"+p.replace("./",""));
fs.writeFileSync("/tmp/ogmeasure/tsconfig.json", JSON.stringify({compilerOptions:{...base.compilerOptions, paths}}, null, 2));
'
```

> 为什么需要这一步：`bun` 从**脚本所在目录**往上找 `node_modules`，
> `/tmp` 下解析不到 `@open-generative/*`（会 fallback 到 bun 全局缓存里的**已发布旧版**，
> 实测拿到的是 0.3.22 的 dist，只返回 6 个契约 —— 直接用会得到错数字）。
> 用绝对路径 `paths` 指向 `packages/*/src/index.ts` 才能测到工作区真实源码。

### 3.2 主测量脚本 `/tmp/ogmeasure/final.ts`

```ts
import { createOfficialCatalog } from "@open-generative/components";
import {
  compileOpenGenerativeLanguage,
  compileOpenGenerativeLanguageForFullCatalogBenchmark,
  createAuthoringPropsSchema,
} from "@open-generative/compiler";
import type { CompilerCatalogLike } from "@open-generative/compiler";
import type { ComponentContract } from "@open-generative/catalog";

const enc = new TextEncoder();
const B = (s: string) => enc.encode(s).byteLength;
const T = (s: string) => Math.ceil(B(s) / 4);           // ← 仓库口径

const official = await createOfficialCatalog();

// 与 language.test.ts:839 完全一致的资源
const plainRes = {
  sliceResourceId: "resource-000001",
  source: { bindingId: "resource-analysis" },
  descriptor: {
    label: "Daily values",
    columns: [
      { columnId: "date",  label: "Date",  valueSchema: { type: "string", format: "date" } },
      { columnId: "value", label: "Value", valueSchema: { type: "number" } },
    ],
  },
};

// 复刻 language.test.ts:1392 的 languageCatalog() 极简 CompilerCatalogLike
function cat(contracts: readonly ComponentContract[], resources: readonly unknown[] = []): CompilerCatalogLike {
  const entries = contracts.map((c, i) => ({
    sliceComponentId: `component-${String(i + 1).padStart(6, "0")}`, contract: c.ref,
  }));
  const byId  = new Map(entries.map((e, i) => [e.sliceComponentId, contracts[i]!]));
  const props = new Map(contracts.map((c) => [c.ref.componentType, createAuthoringPropsSchema(c)]));
  return {
    slice: {
      sliceHash: `sha256:${"f".repeat(64)}`, contractSetHash: `sha256:${"e".repeat(64)}`,
      components: entries, resources,
      limits: { maxOperations: 1_000, maxTextBytes: 16 * 1024 * 1024 },
    },
    componentBySliceId: (id: string) => byId.get(id),
    authoringPropsSchema: (ref: any) => props.get(ref.componentType)!,
  } as unknown as CompilerCatalogLike;
}

const full67  = official.componentContracts;                 // 67
const slice18 = [official.components.dataChart,
                 ...Object.values(official.components.ui).slice(0, 17)]; // 18
const ui60    = Object.values(official.components.ui);        // 60

for (const [mode, contracts, resources, full] of [
  ["全量 67 · 无资源",        full67,  [],        true ],
  ["全量 67 · 1 资源",        full67,  [plainRes], true ],
  ["仅 60 ui.* · 1 资源",     ui60,    [plainRes], true ],
  ["生产 18 · 1 资源",        slice18, [plainRes], false],
  ["生产 18 · 无资源",        slice18, [],        false],
] as const) {
  const fn = full ? compileOpenGenerativeLanguageForFullCatalogBenchmark : compileOpenGenerativeLanguage;
  const lang = fn({ catalog: cat(contracts, resources), presentationPolicy: "auto" });
  console.log(mode, contracts.length, B(lang.systemPrompt), T(lang.systemPrompt));
}
```

运行：

```bash
cd /tmp/ogmeasure && bun run final.ts
```

**实测输出**（2026-02，工作区）：

```
| 模式                             | 契约数 | 字节数 | token 代理 |
| 全量 67 契约 · 无资源             |  67    | 30,548 |  7,637 |
| 全量 67 契约 · 1 资源             |  67    | 34,471 |  8,618 |
| 全量 67 契约 · 1 资源 · required  |  67    | 34,435 |  8,609 |
| 全量 67 契约 · 逼真资源           |  67    | 33,696 |  8,424 |
| 仅 60 个 ui.* 契约 · 1 资源       |  60    | 30,623 |  7,656 |
| 仅 7 个核心契约 · 1 资源          |   7    |  6,550 |  1,638 |
| 生产裁剪 18 契约 · 1 资源         |  18    | 13,275 |  3,319 |
| 生产裁剪 18 契约 · 无资源         |  18    |  9,834 |  2,459 |
| 生产裁剪 18 契约 · required       |  18    | 13,291 |  3,323 |
```

### 3.3 交叉验证（证明 harness 与仓库自己的测试等价）

```bash
cd /tmp/ogmeasure && bun run verify.ts
```

输出：

```
contracts: 18
bytes: 13286 <= 96KiB? true
tokenProxy: 3322 <=  24576
recipes: ["revenue-smooth-area","contributions-heatmap"]
expect  : ["revenue-smooth-area","contributions-heatmap"]
```

与 `language.test.ts:869-871` 的断言（同样的 recipe 列表）**逐字一致** → harness 可信。
（此处 bytes 为 13,286 而非 13,275，唯一差别是 `limits` 行不同：测试用 `maxTextBytes: 64_000`，
我的主脚本用 16 MiB 以隔离"测量"与"预算强制"两件事。）

### 3.4 仓库自带测试（只读运行，不改文件）

```bash
cd /Users/work/open-generative/packages/compiler && bun test src/language.test.ts
# → 29 pass / 0 fail
# 含 "keeps the maximum official component Slice inside explicit byte and token proxy budgets"
#   "keeps the complete registered Catalog inside the general production budget"
```

### 3.5 「所有 17 个 recipe 都命中」怎么构造

`selectCompatibleChartRecipes` 的兼容性谓词要求（`chart-recipe-selector.ts:31-49`）分两类：
`temporal >= 1` 与 `temporal === 0`。**两个资源 + `estimatedItems` 不设值**
（不设值时 `rowsMatch` 恒真）即可让 17 个 recipe 全部命中：

```ts
const temporalRes = { /* bindingId: "resource-temporal" */ descriptor: { label: "Activity history", columns: [
  { columnId: "date", label: "Date", valueSchema: { type: "string", format: "date" } },
  { columnId: "v1" }, { columnId: "v2" }, { columnId: "v3" }, { columnId: "v4" },   // 均 number
  { columnId: "bucket", valueSchema: { type: "string" } } ] } };
const categoricalRes = { /* bindingId: "resource-categorical" */ descriptor: { label: "Segment breakdown", columns: [
  { columnId: "segment" }, { columnId: "device" },                                  // 均 string
  { columnId: "value" }, { columnId: "target" }, { columnId: "count" } ] } };       // 均 number
```

→ 全量 67 契约 = **46,304 字节 ≈ 11,576 token 代理**；生产 18 契约 = 25,087 字节 ≈ 6,272。

---

## 4. 组件数量：确切数字与出处

| 数字 | 含义 | 出处 |
|---|---|---|
| **67** | 官方 ComponentContract 总数 | `README.md:10`；`createOfficialCatalog().componentContracts.length`（实测 67） |
| **60** | 库中立的 `ui.*` 契约（≈ shadcn/ui 那一层） | `README.md:10`"60 library-neutral `ui.*` contracts"；`uiComponentFamilies` 数组（`packages/components/src/ui.ts:18`）实测 60 项 |
| **7** | 核心语义/布局契约 | `README.md:10`"seven Core contracts"：`data.chart` `data.metric` `analysis.insight` `content.text` `layout.stack` `layout.grid` `analysis.report` |
| **17** | chart recipe（**不是契约**，按需注入） | `README.md:10`"17 chart recipes"；`packages/components/src/chart-spec.ts:12` 的 `chartRecipes` 实测 17 项 |
| **31** | shadcn 适配器实际安装的 shadcn registry 依赖 | `packages/adapter-shadcn/registry/radix/open-generative.json` 的 `registryDependencies` 实测 31 项 |
| **67** | 适配器能渲染的契约数 = 全覆盖 | `packages/adapter-shadcn/dist/renderer-manifest.json` → `contracts.length === 67`（`ui.*` 60 + 非 UI 7，无重复） |

### ✅ 「82 组件 / 8959 tokens」的真实归属：**是 OpenUI 的数字，不是我们的**

> ⚠️ 更正：本节初稿曾判为「本仓库查无出处」。**在本仓库确实查无，但它属于 OpenUI**，
> 两个数字都有硬出处，可以直接用。详见 §6。

- **82 组件** = OpenUI **playground** 库的组件数。
  出处：`/Users/work/ai/openui/docs/generated/playground-library.spec.json`（`components.length === 82`）。
  另：chat 库 84、benchmark 目录 70，OpenUI 没有单一"官方总数"。
- **8959 tokens** = OpenUI playground **完整 prompt**（`playground-production`，含 `openuiPromptOptions`
  的 additionalRules）的 **35,837 字符 ÷ 4 = 8,959.25 → 8,959**，即与本文**同一"字符÷4"代理口径**。
  该变体用真实 tokenizer（tiktoken `o200k_base`）为 **9,125 tokens**。
- 所以「82 组件 / 8959 tokens」是 **OpenUI 侧、字符÷4 口径**的一组自洽数字。
- 我们自己的对应数字是 **67 契约 / 34,471 字节 ÷ 4 ≈ 8,618**。
  **两者几乎同重（8,618 vs 8,959，差 4%）—— 这是个很好的对比素材，见 §6.3。**
- 逐项排查记录：`82` 无法由 `60 + 7 + 17 = 84`、`67 + 17 = 84` 等我们这边的组合得出；
  我们仓库全文（排除 `node_modules` / `vendor`）搜不到 `8959` / `8_959`。

---

## 5. 与文档/代码不一致的地方（上幻灯片前必须定口径）

### 5.1 `20 KiB` vs `96 KiB` —— README 与代码矛盾

| 位置 | 说法 |
|---|---|
| `apps/benchmark/README.md:66` | "…does not change the production Host's **18-contract Slice limit or 20 KiB OGL prompt limit**." |
| `packages/compiler/src/language.ts:19` | `OPEN_GENERATIVE_LANGUAGE_PROMPT_MAX_BYTES = 96 * 1_024`（**96 KiB**） |

全仓库 `20 KiB` 只在 README 出现这 **1 次**，任何代码里都没有 20 KiB 的常量。

**而且这是工作区未提交改动造成的**：

```bash
cd /Users/work/open-generative && git diff -- packages/compiler/src/language.ts
# -export const OPEN_GENERATIVE_LANGUAGE_PROMPT_MAX_BYTES = 20 * 1_024;
# +export const OPEN_GENERATIVE_LANGUAGE_PROMPT_MAX_BYTES = 96 * 1_024;
```

- **HEAD（已提交）** = 20 KiB。此时全量 67 契约的提示词 30,548 字节 **> 20,480 字节**
  → 会 `throw`，`language.test.ts:884`「keeps the complete registered Catalog inside the
  general production budget」应当失败。
- **工作区（未提交）** = 96 KiB → `bun test src/language.test.ts` **29 pass / 0 fail**。
- 结论：**工作区是自洽的，README 的"20 KiB"是过期描述**（或改动前遗留）。
  **上幻灯片时应说"96 KiB 上限"**，并顺手修 README 这一行。
  > 注：本仓库 git 历史被压成单个提交 `51ddde2 "chore: update code"`，无法用 `git log -S` 追溯来龙去脉。

- 另外 `apps/benchmark/README.md` 说 full-catalog 是"67 official Contracts (60 library-neutral UI
  families plus 7 semantic/layout Contracts)"—— 与实测 **完全一致**，这部分是准的。
- 还有一处措辞要注意：README 说 18 契约是"production Host's Slice limit"，
  但代码里 18 这个数字**不是**编译器的硬限制 —— 它是
  `language.test.ts:839` 里那个测试用例选定的规模（`dataChart + 前 17 个 ui.*`）。
  生产里真正约束的是 `slice.limits` + 96 KiB 预算。讲的时候说"我们生产用的裁剪规模是 18 个契约"更准。

### 5.2 未提交改动

测量时 `/Users/work/open-generative` 工作区是 **dirty** 的（`git status --short` 有大量 ` M`，
含 `.changeset/`、`README.md`、`packages/adapter-shadcn/*`、`packages/compiler/src/language.ts` 等）。
**上面的所有数字基于工作区源码**，不是 HEAD。若要对齐"已提交版本"，需把预算按 §5.1 换成 20 KiB 并重测
（提示词体积本身不变，只有"是否超限抛错"的判定会变）。

---

## 6. OpenUI 侧实测（Thesys OpenUI Lang）

仓库：`/Users/work/ai/openui`（只读；本仓库内另有 vendored 副本 `vendor/openui/`）。
复现脚本：**`/tmp/oui_prompt_reproduce.sh`** → 输出 `/tmp/oui_prompt/out/*.txt`（报告 `/tmp/oui_prompt/REPORT.md`）。
脚本**不安装任何依赖**：用 node ≥ 22.6 的原生 TS type-stripping，把 OpenUI 真实的
`packages/lang-core/src/parser/prompt.ts` + `builtins.ts` + `packages/react-ui/src/genui-lib/prompt-options/index.ts`
拷到 /tmp，只 stub 掉 telemetry / cloud-config 两个无关 import，然后调真实 `generateSystemPrompt()`。

```bash
bash /tmp/oui_prompt_reproduce.sh
```

### 6.1 OpenUI prompt 体积（字符 / 字节 / 真实 tokens）

真实 tokenizer = **tiktoken `o200k_base`**（与 OpenUI docs 用的 `gpt-tokenizer` 一致）。

| OpenUI 变体 | 组件数 | 字符 | 字节 | 行 | 字符÷4 | **真实 tokens** |
|---|---|---|---|---|---|---|
| `playground-production`（含全部 additionalRules） | 82 | **35,837** | 36,063 | 326 | **8,959** | **9,125** |
| `playground-route-examples-only`（docs playground 路由实际发送） | 82 | 34,116 | 34,332 | 310 | 8,529 | **8,741** |
| `playground-library-only`（只有签名） | 82 | 28,448 | 28,652 | 205 | 7,112 | — |
| `chat-production` | 84 | **53,688** | 53,975 | 481 | 13,422 | **14,041** |
| `chat-library-only` | 84 | 26,387 | 26,591 | 198 | 6,597 | — |
| `empty-no-components`（空库骨架） | 0 | 2,372 | 2,386 | 37 | 593 | 511 |

**拆解（playground-production，35,837 字符）：**

| 段落 | 字符 | 占比 |
|---|---|---|
| Component Signatures（**组件签名**） | **25,536** | **71.3%** |
| Examples（few-shot） | 5,666 | 15.8% |
| Final Verification | 1,951 | 5.4% |
| Hoisting & Streaming | 738 | 2.1% |
| Action — Button Behavior | 687 | 1.9% |
| **Syntax Rules（语法规则）** | **928** | **2.6%** |
| Important Rules | 138 | 0.4% |
| preamble | 186 | 0.5% |

→ **语法规则只有 928 字符（≈221 tokens），组件签名 25,536 字符（≈6,364 tokens）占 71%。**
组件目录净增 ≈ **26,076 字符 ≈ 6,501 tokens**（vs 空库骨架）。

### 6.2 OpenUI 组件数出处

| 数字 | 含义 | 出处 |
|---|---|---|
| **82** | playground 库 | `packages/react-ui/src/genui-lib/openuiLibrary.tsx:281`（`createLibrary({components:[...]})`）· `docs/generated/playground-library.spec.json` → `components.length === 82` ✅ 已独立复核 |
| **84** | chat 库 | `packages/react-ui/src/genui-lib/openuiChatLibrary.tsx:388` · `docs/generated/chat-library.spec.json` → 84 ✅ 已独立复核 |
| 70 | benchmark 目录 | `docs/lib/benchmark-data.ts:35` |
| 58 / 54 | `*-system-prompt.spec.json` 里的旧数 | **已过期、无引用**，别用 |

**OpenUI 没有单一"官方组件总数"** —— 取决于用哪个库（playground / chat / benchmark）。

### 6.3 「比 JSON 少 67% token」的出处与真实含义

- **有出处**：`README.md:24`、`README.md:139`、`docs/content/docs/.../benchmarks.mdx:108`。
- **但要注意三点**（写进幻灯片前必须知道，否则会被反问）：
  1. 原文是 **"up to 67%"** —— 上限，不是平均值。
  2. 它指 **生成输出（completion）的 token**，**不是组件目录注入的 token**。
     所以拿它来说明"目录注入更省"是**错位的**。
  3. 真实基准：对 Vercel `json-render` 省 **67.1%（单场景 contact-form）**；
     **全场景合计只省 52.8%**（4,800 vs 10,180 tokens）。
- **结论**：幻灯片上说"OpenUI 官方称比 JSON 最多省 67% 的输出 token"是准确的；
  说"目录注入省 67%"不准确。我们自己的"裁剪省 62%"是另一件事（见 §6.4），别混用。

### 6.4 可以直接上幻灯片的对比表（**同一口径：字符/字节 ÷ 4**）

| 方案 | 组件数 | 注入体积 | ÷4 估算 | 真实 tokenizer |
|---|---|---|---|---|
| **OpenUI playground**（全量，含全部规则） | 82 | 35,837 字符 | **8,959** | 9,125 |
| OpenUI playground（docs 路由实际版本） | 82 | 34,116 字符 | 8,529 | **8,741** |
| OpenUI chat 库 | 84 | 53,688 字符 | 13,422 | **14,041** |
| **我们：全量 67 契约** + 1 资源 | 67 | 34,471 字节 | **8,618** | — |
| 我们：全量 67 契约 · 无资源 | 67 | 30,548 字节 | 7,637 | — |
| **我们：生产裁剪 18 契约** + 1 资源 | 18 | 13,275 字节 | **3,319** | — |
| 我们：仅 7 个核心契约 + 1 资源 | 7 | 6,550 字节 | 1,638 | — |

**这张表能讲出的两个结论：**

1. **全量注入时，我们和 OpenUI 几乎一样重**：8,618 vs 8,959（差 4%）。
   两家都把"整本目录塞进提示词"这个做法推到了 ~8.6–9.0k tokens 的量级 —— 这不是谁实现得差，
   而是**把 60–80 个组件的签名写清楚，本身就要这么多字**。
2. **赢在裁剪**：我们生产只用 18 个契约 = **3,319**，比全量省 **61.5%**。
   OpenUI 那边没法裁（要裁得靠自己实现一套选择逻辑）—— 这正是我们
   `createCatalogSetSlice` + `selectCompatibleChartRecipes` 的价值。

> 口径注意：上表"÷4 估算"两列都是**代理**（我们=字节÷4，OpenUI=字符÷4，纯 ASCII 下等价）；
> "真实 tokenizer"列是 tiktoken `o200k_base`（OpenUI 官方 docs 用的是 `gpt-tokenizer`/`gpt-5`，同族）。
> 我们这边的真实 tokenizer 数字已补测（见 §2.1）：全量 67+1 资源 = **7,835**（不是 8,618），
> 生产 18 契约+1 资源 = **3,004**（不是 3,319）。
> **两侧真实 tokenizer 对比：7,835（我们 67 契约）vs 9,125（OpenUI 82 组件）→ 我们反而轻 14%。**
> 上幻灯片时**只用一套口径**，推荐仓库口径「字节÷4」，并注明是估算。

### 6.4.1 同一口径下的真实 tokenizer 对照（推荐用这张）

| 方案 | 组件数 | **真实 tokens（o200k_base）** | 备注 |
|---|---|---|---|
| OpenUI playground（全量） | 82 | **9,125** | 官方 docs 路由同族 |
| OpenUI chat 库 | 84 | **14,041** | |
| **我们：全量 67 契约 + 1 资源** | 67 | **7,835** | 比 OpenUI playground 轻 **14%** |
| **我们：生产裁剪 18 契约 + 1 资源** | 18 | **3,004** | 比我们自己的全量省 **61.7%** |
| 我们：仅 7 个核心契约 + 1 资源 | 7 | **1,437** | 字节÷4 = 1,627 |

### 6.5 我们仓库内的 OpenUI 交叉线索（未用于上表，备用）

- `vendor/openui/benchmarks/samples/metrics.json` —— 每个样例的 `ttft_ms` / `completion_tokens` / `tps`，
  例如 `dashboard`: 1,229 completion tokens、TTFT 769ms。**这是输出侧数据，不是注入侧。**
- `vendor/openui/docs/app/(home)/benchmarks/{language,framework}/data.json` —— benchmark 原始数据。

---

## 7. 存疑 / 待确认清单

| 项 | 状态 |
|---|---|
| 「82 组件 / 8959 tokens」 | ✅ **是 OpenUI 的数字，有出处**（§4 / §6.1）。我们自己的对应值是 67 契约 / ≈8.6k |
| `20 KiB` vs `96 KiB` | ⚠️ **README 与代码矛盾**，工作区为 96 KiB 且测试全绿（§5.1）。需修 README |
| 生产 slice 到底是几个契约 | 18 是测试用例规模，不是编译器硬限制（§5.1 末） |
| 我们的 token 数 | ✅ 已用真实 tokenizer 复核（§2.1）：仓库口径「字节÷4」**稳定高估 ~10%**。对外只用一个口径并注明 |
| 「省 67%」 | ✅ 有出处，但指**输出 token**（且是 "up to"，全场景 52.8%），**不是目录注入**（§6.3） |
| OpenUI 组件总数 | ⚠️ **不存在单一官方总数**：playground 82 / chat 84 / benchmark 70（§6.2） |
| 两边字节数为何差 ~40 字节 | 提示词里有一行 `Limits: {...}`，随 `slice.limits` 取值变化（§2.1 末）。不影响结论 |
| HEAD 状态下能否编译全量目录 | 存疑：HEAD = 20 KiB < 30,548 字节，预期抛错（未在 HEAD 上实测，工作区已有改动） |

---

## 8. 复现脚本清单（`catalog-tokens-runs/`）

| 文件 | 用途 | 运行方式 |
|---|---|---|
| `tsconfig.json` | 把 workspace `paths` 改成绝对路径，让 `/tmp` 脚本能解析到真实源码 | 自动读取 |
| `final.ts` | 我们这边主测量（67 / 60 / 18 / 7 契约 × 资源有无） | `cd /tmp/ogmeasure && bun run final.ts` |
| `verify.ts` | 与仓库测试 recipe 断言逐字交叉验证 | `bun run verify.ts` |
| `our-ogl-prompts.ts` | 导出真实提示词全文到 `/tmp/ogl-prompt-*.txt` | `bun our-ogl-prompts.ts` |
| `our-full67-resource.ts` / `our-shadcn60.ts` / `our-7core.ts` | 补测带资源 / 仅 shadcn / 仅 7 核心 | `bun <file>` |
| `our-openui-style-prompts.ts` | OpenUI 风格的 `buildOgInstructions` 变体 | `bun our-openui-style-prompts.ts` |
| `oui_prompt_reproduce.sh` | OpenUI 真实 `generateSystemPrompt()`，不装依赖 | `bash oui_prompt_reproduce.sh` |
| `count-tokens.py` | 两边全部变体的真实 tokenizer 对照表 | `python3 count-tokens.py` |

前置：`python3 -m pip install --target /tmp/tkenv tiktoken`（仅 `count-tokens.py` 需要）。
