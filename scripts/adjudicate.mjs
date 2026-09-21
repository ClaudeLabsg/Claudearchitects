// Adjudicate the QA-flagged questions: a final expert model decides the true
// correct answer(s) for each, rewrites the explanation to match, and marks
// genuinely broken/ambiguous ones for removal. Then:
//   - apply corrected answers + explanations,
//   - drop unsalvageable and duplicate-option questions,
//   - reassign UNIQUE sequential ids per exam (fixes the expansion's dup-id bug).
//
// Reads reports/qa-report.json + content/*.json, writes content/*.json.
// Usage:  AI_GATEWAY_API_KEY=...  npm run adjudicate  [--concurrency 3]
// Model: ADJ_MODEL (default anthropic/claude-sonnet-4.5).

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CONTENT = join(ROOT, "content");
const EXAM_IDS = ["CCAO-F", "CCAR-F", "CCAR-P", "CCDV-F"];

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const CONCURRENCY = Math.max(1, parseInt(opt("concurrency", "3"), 10));
const MODEL = process.env.ADJ_MODEL || "anthropic/claude-sonnet-4.5";
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

if (!process.env.AI_GATEWAY_API_KEY && !process.env.ANTHROPIC_API_KEY) {
  console.error("\n  Missing API key.\n"); process.exit(1);
}
const { generateObject } = await import("ai");
const { z } = await import("zod");
const Schema = z.object({
  correct: z.array(z.string()),
  salvageable: z.boolean(),
  explanation: z.string(),
  reason: z.string(),
});

const report = JSON.parse(readFileSync(join(ROOT, "reports", "qa-report.json"), "utf-8"));
const flags = [];
for (const d of Object.values(report.exams)) for (const f of d.flags) flags.push(f);
console.log(`Adjudicating ${flags.length} flagged questions · model ${MODEL} · concurrency ${CONCURRENCY}`);

async function adjudicate(f) {
  const opts = f.options.map((o) => `${o.id}. ${o.text}`).join("\n");
  const prompt = `You are the FINAL adjudicator for a Claude/Anthropic certification practice exam. Two graders disagree on this question. Decide the truly correct option id(s) on the merits, and rewrite the explanation to match.

QUESTION:
${f.question}

OPTIONS:
${opts}

Grader A chose: ${f.marked.join(", ")}
Grader B chose: ${f.model.join(", ")}

Rules:
- Return the id(s) of the genuinely correct option(s). For a single-answer question return exactly one id; for a select-all question return all correct ids.
- Set salvageable=false ONLY if the question is truly broken: two or more options are identical/equivalent, no option is correct, or it is ambiguous with no single defensible answer.
- explanation: 2-4 sentences on why the correct answer is right and the others wrong (no meta-talk, no "grader").
- reason: one short line on why you decided this.
Be accurate about Claude and Anthropic's products.`;
  let lastErr;
  for (let a = 0; a < 5; a++) {
    try { const { object } = await generateObject({ model: MODEL, schema: Schema, prompt, temperature: 0 }); return object; }
    catch (e) { lastErr = e; await new Promise((r) => setTimeout(r, Math.min(30000, 1500 * 2 ** a) + Math.random() * 1000)); }
  }
  throw lastErr;
}

// run pool
const decisions = new Array(flags.length);
let idx = 0, done = 0;
async function pump() {
  while (idx < flags.length) {
    const my = idx++;
    try { decisions[my] = await adjudicate(flags[my]); }
    catch (e) { decisions[my] = { __error: e?.message || String(e) }; }
    done++; process.stdout.write(`\r  ${done}/${flags.length} adjudicated`);
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, pump));
process.stdout.write("\n");

// map decisions by question text
const byText = new Map();
for (let i = 0; i < flags.length; i++) byText.set(norm(flags[i].question), decisions[i]);

let totFixed = 0, totDropped = 0, totKept = 0, totErr = 0;
for (const ex of EXAM_IDS) {
  const qs = JSON.parse(readFileSync(join(CONTENT, `${ex}.json`), "utf-8"));
  const kept = [];
  let fixed = 0, dropped = 0;
  for (const q of qs) {
    const ids = new Set(q.options.map((o) => o.id));
    const texts = q.options.map((o) => norm(o.text));
    const dupOptions = new Set(texts).size !== texts.length;
    const dec = byText.get(norm(q.question));

    if (dupOptions) { dropped++; continue; } // broken regardless
    if (dec && !dec.__error) {
      if (!dec.salvageable) { dropped++; continue; }
      const valid = dec.correct.filter((c) => ids.has(c));
      if (valid.length >= 1) {
        q.correct = valid;
        q.type = valid.length > 1 ? "multi" : "single";
        if (dec.explanation) q.explanation = dec.explanation.trim();
        q.adjudicated = true;
        fixed++;
      }
    } else if (dec && dec.__error) {
      totErr++; // keep original if adjudication errored
    }
    kept.push(q);
  }
  // reassign unique ids
  kept.forEach((q, i) => { q.id = `${ex}-${String(i + 1).padStart(4, "0")}`; });
  writeFileSync(join(CONTENT, `${ex}.json`), JSON.stringify(kept, null, 2), "utf-8");
  totFixed += fixed; totDropped += dropped; totKept += kept.length;
  console.log(`  [${ex}] ${qs.length} -> ${kept.length}  (fixed ${fixed}, dropped ${dropped})`);
}
console.log(`\nDone. fixed ${totFixed}, dropped ${totDropped}, final ${totKept}${totErr ? `, adjudication errors ${totErr}` : ""}. IDs reassigned uniquely.`);
