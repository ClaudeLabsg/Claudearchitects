# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A free practice-exam site for the four Claude certifications (CCAO-F Associate, CCDV-F Developer, CCAR-F Architect Foundations, CCAR-P Architect Professional), live at https://claudearchitects.org. Next.js 15 App Router, React 19, Tailwind 4, TypeScript. No database, no accounts, no auth.

The repo is two separate things that meet at `content/*.json`:

1. **The site** — fully static. It serves pre-generated question JSON and **makes no AI calls at runtime**. Every route prerenders (`generateStaticParams` for the four exam pages); all learner state lives in `localStorage`.
2. **The content pipeline** (`scripts/`) — offline, run by hand, costs money. It calls Claude models through the Vercel AI Gateway to author, re-tag, grade and audit the question banks.

Keep that boundary. Nothing under `app/`, `components/` or `lib/` should acquire a runtime model call or a server dependency.

## Commands

```bash
npm install
npm run dev                  # http://localhost:3000
npm run build && npm start   # production build; prerenders 18 routes
```

`npm run lint` is **broken** — no ESLint config exists, so `next lint` drops into an interactive setup prompt and hangs. Use `npx tsc --noEmit` for typechecking; `next build` also runs its own lint + type pass, so a green build is the real gate. There is no test suite.

### Content pipeline

All of these need `AI_GATEWAY_API_KEY` (or `ANTHROPIC_API_KEY`) and read `.env` via `--env-file-if-exists`. They cost real money against live banks of 300–700 questions each, so **always do a scoped trial run first** — every script takes `--exam <ID>` and most take `--limit N`, `--dry`, `--batch` and `--concurrency`.

| Command | Does | Writes |
| --- | --- | --- |
| `npm run generate` | Authors original questions from `data/objectives.json` | `content/*.json` (replaces unless `--append`) |
| `npm run ground` | Rewrites each private source question into a new original testing the same concept at the same difficulty, keeping the key | `content/*.json` |
| `npm run rewrite` | Paraphrases `data/source/*.json`; resumes, skipping `"rewritten": true` unless `--force` | `content/*.json` |
| `npm run qa` | An independent model re-solves every question **without seeing the key**; flags disagreements | `reports/qa-report.json` (read-only on content) |
| `npm run adjudicate` | Settles QA-flagged items, fixes keys and explanations, drops unsalvageable ones, reassigns ids | `content/*.json` |
| `npm run audit` | Free structural audit — orphan keys, single-answer items with two keys, explanations arguing against their own key | `reports/bank-audit.md` (read-only) |

Unscripted one-offs in `scripts/` do the rest: `estimate_difficulty.mjs`, `find_enemy_items.mjs`, `reclassify.mjs`, `build_objectives.mjs`, `apply_official_objectives.mjs`, plus Python helpers for PDF parsing and near-duplicate pruning. Read a script's header comment before running it — each explains *why* it exists, and several are one-time migrations that should not be re-run.

`npm run qa` and `npm run audit` catch different defects and neither replaces the other: the known-bad CCAR-F-0087 passed every structural check while being comprehensively wrong, because it argued coherently for the wrong option. Run both.

## Data flow

```
data/source/*.json      (gitignored, private)  ─┐
data/objectives.json    (official blueprints)  ─┴─► scripts/ ─► content/*.json
                                                                      │
                                           lib/exams.ts imports it statically
                                                                      │
                                                        bundled at build time
```

`content/*.json` is committed and hand-editable — add, fix or remove items directly. Domain filters are derived from whatever `domain` values appear in the data, so no registry needs updating. `data/source/` and `reports/` are gitignored and absent from a fresh clone; scripts that read `data/source/` will not run without it.

## The parts that are not obvious

**`lib/quiz.ts` is the heart of the app** and is far more than a shuffle. `buildQuiz` resolves four constraints together, not in sequence, because filtering one at a time lets each pass undo the last:

- **Blueprint weighting** — mock sittings sample to `BLUEPRINT` in `lib/exams.ts` (the official per-domain exam weights), *not* to the bank's own mix. The banks are badly skewed; CCDV-F holds ~9% of its questions in a domain the real exam weights at 33%. Drawing straight from the pool would misrepresent the exam. Only applies when the learner has not filtered to specific domains — if they have, that slice is respected.
- **Enemy items** (`lib/enemies.ts`, `data/enemies.json`) — hard veto on pairs where one question gives away another. A paper holding both effectively asks 59 questions while claiming 60. Relaxed only if honouring it would return a short paper.
- **Difficulty bands** — `DIFFICULTY_TARGET` pulls each paper toward a realistic spread rather than the bank's lopsided one. A pull, not a quota.
- **Exposure** — questions this learner has seen are pushed back so repeat sittings reach further into the bank.
- **Lexical spacing** — greedy farthest-point selection keeps close relatives off the same paper, and `spreadOrder` keeps them non-adjacent.

Both selection stages keep a deliberate random element. Taking the strict best would make every sitting converge on the same "ideal" core and collapse variety across attempts — don't "fix" that by making it deterministic.

**Option shuffling has a trap.** `shuffleQuestionOptions` relabels options and remaps `correct`, but skips any question whose explanation names option letters ("Option C is correct") — reordering those would leave the prose pointing at the wrong letters. `explanationNamesOptions` deliberately errs toward "yes"; a false positive only costs a skipped shuffle.

**localStorage is versioned and migrated, not reset.** `lib/storage.ts` holds four namespaced keys (`ccp:attempts:v2`, `ccp:seen:v1`, `ccp:inprogress:v1`, plus the legacy `ccp:attempts:v1`). The v1→v2 read carries old history forward and leaves v1 in place so a rollback loses nothing. Keep that discipline — silently resetting someone's record is the exact complaint these features exist to answer. Note that `Attempt.served`/`missed` are optional: absent means *not captured*, never *nothing was missed*.

**Two visual identities in one app.** The landing page runs a dark theme scoped to `.arc` (`--arc-*` custom properties, set on a wrapper div in `app/page.tsx`); every other page uses the light `lite-*` classes. `SiteHeader` and `LiteBackdrop` both branch on `usePathname() === "/"`. A component used on both needs both treatments.

**`lib/site.ts` is the single source of truth** for brand, nav, community links, official links, PDFs and prep courses. `SITE.url` reads `NEXT_PUBLIC_SITE_URL` and falls back to the production domain; it feeds canonicals, sitemap, robots, `llms.txt` and the JSON-LD graph in `lib/seo.ts`. Changing a link in one place changes it everywhere, including on pages you were not looking at — `OFFICIAL` and `PDFS` each render on two pages.

**The site deliberately does not handle exam registration.** All apply/screening funnels were removed; it is a pure resource site. Factual description of the credential (fees, Pearson VUE, Credly, Partner Academy as the official route) stays, but do not reintroduce links or CTAs inviting people to apply.

## Content integrity

This codebase treats wrong answer keys as its most serious defect class, because every one found so far arrived as a hand-written email from a learner.

- **A model never changes `correct` on its own.** `rewrite.mjs` and `ground.mjs` carry the source key through untouched. Key changes go through `qa.mjs` → `adjudicate.mjs`, where an independent solver and then an adjudicator are involved.
- Questions carry optional `grounded` (written against a cited source passage) and `difficulty` (1–5). `difficulty` is a **model estimate, not an IRT parameter** — a usable proxy for balancing papers, to be replaced if real response data is ever collected.
- Answers can rot. Several questions were retired or corrected because Claude API behaviour moved underneath them. `qa.mjs` defaults to a current, strong grader (`QA_MODEL`, default `anthropic/claude-opus-5-5`) precisely because the grader's own knowledge is what catches that drift — don't downgrade it to save money.
- The results screen gives learners a prefilled `mailto:` report link carrying the question id and both answers (`reportHref` in `ExamRunner.tsx`).

## Provenance caveat

Per `README.md`, the bank committed in `content/` is still largely lightly-cleaned **PassQuestion** text — a paraphrase of a commercial bank, not original work, and it is being served publicly. Replacing it via `npm run generate` (objectives-authored, safe to publish) is the outstanding task on this project. Do not describe the current published bank as original, and prefer the `generate`/`ground` paths over `rewrite` for anything new.

The site is not affiliated with, endorsed by, or sponsored by Anthropic; the footer disclaimer in `SiteFooter.tsx` says so and should stay on every page.

## Gotchas

- **`README.md` is stale in places** — it documents the exam route as `/exam/[exam]` (actually `/mockexams/[exam]`) and its question counts are several hundred low. Trust the code and `content/*.json` over it.
- **Scroll-reveal breaks naive screenshots.** `components/arc/Reveal.tsx` starts at opacity 0 and fades in via `IntersectionObserver`. A full-page screenshot taken without scrolling shows a huge blank gap — the content is in the DOM and fine. Scroll the page first, then capture.
- **`metadata.icons` in `app/layout.tsx` overrides Next's `app/icon` file convention.** Declaring one means the favicon must be named there explicitly, or it builds and serves but is never linked.
- **`app/opengraph-image.tsx` reads its wordmark from disk as a base64 data URI.** Not `fetch(new URL(...))` — the bundler rewrites that to an origin-less path — and not a Node `Buffer`, which Satori rejects. Safe because the route is statically prerendered.
- Use `npm ci`, not `npm install`. Some npm versions rewrite `package-lock.json` to strip `libc` fields from native-binary metadata; that churn should never be committed.

## Save points

`docs/SAVE-POINTS.md` records tagged-equivalent snapshots of the live site as branches (`v1`, `v2`, …), each pinned to a commit verified in production alongside its Vercel deployment id. They are branches rather than git tags because the cloud sessions this repo is worked on from sit behind a proxy that 403s tag writes. Read that file before taking or restoring one; do not merge `main` into a save-point branch.
