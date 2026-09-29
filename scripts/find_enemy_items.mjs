// Build an enemy-item map: pairs of questions that must not share a paper.
//
// Psychometrics calls these "enemy items" — two items that cover the same
// material, or where one gives away the other's answer. Having both on a form
// breaks local independence and hands the candidate an unearned mark.
//
// Lexical distance (which the assembler already applies) catches rewrites but
// not answer-leakage, so candidate pairs are shortlisted by word overlap across
// the WHOLE exam — enemies can sit in different domains — and a model then
// judges each pair. Output: data/enemies.json  { exam: [[idA, idB], ...] }
//
// Usage: AI_GATEWAY_API_KEY=... node --env-file-if-exists=.env scripts/find_enemy_items.mjs [--dry]

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const EXAMS = ["CCAO-F", "CCDV-F", "CCAR-F", "CCAR-P"];
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const DRY = args.includes("--dry");
const THRESH = parseFloat(opt("threshold", "0.28"));
const BATCH = Math.max(1, parseInt(opt("batch", "12"), 10));
const CONC = Math.max(1, parseInt(opt("concurrency", "3"), 10));
const MODEL = process.env.ENEMY_MODEL || "anthropic/claude-haiku-4.5";

const STOP = new Set(("the a an of to and or in for with on is are be that this it as by if you your we our they can will how what which when should would could may might not no do does at from their its has have").split(" "));
const toks = (s) => new Set((s.toLowerCase().match(/[a-z0-9_]+/g) ?? []).filter((w) => w.length > 2 && !STOP.has(w)));
const jac = (a, b) => { let n = 0; const [s, l] = a.size < b.size ? [a, b] : [b, a]; for (const w of s) if (l.has(w)) n++; return n / (a.size + b.size - n); };
const chunk = (a, n) => { const r = []; for (let i = 0; i < a.length; i += n) r.push(a.slice(i, i + n)); return r; };

const candidates = {};
for (const ex of EXAMS) {
  const bank = JSON.parse(readFileSync(join(ROOT, "content", `${ex}.json`), "utf-8"));
  const sig = bank.map((q) => ({ q, t: toks(q.question + " " + q.options.map((o) => o.text).join(" ")) }));
  const pairs = [];
  for (let i = 0; i < sig.length; i++) {
    for (let j = i + 1; j < sig.length; j++) {
      const a = sig[i].t, b = sig[j].t;
      let inter = 0;
      const [s, l] = a.size < b.size ? [a, b] : [b, a];
      for (const w of s) if (l.has(w)) inter++;
      if (inter < 8) continue;
      if (inter / (a.size + b.size - inter) >= THRESH) pairs.push([sig[i].q, sig[j].q]);
    }
  }
  candidates[ex] = pairs;
  console.log(`${ex}: ${bank.length} questions -> ${pairs.length} candidate pairs (all domains)`);
}
const totalPairs = Object.values(candidates).reduce((n, p) => n + p.length, 0);
console.log(`TOTAL: ${totalPairs} pairs, ~${Math.ceil(totalPairs / BATCH)} model calls`);
if (DRY) process.exit(0);

const { generateObject } = await import("ai");
const { z } = await import("zod");
const Schema = z.object({
  verdicts: z.array(z.object({ n: z.number(), enemy: z.boolean(), reason: z.string() })),
});

const out = existsSync(join(ROOT, "data/enemies.json"))
  ? JSON.parse(readFileSync(join(ROOT, "data/enemies.json"), "utf-8")) : {};

for (const [ex, pairs] of Object.entries(candidates)) {
  if (!pairs.length) { out[ex] = out[ex] || []; continue; }
  const batches = chunk(pairs, BATCH);
  console.log(`\n[${ex}] judging ${pairs.length} pairs in ${batches.length} batches`);

  async function worker(batch) {
    const text = batch.map(([a, b], k) =>
      `#${k + 1}\nA: ${a.question.slice(0, 280)}\n   answer: ${a.options.filter(o => a.correct.includes(o.id)).map(o => o.text.slice(0, 90)).join("; ")}\nB: ${b.question.slice(0, 280)}\n   answer: ${b.options.filter(o => b.correct.includes(o.id)).map(o => o.text.slice(0, 90)).join("; ")}`
    ).join("\n\n");
    const prompt = `You are checking for ENEMY ITEMS on a certification exam. Two questions are enemies if putting them on the same paper would be unfair or redundant, specifically when EITHER:
 (a) they test the same point, so one is effectively a restatement of the other, or
 (b) one question's text or answer reveals the answer to the other.

Two questions on the same broad topic are NOT enemies if they test genuinely different points. Be strict: only mark enemy when a candidate would gain an unearned advantage or learn nothing new from the second.

PAIRS:
${text}`;
    let lastErr;
    for (let a = 0; a < 6; a++) {
      try {
        const { object } = await generateObject({ model: MODEL, schema: Schema, prompt, temperature: 0 });
        return object.verdicts;
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

  const enemies = [];
  batches.forEach((batch, bi) => {
    const byN = new Map((results[bi] || []).map((v) => [v.n, v]));
    batch.forEach(([a, b], k) => {
      const v = byN.get(k + 1);
      if (v?.enemy) enemies.push([a.id, b.id]);
    });
  });
  out[ex] = enemies;
  console.log(`\n    ${enemies.length} enemy pairs confirmed of ${pairs.length} candidates`);
}

writeFileSync(join(ROOT, "data/enemies.json"), JSON.stringify(out, null, 1));
console.log("\nwrote data/enemies.json");
