// Rebuild data/objectives.json from the official blueprint domains.
//
// The banks were re-tagged to the vendor's blueprint, so the Resources page
// would otherwise list domain names that no longer match a single question.
// Objectives are summarised from the questions actually in each domain, which
// keeps the study guide honest about what this bank covers — and each domain
// carries its official exam weight so learners can budget revision time.
//
// Usage: AI_GATEWAY_API_KEY=... node --env-file-if-exists=.env scripts/build_objectives.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MODEL = process.env.OBJ_MODEL || "anthropic/claude-haiku-4.5";

const BLUEPRINT = {
  "CCAO-F": { level: "Foundation", domains: { "Prompting and Task Execution": 14, "Output Evaluation and Validation": 21, "Product and Model Selection": 12, "Workflow Integration and Solution Design": 16, "Configuration and Knowledge Management": 12, "Governance, Risk, and Responsible Use": 15, "Troubleshooting and Optimization": 10 } },
  "CCDV-F": { level: "Foundation", domains: { "Agents and Workflows": 14.7, "Applications and Integration": 33.1, "Claude Code": 3.1, "Eval, Testing, and Debugging": 2.6, "Model Selection and Optimization": 16.8, "Prompt and Context Engineering": 11.0, "Security and Safety": 8.1, "Tools and MCPs": 10.6 } },
  "CCAR-F": { level: "Foundation", domains: { "Agentic Architecture & Orchestration": 27, "Tool Design & MCP Integration": 18, "Claude Code Configuration & Workflows": 20, "Prompt Engineering & Structured Output": 20, "Context Management & Reliability": 15 } },
  "CCAR-P": { level: "Professional", domains: { "Solution Design & Architecture": 17, "Claude Models, Prompting & Context Engineering": 13, "Integration": 19, "Evaluation, Testing & Optimization": 16, "Governance, Safety & Risk Management": 14, "Stakeholder Communication & Lifecycle Management": 14, "Developer Productivity & Operational Enablement": 7 } },
};

const { generateObject } = await import("ai");
const { z } = await import("zod");
const Schema = z.object({ objectives: z.array(z.string()).min(4).max(8) });

const out = {};
for (const [exam, meta] of Object.entries(BLUEPRINT)) {
  const bank = JSON.parse(readFileSync(join(ROOT, "content", `${exam}.json`), "utf-8"));
  const domains = [];
  for (const [name, weight] of Object.entries(meta.domains)) {
    const qs = bank.filter((q) => q.domain === name);
    const sample = qs.slice(0, 14).map((q, i) => `${i + 1}. ${q.question.slice(0, 220)}`).join("\n");
    let objectives = [];
    if (qs.length) {
      const prompt = `These are practice questions from the "${name}" domain of the ${exam} Claude certification exam.

Write 5-7 exam objectives describing what a candidate must be able to DO in this domain. Each objective is one sentence, starts with a verb, and is specific enough to revise against. Base them only on what these questions actually test — do not invent scope.

QUESTIONS:
${sample}`;
      for (let a = 0; a < 5; a++) {
        try {
          const { object } = await generateObject({ model: MODEL, schema: Schema, prompt, temperature: 0.2 });
          objectives = object.objectives;
          break;
        } catch { await new Promise((r) => setTimeout(r, 1500 * 2 ** a)); }
      }
    }
    domains.push({ name, weight, questions: qs.length, objectives });
    process.stdout.write(`\r  ${exam} · ${domains.length}/${Object.keys(meta.domains).length}   `);
  }
  out[exam] = { level: meta.level, domains };
  console.log(`\n${exam}: ${domains.length} domains, ${domains.reduce((n, d) => n + d.objectives.length, 0)} objectives`);
}
writeFileSync(join(ROOT, "data", "objectives.json"), JSON.stringify(out, null, 1));
console.log("\nWrote data/objectives.json");
