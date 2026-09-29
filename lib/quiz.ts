import type { Question } from "./types";

export type Mode = "practice" | "study" | "exam" | "mock";

export interface QuizConfig {
  mode: Mode;
  count: number; // number of questions
  domains: string[]; // empty = all
  shuffle: boolean;
  /** Blueprint weights. When supplied (and no domain filter), the quiz is
   *  sampled to match the official exam mix instead of the bank's own mix. */
  blueprint?: { domain: string; weight: number }[];
  /** Enemy adjacency — question id → ids that must not share a paper with it.
   *  See lib/enemies.ts for what counts as an enemy and why. */
  enemies?: Record<string, string[]>;
  /** How many times this learner has already been shown each question id.
   *  Items seen recently are pushed to the back of the queue so repeat sittings
   *  reach further into the bank instead of recycling the same core. */
  seen?: Record<string, number>;
}

export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F", "G"];

/**
 * True if the explanation text refers to options by letter — "Option C is
 * correct", "Options B and D…", "identifying major phases (B)".
 *
 * Reordering the options of such a question would leave the prose pointing at
 * the wrong letters, so those questions must keep their source order. Any
 * isolated A–E counts as a reference; the one common false positive is "A"
 * used as an English article ("A tool that…"), which we ignore. Erring towards
 * "yes, it references letters" is the safe direction — it only means we skip
 * the shuffle.
 */
export function explanationNamesOptions(explanation: string): boolean {
  // Deliberately avoids lookbehind for broader browser support.
  const re = /(^|[^A-Za-z])([A-E])(?![A-Za-z'])/g;
  for (const m of explanation.matchAll(re)) {
    const after = explanation.slice((m.index ?? 0) + m[1].length + 1);
    if (m[2] === "A" && /^\s+[a-z]/.test(after)) continue; // the article "A"
    return true;
  }
  return false;
}

/**
 * Return a copy of the question with its options in random order, relabeled
 * A/B/C…, and `correct` remapped to the new letters. Neutralizes any
 * answer-position bias inherited from the source material.
 *
 * Questions whose explanation names option letters are returned untouched —
 * see `explanationNamesOptions`.
 */
export function shuffleQuestionOptions(q: Question): Question {
  if (explanationNamesOptions(q.explanation)) return q;
  const correctSet = new Set(q.correct);
  const shuffled = shuffleArray(
    q.options.map((o) => ({ text: o.text, wasCorrect: correctSet.has(o.id) })),
  );
  const options = shuffled.map((o, i) => ({ id: OPTION_LETTERS[i], text: o.text }));
  const correct = shuffled
    .map((o, i) => (o.wasCorrect ? OPTION_LETTERS[i] : null))
    .filter((x): x is string => x !== null);
  return { ...q, options, correct };
}


/* ------------------------------------------------------------------ *
 * Topic spacing within a paper
 *
 * The banks draw on several sources covering the same objectives, so two
 * questions can probe the same narrow point in different words. Near-identical
 * rewrites are pruned from the banks themselves; this guards the remaining
 * case — picking two close relatives into the same sitting. Candidates are
 * taken in random order, and one that overlaps heavily with something already
 * chosen is skipped in favour of the next. If the rule cannot fill the quota,
 * it relaxes rather than handing back a short paper.
 * ------------------------------------------------------------------ */
const STOPWORDS = new Set(
  ("the a an of to and or in for with on is are be that this it as by if you your we our they can" +
   " will how what which when should would could may might not no do does at from their its has have")
    .split(" "),
);

const tokenCache = new Map<string, Set<string>>();
function contentTokens(q: Question): Set<string> {
  const hit = tokenCache.get(q.id);
  if (hit) return hit;
  const set = new Set(
    (q.question.toLowerCase().match(/[a-z0-9_]+/g) ?? []).filter(
      (w) => w.length > 2 && !STOPWORDS.has(w),
    ),
  );
  tokenCache.set(q.id, set);
  return set;
}

function overlap(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  const [small, large] = a.size < b.size ? [a, b] : [b, a];
  for (const w of small) if (large.has(w)) shared++;
  return shared / (a.size + b.size - shared);
}

/* ------------------------------------------------------------------ *
 * Selection constraints beyond topic spacing
 *
 * Three things pull on every pick, and they are resolved together rather than
 * in sequence — filtering one at a time lets each pass undo the last one's
 * work:
 *
 *   spacing    keeps close relatives out of the same paper (soft; gates the
 *              shortlist)
 *   enemies    bars pairs where one item gives away the other (hard; vetoes a
 *              candidate outright)
 *   difficulty keeps the paper's difficulty mix close to a realistic profile
 *   exposure   prefers items this learner has seen least often
 *
 * The last two only choose among candidates the first two already allow, so
 * neither can drag a near-duplicate or an enemy onto the paper.
 * ------------------------------------------------------------------ */

/**
 * Target share of each difficulty band in a sitting, 1 (direct recall) to 5
 * (expert judgement).
 *
 * A real paper clusters around the pass mark with a tail either side; it does
 * not mirror the bank's own mix. That matters here because the banks are
 * lopsided — CCDV-F holds more band-4 items than band-3 — so drawing
 * uniformly produces sittings that read as far harder or easier than the exam
 * they simulate, and a learner cannot tell whether a low score means they are
 * unprepared or simply drew a brutal paper.
 *
 * Treated as a pull, not a quota: a thin band stops attracting picks once it
 * runs dry, and the paper still fills.
 */
const DIFFICULTY_TARGET: Record<number, number> = {
  1: 0.04,
  2: 0.2,
  3: 0.44,
  4: 0.28,
  5: 0.04,
};

/** How far exposure may swing the tie-break. Difficulty need swings by about
 *  0.45, so at this weight neither consistently overrides the other. */
const EXPOSURE_WEIGHT = 0.5;

/**
 * Running state shared by every draw that goes into one paper.
 *
 * Deliberately shared across domains: enemies and difficulty are properties of
 * the *paper*, not of a domain, and enemy pairs regularly span topics. Scoring
 * each domain in isolation would let two items that give each other away land
 * on the same sitting purely because they were filed under different
 * objectives.
 */
interface PickContext {
  enemies?: Record<string, string[]>;
  seen?: Record<string, number>;
  /** ids barred because something already chosen is their enemy */
  blocked: Set<string>;
  /** difficulty band to how many chosen so far */
  bands: Map<number, number>;
  /** size of the finished paper, so band counts can be read as shares */
  target: number;
}

function newContext(config: QuizConfig, target: number): PickContext {
  return {
    enemies: config.enemies,
    seen: config.seen,
    blocked: new Set(),
    bands: new Map(),
    target: Math.max(1, target),
  };
}

function band(q: Question): number {
  const d = q.difficulty;
  return typeof d === "number" && d >= 1 && d <= 5 ? Math.round(d) : 3;
}

/** Record a pick: count its band, and bar everything it gives away. */
function noteChoice(q: Question, ctx: PickContext): void {
  const b = band(q);
  ctx.bands.set(b, (ctx.bands.get(b) ?? 0) + 1);
  for (const foe of ctx.enemies?.[q.id] ?? []) ctx.blocked.add(foe);
}

/**
 * How well a candidate serves what the paper still needs: positive when its
 * difficulty band is under-represented, reduced by how often this learner has
 * already seen it.
 */
function fitScore(q: Question, ctx: PickContext): number {
  const b = band(q);
  const want = DIFFICULTY_TARGET[b] ?? 0.1;
  const have = (ctx.bands.get(b) ?? 0) / ctx.target;
  const need = want - have;

  // Caps at four sightings: past that the item is thoroughly familiar and
  // further repeats do not make it more so.
  const seen = Math.min(ctx.seen?.[q.id] ?? 0, 4) / 4;

  return need - seen * EXPOSURE_WEIGHT;
}

/**
 * Pick the next index from `cands`.
 *
 * Distance decides who is eligible — the most-distant slice of the pool — and
 * fit decides who wins within it. Both stages keep a random element: taking the
 * strict best at either would make selection deterministic after the seed, so
 * every sitting would converge on the same "ideal" core and variety across
 * attempts would collapse.
 */
function chooseNext(
  cands: number[],
  pool: Question[],
  closest: number[],
  ctx: PickContext,
): number {
  const byDistance = [...cands].sort((a, b) => closest[a] - closest[b]);
  const shortlist = byDistance.slice(
    0,
    Math.max(3, Math.ceil(byDistance.length * 0.15)),
  );
  const scored = shortlist
    .map((i) => ({ i, s: fitScore(pool[i], ctx) }))
    .sort((a, b) => b.s - a.s);
  const top = scored.slice(0, Math.max(1, Math.ceil(scored.length / 3)));
  return top[Math.floor(Math.random() * top.length)].i;
}

/**
 * Take `n` questions from `qs`, chosen to be as unlike each other as possible
 * while honouring the paper-wide constraints carried in `ctx`.
 *
 * Greedy farthest-point selection: seed with a little-seen question, then
 * repeatedly take whichever allowed candidate is *least* like everything
 * already chosen. Compared with shuffle-and-skip this degrades gracefully — it
 * always fills the quota, and when the pool is tight it still returns the most
 * varied set available rather than falling back to arbitrary picks.
 *
 * Each candidate carries a running "closest similarity to anything chosen"
 * score, updated after every pick, so the whole selection is O(n*k) rather than
 * rescoring the pool from scratch each time.
 */
function pickSpaced(qs: Question[], n: number, ctx: PickContext): Question[] {
  if (n >= qs.length) {
    const all = shuffleArray(qs);
    for (const q of all) noteChoice(q, ctx);
    return all;
  }

  const pool = shuffleArray(qs);
  const tokens = pool.map(contentTokens);
  const closest = new Array(pool.length).fill(0); // similarity to nearest chosen
  const taken = new Array(pool.length).fill(false);

  const chosen: Question[] = [];

  // Seed from the least-seen of a small random sample. The shuffle already
  // randomised the order, so this costs nothing and stops every sitting from
  // opening on whichever question the learner has answered most often.
  let next = 0;
  const sample = Math.min(10, pool.length);
  for (let i = 1; i < sample; i++) {
    if ((ctx.seen?.[pool[i].id] ?? 0) < (ctx.seen?.[pool[next].id] ?? 0)) {
      next = i;
    }
  }

  for (let k = 0; k < n; k++) {
    taken[next] = true;
    chosen.push(pool[next]);
    noteChoice(pool[next], ctx);

    // refresh each candidate's distance to the newest pick
    const live: number[] = [];
    for (let i = 0; i < pool.length; i++) {
      if (taken[i]) continue;
      const sim = overlap(tokens[i], tokens[next]);
      if (sim > closest[i]) closest[i] = sim;
      live.push(i);
    }
    if (live.length === 0) break;

    // Enemies are a hard constraint, relaxed only when honouring it would hand
    // back a short paper — one question light is a worse failure than one
    // redundant pair.
    const free = live.filter((i) => !ctx.blocked.has(pool[i].id));
    next = chooseNext(free.length > 0 ? free : live, pool, closest, ctx);
  }
  return chosen;
}

/**
 * Order a finished paper so consecutive questions are not close relatives.
 * Same greedy idea applied to sequence rather than selection: repeatedly place
 * whichever remaining question is least like the one just placed.
 */
function spreadOrder(qs: Question[]): Question[] {
  if (qs.length < 3) return qs;
  const remaining = [...qs];
  const out: Question[] = [remaining.shift()!];
  while (remaining.length) {
    const prev = contentTokens(out[out.length - 1]);
    let best = 0;
    let bestSim = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const sim = overlap(prev, contentTokens(remaining[i]));
      if (sim < bestSim) {
        bestSim = sim;
        best = i;
      }
    }
    out.push(remaining.splice(best, 1)[0]);
  }
  return out;
}

/**
 * Allocate `count` slots across domains in proportion to their blueprint
 * weight, using the largest-remainder method so the parts sum exactly to the
 * whole. Domains without enough questions give their surplus back, and it is
 * redistributed to domains that still have spare — so a thin domain never
 * silently shrinks the paper.
 */
function allocateByWeight(
  countsAvailable: Map<string, number>,
  blueprint: { domain: string; weight: number }[],
  count: number,
): Map<string, number> {
  const total = blueprint.reduce((n, b) => n + b.weight, 0) || 1;
  const exact = blueprint.map((b) => ({
    domain: b.domain,
    want: (b.weight / total) * count,
  }));

  const alloc = new Map<string, number>();
  let used = 0;
  for (const e of exact) {
    const n = Math.floor(e.want);
    alloc.set(e.domain, n);
    used += n;
  }
  // hand out the remaining slots to the largest fractional parts
  const byRemainder = [...exact].sort(
    (a, b) => (b.want % 1) - (a.want % 1),
  );
  for (let i = 0; used < count && i < byRemainder.length; i++, used++) {
    const d = byRemainder[i].domain;
    alloc.set(d, (alloc.get(d) ?? 0) + 1);
  }

  // clamp to what each domain actually has, then redistribute the shortfall
  let shortfall = 0;
  for (const [d, n] of alloc) {
    const have = countsAvailable.get(d) ?? 0;
    if (n > have) {
      shortfall += n - have;
      alloc.set(d, have);
    }
  }
  while (shortfall > 0) {
    const spare = [...alloc.entries()].filter(
      ([d, n]) => (countsAvailable.get(d) ?? 0) > n,
    );
    if (spare.length === 0) break; // bank simply doesn't hold enough questions
    for (const [d, n] of spare) {
      if (shortfall === 0) break;
      alloc.set(d, n + 1);
      shortfall--;
    }
  }
  return alloc;
}

export function buildQuiz(all: Question[], config: QuizConfig): Question[] {
  let pool = all;
  if (config.domains.length > 0) {
    pool = pool.filter((q) => config.domains.includes(q.domain));
  }

  // One context for the whole paper, so enemies and the difficulty mix are
  // judged across it rather than within each domain — see PickContext.
  const ctx = newContext(config, config.count > 0 ? config.count : pool.length);

  // Blueprint-weighted sitting: draw per domain so the mix mirrors the real
  // exam. Only when the learner hasn't narrowed to specific domains — if they
  // have, they asked for that slice and we respect it.
  if (config.blueprint?.length && config.domains.length === 0 && config.count > 0) {
    const byDomain = new Map<string, Question[]>();
    for (const q of pool) {
      const arr = byDomain.get(q.domain);
      if (arr) arr.push(q);
      else byDomain.set(q.domain, [q]);
    }
    const available = new Map(
      [...byDomain.entries()].map(([d, qs]) => [d, qs.length]),
    );
    const alloc = allocateByWeight(available, config.blueprint, config.count);

    const picked: Question[] = [];
    for (const [domain, n] of alloc) {
      if (n <= 0) continue;
      const qs = byDomain.get(domain);
      if (!qs) continue;
      // fresh shuffle each sitting, so the same blueprint gives a new paper,
      // with close relatives spaced out of the same sitting
      picked.push(...pickSpaced(qs, n, ctx));
    }
    // Any leftover capacity (thin bank) comes from whatever remains, still
    // preferring items that are neither barred nor already familiar.
    if (picked.length < config.count) {
      const taken = new Set(picked.map((q) => q.id));
      const rest = pool.filter((q) => !taken.has(q.id));
      picked.push(...pickSpaced(rest, config.count - picked.length, ctx));
    }
    return spreadOrder(shuffleArray(picked)).map(shuffleQuestionOptions);
  }

  // Practice and study draw straight from the chosen slice, but still benefit
  // from the constraints: an enemy pair is just as unhelpful in a ten-question
  // drill, and a learner on their fifth run deserves questions they have not
  // already memorised.
  if (config.shuffle && config.count > 0 && config.count < pool.length) {
    return pickSpaced(pool, config.count, ctx).map(shuffleQuestionOptions);
  }

  pool = config.shuffle ? shuffleArray(pool) : [...pool];
  if (config.count > 0) pool = pool.slice(0, config.count);
  // Shuffle each question's options so the correct answer isn't position-biased.
  return pool.map(shuffleQuestionOptions);
}

/** True if the selected option ids exactly match the correct set. */
export function isCorrect(question: Question, selected: string[]): boolean {
  if (selected.length !== question.correct.length) return false;
  const set = new Set(question.correct);
  return selected.every((s) => set.has(s));
}

export function grade(questions: Question[], answers: Record<string, string[]>) {
  let correct = 0;
  const byDomain: Record<string, { correct: number; total: number }> = {};
  for (const q of questions) {
    const dom = q.domain || "General";
    byDomain[dom] ??= { correct: 0, total: 0 };
    byDomain[dom].total++;
    const sel = answers[q.id] ?? [];
    if (isCorrect(q, sel)) {
      correct++;
      byDomain[dom].correct++;
    }
  }
  const total = questions.length;
  const percent = total === 0 ? 0 : Math.round((correct / total) * 100);
  return { correct, total, percent, byDomain };
}

/** Recommended exam time: ~1.5 min per question. */
export function recommendedSeconds(count: number): number {
  return count * 90;
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
