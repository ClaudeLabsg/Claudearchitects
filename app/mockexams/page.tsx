import Link from "next/link";
import { EXAMS, examStats } from "@/lib/exams";

function difficultyClasses(d: string) {
  switch (d) {
    case "Beginner":
      return "bg-[#0891b2]/12 text-[#16a34a]";
    case "Easy":
      return "bg-[#059669]/12 text-[#059669]";
    case "Hard":
      return "bg-[#7c5cff]/12 text-[#5b3fe0]";
    case "Advanced":
      return "bg-[#e11d48]/12 text-[#e11d48]";
    default:
      return "bg-[#5b6480]/12 text-[#5b6480]";
  }
}

export const metadata = {
  title: "Mock Exams",
  description:
    "Free mock exams and practice questions for all four Claude certifications — practice mode with explanations, untimed study sets, timed quizzes and full score-report mock exams.",
};

export default function MockExams() {
  return (
    <div className="mx-auto max-w-5xl px-4">
      {/* Hero */}
      <section className="pt-14 pb-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted)] mb-5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#16a34a]" />
          Free forever · no sign-up
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          Mock exams &amp;{" "}
          <span className="bg-gradient-to-r from-[#7c5cff] to-[#5b3fe0] bg-clip-text text-transparent">
            practice questions
          </span>
        </h1>
        <p className="mt-4 text-lg text-[var(--muted)] max-w-2xl mx-auto">
          Realistic practice exams for the Associate, Architect and Developer
          tracks. Learn with instant explanations, then simulate the real thing
          with a timed run.
        </p>
      </section>

      {/* Exam cards */}
      <section className="grid gap-5 sm:grid-cols-2 pb-6">
        {EXAMS.map((exam) => {
          const stats = examStats(exam.id);
          return (
            <Link
              key={exam.id}
              href={`/mockexams/${exam.id}`}
              className="group relative rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-center gap-2">
                <div
                  className={`inline-flex items-center rounded-lg bg-gradient-to-br ${exam.accent} px-2.5 py-1 text-xs font-semibold text-white`}
                >
                  {exam.code}
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${difficultyClasses(exam.difficulty)}`}>
                  {exam.difficulty}
                </span>
                <span className="text-xs text-[var(--muted)]">
                  {exam.track} · {exam.level}
                </span>
              </div>
              <h2 className="mt-3 text-lg font-semibold leading-snug">
                {exam.name}
              </h2>
              <p className="mt-1.5 text-sm text-[var(--muted)]">
                {exam.tagline}
              </p>
              <div className="mt-4 flex items-center gap-4 text-xs text-[var(--muted)]">
                <span>
                  <strong className="text-[var(--fg)]">{stats.total}</strong>{" "}
                  questions
                </span>
                <span>
                  <strong className="text-[var(--fg)]">{stats.domains}</strong>{" "}
                  domains
                </span>
                <span>
                  pass{" "}
                  <strong className="text-[var(--fg)]">
                    {exam.passingScore}%
                  </strong>
                </span>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={exam.badge}
                alt={`${exam.name} badge`}
                className="absolute right-5 top-5 h-[67px] w-[67px] object-contain drop-shadow-sm"
              />
            </Link>
          );
        })}
      </section>

      {/* How it works */}
      <section className="grid gap-5 sm:grid-cols-3 py-10">
        {[
          {
            title: "Practice mode",
            body: "Answer one at a time and get instant feedback with a full explanation of why each option is right or wrong.",
          },
          {
            title: "Mock exam",
            body: "A full-length, timed simulation graded on the real 720/1000 scale, with a score report broken down by exam domain.",
          },
          {
            title: "Track progress",
            body: "Your attempts and best scores are saved in your browser — no account, no sign-up, nothing leaves your device.",
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
      </section>
    </div>
  );
}
