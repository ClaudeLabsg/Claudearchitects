import Link from "next/link";
import { EXAMS } from "@/lib/exams";
import { PDFS, PREP_COURSES, OFFICIAL, REGISTER_STEPS } from "@/lib/site";

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

      {/* Tracks */}
      <section className="mt-10 space-y-5">
        {EXAMS.map((exam) => (
          <div
            key={exam.id}
            className="relative rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={exam.badge}
              alt={`${exam.name} badge`}
              className="absolute right-5 top-5 h-16 w-16 object-contain"
            />
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-lg bg-gradient-to-br ${exam.accent} px-2.5 py-1 text-xs font-semibold text-white`}
              >
                {exam.code}
              </span>
              <span className="text-xs text-[var(--muted)]">
                {exam.track} · {exam.level}
              </span>
            </div>
            <h2 className="mt-3 text-xl font-semibold pr-20">{exam.name}</h2>
            <p className="mt-2 text-sm text-[var(--muted)] pr-20">
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

            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href={exam.registerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`rounded-lg bg-gradient-to-br ${exam.accent} px-4 py-2 text-sm font-semibold text-white`}
              >
                {exam.registerAvailable ? "Register →" : "Official info →"}
              </a>
              <Link
                href={`/mockexams/${exam.id}`}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium hover:border-[var(--muted)]"
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
        <ol className="mt-5 grid gap-4 sm:grid-cols-3">
          {REGISTER_STEPS.map((s, i) => (
            <li
              key={s.title}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5"
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
          className="mt-5 inline-flex rounded-xl bg-gradient-to-br from-[#7c5cff] to-[#5b3fe0] px-6 py-3 font-semibold text-white"
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
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm font-medium hover:border-[var(--muted)]"
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
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 hover:border-[var(--muted)]"
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
