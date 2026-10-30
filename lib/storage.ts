import type { ExamId, Question } from "./types";

export interface Attempt {
  examId: ExamId;
  mode: "practice" | "study" | "exam" | "mock";
  percent: number;
  correct: number;
  total: number;
  passed: boolean;
  date: number; // epoch ms
  /**
   * Ids of the questions served, and of those answered wrong or left blank.
   *
   * Optional because records written before this existed have neither. Their
   * absence means "not captured", NOT "nothing was missed" — anything reading
   * these must treat an older attempt as unknown rather than perfect.
   */
  served?: string[];
  missed?: string[];
  byDomain?: Record<string, { correct: number; total: number }>;
}

const KEY = "ccp:attempts:v2";
const LEGACY_KEY = "ccp:attempts:v1";

export function loadAttempts(): Attempt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Attempt[];

    // First read since the schema gained per-question detail. Carry the old
    // history forward rather than letting someone's record reset to zero —
    // which is the exact complaint this feature exists to answer. The v1 key
    // is deliberately left in place so a rollback loses nothing.
    const legacy = window.localStorage.getItem(LEGACY_KEY);
    if (!legacy) return [];
    const upgraded = JSON.parse(legacy) as Attempt[];
    window.localStorage.setItem(KEY, JSON.stringify(upgraded));
    return upgraded;
  } catch {
    return [];
  }
}

export interface MissRecord {
  id: string;
  /** How many sittings this question was answered wrong in. */
  missed: number;
  /** How many sittings it was served in (only those that recorded detail). */
  served: number;
  /** Whether the most recent sitting that served it was wrong. */
  lastWrong: boolean;
  /** When that most recent sitting happened. */
  lastDate: number;
}

/**
 * The learner's shaky questions for one exam, worst first.
 *
 * Ordered by whether they got it wrong *most recently*, then by how often they
 * have missed it. A question missed twice but answered correctly since ranks
 * below one missed once and still wrong — the goal is what to drill now, not a
 * tally of past failures.
 */
export function missedFor(examId: ExamId): MissRecord[] {
  const attempts = loadAttempts()
    .filter((a) => a.examId === examId && a.served && a.missed)
    .sort((a, b) => b.date - a.date); // newest first

  const acc = new Map<string, MissRecord>();
  for (const a of attempts) {
    const missedSet = new Set(a.missed ?? []);
    for (const id of a.served ?? []) {
      const wrong = missedSet.has(id);
      const rec = acc.get(id);
      if (!rec) {
        // First time we meet this id walking newest-first, so this attempt is
        // its most recent outcome.
        acc.set(id, {
          id,
          missed: wrong ? 1 : 0,
          served: 1,
          lastWrong: wrong,
          lastDate: a.date,
        });
      } else {
        rec.served += 1;
        if (wrong) rec.missed += 1;
      }
    }
  }

  return [...acc.values()]
    .filter((r) => r.missed > 0)
    .sort(
      (x, y) =>
        Number(y.lastWrong) - Number(x.lastWrong) ||
        y.missed - x.missed ||
        y.lastDate - x.lastDate,
    );
}

export function saveAttempt(a: Attempt): void {
  if (typeof window === "undefined") return;
  try {
    const all = loadAttempts();
    all.unshift(a);
    window.localStorage.setItem(KEY, JSON.stringify(all.slice(0, 200)));
  } catch {
    /* storage unavailable — ignore */
  }
}

export function bestFor(examId: ExamId): number | null {
  const attempts = loadAttempts().filter((a) => a.examId === examId);
  if (attempts.length === 0) return null;
  return Math.max(...attempts.map((a) => a.percent));
}

export function clearAttempts(): void {
  if (typeof window === "undefined") return;
  try {
    // Both keys: leaving v1 behind would let the migration in loadAttempts
    // resurrect the history on the next read, which is not what "clear" means.
    window.localStorage.removeItem(KEY);
    window.localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* ignore */
  }
}

/* ------------------------------------------------------------------ *
 * Exposure memory
 *
 * Which questions this browser has already been shown, and how often. The
 * assembler uses it to reach further into the bank on repeat sittings instead
 * of recycling whichever items it happens to like (see lib/quiz.ts).
 *
 * Local to the device, like the attempt history: nothing is sent anywhere, and
 * clearing site data resets it.
 * ------------------------------------------------------------------ */

const SEEN_KEY = "ccp:seen:v1";

type SeenStore = Partial<Record<ExamId, Record<string, number>>>;

/** Once this share of a bank has been seen, counts are halved. */
const FADE_AT = 0.6;

function loadSeenStore(): SeenStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    return raw ? (JSON.parse(raw) as SeenStore) : {};
  } catch {
    return {};
  }
}

export function loadSeen(examId: ExamId): Record<string, number> {
  return loadSeenStore()[examId] ?? {};
}

/**
 * Note that `ids` have just been served.
 *
 * Before recording, the memory fades if most of the bank is already marked:
 * once nearly everything has been seen once, "seen" no longer distinguishes
 * anything and the assembler loses its steer. Halving the counts keeps the
 * ordering that matters — items drilled many times stay behind items drilled
 * once — while freeing the long tail to come round again. This is the standard
 * fade-away move from exposure control, and without it the feature quietly
 * stops working after a handful of full sittings.
 */
export function recordSeen(
  examId: ExamId,
  ids: string[],
  bankSize: number,
): void {
  if (typeof window === "undefined") return;
  try {
    const store = loadSeenStore();
    let seen = store[examId] ?? {};

    if (bankSize > 0 && Object.keys(seen).length >= bankSize * FADE_AT) {
      const faded: Record<string, number> = {};
      for (const [id, n] of Object.entries(seen)) {
        const half = Math.floor(n / 2);
        if (half > 0) faded[id] = half;
      }
      seen = faded;
    }

    for (const id of ids) seen[id] = (seen[id] ?? 0) + 1;
    store[examId] = seen;
    window.localStorage.setItem(SEEN_KEY, JSON.stringify(store));
  } catch {
    /* storage unavailable — exposure control simply goes quiet */
  }
}

/** How many of this exam's questions the learner has been served at least once. */
export function seenCount(examId: ExamId): number {
  return Object.keys(loadSeen(examId)).length;
}

export function clearSeen(examId?: ExamId): void {
  if (typeof window === "undefined") return;
  try {
    if (!examId) {
      window.localStorage.removeItem(SEEN_KEY);
      return;
    }
    const store = loadSeenStore();
    delete store[examId];
    window.localStorage.setItem(SEEN_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

/* ------------------------------------------------------------------ *
 * An unfinished sitting
 *
 * Until this existed, closing the tab halfway through a 50-question set threw
 * the whole thing away: saveAttempt only runs once a sitting is graded, and the
 * phase lived in React state, so a reload landed you back on the setup screen
 * with nothing to return to. People practise in the gaps in their day, which is
 * precisely the case that lost work.
 *
 * Kept per exam, so an unfinished CCDV-F set and an unfinished CCAR-F set can
 * both be waiting. Local to this browser, like everything else here.
 * ------------------------------------------------------------------ */

const PROGRESS_KEY = "ccp:inprogress:v1";

/** An unfinished sitting is offered for this long, then quietly dropped. */
const RESUME_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export interface InProgress {
  examId: ExamId;
  mode: "practice" | "study" | "exam" | "mock";
  /**
   * The questions exactly as they were served — not their ids.
   *
   * buildQuiz does not merely reorder each question's options, it relabels
   * them: shuffleQuestionOptions rebuilds the option ids as A, B, C, D in the
   * new order and rewrites `correct` to match. A recorded answer of "D" means
   * "the fourth option of that sitting's shuffle" and nothing more, so looking
   * the question up in the bank again would attach the answer to a different
   * option and mark it wrong. Storing the paper as served also means a
   * correction to the bank cannot change the questions under someone midway
   * through them.
   */
  questions: Question[];
  answers: Record<string, string[]>;
  flagged: string[];
  revealed: string[];
  current: number;
  /**
   * When a timed sitting runs out, as an absolute moment.
   *
   * Deliberately not "seconds remaining": storing the countdown itself would
   * hand anyone a way to stop the clock by reloading the page.
   */
  deadline?: number;
  startedAt: number;
  savedAt: number;
}

type ProgressStore = Partial<Record<ExamId, InProgress>>;

function loadProgressStore(): ProgressStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    return raw ? (JSON.parse(raw) as ProgressStore) : {};
  } catch {
    return {};
  }
}

export function saveInProgress(p: InProgress): void {
  if (typeof window === "undefined") return;
  try {
    const store = loadProgressStore();
    store[p.examId] = p;
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(store));
  } catch {
    /* storage unavailable — resume simply is not offered */
  }
}

/**
 * The unfinished sitting for one exam, if there is one worth resuming.
 *
 * Nothing is returned for a sitting that is empty, stale, or already out of
 * time: a timed paper whose deadline has passed cannot honestly be picked up
 * again, so it is discarded rather than offered.
 */
export function loadInProgress(examId: ExamId): InProgress | null {
  const p = loadProgressStore()[examId];
  if (!p || !p.questions || p.questions.length === 0) return null;
  const stale = Date.now() - p.savedAt > RESUME_WINDOW_MS;
  const expired = p.deadline !== undefined && p.deadline <= Date.now();
  if (stale || expired) {
    clearInProgress(examId);
    return null;
  }
  return p;
}

export function clearInProgress(examId: ExamId): void {
  if (typeof window === "undefined") return;
  try {
    const store = loadProgressStore();
    delete store[examId];
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}
