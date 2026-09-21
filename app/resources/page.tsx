import Link from "next/link";
import { EXAMS, examStats } from "@/lib/exams";
import { PDFS, OFFICIAL, PREP_COURSES } from "@/lib/site";
import objectivesData from "@/data/objectives.json";

export const metadata = {
  title: "Resources & Wiki",
  description:
    "The community knowledge base for the Claude certifications — exam domains and objectives for all four tracks, a study guide, FAQ, glossary, and official downloads.",
};

type Domain = { name: string; objectives: string[] };
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

const FAQ: { q: string; a: string }[] = [
  { q: "Are these official exams?", a: "The certifications are Anthropic's official role-based credentials, delivered proctored via Pearson VUE with a Credly badge. This site is an independent, community-built study resource — not affiliated with Anthropic." },
  { q: "How much do they cost?", a: "Approximately: Associate $99, Developer $125, Architect Foundations $125, Architect Professional $175 (USD, paid to Anthropic). Always confirm current pricing with the vendor." },
  { q: "What's the passing score?", a: "The reports use a 720 / 1000 scale (about 72%). The pass mark used in our mock exams is a site default, not a published vendor cut score." },
  { q: "How do I register?", a: "Through the Claude SG partner network: complete the screening, receive a free @claudecode.sg partner-network email, sign a short agreement, then sit the proctored exam. See the Certification page." },
  { q: "How long is a certification valid?", a: "Around 12 months (verify with the vendor)." },
  { q: "How should I prepare?", a: "Take the recommended free Anthropic Academy courses, study the objectives on this page, then drill our free mock exams with explanations." },
];

export default function Resources() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
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
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  {obj.domains.map((d) => (
                    <div
                      key={d.name}
                      className="lite-card rounded-2xl p-4"
                    >
                      <div className="text-sm font-semibold">{d.name}</div>
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
                Register / official info ↗
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
