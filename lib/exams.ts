import type { ExamId, ExamMeta, Question } from "./types";

import ccaof from "@/content/CCAO-F.json";
import ccarf from "@/content/CCAR-F.json";
import ccarp from "@/content/CCAR-P.json";
import ccdvf from "@/content/CCDV-F.json";

// Ordered easiest → hardest.
export const EXAMS: ExamMeta[] = [
  {
    id: "CCAO-F",
    code: "CCAO-F",
    name: "Claude Certified Associate — Foundations",
    level: "Foundation",
    track: "Associate",
    difficulty: "Beginner",
    difficultyRank: 1,
    tagline: "Using Claude well: Projects, prompting, context & responsible use.",
    description:
      "The entry-level certification for everyday Claude users. Covers configuring Projects, prompting fundamentals, managing context and memory, using Claude's interfaces, and responsible-use principles.",
    passingScore: 72,
    mockCount: 50,
    mockMinutes: 90,
    accent: "from-[#0e7490] to-[#0891b2]",
    neon: "#22d3ee",
    deep: "#0891b2",
    badge: "/badges/claude-certified-associate.webp",
    priceUsd: "$99 USD",
    note: "Does not count toward Claude Partner Network tier eligibility.",
    delivery: "Pearson VUE (proctored)",
    validity: "~12 months",
    registerUrl: "https://claudecode.sg/claude-architect-exam",
    registerAvailable: false,
  },
  {
    id: "CCDV-F",
    code: "CCDV-F",
    name: "Claude Certified Developer — Foundations",
    level: "Foundation",
    track: "Developer",
    difficulty: "Easy",
    difficultyRank: 2,
    tagline: "Building with Claude: the API, Agent SDK, tools & MCP.",
    description:
      "For developers building on Claude. Covers the Messages API, the Claude Agent SDK, tool use and MCP, prompt engineering for code, streaming, and evaluation and testing. A good place to start if you're new to building on the platform.",
    passingScore: 72,
    mockCount: 60,
    mockMinutes: 120,
    accent: "from-[#047857] to-[#059669]",
    neon: "#4ade80",
    deep: "#059669",
    badge: "/badges/claude-certified-developer.webp",
    priceUsd: "$125 USD",
    delivery: "Pearson VUE (proctored)",
    validity: "~12 months",
    registerUrl: "https://ccaf-onboarding.claudecode.sg/screening.html?exam=ccdf",
    registerAvailable: true,
  },
  {
    id: "CCAR-F",
    code: "CCAR-F",
    name: "Claude Certified Architect — Foundations",
    level: "Foundation",
    track: "Architect",
    difficulty: "Hard",
    difficultyRank: 3,
    tagline: "Designing with Claude: Claude Code, context engineering & agents.",
    description:
      "The deeper foundation exam — architecture, design decisions and the trade-offs behind them. Covers Claude Code and developer tooling, prompt and context engineering, agentic patterns, integration, and governance foundations.",
    passingScore: 72,
    mockCount: 60,
    mockMinutes: 120,
    accent: "from-[#5b3fe0] to-[#7c5cff]",
    neon: "#7c5cff",
    deep: "#5b3fe0",
    badge: "/badges/claude-certified-architect.webp",
    priceUsd: "$125 USD",
    delivery: "Pearson VUE (proctored)",
    validity: "~12 months",
    registerUrl: "https://ccaf-onboarding.claudecode.sg/screening.html",
    registerAvailable: true,
  },
  {
    id: "CCAR-P",
    code: "CCAR-P",
    name: "Claude Certified Architect — Professional",
    level: "Professional",
    track: "Architect",
    difficulty: "Advanced",
    difficultyRank: 4,
    tagline: "Advanced architecture: complex agents, scale, evaluation & safety.",
    description:
      "The advanced architect certification. Covers designing complex multi-agent systems, production scale and reliability, evaluation strategy, cost and performance trade-offs, and enterprise governance.",
    passingScore: 72,
    mockCount: 63,
    mockMinutes: 120,
    accent: "from-[#be185d] to-[#db2777]",
    neon: "#f43f7e",
    deep: "#be185d",
    badge: "/badges/claude-certified-architect.webp",
    priceUsd: "$175 USD",
    delivery: "Pearson VUE (proctored)",
    validity: "~12 months",
    registerUrl: "https://claudecode.sg/claude-architect-exam",
    registerAvailable: false,
  },
];

const BANKS: Record<ExamId, Question[]> = {
  "CCAO-F": ccaof as Question[],
  "CCAR-F": ccarf as Question[],
  "CCAR-P": ccarp as Question[],
  "CCDV-F": ccdvf as Question[],
};

export function getExam(id: string): ExamMeta | undefined {
  return EXAMS.find((e) => e.id === id);
}

export function getQuestions(id: ExamId): Question[] {
  return BANKS[id] ?? [];
}

export function getDomains(id: ExamId): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const q of getQuestions(id)) {
    counts.set(q.domain, (counts.get(q.domain) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function examStats(id: ExamId) {
  const qs = getQuestions(id);
  return {
    total: qs.length,
    domains: getDomains(id).length,
    multi: qs.filter((q) => q.type === "multi").length,
  };
}
