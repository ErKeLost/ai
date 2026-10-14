import { createOfficialCatalog } from "/Users/work/open-generative/packages/components/src/contracts.ts";
import { compileOpenGenerativeLanguage, estimateOpenGenerativeLanguagePromptTokens } from "/Users/work/open-generative/packages/compiler/src/language.ts";
import { createAuthoringPropsSchema } from "/Users/work/open-generative/packages/compiler/src/schema.ts";
import type { CompilerCatalogLike } from "/Users/work/open-generative/packages/compiler/src/types.ts";
import type { ComponentContract } from "/Users/work/open-generative/packages/catalog/src/contracts.ts";
import { writeFileSync } from "node:fs";
function cat(contracts: readonly ComponentContract[], hash: string, resources: readonly unknown[] = []): CompilerCatalogLike {
  const entries = contracts.map((c,i)=>({sliceComponentId:`component-${String(i+1).padStart(6,"0")}`,contract:c.ref}));
  const byId=new Map(entries.map((e,i)=>[e.sliceComponentId,contracts[i]]));
  return { slice:{sliceHash:`sha256:${"f".repeat(64)}`,contractSetHash:hash,components:entries,resources,limits:{maxOperations:64,maxTextBytes:64_000}},
    componentBySliceId:(id:string)=>byId.get(id),
    authoringPropsSchema:(ref:ComponentContract["ref"])=>{const c=contracts.find(x=>x.ref.componentType===ref.componentType); if(!c) throw new Error("x"); return createAuthoringPropsSchema(c);} } as unknown as CompilerCatalogLike;
}
const official = await createOfficialCatalog();
const HASH=`sha256:${"d".repeat(64)}`;
const res={ sliceResourceId:"resource-000001", source:{bindingId:"resource-analysis"}, descriptor:{ label:"Daily values", columns:[{columnId:"date",label:"Date",valueSchema:{type:"string",format:"date"}},{columnId:"value",label:"Value",valueSchema:{type:"number"}}] } };
const ui = official.componentContracts.filter(c=>c.ref.componentType.startsWith("ui."));
console.log("ui.* contracts:", ui.length);
for (const [label, cs, rs] of [["ALL 60 shadcn ui.* (no resource)", ui, []],["ALL 60 shadcn ui.* + 1 resource", ui, [res]]] as const) {
  const c = compileOpenGenerativeLanguage({ catalog: cat(cs as any, HASH, rs as any), presentationPolicy:"required" });
  const bytes = new TextEncoder().encode(c.systemPrompt).byteLength;
  console.log(`${label}: chars=${[...c.systemPrompt].length} bytes=${bytes} (${(bytes/1024).toFixed(1)} KiB) tokenProxy(bytes/4)=${estimateOpenGenerativeLanguagePromptTokens(c.systemPrompt)}`);
  writeFileSync(`/tmp/ogl-shadcn60${rs.length?"-res":""}.txt`, c.systemPrompt);
}
