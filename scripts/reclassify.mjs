// Re-tag every question in content/*.json with one of the OFFICIAL exam-guide
// blueprint domains.
//
// Why: the banks were built with a taxonomy we invented, and the newly added
// questions carry the vendor's blueprint domains — leaving two schemes in one
// bank. The real score report is per blueprint domain, so a practice result is
// only actionable if it uses the same names.
//
// Classification only: question text, options and answers are never touched.
//
// Usage:
//   AI_GATEWAY_API_KEY=...  node --env-file-if-exists=.env scripts/reclassify.mjs
//   ...  --exam CCAR-F   --batch 25   --concurrency 3   --dry

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT = join(ROOT, "content");
const EXAM_IDS = ["CCAO-F", "CCDV-F", "CCAR-F", "CCAR-P"];

const DOMAINS = {
  "CCAO-F": ["Prompting and Task Execution", "Output Evaluation and Validation", "Product and Model Selection", "Workflow Integration and Solution Design", "Configuration and Knowledge Management", "Governance, Risk, and Responsible Use", "Troubleshooting and Optimization"],
  "CCDV-F": ["Agents and Workflows", "Applications and Integration", "Claude Code", "Eval, Testing, and Debugging", "Model Selection and Optimization", "Prompt and Context Engineering", "Security and Safety", "Tools and MCPs"],
  "CCAR-F": ["Agentic Architecture & Orchestration", "Tool Design & MCP Integration", "Claude Code Configuration & Workflows", "Prompt Engineering & Structured Output", "Context Management & Reliability"],
  "CCAR-P": ["Solution Design & Architecture", "Claude Models, Prompting & Context Engineering", "Integration", "Evaluation, Testing & Optimization", "Governance, Safety & Risk Management", "Stakeholder Communication & Lifecycle Management", "Developer Productivity & Operational Enablement"],
};

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const ONLY = opt("exam", null);
const BATCH = Math.max(1, parseInt(opt("batch", "25"), 10));
const CONC = Math.max(1, parseInt(opt("concurrency", "3"), 10));
const DRY = flag("dry");
const MODEL = process.env.CLASSIFY_MODEL || "anthropic/claude-haiku-4.5";

const chunk = (a, n) => { const r = []; for (let i = 0; i < a.length; i += n) r.push(a.slice(i, i + n)); return r; };

const list = ONLY ? [ONLY] : EXAM_IDS;

if (DRY) {
  for (const ex of list) {
    const bank = JSON.parse(readFileSync(join(CONTENT, `${ex}.json`), "utf-8"));
    const off = new Set(DOMAINS[ex]);
    const stale = bank.filter((q) => !off.has(q.domain)).length;
    console.log(`${ex}: ${bank.length} questions, ${stale} need re-tagging, ${DOMAINS[ex].length} target domains (${chunk(bank, BATCH).length} calls)`);
  }
  console.log("\nDry run only.");
  process.exit(0);
}

if (!process.env.AI_GATEWAY_API_KEY && !process.env.ANTHROPIC_API_KEY) {
  console.error("\n  Missing API key. Set AI_GATEWAY_API_KEY or ANTHROPIC_API_KEY.\n");
  process.exit(1);
}

const { generateObject } = await import("ai");
const { z } = await import("zod");

for (const ex of list) {
  const path = join(CONTENT, `${ex}.json`);
  const bank = JSON.parse(readFileSync(path, "utf-8"));
  const domains = DOMAINS[ex];
  const Schema = z.object({
    assignments: z.array(z.object({ n: z.number(), domain: z.number().int().min(1).max(domains.length) })),
  });
  const batches = chunk(bank.map((q, i) => ({ q, i })), BATCH);
  console.log(`\n[${ex}] ${bank.length} questions in ${batches.length} batches`);

  async function worker(batch) {
    const menu = domains.map((d, i) => `${i + 1}. ${d}`).join("\n");
    const items = batch.map(({ q }, k) => `#${k + 1}: ${q.question.slice(0, 340)}`).join("\n\n");
    const prompt = `Classify each ${ex} certification exam question into exactly ONE official blueprint domain.

DOMAINS:
${menu}

Return one assignment per question, using n = the question number shown and domain = the domain number. Judge by what the question primarily tests, not by surface keywords. Every question must be assigned.

QUESTIONS:
${items}`;
    let lastErr;
    for (let attempt = 0; attempt < 6; attempt++) {
      try {
        const { object } = await generateObject({ model: MODEL, schema: Schema, prompt, temperature: 0 });
        return object.assignments;
      } catch (e) {
        lastErr = e;
        await new Promise((r) => setTimeout(r, Math.min(30000, 1500 * 2 ** attempt) + Math.random() * 1000));
      }
    }
    throw lastErr;
  }

  const results = new Array(batches.length);
  let idx = 0, done = 0;
  async function pump() {
    while (idx < batches.length) {
      const my = idx++;
      results[my] = await worker(batches[my]);
      process.stdout.write(`\r    ${++done}/${batches.length} batches`);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONC, batches.length) }, pump));

  let changed = 0, missed = 0;
  batches.forEach((batch, bi) => {
    const byN = new Map((results[bi] || []).map((a) => [a.n, a.domain]));
    batch.forEach(({ q, i }, k) => {
      const d = byN.get(k + 1);
      if (!d) { missed++; return; }
      const name = domains[d - 1];
      if (bank[i].domain !== name) { bank[i].domain = name; changed++; }
    });
  });
  writeFileSync(path, JSON.stringify(bank, null, 1));
  console.log(`\n    re-tagged ${changed}, unchanged ${bank.length - changed - missed}, unassigned ${missed}`);
}
console.log("\nDone.");
