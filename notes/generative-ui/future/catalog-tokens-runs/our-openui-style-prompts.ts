/**
 * READ-ONLY: generate the real OpenUI-Lang prompt via the actual
 * `@openuidev/lang-core` `library.prompt()` (v0.3.0), plus the
 * OpenUI-equivalent `buildOgInstructions` used in apps/compare.
 *
 * Run: cd /Users/work/open-generative && bun /tmp/gen-openui-prompt.ts
 */
import { openuiPrompt } from "/Users/work/open-generative/apps/compare/src/lib/openui/prompt.ts";
import { schemaLibrary } from "/Users/work/open-generative/apps/compare/src/lib/openui/definitions.ts";
import { componentDefinitions } from "/Users/work/open-generative/apps/compare/src/lib/openui/definitions.ts";
import { buildOgInstructions } from "/Users/work/open-generative/apps/compare/src/lib/og-prompt.ts";
import { writeFileSync } from "node:fs";

const utf8 = (s: string) => new TextEncoder().encode(s).byteLength;
function stats(label: string, prompt: string) {
  const bytes = utf8(prompt);
  const chars = [...prompt].length;
  console.log(`\n=== ${label} ===`);
  console.log(`  chars : ${chars}`);
  console.log(`  bytes : ${bytes}`);
  console.log(`  lines : ${prompt.split("\n").length}`);
  console.log(`  tokens (chars/4 proxy): ${Math.ceil(chars / 4)}`);
  console.log(`  tokens (bytes/4 proxy): ${Math.ceil(bytes / 4)}`);
  return { chars, bytes };
}

console.log("OpenUI local library components:");
console.log("  count =", componentDefinitions.length);
console.log("  types =", componentDefinitions.map((c: { name: string }) => c.name).join(", "));

const o = stats("OpenUI `library.prompt()` — apps/compare (8 Shadcn components)", openuiPrompt);
writeFileSync("/tmp/openui-prompt-compare-8.txt", openuiPrompt);

// Same prompt WITHOUT any component signatures, to isolate the fixed syntax-rule cost.
const bare = schemaLibrary.prompt({
  bindings: false,
  toolCalls: false,
  additionalRules: [],
});
const b = stats("OpenUI `library.prompt()` — syntax rules only (no additionalRules)", bare);
writeFileSync("/tmp/openui-prompt-syntax-only.txt", bare);

console.log(`\nOpenUI delta: component signatures + additional rules cost = ${o.chars - b.chars} chars`);

// ── OGL-prompt in OpenUI style: the compare app's 16-component slice ──
const COMPARE_SLICE_TYPES = [
  "layout.stack", "layout.grid", "content.text", "analysis.report",
  "ui.card", "ui.badge", "ui.button", "ui.alert", "ui.progress", "ui.separator",
  "ui.tabs", "ui.accordion", "ui.input", "ui.field", "ui.avatar", "ui.empty",
];
console.log(`\ncompare CATALOG_SLICE size = ${COMPARE_SLICE_TYPES.length}`);

// ── OGL-prompt in OpenUI style: all 67 official contracts ──
import { createOfficialCatalog } from "/Users/work/open-generative/packages/components/src/contracts.ts";
import { createAuthoringPropsSchema } from "/Users/work/open-generative/packages/compiler/src/schema.ts";

const official = await createOfficialCatalog();
const specs = (contracts: readonly any[]) =>
  contracts.map((contract) => ({
    type: contract.ref.componentType,
    category: String(contract.category ?? "extension:ui"),
    propsSignature: signatureOf(contract),
    requiredProps: (createAuthoringPropsSchema(contract) as any).required ?? [],
    summary: String(contract.prompt?.summary ?? ""),
    useWhen: (contract.prompt?.useWhen ?? []) as readonly string[],
    slots: (contract.slots ?? {}) as Record<string, { min: number; max: number }>,
  }));

/** Reuse the compiler's own signature renderer. */
import { describeModelJsonSchemaSignature } from "/Users/work/open-generative/packages/compiler/src/schema-signature.ts";
function signatureOf(contract: any): string {
  try {
    return describeModelJsonSchemaSignature(createAuthoringPropsSchema(contract));
  } catch {
    return "{}";
  }
}

const allSpecs = specs(official.componentContracts);
const fullOg = buildOgInstructions(allSpecs);
const f = stats("OGL prompt (OpenUI style, buildOgInstructions) — FULL 67", fullOg);
writeFileSync("/tmp/ogl-openui-style-full-67.txt", fullOg);

const sliceSpecs = specs(official.componentContracts.filter((c: any) => COMPARE_SLICE_TYPES.includes(c.ref.componentType)));
const sliceOg = buildOgInstructions(sliceSpecs);
const s = stats(`OGL prompt (OpenUI style) — compare slice ${sliceSpecs.length}`, sliceOg);
writeFileSync("/tmp/ogl-openui-style-compare-16.txt", sliceOg);

console.log("\n=== COMPARISON TABLE ===");
console.log("variant,components,chars,bytes,~tokens(chars/4)");
console.log(`OpenUI library.prompt() (compare),${componentDefinitions.length},${o.chars},${o.bytes},${Math.ceil(o.chars / 4)}`);
console.log(`OpenUI syntax-only,${0},${b.chars},${b.bytes},${Math.ceil(b.chars / 4)}`);
console.log(`OGL OpenUI-style full,${allSpecs.length},${f.chars},${f.bytes},${Math.ceil(f.chars / 4)}`);
console.log(`OGL OpenUI-style compare-slice,${sliceSpecs.length},${s.chars},${s.bytes},${Math.ceil(s.chars / 4)}`);
