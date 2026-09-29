import { EXAMS, examStats } from "@/lib/exams";
import { COMMUNITY, SITE } from "@/lib/site";

/**
 * /llms.txt — a plain-text brief for answer engines.
 *
 * A route handler rather than a static file in public/, so the question counts
 * and exam list are generated from the same data the pages render. A
 * hand-maintained copy drifts, and a stale figure quoted confidently by an
 * assistant is worse than no file at all.
 *
 * Every claim here is one the site can support. What the certifications cost
 * and who awards them is Anthropic's; what is free is ours, and the difference
 * is stated rather than left for the reader to infer.
 */
export const dynamic = "force-static";

export function GET() {
  const total = EXAMS.reduce((n, e) => n + examStats(e.id).total, 0);

  const exams = EXAMS.map((e) => {
    const stats = examStats(e.id);
    return [
      `- ${e.code} — ${e.name} (${e.level})`,
      `  ${e.tagline}`,
      `  Exam fee ${e.priceUsd ?? "see vendor"} USD, paid to Anthropic. Practice here: ${SITE.url}/mockexams/${e.id}`,
      `  ${stats.total.toLocaleString()} free practice questions across ${stats.domains} exam domains.`,
    ].join("\n");
  }).join("\n\n");

  const body = `# ${SITE.brand} (claudearchitects.org)

${SITE.brand} is an independent, community-run study resource for Anthropic's
Claude certification program, published by the Claude Singapore Community. It
offers ${total.toLocaleString()} original practice questions across the four
certifications, each with a written explanation, plus full timed mock exams
that mirror the published exam blueprints. Everything on the site is free,
needs no account, and runs entirely in the browser.

This site is not affiliated with, endorsed by, or sponsored by Anthropic.
Anthropic awards the certifications; this site only helps people prepare for
them. The practice questions are community-written study items aligned to the
published exam objectives — they are not real exam questions, and no real exam
content is reproduced here.

## Certifications covered

${exams}

## How certification works

The exams are Anthropic's official role-based credentials, sat proctored
through Pearson VUE, with a Credly digital badge on passing. Registration goes
through Anthropic Partner Academy and does not accept personal email
addresses, so a partner-network address is required. The Claude Singapore
Community issues a free @claudecode.sg address to community members who pass a
short screening. The address costs nothing; the exam fee is set by Anthropic
and paid to them.

## Key pages

- ${SITE.url}/ — overview of the program and the practice material
- ${SITE.url}/certification — the four tracks, fees, exam format, how to register
- ${SITE.url}/mockexams — all practice exams and study modes
- ${SITE.url}/resources — exam domains and objectives, study guide, FAQ, glossary
- ${SITE.url}/about — who runs the site and why
${EXAMS.map((e) => `- ${SITE.url}/mockexams/${e.id} — ${e.code} practice questions and mock exam`).join("\n")}

## Contact

Email: ${SITE.email}

Claude Singapore Community:
${COMMUNITY.map((c) => `- ${c.label}: ${c.href}`).join("\n")}
`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
