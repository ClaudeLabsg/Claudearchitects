"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { ExamMeta, Question } from "@/lib/types";
import {
  buildQuiz,
  grade,
  isCorrect,
  recommendedSeconds,
  formatTime,
  type Mode,
  type QuizConfig,
} from "@/lib/quiz";
import { bestFor, saveAttempt } from "@/lib/storage";
import QuestionView from "./QuestionView";

type Phase = "setup" | "running" | "results";

interface Props {
  exam: ExamMeta;
  questions: Question[];
  domains: { name: string; count: number }[];
}

const COUNT_OPTIONS = [10, 25, 50];

export default function ExamRunner({ exam, questions, domains }: Props) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [best, setBest] = useState<number | null>(null);

  // setup state
  const [mode, setMode] = useState<Mode>("practice");
  const [count, setCount] = useState<number>(10);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);

  // running state
  const [quiz, setQuiz] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [current, setCurrent] = useState(0);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [remaining, setRemaining] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setBest(bestFor(exam.id));
  }, [exam.id, phase]);

  // Deep link: /exam/<id>?mode=mock (or study/exam/practice) preselects the mode.
  useEffect(() => {
    try {
      const m = new URLSearchParams(window.location.search).get("mode");
      if (m === "mock" || m === "study" || m === "exam" || m === "practice") {
        setMode(m);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const availableInSelection = useMemo(() => {
    if (selectedDomains.length === 0) return questions.length;
    return questions.filter((q) => selectedDomains.includes(q.domain)).length;
  }, [questions, selectedDomains]);

  function start() {
    const isMock = mode === "mock";
    const config: QuizConfig = {
      mode,
      count: isMock
        ? Math.min(exam.mockCount, questions.length)
        : Math.min(count, availableInSelection),
      domains: isMock ? [] : selectedDomains,
      shuffle: true,
    };
    const built = buildQuiz(questions, config);
    setQuiz(built);
    setAnswers({});
    setFlagged(new Set());
    setRevealed(new Set());
    setCurrent(0);
    if (mode === "exam" || mode === "mock") {
      const secs = isMock
        ? exam.mockMinutes * 60
        : recommendedSeconds(built.length);
      setRemaining(secs);
    }
    setPhase("running");
  }

  // countdown timer for timed (exam) and mock modes only
  useEffect(() => {
    if (phase !== "running" || (mode !== "exam" && mode !== "mock")) return;
    timerRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(timerRef.current!);
          finish();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, mode]);

  function toggleOption(qid: string, optId: string, type: "single" | "multi") {
    if (revealed.has(qid)) return;
    setAnswers((prev) => {
      const curr = prev[qid] ?? [];
      if (type === "single") return { ...prev, [qid]: [optId] };
      return {
        ...prev,
        [qid]: curr.includes(optId)
          ? curr.filter((x) => x !== optId)
          : [...curr, optId],
      };
    });
  }

  function finish() {
    if (timerRef.current) clearInterval(timerRef.current);
    const result = grade(quiz, answers);
    saveAttempt({
      examId: exam.id,
      mode,
      percent: result.percent,
      correct: result.correct,
      total: result.total,
      passed: result.percent >= exam.passingScore,
      date: Date.now(),
    });
    setPhase("results");
  }

  // ---------- SETUP ----------
  if (phase === "setup") {
    return (
      <div className="relative mx-auto max-w-3xl px-4 py-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={exam.badge}
          alt={`${exam.name} badge`}
          className="absolute right-4 top-9 h-[77px] w-[77px] object-contain sm:h-24 sm:w-24"
        />
        <Link
          href="/mockexams"
          className="text-sm text-[var(--muted)] hover:text-[var(--fg)]"
        >
          ← All exams
        </Link>

        <div className="mt-4 flex items-start gap-3">
          <div
            className={`inline-flex items-center rounded-lg bg-gradient-to-br ${exam.accent} px-2.5 py-1 text-xs font-semibold text-white`}
          >
            {exam.code}
          </div>
          {best !== null && (
            <span className="text-xs text-[var(--muted)]">
              Your best: <strong className="text-[var(--fg)]">{best}%</strong>
            </span>
          )}
        </div>

        <h1 className="mt-3 text-2xl font-bold">{exam.name}</h1>
        <p className="mt-2 text-[var(--muted)]">{exam.description}</p>
        {exam.note && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--muted)]">
            <span aria-hidden>ⓘ</span> {exam.note}
          </p>
        )}

        {/* Exam facts */}
        <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Exam facts</h3>
            <span className="text-[10px] uppercase tracking-wide text-[var(--muted)]">
              Approximate · verify with vendor
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 text-sm">
            <Fact label="Format">
              ~{exam.mockCount} items · ~{exam.mockMinutes} min
            </Fact>
            <Fact label="Delivery">{exam.delivery}</Fact>
            <Fact label="Price">{exam.priceUsd ?? "See vendor"}</Fact>
            <Fact label="Pass threshold">720 / 1000 ({exam.passingScore}%)</Fact>
            <Fact label="Validity">{exam.validity}</Fact>
            <Fact label="Credential">Credly digital badge</Fact>
          </div>
          <p className="mt-3 text-xs text-[var(--muted)]">
            Independent practice — not affiliated with Anthropic. The pass
            threshold is a site default, not a published vendor cut score. Always
            confirm current details with the exam vendor before booking.
          </p>
        </div>

        {/* Register for the real exam */}
        <a
          href={exam.registerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3.5 hover:border-[var(--muted)] transition-colors"
        >
          <span>
            <span className="block text-sm font-semibold">
              Get certified through the Claude SG partner network
            </span>
            <span className="block text-xs text-[var(--muted)]">
              Open to the Claude SG partner network — needs a partner-network
              email (free to create)
              {exam.priceUsd ? ` · ${exam.priceUsd}, paid to Anthropic` : ""}
            </span>
          </span>
          <span
            className={`shrink-0 rounded-lg bg-gradient-to-br ${exam.accent} px-3.5 py-2 text-sm font-semibold text-white`}
          >
            {exam.registerAvailable ? "Register →" : "Learn more →"}
          </span>
        </a>

        {/* Mode */}
        <div className="mt-8">
          <h3 className="text-sm font-semibold mb-2">Mode</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <ModeCard
              active={mode === "practice"}
              onClick={() => setMode("practice")}
              title="Practice"
              body="Instant feedback and an explanation after each question. Best for learning."
            />
            <ModeCard
              active={mode === "study"}
              onClick={() => setMode("study")}
              title="Study set"
              body="Untimed. Answer at your own pace, then grade everything at the end."
            />
            <ModeCard
              active={mode === "exam"}
              onClick={() => setMode("exam")}
              title="Timed quiz"
              body="Your choice of length and domains, under the clock. Score at the end."
            />
            <ModeCard
              active={mode === "mock"}
              onClick={() => setMode("mock")}
              title="Mock exam"
              body={`Full ${exam.mockCount}-question exam, ${exam.mockMinutes} min, scored like the real thing.`}
            />
          </div>
        </div>

        {mode === "mock" ? (
          /* Mock summary */
          <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <h3 className="text-sm font-semibold mb-3">Mock exam setup</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-2xl font-bold">
                  {Math.min(exam.mockCount, questions.length)}
                </div>
                <div className="text-xs text-[var(--muted)]">questions</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{exam.mockMinutes}</div>
                <div className="text-xs text-[var(--muted)]">minutes</div>
              </div>
              <div>
                <div className="text-2xl font-bold">720</div>
                <div className="text-xs text-[var(--muted)]">to pass / 1000</div>
              </div>
            </div>
            <p className="mt-3 text-xs text-[var(--muted)]">
              Questions are drawn across all domains and shuffled. You&rsquo;ll
              get a score report with a scaled score and a per-domain breakdown,
              like the real exam. (Length and time are approximate.)
            </p>
          </div>
        ) : (
          <>
        {/* Count */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold mb-2">Number of questions</h3>
          <div className="flex flex-wrap gap-2">
            {COUNT_OPTIONS.filter((c) => c <= availableInSelection).map((c) => (
              <Chip key={c} active={count === c} onClick={() => setCount(c)}>
                {c}
              </Chip>
            ))}
            <Chip
              active={count >= availableInSelection}
              onClick={() => setCount(availableInSelection)}
            >
              All ({availableInSelection})
            </Chip>
          </div>
        </div>

        {/* Domains */}
        {domains.length > 1 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">
                Domains{" "}
                <span className="font-normal text-[var(--muted)]">
                  (optional — all by default)
                </span>
              </h3>
              {selectedDomains.length > 0 && (
                <button
                  onClick={() => setSelectedDomains([])}
                  className="text-xs text-[var(--muted)] hover:text-[var(--fg)]"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {domains.map((d) => {
                const active = selectedDomains.includes(d.name);
                return (
                  <label
                    key={d.name}
                    className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors ${
                      active
                        ? "border-[#d97757] bg-[#d97757]/10"
                        : "border-[var(--border)] hover:border-[var(--muted)]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="accent-[#d97757]"
                      checked={active}
                      onChange={() =>
                        setSelectedDomains((prev) =>
                          prev.includes(d.name)
                            ? prev.filter((x) => x !== d.name)
                            : [...prev, d.name],
                        )
                      }
                    />
                    <span className="flex-1">{d.name}</span>
                    <span className="text-xs text-[var(--muted)]">{d.count}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
          </>
        )}

        <button
          onClick={start}
          disabled={mode !== "mock" && availableInSelection === 0}
          className={`mt-8 w-full rounded-xl bg-gradient-to-br ${exam.accent} px-4 py-3.5 font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-50`}
        >
          {mode === "mock"
            ? `Start mock exam · ${Math.min(exam.mockCount, questions.length)} questions · ${exam.mockMinutes} min`
            : `Start ${mode === "exam" ? "timed quiz" : mode === "study" ? "study set" : "practice"} · ${Math.min(count, availableInSelection)} questions`}
        </button>
      </div>
    );
  }

  // ---------- RUNNING ----------
  if (phase === "running") {
    const q = quiz[current];
    const sel = answers[q.id] ?? [];
    const isRevealed = revealed.has(q.id);
    const answeredCount = Object.values(answers).filter(
      (a) => a.length > 0,
    ).length;

    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-[var(--muted)]">
            {exam.code} ·{" "}
            {mode === "practice"
              ? "Practice"
              : mode === "study"
                ? "Study set"
                : mode === "mock"
                  ? "Mock exam"
                  : "Timed quiz"}
          </span>
          {mode === "exam" || mode === "mock" ? (
            <span
              className={`rounded-lg px-3 py-1 text-sm font-semibold tabular-nums ${
                remaining < 60
                  ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                  : "bg-[var(--card)] border border-[var(--border)]"
              }`}
            >
              ⏱ {formatTime(remaining)}
            </span>
          ) : (
            <span className="text-sm text-[var(--muted)]">
              {answeredCount}/{quiz.length} answered
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full rounded-full bg-[var(--border)] mb-6">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${exam.accent} transition-all`}
            style={{ width: `${((current + 1) / quiz.length) * 100}%` }}
          />
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-7">
          <QuestionView
            question={q}
            index={current}
            total={quiz.length}
            selected={sel}
            onToggle={(optId) => toggleOption(q.id, optId, q.type)}
            revealed={isRevealed}
          />
        </div>

        {/* Controls */}
        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
            className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium disabled:opacity-40"
          >
            ← Prev
          </button>

          <button
            onClick={() =>
              setFlagged((prev) => {
                const next = new Set(prev);
                if (next.has(q.id)) next.delete(q.id);
                else next.add(q.id);
                return next;
              })
            }
            className={`rounded-lg border px-3 py-2.5 text-sm font-medium ${
              flagged.has(q.id)
                ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                : "border-[var(--border)]"
            }`}
          >
            {flagged.has(q.id) ? "★ Flagged" : "☆ Flag"}
          </button>

          <div className="flex-1" />

          {mode === "practice" && !isRevealed ? (
            <button
              onClick={() =>
                setRevealed((prev) => new Set(prev).add(q.id))
              }
              disabled={sel.length === 0}
              className={`rounded-lg bg-gradient-to-br ${exam.accent} px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50`}
            >
              Check answer
            </button>
          ) : current < quiz.length - 1 ? (
            <button
              onClick={() => setCurrent((c) => c + 1)}
              className={`rounded-lg bg-gradient-to-br ${exam.accent} px-5 py-2.5 text-sm font-semibold text-white`}
            >
              Next →
            </button>
          ) : (
            <button
              onClick={finish}
              className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Finish
            </button>
          )}
        </div>

        {/* Navigator (timed & mock modes) */}
        {mode !== "practice" && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Navigator</h3>
              <button
                onClick={finish}
                className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Submit exam →
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {quiz.map((qq, i) => {
                const answered = (answers[qq.id] ?? []).length > 0;
                const isFlagged = flagged.has(qq.id);
                return (
                  <button
                    key={qq.id}
                    onClick={() => setCurrent(i)}
                    className={`relative h-8 w-8 rounded-md text-xs font-medium border transition-colors ${
                      i === current
                        ? "border-[#d97757] bg-[#d97757] text-white"
                        : answered
                          ? "border-[var(--border)] bg-[var(--card)]"
                          : "border-dashed border-[var(--border)] text-[var(--muted)]"
                    }`}
                  >
                    {i + 1}
                    {isFlagged && (
                      <span className="absolute -right-0.5 -top-0.5 text-amber-500 text-[10px]">
                        ★
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---------- RESULTS ----------
  const result = grade(quiz, answers);
  const scaledScore = Math.round(result.percent * 10); // 0-1000 scale
  const passed = scaledScore >= 720;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {mode === "mock" ? (
        /* Score-report style result */
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-[var(--muted)]">
                Score Report
              </div>
              <div className="mt-0.5 font-semibold">{exam.name}</div>
            </div>
            <span
              className={`rounded-lg px-3 py-1.5 text-sm font-bold ${
                passed
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
              }`}
            >
              {passed ? "PASS" : "FAIL"}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 py-5 text-center">
            <div>
              <div className="text-xs text-[var(--muted)]">PASSING SCORE</div>
              <div className="mt-1 text-2xl font-bold">720</div>
            </div>
            <div>
              <div className="text-xs text-[var(--muted)]">YOUR SCORE</div>
              <div
                className={`mt-1 text-2xl font-bold ${
                  passed ? "text-emerald-500" : "text-rose-500"
                }`}
              >
                {scaledScore}
              </div>
            </div>
            <div>
              <div className="text-xs text-[var(--muted)]">CORRECT</div>
              <div className="mt-1 text-2xl font-bold">
                {result.correct}/{result.total}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setPhase("setup")}
              className={`rounded-lg bg-gradient-to-br ${exam.accent} px-5 py-2.5 text-sm font-semibold text-white`}
            >
              New attempt
            </button>
            <Link
              href="/mockexams"
              className="rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm font-medium"
            >
              All exams
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8 text-center">
          <div
            className={`mx-auto flex h-28 w-28 items-center justify-center rounded-full border-8 ${
              passed
                ? "border-emerald-500/30 text-emerald-500"
                : "border-rose-500/30 text-rose-500"
            }`}
          >
            <span className="text-3xl font-bold">{result.percent}%</span>
          </div>
          <h1 className="mt-4 text-2xl font-bold">
            {passed ? "Passed 🎉" : "Keep practicing"}
          </h1>
          <p className="mt-1 text-[var(--muted)]">
            {result.correct} of {result.total} correct · passing score{" "}
            {exam.passingScore}%
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setPhase("setup")}
              className={`rounded-lg bg-gradient-to-br ${exam.accent} px-5 py-2.5 text-sm font-semibold text-white`}
            >
              New attempt
            </button>
            <Link
              href="/mockexams"
              className="rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm font-medium"
            >
              All exams
            </Link>
          </div>
        </div>
      )}

      {/* Per-domain breakdown */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-3">By domain</h2>
        <div className="space-y-3">
          {Object.entries(result.byDomain)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([dom, s]) => {
              const pct = Math.round((s.correct / s.total) * 100);
              return (
                <div key={dom}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>{dom}</span>
                    <span className="text-[var(--muted)]">
                      {s.correct}/{s.total} · {pct}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[var(--border)]">
                    <div
                      className={`h-full rounded-full ${
                        pct >= exam.passingScore
                          ? "bg-emerald-500"
                          : "bg-rose-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Review */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold mb-3">Review all questions</h2>
        <div className="space-y-4">
          {quiz.map((q, i) => {
            const sel = answers[q.id] ?? [];
            const ok = isCorrect(q, sel);
            return (
              <div
                key={q.id}
                className={`rounded-2xl border p-5 ${
                  ok ? "border-emerald-500/40" : "border-rose-500/40"
                } bg-[var(--card)]`}
              >
                <QuestionView
                  question={q}
                  index={i}
                  total={quiz.length}
                  selected={sel}
                  onToggle={() => {}}
                  revealed
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ModeCard({
  active,
  onClick,
  title,
  body,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  body: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-xl border px-4 py-3 transition-colors ${
        active
          ? "border-[#d97757] bg-[#d97757]/10"
          : "border-[var(--border)] hover:border-[var(--muted)]"
      }`}
    >
      <div className="font-semibold text-sm">{title}</div>
      <div className="mt-1 text-xs text-[var(--muted)]">{body}</div>
    </button>
  );
}

function Fact({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs text-[var(--muted)]">{label}</div>
      <div className="font-medium">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "border-[#d97757] bg-[#d97757]/10"
          : "border-[var(--border)] hover:border-[var(--muted)]"
      }`}
    >
      {children}
    </button>
  );
}
