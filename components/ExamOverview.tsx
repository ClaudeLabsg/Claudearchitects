import Link from "next/link";
import { BLUEPRINT, examStats } from "@/lib/exams";
import type { ExamId, ExamMeta } from "@/lib/types";

/**
 * Reference material about one exam, rendered under the practice runner.
 *
 * These four routes ship the largest pages on the site — up to 1.3 MB, almost
 * all of it the question bank serialised as hydration data — while exposing
 * roughly 350 words a crawler can actually read, less than the About page.
 * They are also the pages that should answer "CCAR-F practice test" or "what
 * is on the Claude Architect exam", so the thinnest content sat on the highest
 * intent.
 *
 * Everything here is read from the exam data, never written out, for the same
 * reason the FAQ is: these figures also reach answer engines through the Quiz
 * markup on this route, and a number that drifts gets repeated as fact.
 *
 * Placed below the runner deliberately. People arrive here to practise; the
 * reference belongs after the thing they came for, not in front of it.
 */
export default function ExamOverview({
  exam,
  domains,
}: {
  exam: ExamMeta;
  domains: { name: string; count: number }[];
}) {
  const stats = examStats(exam.id as ExamId);
  const blueprint = BLUEPRINT[exam.id as ExamId] ?? [];
  const counts = new Map(domains.map((d) => [d.name, d.count]));

  const facts: { label: string; value: string }[] = [
    { label: "Exam code", value: exam.code },
    { label: "Level", value: exam.level },
    { label: "Format", value: `${exam.mockCount} questions · ${exam.mockMinutes} min` },
    { label: "Passing score", value: `720 / 1000 (${exam.passingScore}%)` },
    { label: "Exam fee", value: exam.priceUsd ?? "See vendor" },
    { label: "Delivery", value: exam.delivery },
    { label: "Validity", value: exam.validity },
    { label: "Practice questions", value: `${stats.total.toLocaleString()} free` },
  ];

  return (
    <section className="mx-auto max-w-5xl px-4 pb-16 pt-4">
      <div className="lite-card rounded-3xl p-6 sm:p-8">
        <h2 className="text-2xl font-bold tracking-tight">
          About the {exam.code} exam
        </h2>
        <p className="mt-3 max-w-3xl text-[var(--muted)]">{exam.description}</p>
        <p className="mt-3 max-w-3xl text-sm text-[var(--muted)]">
          {exam.name} is one of Anthropic&rsquo;s four role-based Claude
          certifications. It is sat proctored through Pearson VUE and earns a
          Credly digital badge on passing. Registration goes through Anthropic
          Partner Academy and needs a partner-network email address, which the
          Claude Singapore Community issues free to members who pass a short
          screening.
        </p>

        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
          {facts.map((f) => (
            <div key={f.label}>
              <dt className="text-xs uppercase tracking-wider text-[var(--muted)]">
                {f.label}
              </dt>
              <dd className="mt-1 text-sm font-semibold">{f.value}</dd>
            </div>
          ))}
        </dl>

        {blueprint.length > 0 && (
          <>
            <h3 className="mt-8 text-lg font-semibold">
              {exam.code} exam domains and weights
            </h3>
            <p className="mt-1.5 text-sm text-[var(--muted)]">
              The official blueprint. Full mock exams on this page are sampled
              to these weights, so a practice paper carries the same mix of
              topics as the real one.
            </p>
            <ul className="mt-4 space-y-2.5">
              {[...blueprint]
                .sort((a, b) => b.weight - a.weight)
                .map((b) => {
                  const have = counts.get(b.domain) ?? 0;
                  return (
                    <li key={b.domain}>
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                        <span className="text-sm font-medium">{b.domain}</span>
                        <span className="text-xs text-[var(--muted)]">
                          <strong className="text-[var(--fg)]">
                            {b.weight}%
                          </strong>{" "}
                          of the exam
                          {have > 0 && (
                            <> · {have.toLocaleString()} practice questions</>
                          )}
                        </span>
                      </div>
                      {/* Weight as a bar: the relative sizes are the whole
                          point of a blueprint, and a column of percentages
                          makes the reader do that comparison in their head. */}
                      <div
                        aria-hidden
                        className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[var(--border)]"
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${b.weight}%`,
                            background: `linear-gradient(90deg, ${exam.deep}, ${exam.neon})`,
                          }}
                        />
                      </div>
                    </li>
                  );
                })}
            </ul>
          </>
        )}

        <h3 className="mt-8 text-lg font-semibold">
          What is in this {exam.code} practice bank
        </h3>
        <p className="mt-1.5 max-w-3xl text-sm text-[var(--muted)]">
          {stats.total.toLocaleString()} original practice questions across{" "}
          {stats.domains} exam domains, each with a written explanation of why
          the correct answer is right and why every distractor is wrong. Answer
          positions are randomised on each run, questions that give each other
          away are kept out of the same paper, and full sittings report on the
          720 / 1000 scale with a per-domain breakdown. Free, no account, and
          your progress stays in your own browser.
        </p>
        <p className="mt-3 max-w-3xl text-xs text-[var(--muted)]">
          These are community-written study items aligned to the published exam
          objectives — not real exam questions. This site is not affiliated
          with, endorsed by, or sponsored by Anthropic.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/certification#apply"
            className="lite-btn-ghost rounded-xl px-4 py-2 text-sm font-medium"
          >
            How to register for {exam.code} →
          </Link>
          <Link
            href="/resources"
            className="lite-btn-ghost rounded-xl px-4 py-2 text-sm font-medium"
          >
            Full objectives and study guide →
          </Link>
        </div>
      </div>
    </section>
  );
}
