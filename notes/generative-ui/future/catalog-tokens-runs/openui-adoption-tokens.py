#!/usr/bin/env python3
"""
Real-tokenizer counts for the "adopting OpenUI with the FULL shadcn/ui library"
measurement. Consumes the prompts written by openui-full-shadcn.ts.

Outputs, per tier: chars / bytes / chars÷4 / bytes÷4 / real tokens (tiktoken o200k_base
+ cl100k_base as a second opinion).

Setup (no repo files touched):
    python3 -m pip install --target /tmp/tkenv tiktoken

Run:  python3 /Users/work/ai/notes/generative-ui/future/catalog-tokens-runs/openui-adoption-tokens.py
"""
import sys, os

sys.path.insert(0, "/tmp/tkenv")
import tiktoken

O200K = tiktoken.get_encoding("o200k_base")
CL100K = tiktoken.get_encoding("cl100k_base")

D = "/tmp/oui-adoption"

# component counts come from the generator's manifest (avoid re-parsing the prompt)
_manifest = {}
try:
    import json
    _manifest = json.load(open(f"{D}/manifest.json", encoding="utf-8"))
except Exception:
    pass
_COMPS = {t["file"]: t["components"] for t in _manifest.get("tiers", [])}
_COMPS["A-bare.txt"] = 0
_COMPS["B-bare.txt"] = 8
_COMPS["C1-bare.txt"] = 61

FILES = [
    ("baseline · default AI SDK, NO system prompt", None),
    ("A   empty skeleton (0 comps)", f"{D}/A-empty.txt"),
    ("A'  empty skeleton, additionalRules=[]", f"{D}/A-bare.txt"),
    ("B   demo today (8 Shadcn blocks)", f"{D}/B-demo8.txt"),
    ("B'  demo today, additionalRules=[]", f"{D}/B-bare.txt"),
    ("C1  full shadcn/ui (60 ui.* + layout root)", f"{D}/C1-shadcn60.txt"),
    ("C1' full shadcn/ui, additionalRules=[]", f"{D}/C1-bare.txt"),
    ("C2  full shadcn/ui + prompt.useWhen", f"{D}/C2-shadcn60-usewhen.txt"),
    ("C3  full official catalog (67)", f"{D}/C3-full67.txt"),
    ("C4  full shadcn/ui LEAN (enum>10 -> string)", f"{D}/C4-shadcn-lean.txt"),
]


def main() -> None:
    print(f"{'tier':46s} {'comps':>5s} {'chars':>7s} {'bytes':>7s} {'chars/4':>8s} {'bytes/4':>8s} {'o200k':>7s} {'cl100k':>7s}")
    print("-" * 104)
    got = {}
    for label, path in FILES:
        if path is None:
            print(f"{label:46s} {0:5d} {0:7d} {0:7d} {0:8.0f} {0:8.0f} {0:7d} {0:7d}")
            got["baseline"] = 0
            continue
        if not os.path.exists(path):
            print(f"{label:46s}   MISSING {path}")
            continue
        s = open(path, encoding="utf-8").read()
        c, b = len(s), len(s.encode("utf-8"))
        o, cl = len(O200K.encode(s)), len(CL100K.encode(s))
        got[label.split()[0]] = o
        comps = _COMPS.get(os.path.basename(path), 0)
        print(f"{label:46s} {comps:5d} {c:7d} {b:7d} {c/4:8.0f} {b/4:8.0f} {o:7d} {cl:7d}")

    print()
    print("── deltas vs BASELINE (extra tokens you must inject to adopt OpenUI) ──")
    print(f"  A  empty skeleton                : {got.get('A', 0):>6d} tokens")
    print(f"  B  demo today (8 blocks)         : {got.get('B', 0):>6d} tokens")
    print(f"  C1 full shadcn/ui (61 defs)      : {got.get('C1', 0):>6d} tokens")
    print()
    print("── catalog-attributable part (tier minus empty skeleton) ──")
    print(f"  B  - A = {got.get('B',0) - got.get('A',0):>6d} tokens  (8 components)")
    print(f"  C1 - A = {got.get('C1',0) - got.get('A',0):>6d} tokens  (60 shadcn + 1 layout root)")
    print(f"  C4 - A = {got.get('C4',0) - got.get('A',0):>6d} tokens  (same, enums >10 collapsed)")
    print()
    print("NOTE: repo caliber is bytes/4 (packages/compiler/src/language.ts:20).")
    print("      OpenUI's own docs figure 8,959 is chars/4. Keep ONE column when quoting.")


if __name__ == "__main__":
    main()
