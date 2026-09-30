import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import {
  breadcrumbs,
  graph,
  organization,
  pageMetadata,
  webPage,
  website,
} from "@/lib/seo";
import ExamBadge from "@/components/ExamBadge";
import { EXAMS, examStats } from "@/lib/exams";
import { PDFS, PREP_COURSES, OFFICIAL, REGISTER_STEPS, CERT_CARDS } from "@/lib/site";

export const metadata = pageMetadata({
  path: "/certification",
  title: "Certification",
  ogTitle: "The four Claude certifications — tracks, fees and how to register",
  description:
    "The four Claude certifications — tracks, pricing, exam format, how to register through the Claude SG partner network, prep courses, and the official exam documents.",
});

export default function Certification() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <JsonLd
        data={graph(
          organization(),
          website(),
          webPage({
            path: "/certification",
            name: "The four Claude certifications",
            description:
              "Tracks, fees, exam format and registration for the Claude Certified Associate, Developer and Architect credentials.",
          }),
          breadcrumbs([
            { name: "Home", path: "/" },
            { name: "Certification", path: "/certification" },
          ]),
        )}
      />
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

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {EXAMS.map((exam) => {
            const card = CERT_CARDS[exam.id];
            if (!card) return null;
            return (
              <div
                key={exam.id}
                style={{ ["--spot" as string]: exam.neon }}
                className="lite-card lite-card-i flex flex-col rounded-2xl p-5"
              >
                <div className="flex items-center gap-3">
                  <ExamBadge exam={exam} size={56} />
                  <div>
                    <h3
                      className="text-base font-semibold leading-tight"
                      style={{ color: exam.deep }}
                    >
                      {card.short}
                    </h3>
                    <span className="mt-0.5 block font-mono text-[11px] text-[var(--muted)]">
                      {exam.code}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-sm text-[var(--muted)]">{card.audience}</p>
                <p className="mt-3 text-sm">{card.focus}</p>
                <Link
                  href={`/mockexams/${exam.id}`}
                  className="group mt-auto flex items-center justify-between border-t border-[var(--border)] pt-4 text-sm font-medium"
                >
                  <span>Practice {exam.code}</span>
                  <span className="text-[var(--muted)] transition-transform group-hover:translate-x-1">
                    &rarr;
                  </span>
                </Link>
              </div>
            );
          })}
        </div>

        {/* Foundations vs Professional */}
        <div className="mt-6 lite-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold">
            Foundations or Professional?
          </h3>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Both Architect exams cover the same track, but they test different
            things.{" "}
            <span className="text-[var(--fg)]">Foundations</span> is about
            building — orchestrating agents, configuring Claude Code, wiring up
            tool use and MCP.{" "}
            <span className="text-[var(--fg)]">Professional</span> is about
            owning the result — architecture decisions, security and governance,
            safety, evaluation strategy, cost and observability, and taking
            stakeholders with you. Foundations asks whether you can build it;
            Professional asks whether you can design, secure and deliver it.
          </p>
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
      {/* The landing target for every general "get your email" click.
          Without this, arriving here meant landing on four exam cards with
          apply buttons and no statement of what you are applying for or why
          — that explanation lived in "How to register", below the fold from
          this anchor. Someone who clicks a button in the header has not read
          the page they just jumped into. */}
      <section id="apply" className="mt-10 scroll-mt-24 space-y-5">
        <div className="lite-card rounded-3xl p-6 sm:p-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#7c5cff]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#5b3fe0]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="arc-ring absolute inset-0 rounded-full bg-[#5b3fe0]" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-[#5b3fe0]" />
            </span>
            Step 1 · Eligibility
          </span>

          <h2 className="mt-3 text-2xl font-bold tracking-tight">
            Why you need a partner-network email
          </h2>

          <p className="mt-3 max-w-3xl text-[var(--muted)]">
            Claude certification exams are booked through the Claude Partner
            Network, and Anthropic Partner Academy will not accept a personal
            email address at registration. Normally that means you have to work
            at a partner company.{" "}
            <span className="font-medium text-[var(--fg)]">
              The Claude Singapore Community lets community members sit the exam
              under its own partner network instead.
            </span>{" "}
            Pass a short screening and we issue you an{" "}
            <span className="font-mono text-[var(--fg)]">@claudecode.sg</span>{" "}
            address, along with a short freelance developer agreement. That
            address is what lets you register.
          </p>

          {/* Stated plainly and early. "Free" beside an exam reads as a
              sponsored exam, and the community funds nobody's exam fee. */}
          <p className="mt-3 max-w-3xl text-sm text-[var(--muted)]">
            <span className="font-medium text-[var(--fg)]">
              The address costs nothing.
            </span>{" "}
            The exam fee is set by Anthropic and paid directly to them — $99 to
            $175 USD depending on the certification. The community does not
            charge for the address and does not pay for the exam. The address is
            for exam and portal access, not an offer of employment.
          </p>

          <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {REGISTER_STEPS.map((step, i) => (
              <li
                key={step.title}
                className="rounded-2xl border border-[var(--border)] bg-white/50 p-4"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#5b3fe0] to-[#7c5cff] font-mono text-xs font-bold text-white">
                  {i + 1}
                </span>
                <span className="mt-2 block text-sm font-semibold">
                  {step.title}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-[var(--muted)]">
                  {step.body}
                </span>
              </li>
            ))}
          </ol>

          <p className="mt-6 text-sm font-medium">
            Pick your track below to start the screening. Screening is open for
            Architect Foundations and Developer Foundations; the other two are
            not open yet.
          </p>
        </div>

        {EXAMS.map((exam) => (
          <div
            key={exam.id}
            className="relative lite-card rounded-2xl p-6"
          >
            <ExamBadge exam={exam} size={112} className="absolute right-5 top-5" />
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
              {/* A track whose screening is not open must not wear the same
                  button as one that is: it leads to a general info page, and
                  dressed identically it reads as an application you can start
                  today. */}
              <a
                href={exam.screeningUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={
                  exam.screeningAvailable
                    ? `rounded-lg bg-gradient-to-br ${exam.accent} px-4 py-2 text-sm font-semibold text-white`
                    : "lite-btn-ghost rounded-xl px-4 py-2 text-sm font-medium text-[var(--muted)]"
                }
              >
                {exam.screeningAvailable
                  ? "1. Apply for email →"
                  : "1. Screening not open yet — partner network info ↗"}
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
