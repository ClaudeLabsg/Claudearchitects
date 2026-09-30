import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import {
  breadcrumbs,
  faqPage,
  graph,
  organization,
  pageMetadata,
  webPage,
  website,
} from "@/lib/seo";
import { BLUEPRINT, EXAMS, examStats } from "@/lib/exams";
import type { ExamId } from "@/lib/types";
import { PDFS, OFFICIAL, PREP_COURSES } from "@/lib/site";
import objectivesData from "@/data/objectives.json";

export const metadata = pageMetadata({
  path: "/resources",
  title: "Resources & Wiki",
  ogTitle: "Claude certification resources — objectives, study guide and FAQ",
  description:
    "The community knowledge base for the Claude certifications — exam domains and objectives for all four tracks, a study guide, FAQ, glossary, and official downloads.",
});

type Domain = { name: string; weight?: number; questions?: number; official?: boolean; objectives: string[] };
type ExamObjectives = { level: string; domains: Domain[] };
const objectives = objectivesData as Record<string, ExamObjectives>;

const GLOSSARY: { term: string; def: string }[] = [
  { term: "Claude Projects", def: "A workspace with custom instructions and a knowledge base that persist across every conversation in the Project." },
  { term: "Custom instructions", def: "Standing guidance (role, tone, rules, output format) applied to all chats in a Project." },
  { term: "Knowledge base", def: "Reference documents attached to a Project so Claude can use them across conversations." },
  { term: "Context window", def: "The amount of text (tokens) Claude can consider at once; managing it well is core to long tasks." },
  { term: "System prompt", def: "Application-level, persistent instructions sent with every API request." },
  { term: "Messages API", def: "The stateless API for multi-turn conversations; you resend history each request." },
  { term: "Message Batches API", def: "Asynchronous processing for large, non-latency-sensitive workloads." },
  { term: "Tool use", def: "Letting Claude call defined tools (with name, description and a typed input schema) and act on the results." },
  { term: "MCP (Model Context Protocol)", def: "An open standard connecting models to external tools and data via interoperable servers." },
  { term: "Claude Agent SDK", def: "The SDK for building agents with built-in tools (Read/Write/Bash), subagents and a coordinator." },
  { term: "Subagents", def: "Specialized agents a coordinator dispatches; the coordinator owns shared state across them." },
  { term: "Prompt caching", def: "Reusing a large, stable prompt prefix across requests to cut cost and latency." },
  { term: "Structured output", def: "Enforcing a schema (via tool use / JSON) so responses can be parsed reliably." },
  { term: "Claude Code", def: "Anthropic's agentic coding tool, configurable via CLAUDE.md, rules, hooks, skills and settings." },
];

/* ------------------------------------------------------------------ *
 * FAQ
 *
 * Phrased the way people ask an assistant — "how do I get Claude certified",
 * "what is the difference between the Architect and Developer certification"
 * — rather than as terse site-FAQ headings. That is the wording an answer
 * engine matches a question against, and this array is also the FAQPage
 * structured data for this route, so the two cannot drift apart.
 *
 * Every figure is read from the exam data instead of written out. An answer
 * that quietly contradicts the banks it describes is worse than no answer,
 * because here it is repeated verbatim by anything that reads the markup.
 * ------------------------------------------------------------------ */

const TOTAL_QS = EXAMS.reduce((n, e) => n + examStats(e.id).total, 0);
const exam = (id: ExamId) => EXAMS.find((e) => e.id === id)!;

/** The `n` heaviest domains of an exam, as "Name (27%)", biggest first. */
function topDomains(id: ExamId, n: number): string {
  return [...BLUEPRINT[id]]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, n)
    .map((b) => `${b.domain} (${b.weight}%)`)
    // Oxford-less list: reads as prose in a sentence, which is where these
    // land, rather than as a comma-run that collides with the next clause.
    .reduce((acc, d, i, all) =>
      i === 0 ? d : i === all.length - 1 ? `${acc} and ${d}` : `${acc}, ${d}`,
    "");
}

const FAQ: { q: string; a: string }[] = [
  {
    q: "How do I get Claude certified?",
    a: `Anthropic offers four role-based credentials, sat proctored through Pearson VUE with a Credly badge on passing. Registration runs through Anthropic Partner Academy, which does not accept personal email addresses — so you need a partner-network address first. The Claude Singapore Community issues a free @claudecode.sg address to community members who pass a short screening; you then sign a freelance developer agreement, register on Partner Academy and book your exam. Exam fees run ${exam("CCAO-F").priceUsd} to ${exam("CCAR-P").priceUsd} and are paid to Anthropic, not to the community.`,
  },
  {
    q: "Is the Claude certification free?",
    a: `The exams are not free: ${exam("CCAO-F").priceUsd} for Associate, ${exam("CCDV-F").priceUsd} for Developer, ${exam("CCAR-F").priceUsd} for Architect Foundations and ${exam("CCAR-P").priceUsd} for Architect Professional, paid to Anthropic. Two things around them are: the @claudecode.sg partner-network email the community issues, and everything on this site — ${TOTAL_QS.toLocaleString()} practice questions with explanations and full timed mock exams, no account needed. Always confirm current pricing with the vendor.`,
  },
  {
    q: "What is the difference between the Claude Architect and Developer certifications?",
    a: `The Developer exam (${exam("CCDV-F").code}) is for engineers building on Claude, and its blueprint is weighted toward ${topDomains("CCDV-F", 3)}. The Architect Foundations exam (${exam("CCAR-F").code}) is for people designing Claude solutions end to end, weighted toward ${topDomains("CCAR-F", 3)}. Both are Foundation level and both cost ${exam("CCAR-F").priceUsd}. The practical split is what you are judged on: writing the integration, versus choosing the architecture it sits in.`,
  },
  {
    q: "What is the difference between Claude Architect Foundations and Professional?",
    a: `Foundations (${exam("CCAR-F").code}, ${exam("CCAR-F").priceUsd}, ${exam("CCAR-F").mockCount} items) is the hands-on level — it tests whether you can build the thing, across ${topDomains("CCAR-F", 2)}. Professional (${exam("CCAR-P").code}, ${exam("CCAR-P").priceUsd}, ${exam("CCAR-P").mockCount} items) is the same track one level up, for people accountable for the solution inside an organisation: ${topDomains("CCAR-P", 4)}. Professional adds governance, stakeholder delivery and lifecycle work that Foundations does not test.`,
  },
  {
    q: "What is on the Claude Architect exam?",
    a: `${exam("CCAR-F").code} is ${exam("CCAR-F").mockCount} questions in ${exam("CCAR-F").mockMinutes} minutes across five domains: ${topDomains("CCAR-F", 5)}. Questions are scenario-based — you are placed in a production situation and asked to make an architectural call rather than recall a definition. The full objective list for every domain is above.`,
  },
  {
    q: "How hard is the Claude Developer exam?",
    a: `${exam("CCDV-F").code} is a Foundation-level exam: ${exam("CCDV-F").mockCount} questions in ${exam("CCDV-F").mockMinutes} minutes, passing at 720 out of 1000. Difficulty is subjective, so the useful signal is the blueprint — it leans heavily on ${topDomains("CCDV-F", 2)}, while Claude Code and Eval/Testing together account for under 6% of the paper. Mock exams on this site sample to those same official weights, so a practice score reflects the real mix rather than whatever the question bank happens to hold most of.`,
  },
  {
    q: "Do I need a partner-network email to sit a Claude certification exam?",
    a: "Yes. Anthropic Partner Academy does not accept personal email addresses for exam registration. The Claude Singapore Community issues a free @claudecode.sg partner-network address to community members who pass a short screening, alongside a short freelance developer agreement. The address exists for exam and portal access — it is not an offer of employment. Screening is currently open for the Architect Foundations and Developer Foundations tracks.",
  },
  {
    q: "Is this site official, or affiliated with Anthropic?",
    a: "No. The certifications themselves are Anthropic's official role-based credentials, but this site is an independent study resource built by the Claude Singapore Community — not affiliated with, endorsed by, or sponsored by Anthropic. The practice questions are original, community-written study items aligned to the published exam objectives. They are not real exam questions, and no real exam content is reproduced here.",
  },
  {
    q: "What is the passing score for the Claude certification exams?",
    a: "Score reports use a 100–1000 scale with 720 to pass, roughly 72%, and that applies across all four exams. Mock exams on this site report on the same scale with the same pass line, but treat it as a site default rather than a published vendor cut score — Anthropic does not publish the exact scoring model.",
  },
  {
    q: "How long is a Claude certification valid?",
    a: "Around 12 months. Verify the current validity period with the vendor before booking, since it is set by Anthropic and can change.",
  },
  {
    q: "How should I prepare for a Claude certification exam?",
    a: "Start with the free Anthropic Academy courses — Introduction to Agent Skills, Introduction to Model Context Protocol, Claude Code in Action, and Building with the Claude API. Then work through the exam objectives listed above for your track. Then drill the mock exams here: every question carries a written explanation of why the key is right and why each distractor is wrong, and full sittings are assembled to the official blueprint weights so the practice mix matches the real paper.",
  },
  {
    q: "How many free Claude practice questions are on this site?",
    a: `${TOTAL_QS.toLocaleString()} across the four certifications — ${EXAMS.map((e) => `${examStats(e.id).total.toLocaleString()} for ${e.code}`).join(", ")}. Every question has a written explanation, answer positions are randomised on each run, and full timed mock exams report a per-domain breakdown. Free, no sign-up, and your progress stays in your own browser.`,
  },
];

export default function Resources() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <JsonLd
        data={graph(
          organization(),
          website(),
          webPage({
            path: "/resources",
            name: "Claude certification resources and wiki",
            description:
              "Exam domains and objectives for all four Claude certifications, plus a study guide, FAQ and glossary.",
          }),
          breadcrumbs([
            { name: "Home", path: "/" },
            { name: "Resources", path: "/resources" },
          ]),
          // Mirrors the FAQ rendered further down this page. Markup-only FAQs
          // are a structured-data policy violation, so one array feeds both.
          faqPage(FAQ),
        )}
      />
      <header className="max-w-2xl">
        <h1 className="text-3xl sm:text-4xl font-bold">Resources &amp; Wiki</h1>
        <p className="mt-3 text-[var(--muted)]">
          The community knowledge base for the Claude certification program —
          the exam domains and objectives for all four tracks, how to prepare, a
          glossary, an FAQ, and the official documents.
        </p>
      </header>

      {/* Sub-nav */}
      <nav className="mt-6 flex flex-wrap gap-2 text-sm">
        {EXAMS.map((e) => (
          <a
            key={e.id}
            href={`#${e.id}`}
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-[var(--muted)] hover:text-[var(--fg)]"
          >
            {e.code}
          </a>
        ))}
        {[
          ["prepare", "How to prepare"],
          ["faq", "FAQ"],
          ["glossary", "Glossary"],
          ["downloads", "Downloads"],
        ].map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-[var(--muted)] hover:text-[var(--fg)]"
          >
            {label}
          </a>
        ))}
      </nav>

      {/* Per-certification deep sections */}
      {EXAMS.map((exam) => {
        const obj = objectives[exam.id];
        const stats = examStats(exam.id);
        return (
          <section
            key={exam.id}
            id={exam.id}
            className="mt-12 scroll-mt-20 border-t border-[var(--border)] pt-8"
          >
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-lg bg-gradient-to-br ${exam.accent} px-2.5 py-1 text-xs font-semibold text-white`}
              >
                {exam.code}
              </span>
              <span className="text-xs text-[var(--muted)]">
                {exam.track} · {exam.level} · {exam.difficulty}
              </span>
            </div>
            <h2 className="mt-3 text-2xl font-bold">{exam.name}</h2>
            <p className="mt-2 text-[var(--muted)]">{exam.description}</p>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 text-sm">
              <Fact label="Price">{exam.priceUsd ?? "See vendor"}</Fact>
              <Fact label="Format">
                ~{exam.mockCount} items · ~{exam.mockMinutes} min
              </Fact>
              <Fact label="Practice bank">{stats.total} questions</Fact>
              <Fact label="Delivery">Pearson VUE</Fact>
            </div>

            {obj?.domains?.length ? (
              <div className="mt-6">
                <h3 className="font-semibold">Domains &amp; objectives</h3>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Percentages are the official exam blueprint weights — budget your
                  revision against them, since the score report is per domain.
                </p>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  {obj.domains.map((d) => (
                    <div
                      key={d.name}
                      className="lite-card rounded-2xl p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-sm font-semibold">{d.name}</div>
                        {d.weight != null && (
                          <span
                            className="shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold"
                            style={{ background: `${exam.deep}14`, color: exam.deep }}
                            title="Share of the official exam blueprint"
                          >
                            {d.weight}%
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-[var(--muted)]">
                        {d.questions != null && (
                          <span>
                            {d.questions.toLocaleString()} practice questions here
                          </span>
                        )}
                        {d.official ? (
                          <span
                            className="rounded px-1.5 py-0.5 font-medium"
                            style={{ background: "#16a34a14", color: "#16a34a" }}
                            title="Wording taken from real score reports"
                          >
                            official objectives
                          </span>
                        ) : (
                          <span title="Summarised from the questions in this bank">
                            · objectives summarised from our bank
                          </span>
                        )}
                      </div>
                      <ul className="mt-2 space-y-1.5 text-sm text-[var(--muted)] list-disc pl-4">
                        {d.objectives.map((o, i) => (
                          <li key={i}>{o}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={`/mockexams/${exam.id}`}
                className={`rounded-lg bg-gradient-to-br ${exam.accent} px-4 py-2 text-sm font-semibold text-white`}
              >
                Practice {exam.code} →
              </Link>
              <a
                href={exam.registerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="lite-btn-ghost rounded-xl px-4 py-2 text-sm font-medium"
              >
                Register on Partner Academy ↗
              </a>
            </div>
          </section>
        );
      })}

      {/* How to prepare */}
      <section id="prepare" className="mt-14 scroll-mt-20 border-t border-[var(--border)] pt-8">
        <h2 className="text-2xl font-bold">How to prepare</h2>
        <ol className="mt-4 space-y-3 text-sm text-[var(--fg)] list-decimal pl-5">
          <li>
            <strong>Take the free Anthropic Academy courses</strong> for your
            track (see below) to cover the concepts end to end.
          </li>
          <li>
            <strong>Study the domains &amp; objectives</strong> above — they map
            directly to what each exam tests.
          </li>
          <li>
            <strong>Drill our free mock exams</strong> in Practice mode (instant
            explanations), then simulate the real thing with a timed Mock exam
            and review the per-domain score report.
          </li>
          <li>
            <strong>Read the official documents</strong> (infographic, policy,
            terms) before you book.
          </li>
        </ol>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {PREP_COURSES.map((c) => (
            <a
              key={c.label}
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              className="lite-card lite-card-i arc-spot rounded-2xl px-4 py-3 text-sm font-medium"
            >
              {c.label} <span className="text-[var(--muted)]">↗</span>
            </a>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mt-14 scroll-mt-20 border-t border-[var(--border)] pt-8">
        <h2 className="text-2xl font-bold">FAQ</h2>
        <div className="mt-4 space-y-3">
          {FAQ.map((f) => (
            <details
              key={f.q}
              className="lite-card rounded-2xl p-4"
            >
              <summary className="cursor-pointer font-medium">{f.q}</summary>
              <p className="mt-2 text-sm text-[var(--muted)]">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Glossary */}
      <section id="glossary" className="mt-14 scroll-mt-20 border-t border-[var(--border)] pt-8">
        <h2 className="text-2xl font-bold">Glossary</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          {GLOSSARY.map((g) => (
            <div
              key={g.term}
              className="lite-card rounded-2xl p-4"
            >
              <dt className="text-sm font-semibold">{g.term}</dt>
              <dd className="mt-1 text-sm text-[var(--muted)]">{g.def}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Downloads + official links */}
      <section id="downloads" className="mt-14 scroll-mt-20 border-t border-[var(--border)] pt-8">
        <h2 className="text-2xl font-bold">Downloads &amp; official links</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {PDFS.map((pdf) => (
            <a
              key={pdf.href}
              href={pdf.href}
              target="_blank"
              rel="noopener noreferrer"
              className="lite-card lite-card-i arc-spot rounded-2xl p-5"
            >
              <div className="text-sm font-semibold">{pdf.label}</div>
              <div className="mt-1 text-xs text-[var(--muted)]">{pdf.desc}</div>
              <div className="mt-3 text-xs font-medium text-[#5b3fe0]">
                Download PDF →
              </div>
            </a>
          ))}
        </div>
        <ul className="mt-6 space-y-2 text-sm">
          {OFFICIAL.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#5b3fe0] hover:underline"
              >
                {l.label} ↗
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-[var(--muted)]">{label}</div>
      <div className="font-medium">{children}</div>
    </div>
  );
}
