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
  accent: string; // tailwind gradient classes
  badge: string; // path to the official certification badge image
  // "Exam facts" (approximate — verify with the vendor before booking)
  priceUsd: string | null; // e.g. "~$125", or null if unknown
  delivery: string;
  validity: string;
  registerUrl: string; // official sign-up (claudecode.sg)
  registerAvailable: boolean; // true = direct exam sign-up; false = info/landing only
  note?: string; // optional eligibility/other caveat
}
