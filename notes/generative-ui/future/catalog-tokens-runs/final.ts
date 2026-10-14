import { createOfficialCatalog } from "@open-generative/components";
import {
  compileOpenGenerativeLanguage,
  compileOpenGenerativeLanguageForFullCatalogBenchmark,
  createAuthoringPropsSchema,
  OPEN_GENERATIVE_LANGUAGE_PROMPT_MAX_BYTES,
  OPEN_GENERATIVE_LANGUAGE_PROMPT_TOKEN_BYTES,
} from "@open-generative/compiler";
import type { CompilerCatalogLike } from "@open-generative/compiler";
import type { ComponentContract } from "@open-generative/catalog";

const enc = new TextEncoder();
const B = (s: string) => enc.encode(s).byteLength;
const T = (s: string) => Math.ceil(B(s) / 4);
const f = (n: number) => n.toLocaleString("en-US");

const official = await createOfficialCatalog();

const plainRes = {
  sliceResourceId: "resource-000001",
  source: { bindingId: "resource-analysis" },
  descriptor: {
    label: "Daily values",
    columns: [
      { columnId: "date", label: "Date", valueSchema: { type: "string", format: "date" } },
      { columnId: "value", label: "Value", valueSchema: { type: "number" } },
    ],
  },
};
const richRes = {
  sliceResourceId: "resource-000001",
  source: { bindingId: "resource-analysis" },
  descriptor: {
    label: "Registered users by month and plan",
    description: "Tenant-scoped registration counts.",
    estimatedItems: 24,
    columns: [
      { columnId: "month", label: "Month", valueSchema: { type: "string", format: "date" } },
      { columnId: "plan", label: "Plan", valueSchema: { type: "string" } },
      { columnId: "registered_users", label: "Registered users", valueSchema: { type: "number" } },
    ],
  },
};

function cat(contracts: readonly ComponentContract[], resources: readonly unknown[] = []): CompilerCatalogLike {
  const entries = contracts.map((c, i) => ({ sliceComponentId: `component-${String(i + 1).padStart(6, "0")}`, contract: c.ref }));
  const byId = new Map(entries.map((e, i) => [e.sliceComponentId, contracts[i]!]));
  const byRef = new Map(contracts.map((c) => [c.ref.componentType, c]));
  const props = new Map(contracts.map((c) => [c.ref.componentType, createAuthoringPropsSchema(c)]));
  return {
    slice: { sliceHash: `sha256:${"f".repeat(64)}`, contractSetHash: `sha256:${"e".repeat(64)}`, components: entries, resources, limits: { maxOperations: 1_000, maxTextBytes: 16 * 1024 * 1024 } },
    componentBySliceId: (id: string) => byId.get(id),
    componentByRef: (ref: any) => byRef.get(ref.componentType),
    authoringPropsSchema: (ref: any) => props.get(ref.componentType)!,
  } as unknown as CompilerCatalogLike;
}

const full67 = official.componentContracts;
const slice18 = [official.components.dataChart, ...Object.values(official.components.ui).slice(0, 17)];
const ui60 = Object.values(official.components.ui);
const core7 = full67.filter((c) => !c.ref.componentType.startsWith("ui."));

type Row = { mode: string; n: number; src: string; bytes: number; tok: number };
const rows: Row[] = [];
function add(mode: string, contracts: readonly ComponentContract[], resources: readonly unknown[], src: string, policy: "auto" | "required" = "auto", full = false) {
  const lang = (full ? compileOpenGenerativeLanguageForFullCatalogBenchmark : compileOpenGenerativeLanguage)({ catalog: cat(contracts, resources), presentationPolicy: policy });
  rows.push({ mode, n: contracts.length, src, bytes: B(lang.systemPrompt), tok: T(lang.systemPrompt) });
  return lang.systemPrompt;
}

add("全量 67 契约 · 无资源", full67, [], "createOfficialCatalog().componentContracts", "auto", true);
add("全量 67 契约 · 1 资源", full67, [plainRes], "同上", "auto", true);
add("全量 67 契约 · 1 资源 · required", full67, [plainRes], "同上", "required", true);
add("全量 67 契约 · 逼真资源", full67, [richRes], "apps/benchmark/benchmark.config.example.json 风格", "auto", true);
add("仅 60 个 ui.* 契约 · 1 资源", ui60, [plainRes], "README:10 (60 ui.*)", "auto", true);
add("仅 7 个核心契约 · 1 资源", core7, [plainRes], "README:10 (seven Core contracts)", "auto", true);
add("生产裁剪 18 契约 · 1 资源", slice18, [plainRes], "packages/compiler/src/language.test.ts:839-872", "auto");
add("生产裁剪 18 契约 · 无资源", slice18, [], "同上", "auto");
add("生产裁剪 18 契约 · required", slice18, [plainRes], "同上", "required");

const w = (s: string) => { const n = 0; return s.padEnd(34); };
console.log("| 模式 | 契约数 | 字节数 | token 代理 (字节/4) |");
console.log("|---|---|---|---|");
for (const r of rows) console.log(`| ${r.mode} | ${r.n} | ${f(r.bytes)} | ${f(r.tok)} |`);
console.log("\n生产上限:", f(OPEN_GENERATIVE_LANGUAGE_PROMPT_MAX_BYTES), "bytes / 4 =", f(OPEN_GENERATIVE_LANGUAGE_PROMPT_MAX_BYTES / OPEN_GENERATIVE_LANGUAGE_PROMPT_TOKEN_BYTES), "token 代理");
console.log("TOKEN PROXY DIVISOR:", OPEN_GENERATIVE_LANGUAGE_PROMPT_TOKEN_BYTES);
console.log("chart recipes:", 17, "| ui families:", Object.values(official.components.ui).length, "| core:", core7.length);
