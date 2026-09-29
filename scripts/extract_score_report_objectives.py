"""Pull the OFFICIAL test objectives out of candidate score reports.

A score report lists, for each objective, the vendor's own wording plus that
candidate's percentage. We take ONLY the objective text: the reports carry a
real person's name, candidate id, registration number and results, none of
which belong anywhere near this repo.

Output: data/source/official-objectives.json  (gitignored)
"""
import json, re, sys, io, pathlib, glob

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
import pymupdf

REPORTS = [
    pathlib.Path.home() / "Downloads/scorereport.pdf",
    pathlib.Path.home() / "OneDrive/Desktop/scorereport 2.pdf",
    pathlib.Path.home() / "Downloads/Telegram Desktop/CCAR-P Malcom.pdf",
    pathlib.Path.home() / "Downloads/Telegram Desktop/CCAR-F Malcom.pdf",
]

# Everything we must never carry across.
PII = re.compile(r"(CANDIDATE|REGISTRATION|SITE NUMBER|YOUR SCORE|GRADE|DATE)\s*:", re.I)

out = {}
for path in REPORTS:
    if not path.exists():
        print(f"  missing: {path.name}")
        continue
    txt = "".join(p.get_text() for p in pymupdf.open(path))
    exam = (re.search(r"EXAM CODE:\s*(\S+)", txt) or [None, None])[1]
    if not exam:
        continue

    start = txt.find("TEST OBJECTIVES")
    body = txt[start:] if start >= 0 else txt
    body = body.split("PERCENT CORRECT", 1)[-1]

    # An objective is the text preceding each "NN%" marker; it may wrap lines.
    objectives, buf = [], []
    for line in body.split("\n"):
        line = line.strip()
        if not line or PII.search(line):
            continue
        if re.fullmatch(r"\d{1,3}%", line):          # the candidate's score — drop it
            if buf:
                o = " ".join(buf).strip()
                o = re.sub(r"\s*\u2014\s*", " — ", re.sub(r"-\s+", "", o))
                if len(o) > 25:
                    objectives.append(o)
                buf = []
        else:
            buf.append(line)

    prev = out.setdefault(exam, [])
    for o in objectives:
        if o not in prev:
            prev.append(o)
    print(f"  {path.name:<28} {exam}: +{len(objectives)} objectives (total {len(prev)})")

dest = pathlib.Path("data/source/official-objectives.json")
dest.write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")
print(f"\nwrote {dest}")
for k, v in out.items():
    print(f"  {k}: {len(v)} unique official objectives")
    print(f"     e.g. {v[0][:120]}")
# safety net: assert no personal data survived
blob = json.dumps(out)
for bad in ["Stephen", "Malcom", "ANTH", "CANDIDATE"]:
    assert bad not in blob, f"PII leaked: {bad}"
print("\nPII check: clean")
