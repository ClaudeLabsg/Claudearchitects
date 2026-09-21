import type { Question } from "./types";

export type Mode = "practice" | "study" | "exam" | "mock";

export interface QuizConfig {
  mode: Mode;
  count: number; // number of questions
  domains: string[]; // empty = all
  shuffle: boolean;
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

export function buildQuiz(all: Question[], config: QuizConfig): Question[] {
  let pool = all;
  if (config.domains.length > 0) {
    pool = pool.filter((q) => config.domains.includes(q.domain));
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
