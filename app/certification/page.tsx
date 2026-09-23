import Link from "next/link";
import { EXAMS, examStats } from "@/lib/exams";
import { PDFS, PREP_COURSES, OFFICIAL, REGISTER_STEPS, TRACKS } from "@/lib/site";

export const metadata = {
  title: "Certification",
  description:
    "The four Claude certifications — tracks, pricing, exam format, how to register through the Claude SG partner network, prep courses, and the official exam documents.",
};

export default function Certification() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <header className="max-w-2xl">
        <h1 className="text-3xl sm:text-4xl font-bold">Claude certification</h1>
        <p className="mt-3 text-[var(--muted)]">
          Anthropic&rsquo;s role-based certification program has four
          credentials, delivered proctored via Pearson VUE with a Credly digital
          badge on passing. Below is each track, how to register through the
          Claude SG partner network, and the official documents.
        </p>
      </header>


      {/* Which one is for you */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold">Which one is for you?</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          The program splits by role, not seniority. Pick the track that matches
          the work you actually do — then the level within it.
        </p>

        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          {TRACKS.map((t) => {
            const exams = EXAMS.filter((e) => e.track === t.track);
            const tint = exams[0]?.deep ?? "#5b3fe0";
            return (
              <div
                key={t.track}
                style={{ ["--spot" as string]: exams[0]?.neon }}
                className="lite-card lite-card-i flex flex-col rounded-2xl p-5"
              >
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={exams[0]?.badge}
                    alt={`Claude Certified ${t.track} badge`}
                    className="h-14 w-14 shrink-0 object-contain"
                    style={{ filter: `drop-shadow(0 6px 16px ${exams[0]?.neon}55)` }}
                  />
                  <h3 className="text-lg font-semibold" style={{ color: tint }}>
                    {t.track}
                  </h3>
                </div>
                <p className="mt-2 text-sm text-[var(--muted)]">{t.audience}</p>
                <p className="mt-3 text-sm">{t.focus}</p>
                <ul className="mt-4 space-y-1.5 border-t border-[var(--border)] pt-4">
                  {exams.map((e) => (
                    <li key={e.id}>
                      <Link
                        href={`/mockexams/${e.id}`}
                        className="group flex items-center justify-between text-sm font-medium"
                      >
                        <span>{e.name.replace("Claude Certified ", "")}</span>
                        <span className="text-[var(--muted)] transition-transform group-hover:translate-x-1">
                          &rarr;
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Side-by-side comparison */}
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 bg-[var(--bg)] p-3 text-left font-medium text-[var(--muted)]">
                  &nbsp;
                </th>
                {EXAMS.map((e) => (
                  <th key={e.id} className="p-3 text-left align-bottom">
                    <span
                      className={`inline-flex items-center rounded-lg bg-gradient-to-br ${e.accent} px-2 py-0.5 text-xs font-semibold text-white`}
                    >
                      {e.code}
                    </span>
                    <span className="mt-2 block text-[13px] font-semibold leading-snug">
                      {e.name.replace("Claude Certified ", "")}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Level", get: (e: (typeof EXAMS)[number]) => e.level },
                {
                  label: "Difficulty",
                  get: (e: (typeof EXAMS)[number]) => e.difficulty,
                },
                {
                  label: "Exam fee",
                  get: (e: (typeof EXAMS)[number]) => e.priceUsd ?? "See vendor",
                },
                {
                  label: "Format",
                  get: (e: (typeof EXAMS)[number]) =>
                    `~${e.mockCount} items · ~${e.mockMinutes} min`,
                },
                {
                  label: "Pass mark",
                  get: (e: (typeof EXAMS)[number]) =>
                    `720 / 1000 (${e.passingScore}%)`,
                },
                {
                  label: "Validity",
                  get: (e: (typeof EXAMS)[number]) => e.validity,
                },
                {
                  label: "Practice questions",
                  get: (e: (typeof EXAMS)[number]) =>
                    examStats(e.id).total.toLocaleString(),
                },
              ].map((row, i) => (
                <tr key={row.label} className={i % 2 ? "bg-white/40" : ""}>
                  <th className="sticky left-0 whitespace-nowrap p-3 text-left font-medium text-[var(--muted)]">
                    {row.label}
                  </th>
                  {EXAMS.map((e) => (
                    <td key={e.id} className="p-3 align-top">
                      {row.get(e)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Tracks */}
      <section className="mt-10 space-y-5">
        {EXAMS.map((exam) => (
          <div
            key={exam.id}
            className="relative lite-card rounded-2xl p-6"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={exam.badge}
              alt={`${exam.name} badge`}
              className="absolute right-5 top-5 h-[112px] w-[112px] object-contain"
              style={{ filter: `drop-shadow(0 10px 24px ${exam.neon}55)` }}
            />
            <div className="flex flex-wrap items-center gap-2 pr-32">
              <span
                className={`inline-flex items-center rounded-lg bg-gradient-to-br ${exam.accent} px-2.5 py-1 text-xs font-semibold text-white`}
              >
                {exam.code}
              </span>
              <span className="text-xs text-[var(--muted)]">
                {exam.track} · {exam.level}
              </span>
            </div>
            <h2 className="mt-3 text-xl font-semibold pr-32">{exam.name}</h2>
            <p className="mt-2 text-sm text-[var(--muted)] pr-32">
              {exam.description}
            </p>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 text-sm">
              <Fact label="Price">{exam.priceUsd ?? "See vendor"}</Fact>
              <Fact label="Format">
                ~{exam.mockCount} items · ~{exam.mockMinutes} min
              </Fact>
              <Fact label="Pass">720 / 1000 ({exam.passingScore}%)</Fact>
              <Fact label="Validity">{exam.validity}</Fact>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <a
                href={exam.screeningUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`rounded-lg bg-gradient-to-br ${exam.accent} px-4 py-2 text-sm font-semibold text-white`}
              >
                {exam.screeningAvailable
                  ? "1. Apply for email →"
                  : "1. Partner network info →"}
              </a>
              <a
                href={exam.registerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="lite-btn-ghost rounded-xl px-4 py-2 text-sm font-medium"
              >
                2. Register for the exam ↗
              </a>
              <Link
                href={`/mockexams/${exam.id}`}
                className="lite-btn-ghost rounded-xl px-4 py-2 text-sm font-medium"
              >
                Practice this exam
              </Link>
            </div>
          </div>
        ))}
        <p className="text-xs text-[var(--muted)]">
          Prices and format are approximate — always confirm current details
          with the exam vendor before registering. Delivery: Pearson VUE
          (proctored). Credential: Credly digital badge.
        </p>
      </section>

      {/* How to register */}
      <section className="mt-14">
        <h2 className="text-2xl font-bold">How to register</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Exams are open to the Claude SG partner network. The partner-network
          email is free to create.
        </p>
        <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {REGISTER_STEPS.map((s, i) => (
            <li
              key={s.title}
              className="lite-card rounded-2xl p-5"
            >
              <div className="text-xs font-semibold text-[#5b3fe0]">
                Step {i + 1}
              </div>
              <div className="mt-1 font-semibold">{s.title}</div>
              <p className="mt-1.5 text-sm text-[var(--muted)]">{s.body}</p>
            </li>
          ))}
        </ol>
        <a
          href="https://claudecode.sg/claude-architect-exam"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex rounded-xl lite-btn px-6 py-3 font-semibold text-white"
        >
          Register at claudecode.sg →
        </a>
      </section>

      {/* Prep courses */}
      <section className="mt-14">
        <h2 className="text-2xl font-bold">Recommended preparation</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Free courses on the Anthropic Partner Academy, plus our free practice.
        </p>
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
        <div className="mt-4">
          <Link
            href="/mockexams"
            className="text-sm font-medium text-[#5b3fe0] hover:underline"
          >
            → Then drill with our free mock exams
          </Link>
        </div>
      </section>

      {/* Official documents */}
      <section className="mt-14">
        <h2 className="text-2xl font-bold">Official documents</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
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
      </section>

      {/* Official links */}
      <section className="mt-14">
        <h2 className="text-2xl font-bold">Official links</h2>
        <ul className="mt-4 space-y-2 text-sm">
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
