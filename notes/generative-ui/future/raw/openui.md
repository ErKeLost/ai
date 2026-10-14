# Thesys OpenUI / OpenUI Lang — raw research notes

Collected 2026-10-14 for the internal talk《生成式 UI》"future directions" section.
Read-only use of `/Users/work/ai/openui` (no git writes). GitHub data via `gh api` (login ErKeLost).

Local snapshot: `/Users/work/ai/openui`
- `git log -1`: `9c5c43e78b95b69a2220c9f0d4bc4919d29067c9` — 2026-10-11 01:58:12 +0530 — `chore: version packages (#1351)`
- root `package.json` version `1.0.1`; `git describe --tags` = `@openuidev/a2ui@0.4.1`
- 1.6 GB pnpm monorepo, packageManager pnpm@10.33.0, license MIT, homepage https://openui.com, repo https://github.com/thesysdev/openui
- Note: the working tree is NOT clean — `examples/agent-frameworks/vercel-ai-sdk/src/app/api/chat/route.ts` and `src/lib/cloud-prompt.ts` show as modified. I did not touch them.
- There is **no `.gitmodules`**; `@openuidev/a2ui@0.4.1` is just the nearest git tag, not a submodule.

## 0. IMPORTANT: the local checkout is BEHIND remote main

Remote `main` has moved past the stated HEAD. As of 2026-10-13/14:
- `gh api repos/thesysdev/openui/commits?per_page=1` → latest commit `2b2e22b3` 2026-10-13T13:27:56Z, `feat(examples): add generate:apiKey scripts and AGENTS.md to examples (#1406)`.
- On 2026-10-12, commit `9e76b1d0` / PR #1348 **"OpenUI 1.0"** shipped.
  - `gh api repos/thesysdev/openui/releases` → `@openuidev/lang-core@1.0.0`, `@openuidev/react-lang@1.0.0`, `@openuidev/react-ui@0.18.0`, `@openuidev/react-headless@0.18.0`, `@openuidev/server@0.3.0`, `@openuidev/browser-bundle@0.2.0`, `@openuidev/a2ui@0.5.0`, `@openuidev/assistant-ui@0.2.0`, `@openuidev/devtools@0.3.0`, `@openuidev/react-email@0.4.0` — all published 2026-10-12T15:06Z.
  - 72 releases total (`gh api "repos/thesysdev/openui/releases?per_page=100" --jq length` → 72).
- Remote root `package.json` version is still `1.0.1` (same as local) — the version bump for the 1.0 packages is separate.
- **Implication for the talk**: any "OpenUI 1.0 / OpenUI Lang 1.0" statement is correct for the live project (2026-10-12) but NOT reflected in the local checkout, where all packages are 0.4.x.

## 1. GitHub repo signals (`gh api`, 2026-10-13/14)

Source: https://github.com/thesysdev/openui
- description: "The Open Standard for Generative UI"
- homepage https://www.openui.com ; license MIT ; default branch `main`
- stars **10,854** ; forks **728** ; open_issues **172** ; watchers/subscribers **32**
- created_at 2024-12-02 ; pushed_at 2026-10-13T23:09:59Z ; topics: ag-ui, agent, agents, ai, generative-ui, javascript, langchain, llm, mastra, react
- contributors (anon=true, per_page=100): 52
- git tags (`git tag | tail -20`): newest are `@openuidev/react-lang@0.4.1`, `@openuidev/react-ui@0.17.1`, `@openuidev/vue-lang@0.4.1`, `@openuidev/svelte-lang@0.4.1`, `@openuidev/server@0.2.0`.
- Open issues (only 3 as of 2026-10-13, all very fresh; most work happens via PRs):
  - #1413 [2026-10-13] "react-headless: built-in stream adapters drop reasoning/thinking output instead of emitting `REASONING_*` events"
  - #1412 [2026-10-13] "docs: add Sage's native Flutter integration to ADOPTERS.md"
  - #1354 [2026-10-11] "Add opt-in Parallel Search MCP to the Vercel AI SDK example"
- No GitHub milestones (`gh api "repos/thesysdev/openui/milestones?state=all"` → empty).
- Roadmap-labelled / future-labelled issues found via search:
  - `gh api "search/issues?q=repo:thesysdev/openui+roadmap+in:title,body"` → 3 hits: #765 (open) `feat: Add @openuidev/vue-headless - Vue 3 port of @openuidev/react-headless`; #678 (open) "Svelte/SvelteKit parity beyond the initial renderer"; #396 (closed) incremental updates.
  - `gh api "search/issues?q=repo:thesysdev/openui+(RFC+OR+roadmap+OR+%22future%22)+in:title"` → #413 (closed) "Future plan".
- Thesys org repos (`gh api "orgs/thesysdev/repos?per_page=100&sort=pushed"`), relevant ones:
  - `openui` ★10,854 (2026-10-13); `openui-trip-planner` ★0; `openui-f1-dashboard` ★0 (both 2026-10-13 demos)
  - `open-intelligent-ui` ★359 (2026-10-13) — no description, README says it is an open-source reimplementation of ChatGPT's "Intelligent UI" on OpenUI. See §8.
  - `appless` ★509 (2026-09-16) — "What if your phone had no apps"; used as the reference app for OUI-1.
  - `generative-ui-bench` ★17 (2026-09-08) — the reliability/framework benchmark repo (raw outputs committed).
  - `openclaw-os` ★329; `openwebui-plugin` ★70; `skills` ★13; `examples` ★56.
  - Legacy C1 repos: `voice-agent-generativeui`, `analytics-agent-generativeui`, `canvas-with-c1`, `template-c1-next`, `genui-widget`, `search-with-c1`…
  - **`roadmap` ★1, pushed 2025-10-06** — "Public roadmap for Thesys". README says roadmap lives on the repo's Projects board with columns **Now / Next / Later / Shipped** and labels `now`/`next`/`later`/`shipped`; features voted by 👍. See §9.

## 2. Package inventory (local 0.4.x; dependency lists from each `packages/*/package.json`)

| Package | Version | Key deps |
|---|---|---|
| `@openuidev/lang-core` | 0.4.1 | `ci-info`, `@modelcontextprotocol/sdk`, `zod` (no UI framework dep) |
| `@openuidev/react-lang` | 0.4.1 | lang-core, devtools, observability, `@modelcontextprotocol/sdk`, react, react-dom, zod |
| `@openuidev/react-headless` | 0.17.1 | `@ag-ui/core`, observability, `ai`, react, zustand |
| `@openuidev/react-ui` | 0.17.1 | react-lang, react-headless + Radix UI, TanStack Table, d3-scale/selection/shape, date-fns, lodash-es, react-markdown, recharts-removed (D3 now), etc. |
| `@openuidev/react-email` | 0.3.1 | `@react-email/components`, react-lang, react, zod |
| `@openuidev/assistant-ui` | 0.1.3 | `@assistant-ui/react`, react-headless, react-lang, react-ui, `ai`, zustand |
| `@openuidev/vue-lang` | 0.4.1 | lang-core, vue, zod |
| `@openuidev/svelte-lang` | 0.4.1 | lang-core, svelte, zod |
| `@openuidev/angular-lang` | 0.4.1 | lang-core, tslib, `@angular/common`, `@angular/core`, rxjs, zod |
| `@openuidev/browser-bundle` | 0.1.7 | react-lang, react-ui, react, react-dom |
| `@openuidev/a2ui` | 0.4.1 | lang-core, react-lang, react, zod |
| `@openuidev/server` | 0.2.0 | lang-core, `@langchain/core` |
| `@openuidev/observability` | 0.0.4 | (framework-free event bus) |
| `@openuidev/observability-cloud` | 0.0.3 | observability |
| `@openuidev/langchain` | 0.0.3 | `@ag-ui/core`, `@langchain/langgraph` |
| `@openuidev/devtools` | 0.2.3 | lucide-react, observability, react-lang, react, react-dom |
| `@openuidev/cli` | 0.5.2 | inquirer, commander, esbuild, dotenv, openid-client, posthog-node |

Rendering runtimes per README table: React (`react-lang`), Vue (`vue-lang`), Svelte (`svelte-lang`), Angular (`angular-lang`); plus `browser-bundle` (CDN/iframe/no-build), `react-email` (email/HTML export), `react-headless` (BYO chat), `react-ui` (prebuilt chat + 2 component libraries). Source: https://github.com/thesysdev/openui/blob/main/README.md

Release 1.0 caveat (from CHANGELOG fetched off remote `main`):
> "vue-lang, svelte-lang and angular-lang stay on 0.4 (OpenUI Lang 0.x). Keep `@openuidev/lang-core` ^0.4 for the prompts they render."
So at the 1.0 release, **only the React runtime was on OpenUI Lang 1.0**; other frameworks were deliberately left on 0.x.
Source: `gh api repos/thesysdev/openui/contents/packages/lang-core/CHANGELOG.md?ref=main` (also react-lang CHANGELOG).

## 3. Token benchmark — exact methodology and numbers

Primary sources:
- `benchmarks/README.md` (local) — table of contents, methodology, running instructions
- https://www.openui.com/docs/openui-lang/benchmarks
- https://www.openui.com/benchmarks (site) and raw `https://www.openui.com/benchmarks/data.json`
- Blog https://www.openui.com/blog/stop-making-ai-write-json and https://www.openui.com/blog/state-of-generative-ui-report

Claim: README intro: "OpenUI Lang uses up to 67% fewer tokens than JSON." (Also in `docs/content/blog/oui-1.mdx`, thesys `/blogs/openui`.)

### How it was measured (from benchmarks/README.md)
1. Fixed set of **7 prompts** in `generate-samples.ts`: `simple-table`, `chart-with-data`, `contact-form`, `dashboard`, `pricing-page`, `settings-panel`, `e-commerce-product`.
2. Generate OpenUI Lang **once per prompt with `gpt-5.2`, temperature 0, streaming**.
3. Parse the `.oui` output with `createParser(schema)` (positional args → named props via `schema.json`).
4. Convert the **same parsed AST** into the other three formats:
   - `*.c1.json`: Thesys C1 format (`thesys-c1-converter.ts`)
   - `*.vercel.jsonl`: json-render RFC 6902 JSON Patch stream (`vercel-jsonl-converter.ts`)
   - `*.yaml`: json-render YAML spec payload (`yaml-converter.ts`)
5. Count tokens over all saved `samples/` artifacts with `tiktoken`, `encoding_for_model("gpt-5")`.
6. Latency estimated at fixed **60 tokens/second**.

### Results (benchmarks/README.md and docs page)
| Scenario | YAML | Vercel JSON-Render | Thesys C1 JSON | OpenUI Lang | vs YAML | vs Vercel | vs C1 |
|---|---:|---:|---:|---:|---:|---:|---:|
| simple-table | 316 | 340 | 357 | 148 | -53.2% | -56.5% | -58.5% |
| chart-with-data | 464 | 520 | 516 | 231 | -50.2% | -55.6% | -55.2% |
| contact-form | 762 | 893 | 849 | 294 | -61.4% | **-67.1%** | -65.4% |
| dashboard | 2128 | 2247 | 2261 | 1226 | -42.4% | -45.4% | -45.8% |
| pricing-page | 2230 | 2487 | 2379 | 1195 | -46.4% | -52.0% | -49.8% |
| settings-panel | 1077 | 1244 | 1205 | 540 | -49.9% | -56.6% | -55.2% |
| e-commerce-product | 2145 | 2449 | 2381 | 1166 | -45.6% | -52.4% | -51.0% |
| **TOTAL** | **9122** | **10180** | **9948** | **4800** | **-47.4%** | **-52.8%** | **-51.7%** |

So: **"up to 67%" = the single best scenario (contact-form, -67.1% vs Vercel json-render); the all-scenario total saving is ~52.8% vs Vercel, ~51.7% vs C1, ~47.4% vs YAML.** The docs page words it as "up to 61.4% fewer tokens than YAML, 67.1% fewer than Vercel JSON-Render, 65.4% fewer than Thesys C1 JSON." README omits YAML from its main table.

### Latency estimate (docs page, at 60 tok/s)
- contact form: 4.90s OpenUI vs 14.88s Vercel vs 15.70s YAML → "up to 3.0× faster"
- dashboard: 20.43s vs 37.45s Vercel → 1.83×
- e-commerce: 19.43s vs 40.82s → 2.10×
- The `benchmarks/samples/metrics.json` (local) records the actual API run: TTFT 769–1851 ms, throughput 66.7–104.5 tok/s, completion_tokens 151–1229 — i.e. the 60 tok/s latency table is a *model*, not measured end-to-end.

### Caveats I found (important for a talk)
- **First-party benchmark**, explicitly disclosed: "OpenUI built and maintains this first-party benchmark" (`data.json` → `first_party_disclosure`).
- All four formats are **serializations of one OpenUI Lang AST**, not independently generated by the model per format. The comparison is "same UI, different wire format", so it measures format verbosity, not "what an LLM would naturally emit in JSON".
- Tokenizer is the **GPT-5 encoder** applied to GPT-5.2 output; counts include whitespace/formatting as-is.
- `data.json` benchmark_updated 2026-08-18, model_board_updated 2026-08-25.

## 4. Reliability / framework benchmark (separate from token benchmark)

Sources: https://www.openui.com/blog/generative-ui-benchmark (2026-08-17), https://github.com/thesysdev/generative-ui-bench, `https://www.openui.com/benchmarks/framework/data.json`.
- Same **46 prompts**, **6 frontier models**, **4 runs each = 1,104 runs per format**; 3 formats (OpenUI, Google A2UI, Vercel json-render); 3,312 scored runs total.
- Catalog of 70 components built from OpenUI's own public library; each format uses its own official prompt generator and parser; same two worked examples.
- Structural validity average: **OpenUI 96.5%**, A2UI 95.7%, json-render 80.2%.
- Blank screens: **OpenUI 1/1104**, json-render 4, **A2UI 35** (its default renderer drops the whole `updateComponents` message if any component is invalid).
- json-render's dominant failure: 929 of 959 scoring errors are reference-graph (dangling/orphaned element ids).
- Tokens: system prompt **OpenUI 5,031** vs json-render 7,651 vs A2UI 12,610; mean output **OpenUI 1,362** vs json-render 3,258 vs A2UI 2,823 (2.1–2.4× gap).
- Cost: identical 46 screens 1.8–2.6× cheaper in OpenUI; one pass on Claude Opus 4.8 = **$2.27 OpenUI vs $5.85 A2UI**.
- Production stats (first party): over a week of streaming traffic ~**7% of OpenUI-Lang generations trip validation on first pass**; failure families: no valid root 44%, reference graph 36%, enum/type/arg 16%, truncation 4%. The repair layer recovers **~9 in 10** first-pass failures → **<1%** of streaming screens reach a user broken.
- A single prompt rule ("attach every component it defines") was worth 13 points on Kimi; a wrong worked example cost double digits.
- Scorer regime: one build of `lang-core 0.2.16`. `docs/content/docs/openui-lang/reliability.mdx` cites "OpenUI completed 92.9% of evaluated tasks… only 2 blank screens across 1,104 runs" (slightly different framing/number from the blog's 96.5%/1 blank — different slice/metric).

## 5. OpenUI Lang syntax (from local docs, v0.1 + v0.5)

Docs: `docs/content/docs/openui-lang/{syntax,specification-v01,specification-v05,evolution-guide,architecture,incremental-editing}.mdx` and https://www.openui.com/docs/openui-lang/…

### Core grammar (v0.1 / "line-oriented")
- One assignment per line: `identifier = Expression`
- First statement is the entry point; default library root is `root = Stack(...)`.
- Expression types: component call `Type(a1,a2)`; string `"..."`; number; boolean `true/false`; `null`; array `[a,b]`; object `{key: value}`; reference `identifier`.
- **Positional arguments** mapped to props by **Zod schema key order**; optional args omitted from the end; **forward references allowed**.
- Example: `root = Stack([title, form])` / `title = TextContent("Sign up", "large-heavy")` / `form = Form("signup", [nameField, emailField], actions)`.
- `docs/content/docs/openui-lang/syntax.mdx` lists default-library signatures, e.g. `Stack(children, direction?, gap?, align?, justify?, wrap?)`, `TextContent(text, size?)`, `Form(name, fields, buttons)`, `Input(name, placeholder?, type?, rules?)`, `Button(label, action, variant?, type?, size?)`, `Table(columns)`, `Col(label, data, type?)`, `BarChart(labels, series, variant?, xLabel?, yLabel?)`.

### v0.5 additions (reactive / data / functions)
- Statement kinds: component `name = Component(...)`; state `$name = default`; data `name = Query(...)` / `name = Mutation(...)`.
- `$variables` are reactive with two-way binding (pass `$days` to an input → user change re-evaluates dependents).
- Built-ins use `@` prefix: `@Count`, `@Sum`, `@Avg`, `@Min`, `@Max`, `@First`, `@Last`, `@Filter(array, field, op, value)`, `@Sort`, `@Round`, `@Abs`, `@Floor`, `@Ceil`, `@Each(array, var, template)`.
- Action steps inside `Action([...])`: `@Run(ref)`, `@Set($v, value)`, `@Reset(...)`, `@ToAssistant("msg")`, `@OpenUrl("url")`.
- `Query("tool", {args}, {defaults}, refreshSeconds?)` runs on load and re-fetches when referenced `$vars` change; `Mutation(...)` only runs via `@Run`.
- Expressions add member access / array pluck (`data.rows.title`), ternary `cond ? a : b`, binary ops, logical ops.
- Prompt feature flags: `toolCalls`, `bindings`, `editMode`, `inlineMode`.
- Streaming & hoisting: forward refs let the renderer show skeletons for not-yet-streamed ids; statement-level incremental caching makes completed statements immutable.
- Incremental editing: LLM emits only changed statements; parser merges by name, **last definition wins**.

### v0.1 → v0.5 shift (evolution-guide.mdx)
| | v0.1 | v0.5 |
|---|---|---|
| Purpose | Generate UI responses in chat | Build interactive apps with live data |
| Data | hardcoded | `Query` / `Mutation` from your tools/MCP |
| State | none | reactive `$variables` |
| LLM role | generates UI every turn | generates UI once, then gets out of the way |
| Transforms | none | `@Count/@Filter/@Sort/@Each/@Sum/...` |
| Components | layout+content | + `Modal`, auto-dismiss `Callout` |

v0.5 is a superset; all v0.1 code is valid v0.5. Source: `docs/content/docs/openui-lang/evolution-guide.mdx`.

### OpenUI Lang 1.0 (2026-10-12, remote only)
From `packages/lang-core/CHANGELOG.md` and `packages/react-lang/CHANGELOG.md` (fetched off remote `main`, PR #1348):
- **Bare action steps**: `Button("Ask", @ToAssistant("Tell me more"))` needs no `Action([...])`; multi-step still uses `Action([...])`. Every step call now evaluates to a one-step plan.
- **Custom actions**: `defineAction({name, description, params})` + `createLibrary({actions})`; e.g. `@CopyToClipboard(order.id)`; delivered to host `onAction`.
- **Library functions**: `defineFunction({name, description, params, returns, fn})` + `createLibrary({functions})`, e.g. `@Percent(done, total)`; validated like component props.
- **Entry rule change**: entry is the `root` statement, else the first statement calling the library root component (warning), else `no-root` error. `root = $t ? A : B` is a valid ternary entry via new `rootExpression`/`evaluateRoot()`.
- **Message protocol**: `parseMessage` / `buildMessage` for `]]>openui:content` / `context` / `end` marker lines; `Renderer` accepts a stored message as `response`.
- Removed exports: `isASTNode`, `isRuntimeExpr`, `CallNode`, `RuntimeExprNode`, `Statement`, `Token`, `BUILTINS`, `isBuiltin`, `toNumber`, `BUILTIN_NAMES`, `LAZY_BUILTINS`, `ACTION_NAMES`.
- Breaking streaming behavior: "A program whose `root` statement is written last shows nothing while it streams, until the `root` line arrives" and a cut-off output that never reaches `root` now renders blank instead of a partial tree.
- Companion: `react-ui 0.18` requires `react-lang >=1.0.0 <2.0.0`; `server 0.3` autofix uses lang-core 1.0.

## 6. "Framework-agnostic" — what the evidence actually shows

Claims:
- root `package.json` description: "A full-stack, framework-agnostic Generative UI framework with a streaming-first language and first-party runtimes for React, Vue, Svelte, and Angular"
- README: "A framework-agnostic core powers first-party runtimes for React, Vue, Svelte, and Angular, and React additionally ships built-in component libraries and ready-to-use chat interfaces."
- `lang-core` description: "Core parser, prompt-generation, runtime-evaluation, and type layer with no React, Angular, Vue, or Svelte dependency." Its deps are only `ci-info`, `@modelcontextprotocol/sdk`, `zod` — confirms the core itself is UI-framework-free.
- `@openuidev/a2ui` README: core client is framework-agnostic; only `@openuidev/a2ui/react` is React.
- `@openuidev/browser-bundle`: "Prebuilt browser bundle that ships the renderer, UI library, React, and styles as script + stylesheet assets."

Caveats found:
- **React is unambiguously first-class**: 1.0 shipped only for `lang-core`/`react-lang`; vue/svelte/angular explicitly stayed on 0.4 (OpenUI Lang 0.x) per the 1.0 CHANGELOG. `react-headless`, `react-ui`, `react-email`, `assistant-ui`, `browser-bundle`, `devtools` are all React-only.
- Open-source parity work is still open: issue #765 "Add @openuidev/vue-headless — Vue 3 port of @openuidev/react-headless" (open, 2026-07-14) and #678 "Svelte/SvelteKit parity beyond the initial renderer" (open, 2026-06-25).
- The June 2026 "State of Generative UI" blog says "Renderers ship for React, Vue, Svelte, and React Native" — **no first-party React Native package exists in this snapshot**; the repo has React/Vue/Svelte/Angular + browser-bundle + react-email. ADOPTERS.md instead credits **Lynx** (`@lynx-js/genui`) as the cross-platform path.
- The design-system claim is real: components are defined with Zod schemas and the system prompt is generated from the library (`library.toJSONSchema()` / `library.prompt()`); docs FAQ: "OpenUI is design-system agnostic, meaning teams can bring their own components, tokens, and UI frameworks."
- Protocol-level openness: `@openuidev/a2ui` implements A2UI v1.0 lifecycle but swaps `updateComponents.components` from A2UI JSON to an array of OpenUI Lang statements; `lang-core` depends on `@modelcontextprotocol/sdk` (tools via MCP or a function map).

## 7. Comparisons in the docs (vs JSON / A2UI / MCP Apps)

`docs/content/docs/openui-lang/comparison.mdx` (https://www.openui.com/docs/openui-lang/comparison) — the headline table (copied in README "How OpenUI compares"):
| | OpenUI | json-render (Vercel) | A2UI (Google) | CopilotKit OpenGenUI |
|---|---|---|---|---|
| Tokens | 1× | 3× | 3× | 4× |
| Latency @60 tok/s | 4.9s | 14.2s | 14.2s | ~20s |
| Streaming | Yes | Yes | Yes | Partial |
| Consistent output | Yes | Yes | Yes | No |
| Design system | Yes | Yes | Yes | No |
| Components | Library + custom | Library + custom | Custom only | None |
| Built-in data fetching | Yes | No | No | No |
| Chat UI included | Yes | No | No | Yes |
| Multi-platform | Web, mobile, email | Web, mobile, PDF, email, video | Web, iOS, Android | Web |
| Security risk | Minimal | Minimal | Minimal | Medium |
| License | MIT | Apache 2.0 | Apache 2.0 | MIT |

`README.md`'s comparison table drops the design-system row but is otherwise the same ("Consistent output" yes).

`docs/research/` contains **only one file** (research date 2026-09-01): `vercel-documentation-patterns.md`. It is an internal IA review of Vercel docs, mapping transferable documentation patterns to OpenUI and identifying gaps: recommends grouping Gateway + hosted Observability under "OpenUI Cloud", keeping a complete OSS path, adding a package chooser/dependency diagram, merging OpenUI Lang intro+overview, availability metadata (Open source / Cloud / Beta / Deprecated). It notes the repo has "five top-level documentation areas" (OpenUI Lang, Build Agents, Gateway, Observability, API Reference).

`docs/content/docs/openui-lang/architecture.mdx`: two-phase model — **Generate** (LLM writes openui-lang once) and **Execute** (Renderer runs `Query`/`Mutation`/`$vars` directly against function map or MCP; no LLM on the interaction path). Example incremental edit: 20 lines/~400 tokens → 3 lines/~60 tokens (85% fewer).

`docs/content/docs/openui-lang/reliability.mdx`: 4 levers — simplify schema, refine prompt, choose model, validate+correct (Gateway streaming correction / Autofix API). Ties reliability to the paid layer.

Transport framing (state-of-generative-ui blog): the two independent axes are **Transport** (AG-UI for your own app vs MCP-Apps for host apps like ChatGPT/Claude) and **Generation** (Static / Declarative / Open-Ended). OpenUI is placed in the **Declarative** bucket; it also ships an Open-Ended escape hatch: `examples/miscellaneous/html-artifact` + "open-ended HTML guide" (a `GeneratedView` component whose prop is model HTML, rendered in a sandboxed iframe). The blog also notes the missing host-side piece for the MCP-Apps + declarative combination: "what's missing is host-side support for rendering a shared catalog".

## 8. Company strategy (Thesys) — primary quotes

### "Why We're Open Sourcing OpenUI" (Rabi, published 2026-03-11, updated 2026-06-05)
Source: https://www.thesys.dev/blogs/openui (body extracted from the Next.js server payload; the page's HTML route works, `/blog` 404s, no working RSS).
Key quotes:
- "10,000 developers built generative UI with our API… Over the past two years, C1 has powered interactive, LLM-generated interfaces for over 10,000 developers."
- "We added validation. Brought down the error rates from 3% to <0.3%… Eventually we had to accept these weren't bugs. They were symptoms of a deeper architectural issue. JSON was the right idea. It wasn't the right format."
- "3x faster rendering than our previous JSON-based approach. 67% fewer tokens to describe the same interface. Dramatic drop in invalid output… Design system agnostic."
- **Business model**: "OpenUI is fully open source. Use it, extend it — make it your own. We want it to become shared infrastructure for the ecosystem. For teams who need production-grade orchestration, reliability at scale, and enterprise support, Thesys C1 is the managed layer we've built on top of OpenUI. **That's where our business is.**"
- "The C1 March release will bring OpenUI under the hood as the new rendering core. It's a free upgrade. Full backward compatibility, nothing to migrate."
- "If you've used Crayon, OpenUI is its successor."
- FAQs: "OpenUI reduces token usage by about 67% and enables roughly 3× faster rendering compared to earlier JSON-based UI generation systems." / "No. OpenUI is design-system agnostic…"

### "Stop making AI write JSON — Why we built OpenUI" (2026-04-10)
https://www.openui.com/blog/stop-making-ai-write-json
- Thesys V1 was JSON; launched March 2025; "50-plus components".
- "up to 67% token savings … is the receipt, not the reason."
- Claim: after switching from JSON, structural parse errors "dropped to zero"; remaining errors are semantic/lint-like with statement ids.
- Incremental patch: "~400 tokens, ~6.7s" vs "3 statements, ~80 tokens, ~1.3s" → "up to 80% fewer tokens, 5x faster edits".
- Rejects raw JS ("too much rope", streaming hard, no constraints) and JSON-in-disguise; positions OpenUI Lang "in the space in between".

### "The State of Generative UI in 2026: Transports, Formats, and Tradeoffs" (2026-06-10)
https://www.openui.com/blog/state-of-generative-ui-report
- Two independent axes: transport (AG-UI vs MCP-Apps) × generation (Static/Declarative/Open-Ended).
- Declarative "is where most production agent UIs currently land"; OpenUI, A2UI, json-render are the entrants.
- Recommends: "OpenUI where per-response cost and TTFR dominate; A2UI where Flutter or native widgets are required; json-render where the same spec needs to render across web, email, PDF, and terminal."
- Notes Open-Ended (raw HTML) runs "5-10x the tokens of an equivalent Declarative spec" and is best as a sandboxed escape hatch.
- Token table there: OpenUI 4,800; YAML 9,122 (+90%); C1 JSON 9,948 (+107%); json-render 10,180 (+112%).

### "Your LLM is not a query engine" (2026-07-23)
https://www.openui.com/blog/the-llm-is-not-your-query-engine
- Architectural thesis: the tool-calling loop routes data through the model every turn → history accumulation, data ingestion (500-row aggregate ≈ 10–20k tokens), query re-derivation, "every number the user reads was retyped by the model".
- Generative UI alternative: model compiles intent to a spec once; runtime executes `Query` against the tool layer (~100 ms, zero tokens for parameter changes).
- "Generative UI can reduce LLM token usage by about 94%" on a representative 7-turn session (70k → 4k tokens), with the estimate deliberately favoring the loop.
- Generated code (SQL/Python) still allowed but must run sandboxed outside the LLM.

### "SaaS 2.0: Beyond the Chatbar" (Rabi, 2026-04-07)
https://www.openui.com/blog/beyond-the-chatbar
- Four stages of the agentic interface: (1) text, (2) inline Generative UI, (3) chat as a builder (persistent views), (4) embedded agentic SDK — "software that builds itself around the way you work"; chat becomes the escape hatch.
- The trap is "a blank text box" on day zero; generated UI flips it to contextual, pre-composed starting points.
- "Three things: reproducibility, consistency, and latency."

### "Introducing OUI-1" (2026-09-08)
https://www.openui.com/blog/oui-1 · weights https://huggingface.co/thesysdev/OUI-1 (Apache 2.0)
- OUI-1 = finetune of Google DiffusionGemma (26B-A4B, 4B active), runs at FP8 on an RTX 5090; "world's first model for Generative UI."
- Score on the Generative UI Benchmark: **71.7%**, up from base DiffusionGemma **13.0%**; Gemma 4 31B 46.7%, Gemma 4 26B-A4B 29.9%; only Qwen3.8 27B dense scored higher (78.8%).
- Training: SFT (~700 examples, LoRA on one A100) then **self-distillation with the parser as verifiable reward** (rejection sampling + repair). Speed recovered 4.3s → 1.9s per output; schema errors 292→76, wiring errors 971→484; recipe repeated across 27 component libraries.
- "Directions from here": (1) personal devices / on-device, (2) **OpenUI Lang 0.5** (state, queries, mutations so the runtime handles interactions), (3) lower latency — "reliable, locally generated interfaces that arrive in under a second."
- Cross-library generalization: on the AppLess library, 60 unseen asks → OUI-1 55 valid vs DiffusionGemma 23.

### "How ChatGPT Intelligent UI works" (2026-10-08) — competitive positioning
https://www.openui.com/blog/how-chatgpt-intelligent-ui-works
- Reverse-engineering of OpenAI's "Intelligent UI" (GPT-6, Oct 2026): model writes **DIL** (Markdown + JSX-like tags + JS); server compiles partial output to a JS program + JSON constants; sandboxed hidden-iframe Web Worker executes it; ~70 native components + design tokens; state resets on reload; follow-ups regenerate the whole interface; "resent programs made up 83% of 275 KB of patches for 6.3 KB of text"; logic errors are silent; diagnostics may not reach the model.
- This is the opening Thesys uses for **OpenUI as the open cross-vendor alternative** to a proprietary ChatGPT-only format.
- Companion repo `open-intelligent-ui` (★359, pushed 2026-10-13): "An open-source implementation of the 'Intelligent UI' experience introduced in ChatGPT, built on OpenUI." README uses "OpenUI Lang 1.0", "OpenUI 1.0 system prompt", 59 custom `@functions`, a demo with Maps/Charts/Media/SVG, and defaults to `openai/gpt-6.1-sol` through OpenUI Cloud Gateway with an Ollama fallback to `qwen3.8:27b`.
  - https://github.com/thesysdev/open-intelligent-ui

### Thesys product surface
- https://www.thesys.dev — title "Thesys - The Generative UI Company"; foundingDate 2024; founders Rabi Shankar Guha, Parikshit Deshmukh; knowsAbout: Generative UI, AI UIs, Frontend Infrastructure, C1 API, Interactive UIs, Agent UI.
- OpenUI Cloud = **Gateway** (unified provider API, streaming validation/autofix, provider failover, reliability monitoring, **zero token markup incl. BYOK**) + **Observability** + **Reliability Monitoring** + **Autofix API**. Sources: `docs/content/docs/gateway/index.mdx`, https://www.openui.com/cloud/gateway.
- Legacy C1 JSON remains the "previous JSON-based approach" being replaced; examples/templates still exist under `thesysdev/*c1*`.
- Public roadmap repo (https://github.com/thesysdev/roadmap) has 17 issues, mostly C1-era feature requests (support Haiku 4.5 / DeepSeek / Gemini Flash, file upload in forms, export to Markdown/PDF, Treemap/Heatmap/GeoSpatial, citations, SwiftSDK, frontend actions, artifacts). **Last pushed 2025-10-06** — stale; the Projects "Now/Next/Later" board was not retrievable via `gh api` in this session.

## 9. Docs / blog index facts

- openui.com blog index (https://www.openui.com/blog) lists 8 posts as of 2026-10-14: `beyond-the-chatbar`, `generative-ui-benchmark`, `how-chatgpt-intelligent-ui-works`, `oui-1`, `rust-wasm-parser`, `state-of-generative-ui-report`, `stop-making-ai-write-json`, `the-llm-is-not-your-query-engine`.
- Local `docs/content/blog/` matches those 8 (plus a `components/` dir).
- `docs/content/docs/openui-lang/meta.json` (same on remote `main`) — no separate "roadmap" page; specs are `specification-v01`, `specification-v05`, `evolution-guide`.
- `docs/content/docs/build-agents/` covers LangGraph, Vercel AI SDK, Vercel eve, pi, Mastra, assistant-ui, CopilotKit, chat UI, tools, conversation history.
- openui.com sitemap (`https://www.openui.com/sitemap.xml`) shows a `lab` section (Lab projects), `compare`, `benchmarks/language`, `benchmarks/framework`, `integrations/{shadcn-ui, material-ui, handsontable, react-email, langchain-langgraph, vercel-ai-sdk, google-adk, mastra, assistant-ui, ag-ui}`, `openclaw-os`, `cloud/gateway`, `cloud/observability`.
- ADOPTERS.md (local) lists companies: Standard Metrics, Entelligence.AI, GAIA, &facts, Oodle, prox, Productboard, Automatio AI. Frameworks: assistant-ui, Lynx, LangChain, Mastra (official integrations).
- "Rewriting our Rust WASM Parser in TypeScript" (2026-03-13, https://www.openui.com/blog/rust-wasm-parser): parser pipeline `autocloser → lexer → splitter → parser → resolver → mapper`; TS is 2.2–4.6× faster per call than WASM (9–19µs vs 20–61µs median); incremental statement-level caching cuts full-stream cost 2.6–3.3×; O(N²) → O(N). Confirms statement/wire-level parser design.
- Non-code disclaimer in README: "OpenUI has no official cryptocurrency, token, or coin."

## 10. Uncertain / not verified (also listed in FINAL_ANSWER)
- **Local vs remote mismatch**: everything in the local repo is 0.4.x; OpenUI 1.0 (2026-10-12) was not fetched (per instruction not to touch git). Remote CHANGELOGs were read via `gh api` contents only.
- Could not retrieve the thesys roadmap **Projects board** ("Now/Next/Later/Shipped") — GitHub Projects v2 needs a scope/GraphQL call I did not complete. The repo's issues are the only roadmap evidence, and that repo is stale (Oct 2025).
- Blog bodies for `/blogs/the-future-of-ai-interfaces-is-generative` and `/blogs/building-the-first-generative-ui-api-…-c1` render "Something went wrong" (client-side fetch); not read. `/blogs/openui` body was recovered from the Next.js flight payload, not from rendered HTML.
- No working RSS for thesys.dev (`/rss.xml`, `/feed.xml` 404; `/blogs/rss.xml` returns HTML) — blog dates were read from index/JSON-LD.
- Did not fetch the full 31-model language benchmark table or OUI-1 Hugging Face model card; numbers come from the blog and `data.json` summaries.
- The "framework-agnostic" claim at 1.0 is React-first by construction; I did not find any 1.0-parity statement for Vue/Svelte/Angular beyond "stay on 0.4".
- The README/docs "Multi-platform … mobile" claim has no first-party React Native/Angular mobile renderer in this snapshot; Lynx is a third-party integration.
- Large context truncation: `stop-making-ai-write-json` and several docs were read in full via `read`; the ChatGPT Intelligent UI post was read in two parts.
