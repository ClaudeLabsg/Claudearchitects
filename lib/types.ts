export type ExamId = "CCAO-F" | "CCAR-F" | "CCAR-P" | "CCDV-F";

export interface Option {
  id: string; // "A" | "B" | ...
  text: string;
}

export interface Question {
  id: string; // e.g. "CCAO-F-001"
  exam: ExamId;
  type: "single" | "multi";
  domain: string;
  question: string;
  options: Option[];
  correct: string[]; // option ids
  explanation: string;
}

export interface ExamMeta {
  id: ExamId;
  code: string;
  name: string;
  level: "Foundation" | "Professional";
  track: string;
  difficulty: "Beginner" | "Easy" | "Hard" | "Advanced";
  difficultyRank: number; // 1 = easiest
  tagline: string;
  description: string;
  passingScore: number; // percent, 0-100 (720/1000 scale = 72)
  mockCount: number; // number of questions in a full mock exam
  mockMinutes: number; // time limit for a mock exam
  accent: string; // tailwind gradient classes — deep enough for white text on light pages
  neon: string; // bright hex of the same hue, for the dark landing page
  deep: string; // darker hex of the same hue, readable as text on a light ground
  badge: string | null; // official badge image; null when we do not have the real asset
  // "Exam facts" (approximate — verify with the vendor before booking)
  priceUsd: string | null; // e.g. "~$125", or null if unknown
  delivery: string;
  validity: string;
  // Step 1 — apply for the @claudecode.sg partner-network address.
  screeningUrl: string;
  screeningAvailable: boolean; // false = screening not open for this exam yet
  // Step 2 — official registration on Anthropic Partner Academy. Requires the
  // partner-network address from step 1.
  registerUrl: string;
  note?: string; // optional eligibility/other caveat
}
