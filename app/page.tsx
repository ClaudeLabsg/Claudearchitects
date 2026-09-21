import Link from "next/link";
import CountUp from "@/components/arc/CountUp";
import Reveal from "@/components/arc/Reveal";
import RotatingWord from "@/components/arc/RotatingWord";
import ShaderCanvas from "@/components/arc/ShaderCanvas";
import SpotlightCard from "@/components/arc/SpotlightCard";
import TryQuestion, { type Deck } from "@/components/arc/TryQuestion";
import { EXAMS, examStats, getDomains, getQuestions } from "@/lib/exams";
import { COMMUNITY, PDFS } from "@/lib/site";
import type { Question } from "@/lib/types";

/* -------------------------------------------------------------------------- */
/*  Data prepared at build time                                                */
/* -------------------------------------------------------------------------- */


const totalQuestions = EXAMS.reduce((n, e) => n + examStats(e.id).total, 0);
const allDomains = [
  ...new Set(EXAMS.flatMap((e) => getDomains(e.id).map((d) => d.name))),
];

/** Three real, compact single-answer questions per exam for the live demo. */
const weight = (q: Question) =>
  q.question.length + q.options.reduce((n, o) => n + o.text.length, 0);

const decks: Deck[] = EXAMS.map((exam) => {
  const picks = getQuestions(exam.id)
    .filter((q) => q.type === "single" && q.options.length === 4)
    .sort((a, b) => weight(a) - weight(b))
    .slice(0, 3);
  return {
    id: exam.id,
    code: exam.code,
    name: exam.name,
    color: exam.neon,
    deep: exam.deep,
    questions: picks.map((q) => ({
      id: q.id,
      domain: q.domain,
      question: q.question,
      options: q.options,
      correct: q.correct,
      explanation: q.explanation,
    })),
  };
});

const MODES = [
  {
    name: "Practice",
    desc: "Answer, then see the explanation immediately.",
    d: "M5 12h14M12 5l7 7-7 7",
  },
  {
    name: "Study",
    desc: "Untimed, browse freely, answers on demand.",
    d: "M4 19V6a2 2 0 0 1 2-2h11v15H6a2 2 0 0 0-2 2Z",
  },
  {
    name: "Quiz",
    desc: "Timed set, graded at the end.",
    d: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  },
  {
    name: "Mock exam",
    desc: "Full length, real timing, scaled score report.",
    d: "M9 11l3 3 7-7M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9",
  },
];

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function Home() {
  return (
    <div className="arc arc-root relative overflow-x-clip">
      {/* ================================================================== */}
      {/* HERO                                                               */}
      {/* ================================================================== */}
      <section className="relative isolate">
        {/* Shader backdrop — extends up behind the transparent sticky header */}
        <div className="pointer-events-none absolute inset-x-0 -top-32 bottom-0 -z-10 overflow-hidden">
          {/* CSS fallback painted underneath, in case WebGL is unavailable */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_15%,#1b1250_0%,transparent_60%),radial-gradient(ellipse_60%_45%_at_80%_40%,#06304a_0%,transparent_65%),linear-gradient(#05060b,#05060b)]" />
          <ShaderCanvas className="absolute inset-0" />
          {/* legibility scrim — keeps the headline on dark ground without
              flattening the effect on the right-hand side */}
          <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(5,6,11,0.93)_0%,rgba(5,6,11,0.74)_32%,rgba(5,6,11,0.22)_68%,rgba(5,6,11,0)_100%)]" />
          <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-[#05060b]/80 to-transparent" />
          {/* fade the shader into the page below */}
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#05060b]" />
        </div>

        <div className="mx-auto flex min-h-[86svh] max-w-6xl flex-col justify-center px-4 py-20 sm:py-24">
          <Reveal>
            <span className="inline-flex items-center gap-2.5 rounded-full border border-[var(--arc-line)] bg-[var(--arc-surface)] px-3.5 py-1.5 text-xs text-[var(--arc-muted)] backdrop-blur-md">
              <span className="relative flex h-1.5 w-1.5">
                <span className="arc-ring absolute inset-0 rounded-full bg-[var(--arc-c)]" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-[var(--arc-c)]" />
              </span>
              <span className="text-[var(--arc-fg)]">
                {totalQuestions.toLocaleString()} questions live
              </span>
              <span className="text-[var(--arc-line-2)]">·</span>
              4 certifications
              <span className="text-[var(--arc-line-2)]">·</span>
              free forever
            </span>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="mt-7 max-w-4xl text-[clamp(2.4rem,7vw,4.6rem)] font-bold leading-[1.03] tracking-tight text-[var(--arc-fg)]">
              Become a Claude
              <br />
              Certified{" "}
              <RotatingWord
                words={["Architect", "Developer", "Associate"]}
                className="arc-grad-text"
              />
            </h1>
          </Reveal>

          <Reveal delay={150}>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-[var(--arc-muted)] sm:text-lg">
              The community hub for Anthropic&rsquo;s certification program —
              what each credential proves, how to register, and{" "}
              <span className="text-[var(--arc-fg)]">
                {totalQuestions.toLocaleString()} original practice questions
              </span>{" "}
              with instant explanations and full timed mock exams. No account,
              no paywall, runs in your browser.
            </p>
          </Reveal>

          <Reveal delay={220}>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/mockexams"
                className="arc-sheen group relative rounded-2xl bg-gradient-to-r from-[var(--arc-a)] to-[var(--arc-b)] px-7 py-3.5 text-sm font-semibold text-[var(--arc-on-accent)] shadow-[0_18px_60px_-18px_var(--arc-a)] transition-all duration-300 hover:shadow-[0_22px_70px_-14px_var(--arc-b)]"
              >
                <span className="arc-sheen-bar" />
                Start practising free
                <span className="ml-1.5 inline-block transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </Link>
              <Link
                href="/certification"
                className="rounded-2xl border border-[var(--arc-line-2)] bg-[var(--arc-surface)] px-7 py-3.5 text-sm font-semibold text-[var(--arc-fg)] backdrop-blur-md transition-all duration-300 hover:bg-[var(--arc-surface-2)]"
              >
                How to get certified
              </Link>
            </div>
          </Reveal>

          {/* Stat strip */}
          <Reveal delay={300}>
            <dl className="mt-14 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[var(--arc-line)] bg-[var(--arc-line)] backdrop-blur-md sm:grid-cols-4">
              {[
                { k: "Questions", v: totalQuestions, suffix: "" },
                { k: "Certifications", v: 4, suffix: "" },
                { k: "Exam domains", v: allDomains.length, suffix: "" },
                { k: "Study modes", v: 4, suffix: "" },
              ].map((s) => (
                <div key={s.k} className="bg-[#05060b]/70 px-5 py-4">
                  <dt className="text-[11px] uppercase tracking-wider text-[var(--arc-muted)]">
                    {s.k}
                  </dt>
                  <dd className="mt-1 text-2xl font-bold text-[var(--arc-fg)]">
                    <CountUp to={s.v} suffix={s.suffix} />
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        {/* scroll cue */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center"
        >
          <span className="arc-float text-[var(--arc-muted)]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 5v14m0 0l-5-5m5 5l5-5"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </section>

      {/* ================================================================== */}
      {/* DOMAIN MARQUEE                                                     */}
      {/* ================================================================== */}
      <section className="relative border-y border-[var(--arc-line)] bg-[var(--arc-surface)] py-4">
        <div className="arc-marquee overflow-hidden">
          <div className="arc-marquee-track flex w-max gap-3">
            {[...allDomains, ...allDomains].map((d, i) => (
              <span
                key={`${d}-${i}`}
                className="whitespace-nowrap rounded-full border border-[var(--arc-line)] px-4 py-1.5 text-xs text-[var(--arc-muted)]"
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* LIGHT HALF — same identity, light ground. The dark hero hands off   */}
      {/* here via `.arc-handoff`, and every --arc-* token flips.             */}
      {/* ================================================================== */}
      <div className="arc-lite relative isolate">
        {/* ambient light aurora, the counterpart of the hero shader */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          <div className="absolute -top-[18vw] -left-[10vw] h-[52vw] w-[52vw] rounded-full bg-[radial-gradient(circle,rgba(124,92,255,0.40),transparent_68%)] blur-[90px]" />
          <div className="absolute top-[22vw] -right-[14vw] h-[48vw] w-[48vw] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.36),transparent_68%)] blur-[90px]" />
          <div className="absolute bottom-[-20vw] left-[28%] h-[44vw] w-[44vw] rounded-full bg-[radial-gradient(circle,rgba(244,63,126,0.26),transparent_68%)] blur-[100px]" />
          <div className="arc-grid absolute inset-0 opacity-70" />
        </div>

        {/* dark → light blend */}
        <div aria-hidden className="arc-handoff h-28 w-full sm:h-36" />

      {/* ================================================================== */}
      {/* LIVE QUESTION                                                      */}
      {/* ================================================================== */}
      <section className="relative mx-auto max-w-4xl px-4 pb-20 pt-6 sm:pb-28">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--arc-b)]">
            Try it right now
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[var(--arc-fg)] sm:text-4xl">
            Not a teaser. A real question from the bank.
          </h2>
          <p className="mt-3 max-w-2xl text-[var(--arc-muted)]">
            Every item is scenario-based, written against the published exam
            objectives, and put through an independent answer-key review. Pick an
            exam and have a go.
          </p>
        </Reveal>

        <Reveal delay={120} className="mt-8">
          <TryQuestion decks={decks} />
        </Reveal>
      </section>

      {/* ================================================================== */}
      {/* THE FOUR CERTIFICATIONS                                            */}
      {/* ================================================================== */}
      <section className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <div
          aria-hidden
          className="arc-grid pointer-events-none absolute inset-0 -z-10 opacity-40"
        />
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--arc-a)]">
                The program
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-[var(--arc-fg)] sm:text-4xl">
                Four certifications, one path
              </h2>
            </div>
            <Link
              href="/certification"
              className="text-sm text-[var(--arc-muted)] transition-colors hover:text-[var(--arc-fg)]"
            >
              Full details →
            </Link>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {EXAMS.map((exam, i) => {
            const stats = examStats(exam.id);
            const neon = exam.neon;
            const deep = exam.deep;
            return (
              <Reveal key={exam.id} delay={i * 90}>
                <SpotlightCard spot={neon} tilt className="h-full rounded-3xl">
                  <div className="group flex h-full flex-col rounded-3xl border border-[var(--arc-line)] bg-gradient-to-b from-[var(--arc-surface-2)] to-[var(--arc-surface)] p-6 backdrop-blur-xl transition-colors duration-300 hover:border-[var(--arc-line-2)]">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span
                          className="inline-flex rounded-lg px-2.5 py-1 font-mono text-xs font-bold tracking-wider"
                          style={{ background: `${deep}14`, color: deep }}
                        >
                          {exam.code}
                        </span>
                        <h3 className="mt-3 text-lg font-semibold leading-snug text-[var(--arc-fg)]">
                          {exam.name}
                        </h3>
                      </div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={exam.badge}
                        alt=""
                        className="h-16 w-16 shrink-0 object-contain opacity-90 transition-transform duration-500 group-hover:scale-105"
                        style={{ filter: `drop-shadow(0 0 22px ${neon}55)` }}
                      />
                    </div>

                    <p className="mt-2.5 text-sm leading-relaxed text-[var(--arc-muted)]">
                      {exam.tagline}
                    </p>

                    {/* difficulty meter */}
                    <div className="mt-5 flex items-center gap-3">
                      <span className="text-[11px] uppercase tracking-wider text-[var(--arc-muted)]">
                        {exam.difficulty}
                      </span>
                      <span className="flex gap-1">
                        {[1, 2, 3, 4].map((n) => (
                          <span
                            key={n}
                            className="h-1 w-6 rounded-full transition-colors"
                            style={{
                              background:
                                n <= exam.difficultyRank
                                  ? neon
                                  : "rgba(150,170,255,0.14)",
                              boxShadow:
                                n <= exam.difficultyRank
                                  ? `0 0 10px ${neon}80`
                                  : undefined,
                            }}
                          />
                        ))}
                      </span>
                    </div>

                    <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-[var(--arc-line)] pt-4 text-xs">
                      {[
                        { k: "Exam fee", v: exam.priceUsd ?? "—" },
                        { k: "Practice Qs", v: stats.total.toLocaleString() },
                        { k: "Pass mark", v: `${exam.passingScore}%` },
                      ].map((f) => (
                        <div key={f.k}>
                          <dt className="text-[var(--arc-muted)]">{f.k}</dt>
                          <dd className="mt-0.5 font-semibold text-[var(--arc-fg)]">
                            {f.v}
                          </dd>
                        </div>
                      ))}
                    </dl>

                    <div className="mt-6 flex gap-2 pt-1">
                      <Link
                        href={`/mockexams/${exam.id}`}
                        className="rounded-xl px-4 py-2 text-sm font-semibold text-[var(--arc-on-accent)] transition-transform duration-200 hover:scale-[1.03]"
                        style={{
                          background: deep,
                          boxShadow: `0 14px 40px -16px ${neon}`,
                        }}
                      >
                        Practice →
                      </Link>
                      <Link
                        href="/certification"
                        className="rounded-xl border border-[var(--arc-line)] px-4 py-2 text-sm font-medium text-[var(--arc-muted)] transition-colors hover:border-[var(--arc-line-2)] hover:text-[var(--arc-fg)]"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                </SpotlightCard>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ================================================================== */}
      {/* BENTO — what's in the box                                          */}
      {/* ================================================================== */}
      <section className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--arc-c)]">
            The practice engine
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-[var(--arc-fg)] sm:text-4xl">
            Built to behave like real exam software
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* modes — spans two */}
          <Reveal className="sm:col-span-2">
            <SpotlightCard spot="#7c5cff" className="h-full rounded-3xl">
              <div className="h-full rounded-3xl border border-[var(--arc-line)] bg-gradient-to-br from-[var(--arc-surface-2)] to-[var(--arc-surface)] p-6 backdrop-blur-xl">
                <h3 className="text-lg font-semibold text-[var(--arc-fg)]">
                  Four ways to study
                </h3>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {MODES.map((m) => (
                    <div
                      key={m.name}
                      className="group flex items-start gap-3 rounded-2xl border border-[var(--arc-line)] bg-[var(--arc-surface)] p-3.5 transition-colors hover:border-[var(--arc-line-2)] hover:bg-[var(--arc-surface-2)]"
                    >
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[var(--arc-line)] text-[var(--arc-b)] transition-transform duration-300 group-hover:scale-110">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path
                            d={m.d}
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-[var(--arc-fg)]">
                          {m.name}
                        </div>
                        <div className="mt-0.5 text-xs leading-relaxed text-[var(--arc-muted)]">
                          {m.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SpotlightCard>
          </Reveal>

          {/* score report */}
          <Reveal delay={90}>
            <SpotlightCard spot="#4ade80" className="h-full rounded-3xl">
              <div className="flex h-full flex-col rounded-3xl border border-[var(--arc-line)] bg-gradient-to-br from-[var(--arc-surface-2)] to-[var(--arc-surface)] p-6 backdrop-blur-xl">
                <h3 className="text-lg font-semibold text-[var(--arc-fg)]">
                  Scaled score report
                </h3>
                <p className="mt-2 text-sm text-[var(--arc-muted)]">
                  Mock exams report on the same 100–1000 scale as the real thing,
                  with a 720 pass line and a per-domain breakdown.
                </p>
                <div className="mt-auto pt-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-[var(--arc-c)]">
                      <CountUp to={780} />
                    </span>
                    <span className="text-sm text-[var(--arc-muted)]">/ 1000</span>
                  </div>
                  <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-[var(--arc-surface-2)]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--arc-b)] to-[var(--arc-c)]"
                      style={{ width: "78%" }}
                    />
                    <span
                      className="absolute top-0 h-full w-px bg-white/60"
                      style={{ left: "72%" }}
                      title="pass line"
                    />
                  </div>
                  <div className="mt-2 text-[11px] text-[var(--arc-muted)]">
                    pass line 720
                  </div>
                </div>
              </div>
            </SpotlightCard>
          </Reveal>

          {/* remaining three */}
          {[
            {
              t: "Explanations, always",
              b: "Every question ships with a written rationale — why the key is right and why the distractors are not.",
              c: "#22d3ee",
            },
            {
              t: "Options reshuffled",
              b: "Answer positions are randomised on every run, so you learn the concept instead of memorising “it's the third one”.",
              c: "#7c5cff",
            },
            {
              t: "No account, no tracking",
              b: "Nothing to sign up for. Progress is kept in your own browser and never leaves the device.",
              c: "#f43f7e",
            },
          ].map((f, i) => (
            <Reveal key={f.t} delay={i * 90}>
              <SpotlightCard spot={f.c} className="h-full rounded-3xl">
                <div className="h-full rounded-3xl border border-[var(--arc-line)] bg-gradient-to-br from-[var(--arc-surface-2)] to-[var(--arc-surface)] p-6 backdrop-blur-xl">
                  <span
                    className="inline-block h-1.5 w-8 rounded-full"
                    style={{ background: f.c, boxShadow: `0 0 14px ${f.c}` }}
                  />
                  <h3 className="mt-4 text-lg font-semibold text-[var(--arc-fg)]">
                    {f.t}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--arc-muted)]">
                    {f.b}
                  </p>
                </div>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================================================================== */}
      {/* RESOURCES + COMMUNITY                                              */}
      {/* ================================================================== */}
      <section className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-2">
          <Reveal>
            <h2 className="text-2xl font-bold tracking-tight text-[var(--arc-fg)]">
              Official documents
            </h2>
            <p className="mt-2 text-sm text-[var(--arc-muted)]">
              The exam infographic, policy and terms — straight from the source.
            </p>
            <ul className="mt-6 space-y-3">
              {PDFS.map((pdf) => (
                <li key={pdf.href}>
                  <a
                    href={pdf.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-4 rounded-2xl border border-[var(--arc-line)] bg-[var(--arc-surface)] px-4 py-3.5 transition-all duration-300 hover:border-[var(--arc-line-2)] hover:bg-[var(--arc-surface-2)]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--arc-line)] text-[var(--arc-b)]">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-[var(--arc-fg)]">
                        {pdf.label}
                      </span>
                      <span className="block text-xs text-[var(--arc-muted)]">
                        {pdf.desc}
                      </span>
                    </span>
                    <span className="text-[var(--arc-muted)] transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            <Link
              href="/resources"
              className="mt-5 inline-block text-sm font-semibold text-[var(--arc-b)] hover:underline"
            >
              Browse the full resource library →
            </Link>
          </Reveal>

          <Reveal delay={120}>
            <h2 className="text-2xl font-bold tracking-tight text-[var(--arc-fg)]">
              Join the community
            </h2>
            <p className="mt-2 text-sm text-[var(--arc-muted)]">
              Claude SG — with a global Claude community launching soon.
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {COMMUNITY.map((c) => (
                <li key={c.href}>
                  <a
                    href={c.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block h-full rounded-2xl border border-[var(--arc-line)] bg-[var(--arc-surface)] px-4 py-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--arc-line-2)] hover:bg-[var(--arc-surface-2)]"
                  >
                    <div className="text-sm font-semibold text-[var(--arc-fg)]">
                      {c.label}
                    </div>
                    <div className="mt-0.5 text-xs text-[var(--arc-muted)]">
                      {c.blurb}
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ================================================================== */}
      {/* FINAL CTA                                                          */}
      {/* ================================================================== */}
      <section className="relative mx-auto max-w-6xl px-4 pb-24 pt-8">
        <Reveal>
          <div className="arc-noise relative overflow-hidden rounded-[2rem] border border-[var(--arc-line)] bg-gradient-to-br from-[#e7e4ff] via-[#eef1fa] to-[#ddf2f8] px-6 py-16 text-center sm:px-12">
            <div
              aria-hidden
              className="arc-grid pointer-events-none absolute inset-0 opacity-50"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-[var(--arc-a)] opacity-20 blur-[100px]"
            />
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-[var(--arc-fg)] sm:text-5xl">
                Ready when you are.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-[var(--arc-muted)]">
                {totalQuestions.toLocaleString()} questions across{" "}
                {allDomains.length} exam domains. Start with a single question or
                sit a full timed mock — it costs nothing either way.
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <Link
                  href="/mockexams"
                  className="arc-sheen group rounded-2xl bg-gradient-to-r from-[var(--arc-a)] to-[var(--arc-b)] px-8 py-4 text-sm font-semibold text-[var(--arc-on-accent)] shadow-[0_18px_60px_-18px_var(--arc-a)]"
                >
                  <span className="arc-sheen-bar" />
                  Start practising free
                  <span className="ml-1.5 inline-block transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </Link>
                <Link
                  href="/resources"
                  className="rounded-2xl border border-[var(--arc-line-2)] bg-[var(--arc-surface)] px-8 py-4 text-sm font-semibold text-[var(--arc-fg)] transition-colors hover:bg-[var(--arc-surface-2)]"
                >
                  Read the guides
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
      </div>
    </div>
  );
}
