import Link from "next/link";
import { EXAMS, examStats } from "@/lib/exams";
import { COMMUNITY, PDFS } from "@/lib/site";

function difficultyClasses(d: string) {
  switch (d) {
    case "Beginner":
      return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
    case "Easy":
      return "bg-teal-500/15 text-teal-600 dark:text-teal-400";
    case "Hard":
      return "bg-[#d97757]/15 text-[#b45f3d] dark:text-[#e59b7f]";
    case "Advanced":
      return "bg-rose-500/15 text-rose-600 dark:text-rose-400";
    default:
      return "bg-slate-500/15 text-slate-600";
  }
}

const totalQuestions = EXAMS.reduce((n, e) => n + examStats(e.id).total, 0);

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* Hero */}
      <section className="pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted)] mb-5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          A Claude SG community project
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
          Get{" "}
          <span className="bg-gradient-to-r from-[#d97757] to-[#c2683f] bg-clip-text text-transparent">
            Claude certified
          </span>
        </h1>
        <p className="mt-5 text-lg text-[var(--muted)] max-w-2xl mx-auto">
          Everything you need for the Claude certification program — the
          Architect, Developer and Associate exams. Learn what each credential
          is, how to register, and prepare with{" "}
          <strong className="text-[var(--fg)]">
            {totalQuestions.toLocaleString()}+ free practice questions
          </strong>
          .
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/certification"
            className="rounded-xl bg-gradient-to-br from-[#d97757] to-[#c2683f] px-6 py-3 font-semibold text-white shadow-sm hover:opacity-95"
          >
            Explore certifications
          </Link>
          <Link
            href="/mockexams"
            className="rounded-xl border border-[var(--border)] px-6 py-3 font-semibold hover:border-[var(--muted)]"
          >
            Practice free →
          </Link>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-[var(--muted)]">
          <span>
            <strong className="text-[var(--fg)]">4</strong> certifications
          </span>
          <span>
            <strong className="text-[var(--fg)]">
              {totalQuestions.toLocaleString()}
            </strong>{" "}
            practice questions
          </span>
          <span>
            <strong className="text-[var(--fg)]">Free</strong> to practise
          </span>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-8">
        <div className="flex items-end justify-between mb-5">
          <h2 className="text-2xl font-bold">The four certifications</h2>
          <Link
            href="/certification"
            className="text-sm text-[var(--muted)] hover:text-[var(--fg)]"
          >
            Full details →
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {EXAMS.map((exam) => {
            const stats = examStats(exam.id);
            return (
              <div
                key={exam.id}
                className="relative rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={exam.badge}
                  alt={`${exam.name} badge`}
                  className="absolute right-5 top-5 h-[67px] w-[67px] object-contain drop-shadow-sm"
                />
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-lg bg-gradient-to-br ${exam.accent} px-2.5 py-1 text-xs font-semibold text-white`}
                  >
                    {exam.code}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${difficultyClasses(exam.difficulty)}`}
                  >
                    {exam.difficulty}
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-semibold leading-snug pr-16">
                  {exam.name}
                </h3>
                <p className="mt-1.5 text-sm text-[var(--muted)] pr-16">
                  {exam.tagline}
                </p>
                <div className="mt-4 flex items-center gap-4 text-xs text-[var(--muted)]">
                  <span>
                    <strong className="text-[var(--fg)]">
                      {exam.priceUsd ?? "—"}
                    </strong>
                  </span>
                  <span>
                    <strong className="text-[var(--fg)]">{stats.total}</strong>{" "}
                    practice Qs
                  </span>
                  <span>
                    pass{" "}
                    <strong className="text-[var(--fg)]">
                      {exam.passingScore}%
                    </strong>
                  </span>
                </div>
                <div className="mt-5 flex gap-2">
                  <Link
                    href="/certification"
                    className="rounded-lg border border-[var(--border)] px-3.5 py-2 text-sm font-medium hover:border-[var(--muted)]"
                  >
                    Details
                  </Link>
                  <Link
                    href={`/mockexams/${exam.id}`}
                    className={`rounded-lg bg-gradient-to-br ${exam.accent} px-3.5 py-2 text-sm font-semibold text-white`}
                  >
                    Practice →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Why certify */}
      <section className="py-12">
        <h2 className="text-2xl font-bold text-center">Why get certified?</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          {[
            {
              title: "Prove your Claude skills",
              body: "A proctored, vendor-delivered credential with a Credly digital badge — verifiable proof you can build and design with Claude.",
            },
            {
              title: "Stand out in the network",
              body: "Certifications feed into the Claude Partner Network and open doors in a fast-growing ecosystem.",
            },
            {
              title: "Prepare with confidence",
              body: `Study the real objectives and drill ${totalQuestions.toLocaleString()} original practice questions with instant explanations and full mock exams.`,
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5"
            >
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Practice highlight */}
      <section className="py-6">
        <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[#d97757]/10 to-[#c2683f]/10 p-8 text-center">
          <h2 className="text-2xl font-bold">
            {totalQuestions.toLocaleString()} free practice questions
          </h2>
          <p className="mt-2 text-[var(--muted)] max-w-xl mx-auto">
            Practice mode with instant explanations, an untimed study set, timed
            quizzes, and full mock exams with a score report — across all four
            certifications. No sign-up, all in your browser.
          </p>
          <Link
            href="/mockexams"
            className="mt-6 inline-flex rounded-xl bg-gradient-to-br from-[#d97757] to-[#c2683f] px-6 py-3 font-semibold text-white"
          >
            Start practising →
          </Link>
        </div>
      </section>

      {/* Downloads */}
      <section className="py-10">
        <h2 className="text-2xl font-bold mb-1">Official documents</h2>
        <p className="text-sm text-[var(--muted)] mb-5">
          The official exam infographic, policy and terms (PDF).
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {PDFS.map((pdf) => (
            <a
              key={pdf.href}
              href={pdf.href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 hover:border-[var(--muted)] transition-colors"
            >
              <div className="text-sm font-semibold">{pdf.label}</div>
              <div className="mt-1 text-xs text-[var(--muted)]">{pdf.desc}</div>
              <div className="mt-3 text-xs font-medium text-[#c2683f] dark:text-[#e59b7f]">
                Download PDF →
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Community */}
      <section className="py-10">
        <h2 className="text-2xl font-bold mb-1">Join the community</h2>
        <p className="text-sm text-[var(--muted)] mb-5">
          Claude SG — and a global Claude community launching soon.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {COMMUNITY.map((c) => (
            <a
              key={c.href}
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 hover:border-[var(--muted)] transition-colors"
            >
              <div className="text-sm font-semibold">{c.label}</div>
              <div className="text-xs text-[var(--muted)]">{c.blurb}</div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
