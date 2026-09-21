import Link from "next/link";
import { COMMUNITY } from "@/lib/site";

export const metadata = {
  title: "About",
  description:
    "Claude Architects is a Claude SG community project — free certification resources, practice exams, and a community for people building with Claude.",
};

export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl sm:text-4xl font-bold">About us</h1>
      <p className="mt-4 text-lg text-[var(--muted)]">
        <strong className="text-[var(--fg)]">Claude Architects</strong> is a
        project of the <strong className="text-[var(--fg)]">Claude SG</strong>{" "}
        community — a group of practitioners in Singapore and beyond building
        with Claude, and helping each other get certified.
      </p>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Our mission</h2>
        <p className="mt-2 text-[var(--muted)]">
          Anthropic&rsquo;s certification program is new, and good preparation
          material is scarce. We want this to be the most useful, most honest
          place on the internet to understand the Claude certifications and get
          ready for them — free, open, and built by people who have actually sat
          the exams.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">What we offer</h2>
        <ul className="mt-3 space-y-2.5 text-[var(--muted)]">
          <li>
            <strong className="text-[var(--fg)]">Free practice exams</strong> —
            1,700+ original questions across all four certifications, with
            explanations, timed quizzes and full mock exams.{" "}
            <Link
              href="/mockexams"
              className="text-[#c2683f] dark:text-[#e59b7f] hover:underline"
            >
              Start practising
            </Link>
            .
          </li>
          <li>
            <strong className="text-[var(--fg)]">A deep resource hub</strong> —
            exam domains and objectives, a study guide, glossary and FAQ.{" "}
            <Link
              href="/resources"
              className="text-[#c2683f] dark:text-[#e59b7f] hover:underline"
            >
              Browse resources
            </Link>
            .
          </li>
          <li>
            <strong className="text-[var(--fg)]">Access to the exams</strong> —
            the certifications are open through the Claude SG partner network,
            and the partner-network email is free to create.{" "}
            <Link
              href="/certification"
              className="text-[#c2683f] dark:text-[#e59b7f] hover:underline"
            >
              How to register
            </Link>
            .
          </li>
          <li>
            <strong className="text-[var(--fg)]">A community</strong> — meetups,
            talks, and people to ask when you get stuck.
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Join us</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
        <div className="mt-4 rounded-xl border border-dashed border-[var(--border)] px-4 py-3 text-sm text-[var(--muted)]">
          🌏 <strong className="text-[var(--fg)]">Claude Global community</strong>{" "}
          — launching soon.
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">About the practice questions</h2>
        <p className="mt-2 text-[var(--muted)]">
          Our questions are original items written by the community and aligned
          to the published exam objectives. Every answer key has been
          independently reviewed. They are study aids — not real exam questions
          — and passing here doesn&rsquo;t guarantee passing the real exam.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Not official</h2>
        <p className="mt-2 text-[var(--muted)]">
          This site is not affiliated with, endorsed by, or sponsored by
          Anthropic. &ldquo;Claude&rdquo; and the certification names are
          trademarks of their respective owner and are used only to describe
          what this resource covers.
        </p>
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/certification"
          className="rounded-xl bg-gradient-to-br from-[#d97757] to-[#c2683f] px-5 py-2.5 text-sm font-semibold text-white"
        >
          Get certified
        </Link>
        <Link
          href="/mockexams"
          className="rounded-xl border border-[var(--border)] px-5 py-2.5 text-sm font-medium"
        >
          Practice free
        </Link>
      </div>
    </div>
  );
}
