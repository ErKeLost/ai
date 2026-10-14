import { createOfficialCatalog } from "/Users/work/open-generative/packages/components/src/contracts.ts";
import { compileOpenGenerativeLanguageForFullCatalogBenchmark } from "/Users/work/open-generative/packages/compiler/src/language.ts";
import { createAuthoringPropsSchema } from "/Users/work/open-generative/packages/compiler/src/schema.ts";
import type { CompilerCatalogLike } from "/Users/work/open-generative/packages/compiler/src/types.ts";
import type { ComponentContract } from "/Users/work/open-generative/packages/catalog/src/contracts.ts";
import { writeFileSync } from "node:fs";
const cat=(cs:readonly ComponentContract[],h:string,rs:readonly unknown[]=[]):CompilerCatalogLike=>{
  const e=cs.map((c,i)=>({sliceComponentId:`component-${String(i+1).padStart(6,"0")}`,contract:c.ref}));
  const m=new Map(e.map((x,i)=>[x.sliceComponentId,cs[i]]));
  return {slice:{sliceHash:`sha256:${"f".repeat(64)}`,contractSetHash:h,components:e,resources:rs,limits:{maxOperations:64,maxTextBytes:64_000}},
    componentBySliceId:(id:string)=>m.get(id),
    authoringPropsSchema:(r:ComponentContract["ref"])=>{const c=cs.find(x=>x.ref.componentType===r.componentType)!;return createAuthoringPropsSchema(c);}} as unknown as CompilerCatalogLike;};
const o=await createOfficialCatalog();
const r={sliceResourceId:"resource-000001",source:{bindingId:"resource-analysis"},descriptor:{label:"Daily values",columns:[{columnId:"date",label:"Date",valueSchema:{type:"string",format:"date"}},{columnId:"value",label:"Value",valueSchema:{type:"number"}}]}};
const c=compileOpenGenerativeLanguageForFullCatalogBenchmark({catalog:cat(o.componentContracts,`sha256:${"d".repeat(64)}`,[r]),presentationPolicy:"required"});
writeFileSync("/tmp/ogl-full67-res.txt",c.systemPrompt); console.log("bytes",new TextEncoder().encode(c.systemPrompt).byteLength);
