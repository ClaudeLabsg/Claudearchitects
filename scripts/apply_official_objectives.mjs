// Replace the derived objectives in data/objectives.json with the OFFICIAL
// ones lifted from candidate score reports, for the exams we have reports for.
//
// Derived objectives describe what our bank happens to cover. Official ones are
// what the exam actually measures — and they are the exact strings a candidate
// sees on their score report, so revising against them maps 1:1 onto the result.
// Each is assigned to its blueprint domain by an LLM pass.

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MODEL = process.env.CLASSIFY_MODEL || "anthropic/claude-haiku-4.5";

const official = JSON.parse(readFileSync(join(ROOT, "data/source/official-objectives.json"), "utf-8"));
const objectives = JSON.parse(readFileSync(join(ROOT, "data/objectives.json"), "utf-8"));

const { generateObject } = await import("ai");
const { z } = await import("zod");

for (const [exam, list] of Object.entries(official)) {
  const entry = objectives[exam];
  if (!entry) { console.log(`  ${exam}: not in objectives.json, skipped`); continue; }
  const domains = entry.domains.map((d) => d.name);

  const Schema = z.object({
    assignments: z.array(z.object({ n: z.number(), domain: z.number().int().min(1).max(domains.length) })),
  });
  const prompt = `Assign each ${exam} exam objective to exactly ONE blueprint domain.

DOMAINS:
${domains.map((d, i) => `${i + 1}. ${d}`).join("\n")}

OBJECTIVES:
${list.map((o, i) => `#${i + 1}: ${o}`).join("\n")}

Return one assignment per objective (n = its number, domain = the domain number).`;

  let assignments = [];
  for (let a = 0; a < 5; a++) {
    try {
      const { object } = await generateObject({ model: MODEL, schema: Schema, prompt, temperature: 0 });
      assignments = object.assignments;
      break;
    } catch { await new Promise((r) => setTimeout(r, 1500 * 2 ** a)); }
  }

  const byDomain = new Map(domains.map((d) => [d, []]));
  for (const a of assignments) {
    const d = domains[a.domain - 1];
    const o = list[a.n - 1];
    if (d && o) byDomain.get(d).push(o);
  }
  let placed = 0;
  for (const dom of entry.domains) {
    const got = byDomain.get(dom.name) || [];
    if (got.length) { dom.objectives = got; dom.official = true; placed += got.length; }
  }
  console.log(`  ${exam}: ${placed}/${list.length} official objectives placed across ${entry.domains.filter((d) => d.official).length} domains`);
}

writeFileSync(join(ROOT, "data/objectives.json"), JSON.stringify(objectives, null, 1));
console.log("\nwrote data/objectives.json");
