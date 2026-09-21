# Claude Cert Practice

A free, community-built practice-exam platform for the Claude certifications:

| Exam | Track | Level | Questions |
| --- | --- | --- | --- |
| **CCAO-F** | Associate | Foundation | 117 |
| **CCAR-F** | Architect | Foundation | 152 |
| **CCAR-P** | Architect | Professional | 104 |
| **CCDV-F** | Developer | Foundation | 678 |

Built with Next.js (App Router) + Tailwind CSS. No database, no accounts — progress is stored in the visitor's browser. The quiz needs **no AI at runtime**; it just serves pre-generated question JSON, so hosting is cheap.

## Features

- **Practice mode** — answer one at a time, get instant right/wrong feedback and a full explanation.
- **Exam mode** — timed simulation with a question navigator, flag-for-review, score, pass/fail, and a per-domain breakdown.
- Filter by domain, choose 10 / 25 / 50 / all questions, shuffled each attempt.
- Light/dark aware, responsive, keyboard-friendly.

## Run locally

```bash
npm install
npm run dev
# open http://localhost:3000
```

Build for production:

```bash
npm run build && npm start
```

## Project structure

```
app/                 # routes (home, /about, /exam/[exam])
components/           # ExamRunner (setup/run/results), QuestionView
lib/                 # types, exam metadata, quiz logic, localStorage
content/*.json       # the question banks the app serves  (committed)
data/source/*.json   # private raw source banks           (gitignored)
scripts/rewrite.mjs  # rewrite/expand pipeline (see below)
```

### Question format (`content/<EXAM>.json`)

```json
{
  "id": "CCDV-F-001",
  "exam": "CCDV-F",
  "type": "single",           // or "multi"
  "domain": "Agent SDK",
  "question": "…",
  "options": [{ "id": "A", "text": "…" }, { "id": "B", "text": "…" }],
  "correct": ["A"],
  "explanation": "…",
  "rewritten": true
}
```

You can hand-edit these files directly — add, fix, or remove items. The domain
filter is derived automatically from whatever `domain` values appear in the data.

## Generate original questions from the official objectives (recommended for a public site)

The cleanest way to build a **publishable** bank: generate fresh questions from
the official exam objectives (`data/objectives.json`, drawn from Anthropic's
score-report blueprints) rather than adapting a third-party bank. Nothing is
derived from any vendor's questions.

```bash
# PowerShell
$env:AI_GATEWAY_API_KEY = "your_gateway_key"
npm run generate                       # all exams, ~3 questions per objective (~300 total)
npm run generate -- --exam CCAO-F --per 5
npm run generate -- --exam CCDV-F --limit 2 --per 3   # cheap trial (first 2 objectives)
npm run generate -- --dry              # no API calls; just prints the plan
npm run generate -- --append           # add to the existing bank instead of replacing
```

- Writes `content/*.json` (what the app serves). Replaces that exam's bank
  unless you pass `--append`. Your private PassQuestion-derived bank stays in
  `data/source/*.json` and is untouched.
- Model via `GENERATE_MODEL` (or `REWRITE_MODEL`); default `anthropic/claude-sonnet-4.5`.
  Use a smaller model (e.g. `anthropic/claude-haiku-4.5`) to cut cost.
- Edit `data/objectives.json` to add/adjust objectives or change coverage.

## Rewrite / expand pipeline (alternative: adapt the source PDFs)

The banks in `content/` were extracted from source PDFs and cleaned. To turn them
into polished, **original** items (freshly worded stems, expanded explanations,
tidier domain tags) — recommended before publishing publicly — run the rewrite
pipeline. It uses a Claude model through the [Vercel AI Gateway](https://vercel.com/docs/ai-gateway).

```bash
# PowerShell
$env:AI_GATEWAY_API_KEY = "your_gateway_key"
npm run rewrite                      # all four exams
npm run rewrite -- --exam CCDV-F     # one exam
npm run rewrite -- --exam CCAO-F --limit 20   # first 20 pending (a cheap trial run)
npm run rewrite -- --force           # re-rewrite everything
```

- The pipeline reads `data/source/*.json`, rewrites each question, and writes
  `content/*.json`. It **resumes** — items already marked `"rewritten": true`
  are skipped unless you pass `--force`.
- The correct answer id(s) are taken from the source and never changed by the model.
- Pick the model with `REWRITE_MODEL` (default `anthropic/claude-sonnet-4.5`);
  use a smaller model to cut cost, e.g. `REWRITE_MODEL=anthropic/claude-haiku-4.5`.
- Prefer a direct provider instead of the Gateway? Set `ANTHROPIC_API_KEY` and
  change the `model` string in `scripts/rewrite.mjs` to an `@ai-sdk/anthropic`
  model.

## Deploy to Vercel

1. Push this folder to a Git repo (GitHub/GitLab/Bitbucket).
2. In the [Vercel dashboard](https://vercel.com/new), import the repo. Framework
   preset **Next.js** is detected automatically; no environment variables are
   needed for the site itself.
3. Deploy. That's it.

Or with the CLI:

```bash
npm i -g vercel
vercel          # preview
vercel --prod   # production
```

## Content & licensing note

Two content paths:

- **`npm run generate`** — original questions authored from the official exam
  objectives. Safe to publish. **This is the recommended path for anything public.**
- **`npm run rewrite`** — a close paraphrase of the source PassQuestion PDFs.
  Lower risk than verbatim, but still a derivative of a commercial bank; best
  kept for private study.

The bank currently committed in `content/` is the lightly-cleaned PassQuestion
text (fine for private study). **Before making the site public, run
`npm run generate`** so the published items are original work rather than a
redistribution of someone else's material.

This project is not affiliated with, endorsed by, or sponsored by Anthropic.
"Claude" and the certification names are trademarks of their respective owner and
are used only to describe what the practice content covers.
