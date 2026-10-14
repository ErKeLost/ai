/**
 * READ-ONLY export of the real OGL prompt text for:
 *   (a) the Full Catalog (all 67 official Contracts)
 *   (b) the production 18-contract Slice (mirrors language.test.ts)
 *
 * Run: cd /Users/work/open-generative && bun /tmp/gen-catalog-prompt.ts
 */
import { createOfficialCatalog } from "/Users/work/open-generative/packages/components/src/contracts.ts";
import {
  compileOpenGenerativeLanguage,
  compileOpenGenerativeLanguageForFullCatalogBenchmark,
  estimateOpenGenerativeLanguagePromptTokens,
  OPEN_GENERATIVE_LANGUAGE_PROMPT_MAX_BYTES,
  OPEN_GENERATIVE_LANGUAGE_PROMPT_TOKEN_BYTES,
  OPEN_GENERATIVE_LANGUAGE_PROMPT_MAX_TOKEN_PROXY,
  OPEN_GENERATIVE_FULL_CATALOG_BENCHMARK_PROMPT_MAX_BYTES,
  OPEN_GENERATIVE_FULL_CATALOG_BENCHMARK_PROMPT_MAX_TOKEN_PROXY,
} from "/Users/work/open-generative/packages/compiler/src/language.ts";
import { createAuthoringPropsSchema } from "/Users/work/open-generative/packages/compiler/src/schema.ts";
import type { CompilerCatalogLike } from "/Users/work/open-generative/packages/compiler/src/types.ts";
import type { ComponentContract } from "/Users/work/open-generative/packages/catalog/src/contracts.ts";
import { writeFileSync } from "node:fs";

function languageCatalog(
  contracts: readonly ComponentContract[],
  contractSetHash: string,
  resources: readonly unknown[] = [],
): CompilerCatalogLike {
  const entries = contracts.map((contract, index) => ({
    sliceComponentId: `component-${String(index + 1).padStart(6, "0")}`,
    contract: contract.ref,
  }));
  const byId = new Map(entries.map((entry, index) => [entry.sliceComponentId, contracts[index]]));
  return {
    slice: {
      sliceHash: `sha256:${"f".repeat(64)}`,
      contractSetHash,
      components: entries,
      resources,
      limits: { maxOperations: 64, maxTextBytes: 64_000 },
    },
    componentBySliceId: (id: string) => byId.get(id),
    authoringPropsSchema: (ref: ComponentContract["ref"]) => {
      const contract = contracts.find((c) => c.ref.componentType === ref.componentType);
      if (contract === undefined) throw new TypeError(`Missing Contract ${ref.componentType}`);
      return createAuthoringPropsSchema(contract);
    },
  } as unknown as CompilerCatalogLike;
}

const utf8 = (s: string) => new TextEncoder().encode(s).byteLength;

function stats(label: string, prompt: string) {
  const bytes = utf8(prompt);
  const chars = [...prompt].length;
  const lines = prompt.split("\n").length;
  console.log(`\n=== ${label} ===`);
  console.log(`  chars : ${chars}`);
  console.log(`  bytes : ${bytes}  (${(bytes / 1024).toFixed(1)} KiB)`);
  console.log(`  lines : ${lines}`);
  console.log(`  tokenProxy (bytes/4, official): ${estimateOpenGenerativeLanguagePromptTokens(prompt)}`);
  console.log(`  tokenProxy (chars/4):           ${Math.ceil(chars / 4)}`);
  return { chars, bytes, lines, tokens: estimateOpenGenerativeLanguagePromptTokens(prompt) };
}

const official = await createOfficialCatalog();
const HASH = `sha256:${"d".repeat(64)}`;

// ── Full catalog: all 67 official Contracts ─────────────────────────
const allContracts = official.componentContracts;
console.log(`official.componentContracts.length = ${allContracts.length}`);
console.log(`  semantic/layout (non-ui): ${allContracts.filter((c) => !c.ref.componentType.startsWith("ui.")).length}`);
console.log(`  ui.* families: ${allContracts.filter((c) => c.ref.componentType.startsWith("ui.")).length}`);

const full = compileOpenGenerativeLanguageForFullCatalogBenchmark({
  catalog: languageCatalog(allContracts, HASH),
  presentationPolicy: "required",
});
const fullStats = stats("FULL CATALOG (67 contracts, no resources)", full.systemPrompt);
writeFileSync("/tmp/ogl-prompt-full-67.txt", full.systemPrompt);

// ── Production Slice: 18 contracts (data.chart + 17 ui.*), per language.test.ts
const sliceContracts = [
  official.components.dataChart,
  ...Object.values(official.components.ui).slice(0, 17),
];
console.log(`\nproduction slice contracts = ${sliceContracts.length}`);
console.log(`  types: ${sliceContracts.map((c) => c.ref.componentType).join(", ")}`);

const resource = {
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
const slice = compileOpenGenerativeLanguage({
  catalog: languageCatalog(sliceContracts, HASH, [resource]),
  presentationPolicy: "required",
});
const sliceStats = stats("PRODUCTION SLICE (18 contracts + 1 resource)", slice.systemPrompt);
writeFileSync("/tmp/ogl-prompt-slice-18.txt", slice.systemPrompt);

// Same slice WITHOUT the resource, to isolate resource-line cost.
const sliceNoRes = compileOpenGenerativeLanguage({
  catalog: languageCatalog(sliceContracts, HASH, []),
  presentationPolicy: "required",
});
const sliceNoResStats = stats("PRODUCTION SLICE (18 contracts, NO resource)", sliceNoRes.systemPrompt);
writeFileSync("/tmp/ogl-prompt-slice-18-noresource.txt", sliceNoRes.systemPrompt);

// ── Fixed harness vs catalog lines ─────────────────────────────────
// The fixed overhead = prompt with a catalog whose component lines are absent.
// Approximate by compiling with a single already-built-in semantic component
// (Built-in semantic calls are listed separately) and subtracting.
console.log("\n=== BUDGET CONSTANTS (packages/compiler/src/language.ts:19-32) ===");
console.log(`  OPEN_GENERATIVE_LANGUAGE_PROMPT_MAX_BYTES                      = ${OPEN_GENERATIVE_LANGUAGE_PROMPT_MAX_BYTES}`);
console.log(`  OPEN_GENERATIVE_LANGUAGE_PROMPT_TOKEN_BYTES                    = ${OPEN_GENERATIVE_LANGUAGE_PROMPT_TOKEN_BYTES}`);
console.log(`  OPEN_GENERATIVE_LANGUAGE_PROMPT_MAX_TOKEN_PROXY                = ${OPEN_GENERATIVE_LANGUAGE_PROMPT_MAX_TOKEN_PROXY}`);
console.log(`  OPEN_GENERATIVE_FULL_CATALOG_BENCHMARK_PROMPT_MAX_BYTES        = ${OPEN_GENERATIVE_FULL_CATALOG_BENCHMARK_PROMPT_MAX_BYTES}`);
console.log(`  OPEN_GENERATIVE_FULL_CATALOG_BENCHMARK_PROMPT_MAX_TOKEN_PROXY  = ${OPEN_GENERATIVE_FULL_CATALOG_BENCHMARK_PROMPT_MAX_TOKEN_PROXY}`);

console.log("\n=== SUMMARY TABLE ===");
console.log("mode,contracts,chars,bytes,kib,tokens(bytes/4)");
console.log(`full-67,${allContracts.length},${fullStats.chars},${fullStats.bytes},${(fullStats.bytes / 1024).toFixed(1)},${fullStats.tokens}`);
console.log(`slice-18,${sliceContracts.length},${sliceStats.chars},${sliceStats.bytes},${(sliceStats.bytes / 1024).toFixed(1)},${sliceStats.tokens}`);
console.log(`slice-18-noresource,${sliceContracts.length},${sliceNoResStats.chars},${sliceNoResStats.bytes},${(sliceNoResStats.bytes / 1024).toFixed(1)},${sliceNoResStats.tokens}`);
