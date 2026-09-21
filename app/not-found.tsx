import Link from "next/link";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <div className="text-5xl font-bold text-[var(--muted)]">404</div>
      <h1 className="mt-3 text-xl font-semibold">Page not found</h1>
      <p className="mt-2 text-[var(--muted)]">
        That page doesn&rsquo;t exist. Head back to the homepage or jump into the
        mock exams.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex rounded-lg bg-gradient-to-br from-[#d97757] to-[#c2683f] px-5 py-2.5 text-sm font-semibold text-white"
        >
          ← Home
        </Link>
        <Link
          href="/mockexams"
          className="inline-flex rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm font-medium"
        >
          Mock exams
        </Link>
      </div>
    </div>
  );
}
