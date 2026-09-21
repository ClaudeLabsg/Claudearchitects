// Answer-key QA: an independent model re-solves every question WITHOUT seeing
// the stored correct answer, then we flag any disagreement for review.
// Produces reports/qa-report.json. Does NOT modify any content.
//
// Usage:
//   AI_GATEWAY_API_KEY=...  npm run qa                # all exams
//   ...  --exam CCAR-P
//   ...  --batch 6          questions per call (default 6)
//   ...  --concurrency 3
// Model: QA_MODEL (default anthropic/claude-sonnet-4.5 — use a strong model here).

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CONTENT = join(ROOT, "content");
const REPORTS = join(ROOT, "reports");
const EXAM_IDS = ["CCAO-F", "CCAR-F", "CCAR-P", "CCDV-F"];

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const ONLY = opt("exam", null);
const BATCH = Math.max(1, parseInt(opt("batch", "6"), 10));
const CONCURRENCY = Math.max(1, parseInt(opt("concurrency", "3"), 10));
const MODEL = process.env.QA_MODEL || "anthropic/claude-sonnet-4.5";

const chunk = (a, n) => { const r = []; for (let i = 0; i < a.length; i += n) r.push(a.slice(i, i + n)); return r; };
const sortedEq = (a, b) => { const x = [...a].sort().join(","); const y = [...b].sort().join(","); return x === y; };

if (!process.env.AI_GATEWAY_API_KEY && !process.env.ANTHROPIC_API_KEY) {
  console.error("\n  Missing API key (AI_GATEWAY_API_KEY or ANTHROPIC_API_KEY).\n");
  process.exit(1);
}
const { generateObject } = await import("ai");
const { z } = await import("zod");
const Schema = z.object({
  answers: z.array(z.object({
    index: z.number(),
    correct: z.array(z.string()),
    confidence: z.enum(["high", "medium", "low"]),
  })),
});

if (!existsSync(REPORTS)) mkdirSync(REPORTS, { recursive: true });
const list = ONLY ? [ONLY] : EXAM_IDS;
console.log(`Answer-key QA · model ${MODEL} · batch ${BATCH} · concurrency ${CONCURRENCY}`);

const report = { model: MODEL, generatedAt: new Date().toISOString(), exams: {} };
let grandFlag = 0, grandTotal = 0;

for (const ex of list) {
  const qs = JSON.parse(readFileSync(join(CONTENT, `${ex}.json`), "utf-8"));
  const batches = chunk(qs, BATCH);
  console.log(`\n[${ex}] ${qs.length} questions in ${batches.length} batches`);

  async function solve(batch) {
    const body = batch.map((q, i) => {
      const opts = q.options.map((o) => `   ${o.id}. ${o.text}`).join("\n");
      const kind = q.type === "multi" ? "select ALL correct" : "one correct";
      return `[${i}] (${kind})\n${q.question}\n${opts}`;
    }).join("\n\n");
    const prompt = `You are a meticulous subject-matter expert on Claude and Anthropic's products, grading a practice exam. Solve each multiple-choice question below on the merits. Return, for each, the id(s) of the correct option and your confidence. For "select ALL correct" items, return every correct id. Base your answer only on the question content and your expertise — there is no answer key provided.\n\n${body}`;
    let lastErr;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const { object } = await generateObject({ model: MODEL, schema: Schema, prompt, temperature: 0 });
        return object.answers;
      } catch (e) { lastErr = e; await new Promise((r) => setTimeout(r, Math.min(30000, 1500 * 2 ** attempt) + Math.random() * 1000)); }
    }
    throw lastErr;
  }

  const results = new Array(batches.length);
  let idx = 0, done = 0;
  async function pump() {
    while (idx < batches.length) {
      const my = idx++;
      try { results[my] = await solve(batches[my]); }
      catch (e) { results[my] = { __error: e?.message || String(e) }; }
      done++; process.stdout.write(`\r    ${done}/${batches.length} batches`);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, batches.length) }, pump));
  process.stdout.write("\n");

  const flags = [];
  let checked = 0, errored = 0;
  for (let b = 0; b < batches.length; b++) {
    const out = results[b];
    if (!out || out.__error) { errored += batches[b].length; continue; }
    const byIndex = new Map(out.map((a) => [a.index, a]));
    for (let i = 0; i < batches[b].length; i++) {
      const q = batches[b][i];
      const a = byIndex.get(i);
      if (!a) { errored++; continue; }
      checked++;
      const ids = new Set(q.options.map((o) => o.id));
      const modelAns = a.correct.filter((c) => ids.has(c));
      if (!sortedEq(modelAns, q.correct)) {
        flags.push({
          id: q.id, exam: ex, domain: q.domain,
          marked: q.correct, model: modelAns, confidence: a.confidence,
          question: q.question,
          options: q.options,
          explanation: q.explanation,
        });
      }
    }
  }
  const highConf = flags.filter((f) => f.confidence === "high").length;
  report.exams[ex] = { total: qs.length, checked, errored, flagged: flags.length, highConfidenceFlags: highConf, flags };
  grandFlag += flags.length; grandTotal += checked;
  console.log(`    checked ${checked}, errored ${errored}, FLAGGED ${flags.length} (high-confidence ${highConf})`);
}

const outPath = join(REPORTS, "qa-report.json");
writeFileSync(outPath, JSON.stringify(report, null, 2), "utf-8");
console.log(`\nDone. Flagged ${grandFlag}/${grandTotal} for review. Report: ${outPath}`);
console.log("(No content was modified. Review flags, especially high-confidence, before publishing.)");
