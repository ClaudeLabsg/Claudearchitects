"""Find and remove near-duplicate questions across the banks.

The banks were built from several sources covering the same objectives, so the
same concept can appear twice in slightly different wording. Exact-text dedup
(which the generator already does) cannot see those. Two questions are treated
as near-duplicates when their content words overlap heavily (Jaccard >= 0.6
after stripping stopwords), which the samples confirm catches rewrites like
"organizational AI governance framework" vs "enterprise AI governance framework"
without touching genuinely distinct items.

Of each pair we keep the one with the fuller explanation, as the better study
item. Run with --apply to write; default is a dry report.
"""
import json, re, sys, io, glob, os
from itertools import combinations

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
APPLY = "--apply" in sys.argv
THRESHOLD = 0.60

STOP = set("""the a an of to and or in for with on is are be that this it as by if you your we our they
can will how what which when should would could may might not no do does at from their its has have""".split())

def toks(s):
    return {w for w in re.findall(r"[a-z0-9_]+", s.lower()) if w not in STOP and len(w) > 2}

total_removed = 0
for path in sorted(glob.glob("content/*.json")):
    exam = os.path.basename(path)[:-5]
    bank = json.load(io.open(path, encoding="utf-8"))
    sig = [(i, toks(q["question"])) for i, q in enumerate(bank)]

    drop = set()
    pairs = []
    for (i1, s1), (i2, s2) in combinations(sig, 2):
        if i1 in drop or i2 in drop or not s1 or not s2:
            continue
        inter = len(s1 & s2)
        if inter < 6:
            continue
        j = inter / len(s1 | s2)
        if j >= THRESHOLD:
            # keep the fuller explanation; tie-break on the earlier item
            a, b = bank[i1], bank[i2]
            loser = i2 if len(a.get("explanation", "")) >= len(b.get("explanation", "")) else i1
            drop.add(loser)
            pairs.append((round(j, 2), bank[i1]["question"][:80], bank[i2]["question"][:80], bank[loser]["id"]))

    print(f"\n=== {exam}: {len(bank)} questions, {len(drop)} near-duplicates to remove ===")
    for j, q1, q2, lost in pairs:
        print(f"  {j}  drop {lost}")
        print(f"        A: {q1}")
        print(f"        B: {q2}")

    if APPLY and drop:
        kept = [q for i, q in enumerate(bank) if i not in drop]
        io.open(path, "w", encoding="utf-8").write(json.dumps(kept, indent=1, ensure_ascii=False))
        print(f"  -> wrote {len(kept)} questions")
    total_removed += len(drop)

print(f"\n{'REMOVED' if APPLY else 'WOULD REMOVE'} {total_removed} near-duplicate questions")
if not APPLY:
    print("(dry run — pass --apply to write)")
