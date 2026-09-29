"""Parse the supplied practice-question PDFs into structured JSON.

Two layouts appear across the set:
  * domain-grouped  (CCAO-F, CCDV-F, CCAR-P) — "Domain N: Name (X%)" sections
  * scenario-grouped (CCAR-F)               — "Scenario N: Title" + per-question
                                               "Domain N" tag in the header

Both carry an "Answer Key & Rationales" section keyed by question ref (e.g.
"1.1 - Correct: B"). Output goes to data/source/ which is gitignored: this is
source material for rewriting, not content to publish verbatim.
"""
import json, re, sys, io, pathlib

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
import pymupdf

SRC = pathlib.Path.home() / "OneDrive/Desktop/CCAF resources"
OUT = pathlib.Path("data/source")
FILES = {"CCAO-F": "CCAOF", "CCDV-F": "CCDVF", "CCAR-F": "CCARF", "CCAR-P": "CCARP"}

Q_HEAD = re.compile(r"Question\s+(\d+\.\d+)\s*·\s*(.*?)\s*\n", re.S)
DOMAIN_HEAD = re.compile(r"^Domain\s+(\d+):\s*(.+?)\s*\(([\d.]+)%\)", re.M)
SCEN_HEAD = re.compile(r"^Scenario\s+(\d+):\s*(.+?)\s*$", re.M)
OPT = re.compile(r"^([A-E])\.\s+(.*?)(?=^\s*[A-E]\.\s|\Z)", re.M | re.S)
ANS = re.compile(r"^(\d+\.\d+)\s*[—-]\s*Correct:\s*([A-E](?:\s*(?:,|and)\s*[A-E])*)", re.M)
RAT = re.compile(r"^(\d+\.\d+)\s*[—-]\s*Correct:[^\n]*\n(.*?)(?=^\d+\.\d+\s*[—-]\s*Correct:|\Z)", re.M | re.S)


def clean(s: str) -> str:
    s = s.replace("\u200b", "").replace("\u00a0", " ")
    s = re.sub(r"\n?[A-Z]{4}-[A-Z] Practice Questions[^\n]*\n\s*\d+\s*\n", "\n", s)
    s = re.sub(r"\s*\n\s*", " ", s)
    return re.sub(r"\s{2,}", " ", s).strip()


def parse(exam: str, stem: str):
    doc = pymupdf.open(SRC / f"{stem}.pdf")
    txt = "".join(p.get_text() for p in doc).replace("\u200b", "")

    split = txt.find("Answer Key & Rationales")
    body, key = txt[:split], txt[split:]

    correct = {r: [c.strip() for c in re.split(r",|and", cs) if c.strip()]
               for r, cs in ANS.findall(key)}
    rationale = {r: clean(t) for r, t in RAT.findall(key)}

    # positions of domain / scenario headers so each question inherits its section
    sections = [(m.start(), m.group(2).strip(), m.group(1)) for m in DOMAIN_HEAD.finditer(body)]
    # The scenario layout has no in-body domain sections; its blueprint is the
    # numbered list in the intro ("1. Name - 27% -> 16 questions").
    if not sections:
        intro = re.findall(r"(\d)\.\s*([^—]{5,70}?)\s*—\s*\d+%\s*→", body)
        sections = [(-1, name.strip(), num) for num, name in intro]
    scenarios = [(m.start(), m.group(2).strip()) for m in SCEN_HEAD.finditer(body)]
    domain_by_num = {n: name for _, name, n in sections}

    heads = list(Q_HEAD.finditer(body))
    out = []
    for i, m in enumerate(heads):
        ref, meta = m.group(1), m.group(2)
        start, end = m.end(), (heads[i + 1].start() if i + 1 < len(heads) else len(body))
        chunk = body[start:end]

        opts = [{"id": g, "text": clean(t)} for g, t in OPT.findall(chunk)]
        if not opts:
            continue
        qtext = clean(chunk[: OPT.search(chunk).start()])

        # domain: from the header tag (scenario layout) or the enclosing section
        dm = re.search(r"Domain\s*(\d+)", meta)
        if dm:
            domain = domain_by_num.get(dm.group(1), f"Domain {dm.group(1)}")
        else:
            prior = [s for s in sections if s[0] < m.start()]
            domain = prior[-1][1] if prior else "General"

        scen = [s for s in scenarios if s[0] < m.start()]
        multi = "multiple response" in meta.lower() or len(correct.get(ref, [])) > 1

        out.append({
            "ref": ref, "exam": exam, "domain": domain,
            "scenario": scen[-1][1] if scen else None,
            "type": "multi" if multi else "single",
            "question": qtext, "options": opts,
            "correct": correct.get(ref, []),
            "rationale": rationale.get(ref, ""),
        })
    return out


OUT.mkdir(parents=True, exist_ok=True)
total = 0
for exam, stem in FILES.items():
    qs = parse(exam, stem)
    bad = [q for q in qs if not q["correct"] or len(q["options"]) < 2 or not q["question"]]
    (OUT / f"purcell-{exam}.json").write_text(json.dumps(qs, indent=1, ensure_ascii=False), encoding="utf-8")
    doms = sorted({q["domain"] for q in qs})
    print(f"{exam}: {len(qs):3d} parsed | {len(bad)} incomplete | {len(doms)} domains")
    for d in doms:
        print(f"      - {d} ({sum(1 for q in qs if q['domain'] == d)})")
    total += len(qs)
print(f"\ntotal parsed: {total}")
