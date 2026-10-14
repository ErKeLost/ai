#!/usr/bin/env bash
# Reproduces OpenUI's real system-prompt size WITHOUT installing the repo's deps.
# Repo (/Users/work/ai/openui) is only read. Everything lands in /tmp/oui_prompt.
# Requires: node >= 22.6 (native TS type-stripping). Tested on node v24.16.0.
set -euo pipefail
REPO=${REPO:-/Users/work/ai/openui}
W=/tmp/oui_prompt
rm -rf "$W" && mkdir -p "$W/out"
cd "$REPO"

# 1. Copy the REAL prompt generator and its only data dependency.
cp packages/lang-core/src/parser/prompt.ts "$W/prompt.ts"
cp packages/lang-core/src/parser/builtins.ts "$W/builtins.ts"
cp packages/react-ui/src/genui-lib/prompt-options/index.ts "$W/prompt-options.ts"

# 2. Stub the two imports irrelevant to non-cloud generatePrompt().
python3 - "$W/prompt.ts" <<'PY'
import sys
p=sys.argv[1]; s=open(p).read()
s=s.replace('import { recordSystemPromptGeneration } from "../telemetry/runtime";',
            'const recordSystemPromptGeneration = (..._a: unknown[]): void => {};')
s=s.replace('import { generateCloudConfig } from "./cloud-config";',
            'const generateCloudConfig = (_s: unknown): string => { throw new Error("cloud disabled"); };')
s=s.replace('import { BUILTINS, LAZY_BUILTIN_DEFS } from "./builtins";',
            'import { BUILTINS, LAZY_BUILTIN_DEFS } from "./builtins.ts";')
s=s.replace('import type { LibraryJSONSchema } from "./types";','')
open(p,'w').write(s)
PY

# 3. Driver: builds the exact prompts the docs routes send, plus library-only & empty variants.
cat > "$W/driver.ts" <<'TS'
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { generateSystemPrompt, generatePrompt } from "./prompt.ts";
import { openuiPromptOptions, openuiChatPromptOptions } from "./prompt-options.ts";

const REPO = "/Users/work/ai/openui";
const OUT = "/tmp/oui_prompt/out";
mkdirSync(OUT, { recursive: true });
const n = (s: string) => ({ chars: [...s].length, bytes: Buffer.byteLength(s, "utf8"), lines: s ? s.split("\n").length : 0 });

function report(name: string, prompt: string, spec: any) {
  writeFileSync(join(OUT, name + ".txt"), prompt);
  const t = n(prompt);
  console.log(`${name}: components=${Object.keys(spec.components).length} chars=${t.chars} bytes=${t.bytes} lines=${t.lines}`);
  const lines = prompt.split("\n"); const marks: any[] = [];
  lines.forEach((l, i) => { if (l.startsWith("## ")) marks.push({ title: l.slice(3).trim(), line: i }); });
  let syntax = 0, sigs = 0;
  const first = marks.length ? marks[0].line : lines.length;
  const secs = [{ title: "(preamble)", text: lines.slice(0, first).join("\n") }];
  for (let i = 0; i < marks.length; i++) {
    const end = i + 1 < marks.length ? marks[i + 1].line : lines.length;
    secs.push({ title: marks[i].title, text: lines.slice(marks[i].line, end).join("\n") });
  }
  for (const s of secs) {
    const c = n(s.text);
    console.log(`   ${s.title.padEnd(42)} chars=${String(c.chars).padStart(6)} bytes=${String(c.bytes).padStart(6)} lines=${String(c.lines).padStart(4)}`);
    if (s.title === "Syntax Rules") syntax = c.chars;
    if (s.title === "Component Signatures") sigs = c.chars;
  }
  console.log(`   >> syntax-rules=${syntax}c  component-signatures=${sigs}c`);
}

const chatSpec: any = JSON.parse(readFileSync(join(REPO, "docs/generated/chat-library.spec.json"), "utf8"));
const playSpec: any = JSON.parse(readFileSync(join(REPO, "docs/generated/playground-library.spec.json"), "utf8"));

report("chat-production", generateSystemPrompt({ library: chatSpec, promptOptions: openuiChatPromptOptions } as any), chatSpec);
report("playground-production", generateSystemPrompt({ library: playSpec, promptOptions: openuiPromptOptions } as any), playSpec);
import { openuiExamples } from "./prompt-options.ts";
report("playground-route-examples-only", generateSystemPrompt({ library: playSpec, promptOptions: { examples: openuiExamples } } as any), playSpec);
report("chat-library-only", generatePrompt({ root: chatSpec.root, components: chatSpec.components, componentGroups: chatSpec.componentGroups } as any), chatSpec);
report("playground-library-only", generatePrompt({ root: playSpec.root, components: playSpec.components, componentGroups: playSpec.componentGroups } as any), playSpec);
report("empty-no-components", generatePrompt({ root: "Stack", components: {} } as any), { components: {} });
TS

# 4. Run with Node native TS type-stripping (no tsx/esbuild needed).
node "$W/driver.ts"
echo; echo "Prompt files: $W/out/*.txt"
