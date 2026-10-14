#!/usr/bin/env python3
"""
Real-tokenizer counts for BOTH sides, so the slide comparison is apples-to-apples.

Repo caliber is bytes/4 (packages/compiler/src/language.ts:20). This script adds a
REAL tokenizer (tiktoken) count so we never have to call the proxy "measured tokens".

Setup (no repo files touched):
    python3 -m pip install --target /tmp/tkenv tiktoken

Inputs are the prompts emitted by:
    - /tmp/gen-catalog-prompt.ts        (our full 67 / slice 18)
    - /tmp/gen-openui-prompt.ts         (our OpenUI-style variants)
    - /Users/work/ai/openui/docs/generated/*.spec.json via oui_prompt_reproduce.sh (OpenUI)

Run: python3 /Users/work/ai/notes/generative-ui/future/catalog-tokens-runs/count-tokens.py
"""
import sys, os
sys.path.insert(0, "/tmp/tkenv")
import tiktoken

O200K = tiktoken.get_encoding("o200k_base")   # OpenAI gpt-4o/o-series; same family as OpenUI's "gpt-5" encoder
CL100K = tiktoken.get_encoding("cl100k_base")  # gpt-4 / gpt-3.5

# label, path
FILES = [
    ("OURS · full 67 contracts, no resource",            "/tmp/ogl-prompt-full-67.txt"),
    ("OURS · full 67 contracts + 1 resource",            "/tmp/ogl-full67-res.txt"),
    ("OURS · all 60 ui.* (shadcn layer) + 1 resource",   "/tmp/ogl-shadcn60-res.txt"),
    ("OURS · production slice 18 + 1 resource",          "/tmp/ogl-prompt-slice-18.txt"),
    ("OURS · production slice 18, no resource",          "/tmp/ogl-prompt-slice-18-noresource.txt"),
    ("OURS · OpenUI-style builder, full 67",             "/tmp/ogl-openui-style-full-67.txt"),
    ("OURS · OpenUI-style builder, compare slice 16",    "/tmp/ogl-openui-style-compare-16.txt"),
    ("OPENUI · playground production (82 comps)",        "/tmp/prompt-with.txt"),
    ("OPENUI · playground library-only (82 comps)",      "/tmp/prompt-without.txt"),
    ("OPENUI · chat production (84 comps)",              "/tmp/oui_prompt/out/chat-production.txt"),
    ("OPENUI · playground route (examples only)",        "/tmp/oui_prompt/out/playground-route-examples-only.txt"),
    ("OPENUI · empty skeleton (0 comps)",                "/tmp/oui_prompt/out/empty-no-components.txt"),
]


def main() -> None:
    print(f"{'variant':50s} {'bytes':>7s} {'chars':>7s} {'chars/4':>7s} {'bytes/4':>7s} {'o200k':>6s} {'cl100k':>6s}")
    print("-" * 100)
    for label, path in FILES:
        if not os.path.exists(path):
            print(f"{label:50s}   MISSING {path}")
            continue
        s = open(path, encoding="utf-8").read()
        b, c = len(s.encode("utf-8")), len(s)
        print(f"{label:50s} {b:7d} {c:7d} {c/4:7.0f} {b/4:7.0f} {len(O200K.encode(s)):6d} {len(CL100K.encode(s)):6d}")
    print()
    print("NOTE: repo caliber is bytes/4 (packages/compiler/src/language.ts:20).")
    print("      For pure-ASCII prompts bytes/4 OVER-estimates by ~10% vs o200k_base.")
    print("      OpenUI's slide figure 8,959 is *chars/4* (its prompts contain non-ASCII dashes,")
    print("      so bytes/4 = 9,016 there). Use ONE column consistently when quoting.")


if __name__ == "__main__":
    main()
