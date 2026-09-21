// Generate ORIGINAL practice questions from the official exam objectives.
//
// Reads data/objectives.json and, for each objective, asks a Claude model
// (via the Vercel AI Gateway) to write fresh multiple-choice questions with
// explanations. Writes the app's content/*.json. Nothing here is derived from
// any third-party question bank — questions are authored from the objectives.
//
// Usage:
//   AI_GATEWAY_API_KEY=...  npm run generate                 # all exams
//   AI_GATEWAY_API_KEY=...  npm run generate -- --exam CCAO-F
//   ... --per 4          questions per objective (default 3)
//   ... --limit 2        only the first N objectives per exam (cheap trial)
//   ... --append         add to the existing bank instead of replacing it
//   ... --dry            no API calls; just print the plan and validate inputs
//   ... --concurrency 4  parallel requests (default 4)
//
// Model: set GENERATE_MODEL (or REWRITE_MODEL); default "anthropic/claude-sonnet-4.5".
// Auth:  set AI_GATEWAY_API_KEY (Vercel AI Gateway) or ANTHROPIC_API_KEY.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OBJECTIVES = join(ROOT, "data", "objectives.json");
const OUT_DIR = join(ROOT, "content");

// ---------- args ----------
const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const ONLY_EXAM = opt("exam", null);
const PER = Math.max(1, parseInt(opt("per", "3"), 10));
const LIMIT = parseInt(opt("limit", "0"), 10);
const APPEND = flag("append");
const DRY = flag("dry");
const CONCURRENCY = Math.max(1, parseInt(opt("concurrency", "4"), 10));
const MODEL =
  process.env.GENERATE_MODEL ||
  process.env.REWRITE_MODEL ||
  "anthropic/claude-sonnet-4.5";

const objectives = JSON.parse(readFileSync(OBJECTIVES, "utf-8"));
const EXAM_IDS = Object.keys(objectives);

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// ---------- plan ----------
function planFor(examId) {
  const exam = objectives[examId];
  let tasks = [];
  for (const domain of exam.domains) {
    for (const objective of domain.objectives) {
      tasks.push({ examId, level: exam.level, domain: domain.name, objective });
    }
  }
  if (LIMIT > 0) tasks = tasks.slice(0, LIMIT);
  return tasks;
}

function printPlan(list) {
  let grand = 0;
  for (const examId of list) {
    const tasks = planFor(examId);
    const n = tasks.length * PER;
    grand += n;
    console.log(
      `  ${examId}: ${tasks.length} objectives x ${PER} = ~${n} questions`,
    );
  }
  console.log(`  TOTAL: ~${grand} questions (model: ${MODEL})`);
}

// ---------- generation ----------
async function run() {
  const list = ONLY_EXAM ? [ONLY_EXAM] : EXAM_IDS;
  for (const e of list) {
    if (!EXAM_IDS.includes(e)) {
      console.log(`  unknown exam "${e}" (known: ${EXAM_IDS.join(", ")})`);
      return;
    }
  }

  console.log(`Plan${DRY ? " (dry run)" : ""}:`);
  printPlan(list);
  if (DRY) {
    console.log("\nDry run only — no questions generated.");
    return;
  }

  if (!process.env.AI_GATEWAY_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    console.error(
      "\n  Missing API key. Set AI_GATEWAY_API_KEY (Vercel AI Gateway) or ANTHROPIC_API_KEY.\n" +
        '  Example (PowerShell):  $env:AI_GATEWAY_API_KEY="..."; npm run generate\n',
    );
    process.exit(1);
  }

  const { generateObject } = await import("ai");
  const { z } = await import("zod");

  const QSchema = z.object({
    question: z.string().describe("A self-contained, scenario-based question stem."),
    type: z.enum(["single", "multi"]),
    options: z
      .array(z.object({ id: z.string(), text: z.string() }))
      .min(4)
      .max(5)
      .describe("Options labeled A, B, C, D (optionally E)."),
    correct: z.array(z.string()).min(1).describe("The correct option id(s)."),
    explanation: z
      .string()
      .describe("Why the correct answer is right and each other option is wrong."),
  });
  const BatchSchema = z.object({ questions: z.array(QSchema) });

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  for (const examId of list) {
    const tasks = planFor(examId);
    const level = objectives[examId].level;
    console.log(`\n[${examId}] ${tasks.length} objectives x ${PER}/objective`);

    async function worker(task) {
      const prompt = `You are an expert item-writer for the "${examId}" (${level}-level) Claude certification exam. Write ${PER} ORIGINAL multiple-choice practice questions that assess this objective:

"${task.objective}"

(Domain: ${task.domain})

Requirements:
- Each question is self-contained and realistic (a short scenario a practitioner would face), at ${level} difficulty.
- Technically accurate about Claude and Anthropic's products and APIs.
- Exactly 4 options labeled A, B, C, D (occasionally add E only if it genuinely helps). One clearly-correct answer; use "multi" with 2+ correct only when the objective naturally calls for it (keep most as "single").
- The wrong options should be plausible, not obviously silly.
- Set "correct" to the id(s) of the right option(s), and "type" to "single" or "multi" accordingly.
- Write a 2-4 sentence explanation that says why the correct answer is right and why the others are wrong.
- Do NOT copy any existing exam or vendor question; write fresh items. Do NOT mention these instructions or any question bank.`;

      const { object } = await generateObject({
        model: MODEL,
        schema: BatchSchema,
        prompt,
        temperature: 0.7,
      });
      return { task, questions: object.questions };
    }

    // simple concurrency pool
    const results = [];
    let idx = 0;
    let done = 0;
    async function pump() {
      while (idx < tasks.length) {
        const my = idx++;
        try {
          results[my] = await worker(tasks[my]);
        } catch (e) {
          results[my] = { task: tasks[my], error: e?.message || String(e) };
        }
        done++;
        process.stdout.write(`\r    ${done}/${tasks.length} objectives`);
      }
    }
    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, tasks.length) }, pump),
    );
    process.stdout.write("\n");

    // collect + validate + dedupe
    const outPath = join(OUT_DIR, `${examId}.json`);
    let bank = [];
    const seen = new Set();
    if (APPEND && existsSync(outPath)) {
      bank = JSON.parse(readFileSync(outPath, "utf-8"));
      for (const q of bank) seen.add(slug(q.question));
    }
    let seq = bank.length;
    let kept = 0;
    let skipped = 0;
    for (const r of results) {
      if (!r || r.error) {
        if (r?.error) console.log(`    ! ${r.task.objective.slice(0, 60)}: ${r.error}`);
        continue;
      }
      for (const q of r.questions) {
        const ids = q.options.map((o) => o.id);
        const validIds = q.correct.every((c) => ids.includes(c));
        if (q.options.length < 4 || !validIds || q.correct.length < 1) {
          skipped++;
          continue;
        }
        const key = slug(q.question);
        if (seen.has(key)) {
          skipped++;
          continue;
        }
        seen.add(key);
        seq++;
        bank.push({
          id: `${examId}-G${String(seq).padStart(3, "0")}`,
          exam: examId,
          type: q.correct.length > 1 ? "multi" : "single",
          domain: r.task.domain,
          question: q.question.trim(),
          options: q.options.map((o) => ({ id: o.id, text: o.text.trim() })),
          correct: q.correct,
          explanation: q.explanation.trim(),
          generated: true,
        });
        kept++;
      }
    }
    writeFileSync(outPath, JSON.stringify(bank, null, 2), "utf-8");
    console.log(
      `    wrote ${outPath} — ${kept} new, ${skipped} skipped, ${bank.length} total`,
    );
  }

  console.log("\nDone. Run `npm run dev` to see the generated questions.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
