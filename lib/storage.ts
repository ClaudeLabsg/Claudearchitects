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
