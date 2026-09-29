import rawEnemies from "@/data/enemies.json";
import type { ExamId } from "./types";

/**
 * Enemy items — pairs that must not appear in the same paper.
 *
 * Lexical distance (see `pickSpaced` in lib/quiz.ts) catches questions that are
 * *worded* alike, but the damaging case is a pair that reads quite differently
 * and still gives the game away: one question's options name the very fact the
 * other is testing, or two items hinge on the same single distinction. In
 * psychometrics that is a local-independence violation — the two scores are no
 * longer independent evidence, so a paper holding both effectively asks 59
 * questions while claiming 60.
 *
 * These pairs were shortlisted by content overlap and then judged one by one by
 * a model asked a single question: does either item give away the other? Only
 * confirmed pairs are stored, as an adjacency map from question id to the ids it
 * conflicts with.
 */
// JSON widens tuples to arrays, so pairs are read defensively rather than
// asserted into a tuple type.
const PAIRS: Record<string, string[][]> = rawEnemies;

function adjacency(pairs: string[][]): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const pair of pairs) {
    const [a, b] = pair;
    if (!a || !b) continue;
    (map[a] ??= []).push(b);
    (map[b] ??= []).push(a);
  }
  return map;
}

export const ENEMIES: Record<string, Record<string, string[]>> =
  Object.fromEntries(
    Object.entries(PAIRS).map(([exam, pairs]) => [exam, adjacency(pairs)]),
  );

export function enemiesFor(examId: ExamId): Record<string, string[]> {
  return ENEMIES[examId] ?? {};
}
