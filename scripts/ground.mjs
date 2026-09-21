// Grounded generation: turn each private source question (data/source/*.json,
// parsed from the exam PDFs) into a NEW, original question that tests the SAME
// concept at the SAME difficulty, preserving the correct answer — with fresh
// scenario wording, fresh distractors and an expanded explanation.
//
// This grounds the public bank in the real exam material while keeping every
// published item original (nothing is copied verbatim). Multi-select questions
// in the source stay multi-select, so the type mix matches the real exams.
//
// Usage:
//   AI_GATEWAY_API_KEY=...  npm run ground                 # all exams (replaces content/*.json)
//   ...  npm run ground -- --exam CCAO-F
//   ...  --limit 10       only first N source questions (cheap trial)
//   ...  --batch 5        source questions per model call (default 5)
//   ...  --concurrency 3  parallel calls (default 3)
//   ...  --append         add to existing content instead of replacing
//   ...  --dry            no API calls; print the plan
// Model: GROUND_MODEL or GENERATE_MODEL (default anthropic/claude-haiku-4.5).

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SRC_DIR = join(ROOT, "data", "source");
const OUT_DIR = join(ROOT, "content");
const EXAM_IDS = ["CCAO-F", "CCAR-F", "CCAR-P", "CCDV-F"];

const DOMAINS = {
  "CCAO-F": ["Projects & Configuration", "Prompting Fundamentals", "Context & Memory", "Claude Features & Interfaces", "Responsible Use"],
  "CCAR-F": ["Multi-Agent Orchestration & Subagents", "Agentic Workflows & Task Design", "Claude Code Configuration & Tooling", "Context & Session Management", "Structured Output & Tool Use", "MCP & API Integration", "Review, Extraction & Evaluation"],
  "CCAR-P": ["Solution Design & Architecture", "Models, Prompting & Configuration", "Security, Compliance & Governance", "Safety & Risk", "Evaluation & Testing", "Observability & Optimization", "Delivery & Stakeholder Management", "Developer Enablement"],
  "CCDV-F": ["Messages API", "Agent SDK", "Tool Use & MCP", "Prompt Engineering for Code", "Evaluation & Testing"],
};

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const ONLY_EXAM = opt("exam", null);
const LIMIT = parseInt(opt("limit", "0"), 10);
const BATCH = Math.max(1, parseInt(opt("batch", "5"), 10));
const CONCURRENCY = Math.max(1, parseInt(opt("concurrency", "3"), 10));
const APPEND = flag("append");
const DRY = flag("dry");
const MODEL = process.env.GROUND_MODEL || process.env.GENERATE_MODEL || "anthropic/claude-haiku-4.5";

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const chunk = (a, n) => { const r = []; for (let i = 0; i < a.length; i += n) r.push(a.slice(i, i + n)); return r; };

function planFor(ex) {
  const src = JSON.parse(readFileSync(join(SRC_DIR, `${ex}.json`), "utf-8"));
  return LIMIT > 0 ? src.slice(0, LIMIT) : src;
}

async function run() {
  const list = ONLY_EXAM ? [ONLY_EXAM] : EXAM_IDS;
  console.log(`Grounded generation${DRY ? " (dry run)" : ""} · model ${MODEL} · batch ${BATCH} · concurrency ${CONCURRENCY}`);
  let grand = 0;
  for (const ex of list) { const n = planFor(ex).length; grand += n; console.log(`  ${ex}: ${n} source questions -> ${n} grounded originals (${Math.ceil(n / BATCH)} calls)`); }
  console.log(`  TOTAL: ~${grand} questions`);
  if (DRY) { console.log("\nDry run only."); return; }

  if (!process.env.AI_GATEWAY_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    console.error('\n  Missing API key. Set AI_GATEWAY_API_KEY or ANTHROPIC_API_KEY.\n');
    process.exit(1);
  }
  const { generateObject } = await import("ai");
  const { z } = await import("zod");
  const Schema = z.object({
    items: z.array(z.object({
      question: z.string(),
      options: z.array(z.object({ id: z.string(), text: z.string() })).min(2),
      domain: z.string(),
      explanation: z.string(),
    })),
  });
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  for (const ex of list) {
    const src = planFor(ex);
    const batches = chunk(src, BATCH);
    console.log(`\n[${ex}] ${src.length} source questions in ${batches.length} batches`);

    async function worker(batch) {
      const domainList = DOMAINS[ex].map((d) => `- ${d}`).join("\n");
      const srcText = batch.map((q, i) => {
        const opts = q.options.map((o) => `  ${o.id}. ${o.text}`).join("\n");
        return `#${i + 1} (correct: ${q.correct.join(", ")})\n${q.question}\n${opts}`;
      }).join("\n\n");
      const prompt = `You are an expert item-writer for the ${ex} Claude certification exam. Below are ${batch.length} source practice questions. For EACH one, write a NEW, ORIGINAL question that tests the SAME underlying concept at the SAME difficulty and has the SAME correct option id(s) in the SAME positions.

Rules:
- Return items in the SAME order as the input, one per source question.
- Keep the SAME option ids and count; keep the correct option(s) in the SAME position so the correct id(s) stay valid. (The correct ids are given per question.)
- Rewrite the scenario, the stem, and EVERY option in fresh, original wording — do not copy phrasing from the source. Keep any specific technical facts accurate about Claude/Anthropic.
- Preserve single vs multiple correct answers exactly as in the source.
- Pick exactly one domain per question from:\n${domainList}
- Write a clear 2-4 sentence explanation of why the correct answer is right and the others are wrong. Never mention "the source", "PassQuestion", or these instructions.

SOURCE QUESTIONS:
${srcText}`;
      // retry with exponential backoff + jitter to survive gateway throttling
      let lastErr;
      for (let attempt = 0; attempt < 6; attempt++) {
        try {
          const { object } = await generateObject({ model: MODEL, schema: Schema, prompt, temperature: 0.6 });
          return object.items;
        } catch (e) {
          lastErr = e;
          const wait = Math.min(30000, 1500 * 2 ** attempt) + Math.random() * 1000;
          await new Promise((r) => setTimeout(r, wait));
        }
      }
      throw lastErr;
    }

    const results = new Array(batches.length);
    let idx = 0, done = 0;
    async function pump() {
      while (idx < batches.length) {
        const my = idx++;
        try { results[my] = await worker(batches[my]); }
        catch (e) { results[my] = { __error: e?.message || String(e) }; }
        done++; process.stdout.write(`\r    ${done}/${batches.length} batches`);
      }
    }
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, batches.length) }, pump));
    process.stdout.write("\n");

    const outPath = join(OUT_DIR, `${ex}.json`);
    let bank = [];
    const seen = new Set();
    if (APPEND && existsSync(outPath)) { bank = JSON.parse(readFileSync(outPath, "utf-8")); for (const q of bank) seen.add(slug(q.question)); }
    let kept = 0, fail = 0;
    for (let b = 0; b < batches.length; b++) {
      const out = results[b];
      if (!out || out.__error) { fail += batches[b].length; if (out?.__error) console.log(`    ! batch ${b}: ${out.__error}`); continue; }
      for (let i = 0; i < batches[b].length; i++) {
        const s = batches[b][i];
        const g = out[i];
        if (!g) { fail++; continue; }
        const srcIds = s.options.map((o) => o.id);
        const byId = new Map((g.options || []).map((o) => [o.id, o.text]));
        const options = srcIds.map((id) => ({ id, text: (byId.get(id) || s.options.find((o) => o.id === id).text).trim() }));
        const key = slug(g.question || "");
        if (!g.question || seen.has(key)) { fail++; continue; }
        seen.add(key);
        bank.push({
          id: s.id,
          exam: ex,
          type: s.correct.length > 1 ? "multi" : "single",
          domain: DOMAINS[ex].includes(g.domain) ? g.domain : s.domain,
          question: g.question.trim(),
          options,
          correct: s.correct,
          explanation: (g.explanation || "").trim(),
          grounded: true,
        });
        kept++;
      }
    }
    writeFileSync(outPath, JSON.stringify(bank, null, 2), "utf-8");
    console.log(`    wrote ${outPath} — ${kept} grounded, ${fail} failed, ${bank.length} total`);
  }
  console.log("\nDone.");
}

run().catch((e) => { console.error(e); process.exit(1); });
