import Link from "next/link";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <div className="text-5xl font-bold text-[var(--muted)]">404</div>
      <h1 className="mt-3 text-xl font-semibold">Page not found</h1>
      <p className="mt-2 text-[var(--muted)]">
        That page doesn&rsquo;t exist. Pick an exam from the home page to start
        practising.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 px-5 py-2.5 text-sm font-semibold text-white"
      >
        ← Back to exams
      </Link>
    </div>
  );
}
