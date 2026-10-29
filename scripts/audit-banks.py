# -*- coding: utf-8 -*-
"""Structural audit of the four question banks. Read-only; never edits content.

The free counterpart to scripts/qa.mjs. That one spends money having a model
re-solve every question on the merits; this one costs nothing and checks the
things a model cannot see: keys pointing at options that do not exist, a
single-answer question with two keys, the same question filed twice under
different answers, an explanation that argues for a letter the key disagrees
with, and claims about the Claude API that have since moved.

The two catch different defects and neither replaces the other. CCAR-F-0087 —
the wrong answer a learner reported — passed every check in here while being
comprehensively wrong, because it argued coherently for the wrong option. Run
both.

Usage:
    python scripts/audit-banks.py
    npm run audit
"""
import io
import json
import os
import re
import sys
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CONTENT = os.path.join(ROOT, "content")
REPORT = os.path.join(ROOT, "reports", "bank-audit.md")
BANKS = ["CCAO-F", "CCAR-F", "CCAR-P", "CCDV-F"]

findings = defaultdict(list)


def add(cat, q, detail):
    findings[cat].append((q.get("id", "?"), q.get("exam", "?"), detail))


def load(name):
    with io.open(os.path.join(CONTENT, name + ".json"), encoding="utf-8") as f:
        d = json.load(f)
    return d["questions"] if isinstance(d, dict) and "questions" in d else d


# --- explanation contradicting its own key ---------------------------------
SAYS_RIGHT = re.compile(
    r"(?:option\s+)?\b([A-E])\b\s+(?:is|are)\s+(?:the\s+)?(?:correct|right|best)"
    r"|correct\s+answer\s+is\s+(?:option\s+)?\b([A-E])\b"
    r"|(?:option\s+)?\b([A-E])\b\s+correctly\b",
    re.I,
)
SAYS_WRONG = re.compile(
    r"(?:option\s+)?\b([A-E])\b\s+(?:is|are)\s+(?:incorrect|wrong|ineffective|"
    r"counterproductive|insufficient|inadequate|not\b)"
    r"|(?:option\s+)?\b([A-E])\b\s+(?:misunderstands|fails|ignores|overlooks|"
    r"confuses|conflates)\b",
    re.I,
)


def letters(matches):
    out = set()
    for m in matches:
        for g in m.groups():
            if g:
                out.add(g.upper())
    return out


# --- Claude API facts that have moved --------------------------------------
# Each of these has already produced at least one wrong answer in this bank.
# Where a fact appears matters more than that it appears: a retired model name
# inside a distractor is harmless, the same name inside the keyed option is a
# defect. The report separates the two.
STALE = [
    (r"\bclaude[- ]3(?:\.\d)?\b|\bclaude[- ]2\b|\bclaude\s+instant\b",
     "names a retired model generation"),
    (r"\bbudget_tokens\b|thinking_budget_tokens",
     "budget_tokens is removed on current models (400)"),
    (r"\boutput_format\b",
     "output_format is deprecated - now output_config.format"),
    (r"200[,.]?000[- ]token|\b200K\s+(?:token\s+)?context",
     "200K context - current models are 1M"),
    (r"1[,.]?024[- ]tokens?\b",
     "cache minimum is model-dependent (512-4096), not a flat 1024"),
    (r"\bprefill(?:ing|ed)?\b",
     "assistant prefill returns 400 on current models"),
    (r"web_search_20250305|web_fetch_20250910",
     "superseded server-tool type string"),
    (r"\btemperature\b|\btop_p\b|\btop_k\b",
     "sampling parameters return 400 on current models"),
]

# --- a keyed answer that breaks a promise the stem made ---------------------
CONSTRAINT = re.compile(
    r"while\s+(?:still\s+)?(?:maintaining|preserving|retaining|keeping|continuing)\s+([^.?]{3,70})"
    r"|without\s+(?:sacrificing|losing|giving up|abandoning|disabling)\s+([^.?]{3,70})",
    re.I,
)
ABANDON = re.compile(
    r"\b(sequential|serially|one at a time|disable|disabling|remove|removing|"
    r"eliminate|eliminating|abandon|stop|switch\s+off|turn\s+off|revert|"
    r"waiting for each)\b",
    re.I,
)

ORDER = [
    ("dangling-key", "a correct id that is not one of the options"),
    ("no-key", "no correct answer recorded"),
    ("cardinality", "single-answer with two keys, or multi with one"),
    ("explanation-contradicts-key", "the explanation argues for a different letter"),
    ("duplicate-question-DIFFERENT-KEYS", "same question, different answers"),
    ("key-may-violate-stem", "keyed answer appears to break a stem constraint"),
    ("stale-fact-KEYED", "a moved API fact inside the KEYED option - usually a wrong answer"),
    ("stale-fact-explanation", "a moved API fact in the explanation - needs a human to judge"),
    ("stale-fact-incidental", "a moved API fact in a distractor or the stem - usually harmless"),
    ("duplicate-question", "same question twice, same answer"),
    ("no-explanation", "nothing to learn from"),
    ("dup-option-id", "two options share an id"),
    ("dup-option-text", "two options share wording"),
    ("unverified", "grounded or adjudicated is false"),
]
HARD = {"dangling-key", "no-key", "cardinality",
        "explanation-contradicts-key", "duplicate-question-DIFFERENT-KEYS"}


def main():
    all_q = []
    by_text = defaultdict(list)

    for name in BANKS:
        qs = load(name)
        print("%-9s %4d questions" % (name, len(qs)))
        for q in qs:
            all_q.append(q)
            opt_ids = [o.get("id") for o in q.get("options", [])]
            correct = q.get("correct", [])
            expl = q.get("explanation") or ""
            stem = q.get("question") or ""
            keyed = " ".join(o.get("text", "") for o in q.get("options", [])
                             if o.get("id") in set(correct))
            others = " ".join(o.get("text", "") for o in q.get("options", [])
                              if o.get("id") not in set(correct))

            for c in correct:
                if c not in opt_ids:
                    add("dangling-key", q, "correct %r not among %s" % (c, opt_ids))
            if not correct:
                add("no-key", q, "no correct answer recorded")
            if q.get("type") == "single" and len(correct) != 1:
                add("cardinality", q, "type=single but %d correct" % len(correct))
            if q.get("type") == "multi" and len(correct) < 2:
                add("cardinality", q, "type=multi but %d correct" % len(correct))
            if not expl.strip():
                add("no-explanation", q, "explanation empty")
            if len(opt_ids) != len(set(opt_ids)):
                add("dup-option-id", q, str(opt_ids))
            texts = [(o.get("text") or "").strip().lower() for o in q.get("options", [])]
            if len(texts) != len(set(texts)):
                add("dup-option-text", q, "two options share wording")
            if not q.get("grounded", True) or not q.get("adjudicated", True):
                add("unverified", q, "grounded=%s adjudicated=%s"
                    % (q.get("grounded"), q.get("adjudicated")))

            ck = set(correct)
            bad_right = {l for l in letters(SAYS_RIGHT.finditer(expl))
                         if l in opt_ids and l not in ck}
            bad_wrong = {l for l in letters(SAYS_WRONG.finditer(expl)) if l in ck}
            if bad_right:
                add("explanation-contradicts-key", q,
                    "explanation calls %s correct, key is %s"
                    % (sorted(bad_right), sorted(ck)))
            if bad_wrong:
                add("explanation-contradicts-key", q,
                    "explanation dismisses the keyed answer %s" % sorted(bad_wrong))

            for pat, why in STALE:
                where = []
                if re.search(pat, keyed, re.I):
                    where.append("KEYED OPTION")
                if re.search(pat, expl, re.I):
                    where.append("explanation")
                if re.search(pat, stem, re.I):
                    where.append("stem")
                if re.search(pat, others, re.I):
                    where.append("distractor")
                if not where:
                    continue
                # Three tiers, because where the fact sits decides whether it is
                # a defect at all. In the keyed option it is almost always a
                # wrong answer. In the explanation it needs a human: an
                # explanation that correctly says "temperature is now rejected"
                # matches the same pattern as one that tells you to tune it.
                # In a distractor it is harmless - a wrong answer made wronger.
                if "KEYED OPTION" in where:
                    cat = "stale-fact-KEYED"
                elif "explanation" in where:
                    cat = "stale-fact-explanation"
                else:
                    cat = "stale-fact-incidental"
                add(cat, q, "%s - in %s" % (why, " + ".join(where)))

            m = CONSTRAINT.search(stem)
            if m and ABANDON.search(keyed):
                clause = (m.group(1) or m.group(2) or "").strip()
                add("key-may-violate-stem", q,
                    "stem requires '%s'; keyed: %s" % (clause[:50], keyed[:80]))

            by_text[re.sub(r"\s+", " ", stem.strip().lower())].append(q)

    for text, group in by_text.items():
        if len(group) < 2 or not text:
            continue
        ids = ["%s/%s" % (g.get("exam"), g.get("id")) for g in group]
        keys = {tuple(sorted(g.get("correct", []))) for g in group}
        cat = ("duplicate-question-DIFFERENT-KEYS" if len(keys) > 1
               else "duplicate-question")
        findings[cat].append(
            (ids[0], group[0].get("exam"),
             "%d copies: %s%s" % (len(group), ids,
                                  "  KEYS DIFFER: %s" % sorted(keys)
                                  if len(keys) > 1 else "")))

    print("\ntotal questions: %d\n" % len(all_q))
    lines = ["# Question bank audit\n", "Total questions: %d\n" % len(all_q)]
    hard_total = 0
    for cat, blurb in ORDER:
        rows = findings.get(cat, [])
        if cat in HARD:
            hard_total += len(rows)
        print("%-36s %4d  %s" % (cat, len(rows), blurb))
        lines.append("\n## %s - %d\n\n_%s_\n" % (cat, len(rows), blurb))
        for qid, exam, detail in rows:
            lines.append("- `%s` (%s) - %s" % (qid, exam, detail))

    os.makedirs(os.path.dirname(REPORT), exist_ok=True)
    with io.open(REPORT, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print("\nreport: %s" % REPORT)

    # Non-zero only for defects that are unambiguously broken, so this can gate
    # a build without the judgement-call categories blocking a deploy.
    if hard_total:
        print("\n%d hard defect(s) - these are always bugs." % hard_total)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
