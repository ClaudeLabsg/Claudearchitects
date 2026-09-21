import Link from "next/link";

export const metadata = { title: "About — Claude Cert Practice" };

export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 prose-slate">
      <h1 className="text-3xl font-bold">About this project</h1>
      <div className="mt-6 space-y-5 text-[var(--fg)]">
        <p>
          <strong>Claude Cert Practice</strong> is a free, community-built study
          aid for the Claude certification program. It gives you realistic
          multiple-choice practice across the Associate, Architect and Developer
          tracks, with a practice mode for learning and a timed mode for
          simulating the real exam.
        </p>

        <h2 className="text-xl font-semibold pt-2">How to use it</h2>
        <ul className="list-disc pl-5 space-y-1 text-[var(--muted)]">
          <li>
            <strong className="text-[var(--fg)]">Practice mode</strong> — check
            each answer as you go and read the explanation. Best for learning.
          </li>
          <li>
            <strong className="text-[var(--fg)]">Exam mode</strong> — a timed
            run. Flag questions, move around freely, then review your full
            results and per-domain breakdown.
          </li>
          <li>
            Everything is stored in your browser only. There are no accounts and
            no tracking.
          </li>
        </ul>

        <h2 className="text-xl font-semibold pt-2">About the questions</h2>
        <p className="text-[var(--muted)]">
          The questions are original items written by the community and aligned
          to the published exam objectives. They are meant to build understanding
          of the concepts each exam covers — they are <em>not</em> real exam
          questions, and passing here does not guarantee passing the real exam.
          If you spot an error, contributions and corrections are welcome.
        </p>

        <h2 className="text-xl font-semibold pt-2">Not official</h2>
        <p className="text-[var(--muted)]">
          This site is not affiliated with, endorsed by, or sponsored by
          Anthropic. &ldquo;Claude&rdquo; and the certification names are
          trademarks of their respective owner and are used here only to describe
          what the practice content covers.
        </p>

        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 px-4 py-2 text-sm font-medium text-white"
          >
            ← Back to exams
          </Link>
        </div>
      </div>
    </div>
  );
}
