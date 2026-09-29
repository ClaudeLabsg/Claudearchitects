import type { ExamId } from "./types";

export interface Attempt {
  examId: ExamId;
  mode: "practice" | "study" | "exam" | "mock";
  percent: number;
  correct: number;
  total: number;
  passed: boolean;
  date: number; // epoch ms
}

const KEY = "ccp:attempts:v1";

export function loadAttempts(): Attempt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Attempt[]) : [];
  } catch {
    return [];
  }
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
    window.localStorage.removeItem(KEY);
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
