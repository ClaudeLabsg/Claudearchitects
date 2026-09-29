// Attach a difficulty estimate (1-5) to every question.
//
// IMPORTANT: this is a MODEL ESTIMATE, not an IRT parameter. Real item
// difficulty is measured from how actual candidates perform — p-values and
// discrimination from response data we do not collect. This is a usable proxy
// so papers can be balanced across easy/medium/hard instead of treating every
// question as interchangeable, and it should be replaced by empirical values
// if response logging is ever added.
//
// Usage: AI_GATEWAY_API_KEY=... node --env-file-if-exists=.env scripts/estimate_difficulty.mjs [--exam X] [--dry]

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const EXAMS = ["CCAO-F", "CCDV-F", "CCAR-F", "CCAR-P"];
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const ONLY = opt("exam", null);
const BATCH = Math.max(1, parseInt(opt("batch", "20"), 10));
const CONC = Math.max(1, parseInt(opt("concurrency", "3"), 10));
const DRY = args.includes("--dry");
const MODEL = process.env.DIFFICULTY_MODEL || "anthropic/claude-haiku-4.5";

const chunk = (a, n) => { const r = []; for (let i = 0; i < a.length; i += n) r.push(a.slice(i, i + n)); return r; };
const list = ONLY ? [ONLY] : EXAMS;

if (DRY) {
  for (const ex of list) {
    const b = JSON.parse(readFileSync(join(ROOT, "content", `${ex}.json`), "utf-8"));
    console.log(`${ex}: ${b.length} questions, ${b.filter((q) => q.difficulty == null).length} unrated (${chunk(b, BATCH).length} calls)`);
  }
  process.exit(0);
}

const { generateObject } = await import("ai");
const { z } = await import("zod");
const Schema = z.object({
  ratings: z.array(z.object({ n: z.number(), difficulty: z.number().int().min(1).max(5) })),
});

for (const ex of list) {
  const path = join(ROOT, "content", `${ex}.json`);
  const bank = JSON.parse(readFileSync(path, "utf-8"));
  const batches = chunk(bank.map((q, i) => ({ q, i })), BATCH);
  console.log(`\n[${ex}] ${bank.length} questions in ${batches.length} batches`);

  async function worker(batch) {
    const items = batch.map(({ q }, k) =>
      `#${k + 1}: ${q.question.slice(0, 300)}\n   options: ${q.options.map((o) => o.text.slice(0, 70)).join(" | ")}`
    ).join("\n\n");
    const prompt = `Rate how hard each ${ex} certification question is for a competent candidate who has studied but lacks deep production experience.

1 = recall of a single documented fact
2 = straightforward application of one concept
3 = requires connecting two concepts, or distinguishing close options
4 = requires judgement about trade-offs in a realistic scenario
5 = subtle: several options are defensible and the best one depends on careful reasoning

Judge the reasoning required, not the length of the text. Use the whole range — most well-written certification items land at 3 or 4.

QUESTIONS:
${items}`;
    let lastErr;
    for (let a = 0; a < 6; a++) {
      try {
        const { object } = await generateObject({ model: MODEL, schema: Schema, prompt, temperature: 0 });
        return object.ratings;
      } catch (e) { lastErr = e; await new Promise((r) => setTimeout(r, Math.min(30000, 1500 * 2 ** a) + Math.random() * 800)); }
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

  let rated = 0;
  batches.forEach((batch, bi) => {
    const byN = new Map((results[bi] || []).map((r) => [r.n, r.difficulty]));
    batch.forEach(({ i }, k) => {
      const d = byN.get(k + 1);
      if (d) { bank[i].difficulty = d; rated++; }
    });
  });
  writeFileSync(path, JSON.stringify(bank, null, 1));
  const dist = {};
  for (const q of bank) dist[q.difficulty ?? "?"] = (dist[q.difficulty ?? "?"] || 0) + 1;
  console.log(`\n    rated ${rated}/${bank.length} · distribution ${JSON.stringify(dist)}`);
}
console.log("\nDone.");
