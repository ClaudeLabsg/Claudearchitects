// Rewrite & expand the raw question banks into original, community-safe items.
//
// Reads the private source banks in data/source/*.json (kept out of git),
// asks a Claude model (via the Vercel AI Gateway) to rewrite each question in
// original wording, expand the explanation, and assign a domain — then writes
// the result to content/*.json, which the app serves.
//
// Usage:
//   AI_GATEWAY_API_KEY=...  npm run rewrite            # all exams
//   AI_GATEWAY_API_KEY=...  npm run rewrite -- --exam CCDV-F
//   ... --limit 20            only process the first 20 pending in each exam
//   ... --force               re-rewrite even items already marked rewritten
//   ... --concurrency 6       parallel requests (default 5)
//
// Model: set REWRITE_MODEL (default "anthropic/claude-sonnet-4.5").
// Auth:  set AI_GATEWAY_API_KEY (Vercel AI Gateway). You can instead point the
//        AI SDK at a provider directly — see the README.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { generateObject } from "ai";
import { z } from "zod";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SRC_DIR = join(ROOT, "data", "source");
const OUT_DIR = join(ROOT, "content");

const EXAMS = ["CCAO-F", "CCAR-F", "CCAR-P", "CCDV-F"];

const DOMAINS = {
  "CCAO-F": [
    "Projects & Configuration",
    "Prompting Fundamentals",
    "Context & Memory",
    "Claude Features & Interfaces",
    "Responsible Use",
  ],
  "CCAR-F": [
    "Multi-Agent Orchestration & Subagents",
    "Agentic Workflows & Task Design",
    "Claude Code Configuration & Tooling",
    "Context & Session Management",
    "Structured Output & Tool Use",
    "MCP & API Integration",
    "Review, Extraction & Evaluation",
  ],
  "CCAR-P": [
    "Solution Design & Architecture",
    "Models, Prompting & Configuration",
    "Security, Compliance & Governance",
    "Safety & Risk",
    "Evaluation & Testing",
    "Observability & Optimization",
    "Delivery & Stakeholder Management",
    "Developer Enablement",
  ],
  "CCDV-F": [
    "Messages API",
    "Agent SDK",
    "Tool Use & MCP",
    "Prompt Engineering for Code",
    "Evaluation & Testing",
  ],
};

// ---------- args ----------
const args = process.argv.slice(2);
function flag(name, def = false) {
  return args.includes(`--${name}`) ? true : def;
}
function opt(name, def) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
}
const ONLY_EXAM = opt("exam", null);
const LIMIT = parseInt(opt("limit", "0"), 10);
const FORCE = flag("force");
const CONCURRENCY = Math.max(1, parseInt(opt("concurrency", "5"), 10));
const MODEL = process.env.REWRITE_MODEL || "anthropic/claude-sonnet-4.5";

if (!process.env.AI_GATEWAY_API_KEY && !process.env.ANTHROPIC_API_KEY) {
  console.error(
    "\n  Missing API key. Set AI_GATEWAY_API_KEY (Vercel AI Gateway) or ANTHROPIC_API_KEY.\n" +
      "  Example (PowerShell):  $env:AI_GATEWAY_API_KEY=\"...\"; npm run rewrite\n",
  );
  process.exit(1);
}

const OutSchema = z.object({
  question: z.string().describe("The rewritten question stem in original wording."),
  options: z
    .array(z.object({ id: z.string(), text: z.string() }))
    .describe("Each option with its ORIGINAL id (A, B, ...) and rewritten text."),
  domain: z.string().describe("One domain, chosen from the provided list."),
  explanation: z
    .string()
    .describe("An expanded explanation of why the correct answer(s) are right and the others wrong."),
});

function prompt(exam, q) {
  const domainList = DOMAINS[exam].map((d) => `- ${d}`).join("\n");
  const opts = q.options.map((o) => `${o.id}. ${o.text}`).join("\n");
  return `You are an expert item-editor for the ${exam} certification exam. Produce a LIGHT PARAPHRASE of the multiple-choice question below. The goal is to reword it so it is not verbatim, while staying close to the original — same scenario, same details/numbers, same difficulty, same meaning of each option, and the same correct answer. This is a close paraphrase, NOT a from-scratch rewrite: do not invent new scenarios, do not add or remove options, do not change the facts.

Rules:
- Keep the SAME option ids (${q.options.map((o) => o.id).join(", ")}) in the SAME order, so the correct answer id is unchanged. The correct answer id(s) are: ${q.correct.join(", ")}.
- Reword the stem and each option using different sentence structure and synonyms, but preserve the exact meaning and any specific values, names, or constraints. Fix grammar and encoding artifacts.
- Keep it technically accurate about Claude and Anthropic's products.
- Choose exactly one domain from this list:\n${domainList}
- Lightly clean up the explanation (keep it faithful; you may make it slightly clearer, ~2-5 sentences). Do not mention "the source" or "PassQuestion".
- Do not change which option is correct, and do not drift from the original intent.

SOURCE QUESTION:
${q.question}

OPTIONS:
${opts}

CORRECT: ${q.correct.join(", ")}

EXISTING EXPLANATION (for reference, lightly clean/keep it):
${q.explanation || "(none)"}`;
}

async function rewriteOne(exam, q) {
  const { object } = await generateObject({
    model: MODEL,
    schema: OutSchema,
    prompt: prompt(exam, q),
    temperature: 0.4,
  });

  // enforce invariants: ids and correctness come from the source, never the model
  const srcIds = q.options.map((o) => o.id);
  const byId = new Map(object.options.map((o) => [o.id, o.text]));
  const options = srcIds.map((id) => ({
    id,
    text: (byId.get(id) || q.options.find((o) => o.id === id).text).trim(),
  }));
  const domain = DOMAINS[exam].includes(object.domain)
    ? object.domain
    : q.domain;

  return {
    ...q,
    question: object.question.trim(),
    options,
    domain,
    explanation: object.explanation.trim(),
    correct: q.correct, // unchanged, authoritative
    rewritten: true,
  };
}

async function pool(items, worker, concurrency) {
  const results = new Array(items.length);
  let next = 0;
  let done = 0;
  async function run() {
    while (next < items.length) {
      const i = next++;
      try {
        results[i] = await worker(items[i], i);
      } catch (e) {
        results[i] = { __error: e?.message || String(e), __index: i };
      }
      done++;
      if (done % 10 === 0 || done === items.length) {
        process.stdout.write(`\r    ${done}/${items.length} done`);
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, run));
  process.stdout.write("\n");
  return results;
}

async function processExam(exam) {
  const srcPath = join(SRC_DIR, `${exam}.json`);
  const outPath = join(OUT_DIR, `${exam}.json`);
  if (!existsSync(srcPath)) {
    console.log(`  [${exam}] no source at data/source/${exam}.json — skipping`);
    return;
  }
  const source = JSON.parse(readFileSync(srcPath, "utf-8"));

  // load existing output so we can resume
  let current = [];
  if (existsSync(outPath)) current = JSON.parse(readFileSync(outPath, "utf-8"));
  const currentById = new Map(current.map((q) => [q.id, q]));

  const pending = source.filter((q) => {
    const done = currentById.get(q.id);
    return FORCE || !done || !done.rewritten;
  });
  const batch = LIMIT > 0 ? pending.slice(0, LIMIT) : pending;

  console.log(
    `  [${exam}] source ${source.length} · pending ${pending.length} · processing ${batch.length}`,
  );
  if (batch.length === 0) return;

  const results = await pool(batch, (q) => rewriteOne(exam, q), CONCURRENCY);

  let ok = 0;
  let fail = 0;
  for (let i = 0; i < batch.length; i++) {
    const r = results[i];
    if (r && !r.__error) {
      currentById.set(batch[i].id, r);
      ok++;
    } else {
      fail++;
    }
  }

  // preserve original source order
  const merged = source.map((q) => currentById.get(q.id) || q);
  writeFileSync(outPath, JSON.stringify(merged, null, 2), "utf-8");
  console.log(`  [${exam}] wrote ${outPath} — rewritten ok ${ok}, failed ${fail}`);
}

async function main() {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  const list = ONLY_EXAM ? [ONLY_EXAM] : EXAMS;
  console.log(`Model: ${MODEL} · concurrency ${CONCURRENCY}${FORCE ? " · force" : ""}`);
  for (const exam of list) {
    if (!EXAMS.includes(exam)) {
      console.log(`  unknown exam "${exam}"`);
      continue;
    }
    await processExam(exam);
  }
  console.log("\nDone. Run `npm run dev` to see the updated questions.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
