# 接入 OpenUI 的提示词成本：全量 shadcn/ui 要多少 token

> 问题：**一个默认的 AI SDK 项目（没有 system prompt）接入 OpenUI 之后，要多花多少 token？组件库用全量 shadcn/ui。**
> 基线 = 0 token。所以「多花的 token」= 接入后必须往 system prompt 里塞的那一整坨。
>
> 测量时间：2026-02（工作区状态）。**只读测量，未修改 `/Users/work/open-generative` 任何文件。**
> 提示词由**真实的 OpenUI 提示词生成器**产出：`@openuidev/lang-core@0.3.0`（即 `apps/compare` 实际安装的版本）的
> `createLibrary().prompt()` / `generateSystemPrompt()`。

---

## 0. 结论速览（可直接上幻灯片）

| 档 | 组件定义 | 字符 | 字节 | 真实 tokens（o200k_base） | 相对基线多花 |
|---|---|---|---|---|---|
| **基线：默认 AI SDK 项目** | 0 | 0 | 0 | **0** | — |
| **A. 空骨架**（只有 OpenUI 语法规则） | 0 | 2,932 | 2,946 | **620** | +620 |
| **B. 我们的 demo 现状**（8 个 Shadcn block） | 8 | 3,966 | 3,996 | **874** | +874 |
| **C. 全量 shadcn/ui**（60 个 `ui.*` + 1 个布局根） | 61 | 23,080 | 23,216 | **6,426** | **+6,426** |

**一句话**：接入 OpenUI 本身的骨架只要 **620 token**；把**全量 shadcn/ui（60 个组件）**写成 OpenUI 定义，
提示词涨到 **6,426 token** —— 其中 **5,806 token 是组件目录**（平均 **95 token/组件**）。
如果按「最短可读形式」把长枚举收敛掉（见 C4），可以压到 **3,474 token**。

**和 OpenUI 官方自己的库比**：官方 playground 库 82 个组件 = **9,125 token**（真实 tokenizer，见 `catalog-tokens.md` §6.1）。
我们的全量 shadcn 只有 **6,426** —— 少 30%，因为我们**只做 shadcn/ui**，而官方那 82 个里含图表、卡片块、markdown 渲染器等复合组件。

---

## 1. 完整结果表（每个数字都带口径）

生成脚本：`catalog-tokens-runs/openui-full-shadcn.ts`
计数脚本：`catalog-tokens-runs/openui-adoption-tokens.py`（tiktoken `o200k_base` / `cl100k_base`）

| 档 | 组件 | 字符 | 字节 | 字符÷4 | 字节÷4 | **o200k** | cl100k |
|---|---|---|---|---|---|---|---|
| 基线（无 system prompt） | 0 | 0 | 0 | 0 | 0 | **0** | 0 |
| A. 空骨架，带 demo 的 additionalRules | 0 | 2,932 | 2,946 | 733 | 736 | **620** | 625 |
| A′. 空骨架，`additionalRules: []` | 0 | 2,372 | 2,386 | 593 | 596 | **511** | 514 |
| B. demo 现状（8 block） | 8 | 3,966 | 3,996 | 992 | 999 | **874** | 879 |
| B′. demo 现状，`additionalRules: []` | 8 | 3,406 | 3,436 | 852 | 859 | **765** | 768 |
| **C1. 全量 shadcn/ui** | **61** | 23,080 | 23,216 | 5,770 | 5,804 | **6,426** | 6,415 |
| C1′. 全量 shadcn/ui，`additionalRules: []` | 61 | 22,520 | 22,656 | 5,630 | 5,664 | **6,317** | 6,304 |
| C2. 全量 + `prompt.useWhen` 一起写进去 | 61 | 26,865 | 27,001 | 6,716 | 6,750 | **7,150** | 7,139 |
| C3. **整个官方目录 67 契约** | 67 | 61,741 | 61,889 | 15,435 | 15,472 | **17,631** | 17,550 |
| C4. 全量 shadcn/ui · LEAN（枚举 >10 收敛成 `string`） | 61 | 14,800 | 14,936 | 3,700 | 3,734 | **3,474** | 3,463 |

`additionalRules` = `apps/compare/src/lib/openui/prompt.ts` 里那 5 条（≈560 字节）。A/B/C1 用同一套，保证可比。

**口径提醒**：仓库惯用口径是 **字节÷4**（`packages/compiler/src/language.ts:20`）。
这一列在 OpenUI 提示词上**低估**（5,804 vs 真实 6,426，−9.7%）；而在我们自己的 OGL 提示词上**高估约 10%**
（8,618 vs 7,835）。所以**上幻灯片时只用一列并注明**，不要混用。

---

## 2. 提示词的结构拆解（为什么 6.4k 全是目录）

按 `## ` 段落切分（与 `oui_prompt_reproduce.sh` 同一套切法）：

| 段落 | A 空骨架 | B demo(8) | **C1 shadcn(61)** | C4 LEAN | C3 (67) |
|---|---|---|---|---|---|
| preamble | 186 | 186 | 186 | 186 | 186 |
| Syntax Rules | 928 | 929 | 934 | 934 | 934 |
| **Component Signatures** | **148** | **1,178** | **20,272** | **11,992** | **58,933** |
| Hoisting & Streaming | 737 | 739 | 749 | 749 | 749 |
| Important Rules | 138 | 138 | 138 | 138 | 138 |
| Final Verification | 790 | 791 | 796 | 796 | 796 |
| **合计（字符）** | 2,932 | 3,966 | **23,080** | 14,800 | 61,741 |

**固定的语法骨架只有 ≈2,780 字符**（preamble + Syntax Rules + Hoisting + Rules + Final Verification；
不含 `additionalRules` 时正好是 A′ 档的 **511 token**）。**组件签名段落 = 全量提示词的 87.8%。**
A 档那 148 字符是段落标题 + 一行说明，里面没有组件。

**C1 的组件签名细节**（来自 `manifest.json`）：

- 61 条签名，签名正文 **17,003 字符**（平均 **279**/组件），描述 **2,877 字符**（平均 **47**/组件）
- 单条最长：`RecordList` 919 · `RadioGroup` 734 · `Combobox` 733 · `ToggleGroup` 700 · `NativeSelect` 695
- 单条最短：`ChartFrame` 66 · `Label` 58 · `Kbd` 57 · `Spinner` 50 · `LayoutStack` 46

**膨胀的来源是枚举**：`icon?: "activity" | "alert-circle" | … | "x"` 这一串 **37 个字面量 = 466 字符/次**，
在 60 个组件里出现 **7 次**（共 3,262 字符）；全库 >10 字面量的枚举共 **18 处、8,388 字符**。
把它们收敛成 `string`（C4）→ 提示词从 23,080 掉到 14,800（**−36%**），token 从 6,426 掉到 3,474（**−46%**）。

> C3 的 61,741 字符几乎全是 `data.chart` 一个组件：它的 `spec` 把整本 chart recipe 联合类型内联进签名，
> **单条签名 37,571 字符**。其余 6 个核心契约加起来只有 696 字符。
> 这说明「把结构化数据契约也塞进 UI 目录」的代价极高 —— 和 `catalog-tokens.md` 里「组件目录占 80%」的结论同源。

---

## 3. 交叉验证：我们的全量 shadcn 定义 vs OpenUI 官方库

`catalog-tokens.md` §6.1 已实测 OpenUI 官方 playground 库（82 组件）的 `Component Signatures` 段落 = **25,536 字符**。

| | 组件数 | Component Signatures 段落 | 字符/组件 |
|---|---|---|---|
| OpenUI 官方 playground 库 | 82 | 25,536 | **311.4** |
| **我们机械转换的全量 shadcn/ui** | 61 | 20,272 | **332.3** |
| 差异 | | | **+6.7%** |

**同一个量级（差 6.7%），说明机械转换的写法既没有明显偏胖也没有偏瘦** —— 这就是任务要求的交叉验证。
略重的原因很直白：shadcn 契约的 props 里带大量枚举（variant/size/icon/tone），而 OpenUI 官方库把
图标、颜色这类东西大多收在别处。

---

## 4. 哪些是官方现成数据、哪些是机械转换推导的

| 数字 | 性质 | 出处 |
|---|---|---|
| A 空骨架 2,372 字符 / 511 token | **官方生成器产出** | 本脚本的 `A-bare.txt`，与 `catalog-tokens.md` §6.1 的 `empty-no-components` **逐字节一致**（已 `diff` 验证） |
| B demo 8 block 3,996 字节 | **官方生成器产出，且与线上代码逐字节一致** | 已断言 `B-demo8.txt === apps/compare 的 openuiPrompt`（md5 `ce3a33f…`） |
| C1/C2/C3/C4 全部数字 | **机械转换推导**（不是 OpenUI 官方库） | 见下方转换规则 |
| OpenUI 官方 playground 82 组件 = 25,536 字符 / 9,125 token | 官方现成数据 | `catalog-tokens.md` §6.1、§6.4.1 |
| shadcn/ui 组件数 61 / 32 / 60 | 仓库内文件与契约统计 | 见 §5 |

### 机械转换规则（没有任何一条签名是手写的）

```
contract.resolvedPropsSchema                // 我们的 60 个 ui.* 契约，JSON Schema
  -> 删掉 $schema / $defs，原样交给 zod 4 的 z.fromJSONSchema()
  -> defineComponent({ name, props, description })      // OpenUI 官方 API
       name        = "ui.alert-dialog" -> "AlertDialog"（ui. 前缀剥掉、kebab->PascalCase）
       description = contract.prompt.summary            // C2 额外拼上 prompt.useWhen
  -> createLibrary({ root, components })                // OpenUI 官方 API
  -> library.prompt({ bindings:false, toolCalls:false, additionalRules:[...] })
```

签名本身由 OpenUI 自己的 `analyzeFields` + `buildSignature`（`packages/lang-core/src/library.ts:296-316`）产出，
我们**没有**复刻它的类型渲染逻辑，因此不存在「我们自己写的签名格式和 OpenUI 不一致」的风险。

**两个必须说明的转换取舍：**

1. **组件命名**：`ui.*` 前缀被剥掉（`ui.card` → `Card`），非 `ui.` 命名空间保留（`layout.stack` → `LayoutStack`）。
   这符合 OpenUI 官方库的命名习惯（`Card` / `TextContent` / `Stack`）。
2. **root 必须是一个组件**：OpenUI 的 `createLibrary()` 会抛错 `Root component "X" was not found in components`。
   所以 C 档把目录里的 **`layout.stack`（→ `LayoutStack`）作为第 61 个定义**加了进去 ——
   OpenUI 官方库同样把 `Stack` 放在它那 82 个里面。**这不是凑数，是 API 要求**，但计数时必须说明：
   **60 个是 shadcn 组件，1 个是布局根。**（60 个 shadcn 签名本身 = 17,003 字符。）

### 没做的事（避免被误读）

- **不是** OpenUI 官方库的 82 个组件 —— 那是 `catalog-tokens.md` §6.1 的另一组数字。
- **不是**「我们手写的最优目录」—— 是**未经人工优化的机械转换**，所以枚举全部照抄（C1 偏重）。
  工程上真要接入，C4 才是更现实的下限。
- **未**注入 `examples`（few-shot）。OpenUI 官方 playground 提示词里有 5,666 字符的 Examples，
  我们这一版沿用 `apps/compare` 的配置（不注入 examples）。加进去大约再 +1.4k token。

---

## 5. 「全量 shadcn/ui」到底是多少个组件：三份清单

清单脚本：`catalog-tokens-runs/shadcn-inventory.py`（输出也在 `/tmp/oui-adoption/shadcn-inventory.json`）

| 口径 | 数量 | 出处 |
|---|---|---|
| **upstream registry 组件文件** | **61** | `vendor/shadcn-ui/apps/v4/registry/new-york-v4/ui/*.tsx`（排除 `_registry.ts`） |
| upstream 自动生成的 registry index | **61** ✅ 与上面完全一致 | `vendor/shadcn-ui/apps/v4/registry/__index__.tsx`（`files[].path = registry/new-york-v4/ui/*.tsx`） |
| 我们自己安装的副本 | 32 | `apps/compare/src/components/ui/*.tsx` |
| **我们的契约族** | **60** | `packages/components/src/ui.ts` 的 `uiComponentFamilies` |

**我们的 60 个 `ui.*` 契约族**：

```
accordion alert alert-dialog aspect-ratio attachment avatar badge breadcrumb bubble button
button-group calendar card carousel chart-frame checkbox collapsible combobox command
context-menu dialog drawer dropdown-menu empty field form hover-card input input-group
input-otp kbd label marker menubar message message-scroller native-select navigation-menu
pagination popover progress radio-group record-list resizable scroll-area select separator
sheet sidebar skeleton slider spinner switch table tabs textarea toast toggle toggle-group tooltip
```

**差异（都在预期内）**：

- upstream 有、我们没有：`chart`（我们叫 `chart-frame`）、`direction`、`item`、`sonner`（我们叫 `toast`）
- 我们有、upstream 没有同名文件：`chart-frame`、`record-list`、`toast` —— 都是**改名或我们自己的组合契约**
- `apps/compare` 装了 32 个，比契约少 28 个（demo 只装了用得上的那一部分）

**结论**：说「全量 shadcn/ui」时，**61（upstream）/ 60（我们的契约）** 都站得住，
但**必须写清是哪一个**。本测量用的是 **我们的 60 个 `ui.*` 契约**（因为它们是 shadcn 适配器 60/60 覆盖的那一套，
且直接可机械转换成 OpenUI 定义）。

---

## 6. 复现命令

```bash
# 0) 依赖：tiktoken（只装到 /tmp，不污染环境）
python3 -m pip install --target /tmp/tkenv tiktoken

# 1) 生成提示词（真实 OpenUI 生成器；从 monorepo 根跑，才有正确的模块解析）
cd /Users/work/open-generative && bun \
  /Users/work/ai/notes/generative-ui/future/catalog-tokens-runs/openui-full-shadcn.ts
#   -> /tmp/oui-adoption/{A,B,C1,C2,C3,C4}(-bare).txt + manifest.json

# 2) 真实 tokenizer 计数
python3 /Users/work/ai/notes/generative-ui/future/catalog-tokens-runs/openui-adoption-tokens.py

# 3) shadcn 组件清单
python3 /Users/work/ai/notes/generative-ui/future/catalog-tokens-runs/shadcn-inventory.py

# 4) 自检：B 档提示词必须与线上代码逐字节一致
cd /Users/work/open-generative && bun -e '
  import { openuiPrompt } from "./apps/compare/src/lib/openui/prompt.ts";
  import { readFileSync } from "node:fs";
  console.log(readFileSync("/tmp/oui-adoption/B-demo8.txt","utf8") === openuiPrompt);'
```

**确定性**：连续两次生成，`C1-shadcn60.txt` 的 md5 相同（`7a99d392c4075c90dd504c69abc4c6b1`）。

### 产物清单（md5）

| 文件 | 字节 | md5 |
|---|---|---|
| `/tmp/oui-adoption/A-empty.txt` | 2,946 | `eb169c235d70620bddd0bb2a65a92ad3` |
| `/tmp/oui-adoption/A-bare.txt` | 2,386 | `cb74dbda9d3d76fca0d95872e4ccd1b9` |
| `/tmp/oui-adoption/B-demo8.txt` | 3,996 | `ce3a33f28ce635c985be9eec76c10bd0` |
| `/tmp/oui-adoption/B-bare.txt` | 3,436 | `2528a51cbef1ab9107999d19cbd3b61a` |
| `/tmp/oui-adoption/C1-shadcn60.txt` | 23,216 | `7a99d392c4075c90dd504c69abc4c6b1` |
| `/tmp/oui-adoption/C1-bare.txt` | 22,656 | `d4810fed277888ec0e083e8b8c9f6f3f` |
| `/tmp/oui-adoption/C2-shadcn60-usewhen.txt` | 27,001 | `e2c2df3e343cee18e009a08cfe42f621` |
| `/tmp/oui-adoption/C3-full67.txt` | 61,889 | `5117aee0df1c146149783957e3e874c0` |
| `/tmp/oui-adoption/C4-shadcn-lean.txt` | 14,936 | `c1573aa8fcbb81945a77f7170c065240` |

---

## 7. 不确定性与限制（写进幻灯片前必须知道）

| 项 | 状态 |
|---|---|
| 60 个 shadcn 组件的 props 是否「完整」 | ⚠️ 我们取的是 `contract.resolvedPropsSchema`（组件声明的 props）。若改用 `createAuthoringPropsSchema`（含绑定联合类型），提示词会显著变胖 —— 那是 OGL 的口径，不是 OpenUI 的口径。**本测量统一用 `resolvedPropsSchema`。** |
| 61 vs 60 | ⚠️ 第 61 个是 API 强制的布局根（`LayoutStack`）。说「61 个组件」会误导，说「60 个 shadcn + 1 个布局根」才对。 |
| 枚举照抄 → C1 偏重 | ⚠️ 是**故意的**（任务要求机械转换、不得臆测）。工程现实下限见 C4（3,474 token）。**两个数都要报**，否则会被问「为什么不把 icon 枚举砍掉」。 |
| 没有 few-shot examples | ⚠️ 加了大约 +1.4k token（官方 playground 的 Examples 段落 = 5,666 字符）。 |
| 真实 tokenizer 是第三方口径 | ⚠️ tiktoken `o200k_base` 与 OpenUI docs 的 `gpt-tokenizer`(**gpt-5**) 同族但不等价；cl100k 同表给出作第二意见（两者差 <0.2%）。 |
| 为什么不直接引用 OpenUI 官方 82 组件的 9,125 | ⚠️ 那是**别人的库**。我们要回答的是「用**我们自己的**全量 shadcn 接入要多少」。两者都在，别混。 |
| 与 `catalog-tokens.md` 的可比性 | ⚠️ 那边全量 67 契约 = 7,835 token（真实）与这边 C1 的 6,426 看似同量级，但**组件集合不同**（那边含 `data.chart`）。**不要直接相减相除。** |

---

## 8. 脚本清单（`catalog-tokens-runs/` 新增文件）

| 文件 | 用途 |
|---|---|
| `openui-full-shadcn.ts` | 主生成器：A/B/C1/C2/C3/C4 六档提示词 + `manifest.json` |
| `openui-adoption-tokens.py` | tiktoken 真实计数（字符/字节/两个代理/o200k/cl100k） |
| `shadcn-inventory.py` | shadcn/ui 三份组件清单与差异 |

（未改动该目录下已有的 `final.ts` / `verify.ts` / `count-tokens.py` 等文件。）
