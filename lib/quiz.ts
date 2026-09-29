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

/**
 * Take `n` questions from `qs`, chosen to be as unlike each other as possible.
 *
 * Greedy farthest-point selection: seed with a random question, then repeatedly
 * take whichever candidate is *least* like everything already chosen. Compared
 * with shuffle-and-skip this degrades gracefully — it always fills the quota,
 * and when the pool is tight it still returns the most varied set available
 * rather than falling back to arbitrary picks.
 *
 * Each candidate carries a running "closest similarity to anything chosen"
 * score, updated after every pick, so the whole selection is O(n·k) rather
 * than rescoring the pool from scratch each time.
 *
 * The random seed is what keeps successive sittings different; the spacing is
 * what stops two questions on the same narrow point landing together.
 */
function pickSpaced(qs: Question[], n: number): Question[] {
  if (n >= qs.length) return shuffleArray(qs);

  const pool = shuffleArray(qs);
  const tokens = pool.map(contentTokens);
  const closest = new Array(pool.length).fill(0); // similarity to nearest chosen
  const taken = new Array(pool.length).fill(false);

  const chosen: Question[] = [];
  let next = 0; // the shuffle already randomised the seed

  for (let k = 0; k < n; k++) {
    taken[next] = true;
    chosen.push(pool[next]);

    // refresh each candidate's distance to the newest pick
    const live: number[] = [];
    for (let i = 0; i < pool.length; i++) {
      if (taken[i]) continue;
      const sim = overlap(tokens[i], tokens[next]);
      if (sim > closest[i]) closest[i] = sim;
      live.push(i);
    }
    if (live.length === 0) break;

    // Choose at random from the most-distant candidates rather than always the
    // single furthest. Taking the strict argmin makes selection deterministic
    // after the seed, so every sitting converges on the same "most diverse"
    // core — variety across attempts collapses. A shortlist keeps the spacing
    // while letting successive papers differ.
    live.sort((a, b) => closest[a] - closest[b]);
    const shortlist = Math.max(3, Math.ceil(live.length * 0.15));
    next = live[Math.floor(Math.random() * Math.min(shortlist, live.length))];
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
      picked.push(...pickSpaced(qs, n));
    }
    // any leftover capacity (thin bank) comes from whatever remains
    if (picked.length < config.count) {
      const taken = new Set(picked.map((q) => q.id));
      picked.push(
        ...shuffleArray(pool.filter((q) => !taken.has(q.id))).slice(
          0,
          config.count - picked.length,
        ),
      );
    }
    return spreadOrder(shuffleArray(picked)).map(shuffleQuestionOptions);
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
