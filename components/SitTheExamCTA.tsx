import type { ExamMeta } from "@/lib/types";

/**
 * Shown on the results screen, immediately after the score.
 *
 * This is the highest-intent moment in the whole site: someone has just
 * finished a full sitting and knows where they stand. The two real-world steps
 * (partner-network address, then Partner Academy registration) are numbered
 * because registration rejects personal email addresses — people who try to
 * register first hit a dead end.
 */
export default function SitTheExamCTA({
  exam,
  passed,
}: {
  exam: ExamMeta;
  passed: boolean;
}) {
  return (
    <section
      style={{ ["--spot" as string]: exam.neon }}
      className="lite-card arc-noise relative mt-8 overflow-hidden rounded-[1.75rem] p-6 sm:p-8"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full opacity-20 blur-[70px]"
        style={{ background: exam.neon }}
      />
      <div className="relative">
        <p
          className="text-xs font-semibold uppercase tracking-[0.2em]"
          style={{ color: exam.deep }}
        >
          {passed ? "You're tracking well" : "When you're ready"}
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          {passed
            ? `Sit the real ${exam.code} exam`
            : `How to sit the real ${exam.code} exam`}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
          {passed
            ? "That result is above the pass mark on our practice bank. "
            : "Practice as long as you need — the path to the real exam stays the same. "}
          The exam is booked through the Claude Partner Network, and the Claude
          Singapore Community lets community members sit it under its own: pass a
          short screening and we issue you a{" "}
          <span className="text-[var(--fg)]">
            free @claudecode.sg partner-network email
          </span>
          . Registration will not accept a personal address, so that comes first.
          {exam.priceUsd
            ? ` The exam fee is ${exam.priceUsd}, paid to the vendor.`
            : ""}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a
            href={exam.screeningUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="arc-sheen group rounded-2xl px-6 py-3.5 text-sm font-semibold text-white shadow-[0_16px_44px_-18px_var(--spot)]"
            style={{
              background: `linear-gradient(135deg, ${exam.deep}, ${exam.neon})`,
            }}
          >
            <span className="arc-sheen-bar" />
            {exam.screeningAvailable
              ? "1. Apply for Claude Certification Exams"
              : "1. Partner network info"}
            <span className="ml-1.5 inline-block transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </a>
          <a
            href={exam.registerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="lite-btn-ghost rounded-2xl px-6 py-3.5 text-sm font-semibold"
          >
            2. Register for {exam.code} ↗
          </a>
        </div>
      </div>
    </section>
  );
}
