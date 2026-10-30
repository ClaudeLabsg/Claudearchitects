"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { BLUEPRINT } from "@/lib/exams";
import { enemiesFor } from "@/lib/enemies";
import SitTheExamCTA from "@/components/SitTheExamCTA";
import ExamBadge from "@/components/ExamBadge";
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
import {
  bestFor,
  clearAttempts,
  clearInProgress,
  loadAttempts,
  loadInProgress,
  loadSeen,
  missedFor,
  recordSeen,
  saveAttempt,
  saveInProgress,
  seenCount,
  type Attempt,
  type InProgress,
} from "@/lib/storage";
import { DOMAIN_COURSES, SITE } from "@/lib/site";
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
  const [deadline, setDeadline] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // An unfinished sitting waiting to be picked up, and the bookkeeping that
  // keeps resuming honest: when this sitting began, and which of its questions
  // have already been counted towards the exposure memory.
  const [resumable, setResumable] = useState<InProgress | null>(null);
  const startedAtRef = useRef(0);
  const seenThisSitting = useRef<Set<string>>(new Set());

  // The learner's record. Read on the client only, and re-read whenever the
  // phase changes so finishing a sitting updates the panel behind it.
  const [history, setHistory] = useState<Attempt[]>([]);
  const [seenN, setSeenN] = useState(0);
  const [toRevisit, setToRevisit] = useState(0);

  function refreshRecord() {
    setBest(bestFor(exam.id));
    setHistory(loadAttempts().filter((a) => a.examId === exam.id));
    setSeenN(seenCount(exam.id));
    setToRevisit(missedFor(exam.id).length);
    setResumable(loadInProgress(exam.id));
  }

  useEffect(() => {
    refreshRecord();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam.id, phase]);

  // Hold the ambient backdrop still for the duration of a sitting. A mock runs
  // to two hours; nobody is looking at the background while answering question
  // 41, and the blurred blooms behind it are the most expensive thing on the
  // page. Cleanup matters — leaving the class behind would freeze the backdrop
  // for the rest of the visit.
  useEffect(() => {
    if (phase !== "running") return;
    document.body.classList.add("sitting");
    return () => document.body.classList.remove("sitting");
  }, [phase]);

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
      // Every unfiltered sitting mirrors the official blueprint mix, not just
      // the timed ones. Drawing straight from the bank skews badly against the
      // real paper: in CCDV-F, Eval/Testing/Debugging is 2.6% of the exam but
      // 18% of the bank, while Applications & Integration is 33% of the exam
      // and 9% of the bank. Practice is the mode people actually use, so it was
      // the least representative one in the heaviest use.
      //
      // Free-form drilling is preserved by the domain filter: buildQuiz ignores
      // the blueprint whenever domains are selected, so picking a domain still
      // draws everything available in it.
      blueprint: BLUEPRINT[exam.id],
      // Pairs that give each other away never share a paper, and questions
      // already served on this device go to the back of the queue.
      enemies: enemiesFor(exam.id),
      seen: loadSeen(exam.id),
    };
    const built = buildQuiz(questions, config);
    // Starting fresh replaces whatever was left unfinished for this exam.
    clearInProgress(exam.id);
    setResumable(null);
    seenThisSitting.current = new Set();
    startedAtRef.current = Date.now();
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
      setDeadline(Date.now() + secs * 1000);
    } else {
      setDeadline(null);
    }
    setPhase("running");
  }

  /** Pick up the unfinished sitting exactly where it was left. */
  function resume() {
    if (!resumable) return;
    // The paper comes back as it was served, options and all, so the recorded
    // answers still point at the options they were given for.
    const quizQs = resumable.questions;
    const at = Math.min(resumable.current, quizQs.length - 1);
    setMode(resumable.mode);
    setQuiz(quizQs);
    setAnswers(resumable.answers);
    setFlagged(new Set(resumable.flagged));
    setRevealed(new Set(resumable.revealed));
    setCurrent(at);
    // Everything up to where they stopped was counted as seen at the time, so
    // resuming must not count it twice.
    seenThisSitting.current = new Set(quizQs.slice(0, at + 1).map((q) => q.id));
    startedAtRef.current = resumable.startedAt;
    setDeadline(resumable.deadline ?? null);
    setPhase("running");
  }

  // Countdown for the timed modes, read off the deadline rather than counted
  // down a second at a time.
  //
  // Decrementing a number got two things wrong: a background tab throttles
  // setInterval, so switching away quietly bought you extra time, and nothing
  // survived a reload. Both go away once the clock is a fixed point in the
  // future that we simply look at.
  useEffect(() => {
    if (phase !== "running" || deadline === null) return;
    function tick() {
      const left = Math.max(0, Math.round((deadline! - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        finish();
      }
    }
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, deadline]);

  // Keep the live sitting on disk, so closing the tab no longer throws it away.
  // Written on every answer, flag, reveal and move: all cheap, and the whole
  // point is that the last thing you did is the thing that survives.
  useEffect(() => {
    if (phase !== "running" || quiz.length === 0) return;
    saveInProgress({
      examId: exam.id,
      mode,
      questions: quiz,
      answers,
      flagged: [...flagged],
      revealed: [...revealed],
      current,
      ...(deadline !== null ? { deadline } : {}),
      startedAt: startedAtRef.current || Date.now(),
      savedAt: Date.now(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, quiz, answers, flagged, revealed, current, deadline]);

  // Exposure memory, recorded question by question as each one is reached.
  //
  // This used to mark the whole set the moment a sitting was built, reasoning
  // that the learner had seen those items either way. They had not: starting a
  // 50-question set and answering one marked all fifty, which both overstated
  // the "questions seen" figure on their own record and pushed the assembler
  // needlessly deep into the bank. Only what they actually reach counts.
  useEffect(() => {
    if (phase !== "running") return;
    const q = quiz[current];
    if (!q || seenThisSitting.current.has(q.id)) return;
    seenThisSitting.current.add(q.id);
    recordSeen(exam.id, [q.id], questions.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, current, quiz]);

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
    // Graded, so there is nothing left to resume.
    clearInProgress(exam.id);
    setResumable(null);
    setDeadline(null);
    const result = grade(quiz, answers);
    // Record which questions were served and which went wrong, so a later
    // sitting can drill the misses. An unanswered question counts as missed —
    // from a revision standpoint, skipped and wrong are the same thing.
    const served = quiz.map((q) => q.id);
    const missed = quiz
      .filter((q) => !isCorrect(q, answers[q.id] ?? []))
      .map((q) => q.id);
    saveAttempt({
      examId: exam.id,
      mode,
      percent: result.percent,
      correct: result.correct,
      total: result.total,
      passed: result.percent >= exam.passingScore,
      date: Date.now(),
      served,
      missed,
      byDomain: result.byDomain,
    });
    setPhase("results");
  }

  // ---------- SETUP ----------
  if (phase === "setup") {
    return (
      <div className="relative mx-auto max-w-3xl px-4 py-10">
        <ExamBadge exam={exam} size={77} className="absolute right-5 top-5" />
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

        {/* An unfinished sitting, offered before anything else on the screen:
            it is the one thing here that is waiting on a decision. */}
        {resumable && (
          <div className="mt-6 rounded-xl border border-[#d97706]/40 bg-[#d97706]/[0.06] p-4">
            <h2 className="text-sm font-semibold">
              You have an unfinished{" "}
              {resumable.mode === "mock"
                ? "mock exam"
                : resumable.mode === "exam"
                  ? "timed quiz"
                  : resumable.mode === "study"
                    ? "study set"
                    : "practice set"}
            </h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              <strong className="text-[var(--fg)]">
                {
                  Object.values(resumable.answers).filter((a) => a.length > 0)
                    .length
                }
              </strong>{" "}
              of {resumable.questions.length} answered &middot; you left off at
              question{" "}
              {Math.min(resumable.current, resumable.questions.length - 1) + 1}{" "}
              &middot; {new Date(resumable.savedAt).toLocaleString()}
            </p>
            <div className="mt-3 flex items-center gap-4">
              <button
                type="button"
                onClick={resume}
                className={`rounded-lg bg-gradient-to-br ${exam.accent} px-4 py-2 text-sm font-semibold text-white`}
              >
                Resume
              </button>
              <button
                type="button"
                onClick={() => {
                  clearInProgress(exam.id);
                  setResumable(null);
                }}
                className="text-xs text-[var(--muted)] underline underline-offset-2 hover:text-[var(--fg)]"
              >
                Discard and start fresh
              </button>
            </div>
          </div>
        )}

        {/* Your record. Everything here was already being stored; until now
            none of it was shown, so repeat visits felt like starting over. */}
        {history.length > 0 && (
          <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-semibold">Your record</h2>
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      "Clear your saved history for every exam on this device? This cannot be undone.",
                    )
                  ) {
                    clearAttempts();
                    refreshRecord();
                  }
                }}
                className="text-xs text-[var(--muted)] underline underline-offset-2 hover:text-[var(--fg)]"
              >
                Clear history
              </button>
            </div>

            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[var(--muted)]">
              <span>
                <strong className="text-[var(--fg)]">{history.length}</strong>{" "}
                {history.length === 1 ? "sitting" : "sittings"}
              </span>
              {best !== null && (
                <span>
                  best <strong className="text-[var(--fg)]">{best}%</strong>
                </span>
              )}
              <span>
                <strong className="text-[var(--fg)]">{seenN}</strong> of{" "}
                {questions.length} questions seen
              </span>
              {toRevisit > 0 && (
                <span>
                  <strong className="text-[var(--fg)]">{toRevisit}</strong> to
                  revisit
                </span>
              )}
            </div>

            <ul className="mt-3 space-y-1">
              {history.slice(0, 5).map((a, i) => (
                <li
                  key={`${a.date}:${i}`}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-[var(--muted)]">
                    {new Date(a.date).toLocaleDateString()} &middot; {a.mode}
                  </span>
                  <span
                    className={
                      a.passed ? "text-[#16a34a]" : "text-[var(--muted)]"
                    }
                  >
                    {a.correct}/{a.total} &middot; {a.percent}%
                  </span>
                </li>
              ))}
            </ul>

            {toRevisit === 0 && history.some((a) => !a.missed) && (
              <p className="mt-3 text-xs text-[var(--muted)]">
                Earlier sittings were saved before per-question detail was
                kept, so there is nothing to drill from those yet. New sittings
                from now on will record it.
              </p>
            )}

            <p className="mt-3 text-xs text-[var(--muted)]">
              Saved in this browser only — it will not follow you to another
              device.
            </p>
          </div>
        )}

        {/* Exam facts */}
        <div className="mt-6 lite-card rounded-2xl p-4">
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

        {/* Sit the real exam — two steps, in order */}
        <div className="mt-4 lite-card rounded-2xl p-4">
          <div className="text-sm font-semibold">Sit the real exam</div>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Registration needs a partner-network address, so apply for that
            first
            {exam.priceUsd ? ` · exam fee ${exam.priceUsd}, paid to Anthropic` : ""}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <a
              href={exam.screeningUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`rounded-lg bg-gradient-to-br ${exam.accent} px-3.5 py-2 text-sm font-semibold text-white`}
            >
              {exam.screeningAvailable
                ? `Register for ${exam.code} →`
                : "Partner network info →"}
            </a>
          </div>
        </div>

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
          <div className="mt-6 lite-card rounded-2xl p-5">
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
                  (optional)
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
            <p className="mb-2 text-xs text-[var(--muted)]">
              {selectedDomains.length === 0
                ? "Pick none and questions are drawn to match the real exam's domain mix. Pick one or more to drill those instead."
                : "Drilling your selection — the real exam's domain mix does not apply while a filter is on."}
            </p>
            <div className="grid sm:grid-cols-2 gap-2">
              {domains.map((d) => {
                const active = selectedDomains.includes(d.name);
                return (
                  <label
                    key={d.name}
                    className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors ${
                      active
                        ? "border-[#7c5cff] bg-[#7c5cff]/8"
                        : "border-[var(--border)] hover:border-[var(--muted)]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="accent-[#7c5cff]"
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
                  ? "bg-[#e11d48]/12 text-[#e11d48]"
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

        <div className="lite-card rounded-2xl p-5 sm:p-7">
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
            className="lite-btn-ghost rounded-xl px-4 py-2.5 text-sm font-medium disabled:opacity-40"
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
                ? "border-[#d97706] bg-[#d97706]/10 text-[#b45309]"
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
              className="rounded-lg bg-[#16a34a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#15803d]"
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
                className="text-sm font-medium text-[#16a34a] hover:underline"
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
                        ? "border-[#7c5cff] lite-btn text-white"
                        : answered
                          ? "border-[var(--border)] bg-[var(--card)]"
                          : "border-dashed border-[var(--border)] text-[var(--muted)]"
                    }`}
                  >
                    {i + 1}
                    {isFlagged && (
                      <span className="absolute -right-0.5 -top-0.5 text-[#d97706] text-[10px]">
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
        <div className="lite-card rounded-2xl p-6 sm:p-8">
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
                  ? "bg-[#0891b2]/12 text-[#16a34a]"
                  : "bg-[#e11d48]/12 text-[#e11d48]"
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
                  passed ? "text-[#16a34a]" : "text-[#e11d48]"
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
              className="lite-btn-ghost rounded-xl px-5 py-2.5 text-sm font-medium"
            >
              All exams
            </Link>
          </div>
        </div>
      ) : (
        <div className="lite-card rounded-2xl p-6 sm:p-8 text-center">
          <div
            className={`mx-auto flex h-28 w-28 items-center justify-center rounded-full border-8 ${
              passed
                ? "border-[#16a34a]/30 text-[#16a34a]"
                : "border-[#e11d48]/30 text-[#e11d48]"
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
              className="lite-btn-ghost rounded-xl px-5 py-2.5 text-sm font-medium"
            >
              All exams
            </Link>
          </div>
        </div>
      )}

      <SitTheExamCTA exam={exam} passed={passed} />

      {/* Per-domain breakdown */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-3">By domain</h2>
        <div className="space-y-3">
          {Object.entries(result.byDomain)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([dom, s]) => {
              const pct = Math.round((s.correct / s.total) * 100);
              const weak = pct < exam.passingScore;
              // Only suggest study for domains that actually fell short —
              // a wall of links under every domain teaches nothing.
              const courses = weak
                ? DOMAIN_COURSES[exam.id]?.[dom] ?? []
                : [];
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
                          ? "bg-[#16a34a]"
                          : "bg-[#e11d48]"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {courses.length > 0 && (
                    <p className="mt-1.5 text-xs text-[var(--muted)]">
                      Study this:{" "}
                      {courses.map((course, i) => (
                        <span key={course.href}>
                          {i > 0 && " · "}
                          <a
                            href={course.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline underline-offset-2 hover:text-[var(--fg)]"
                          >
                            {course.label}
                          </a>
                          {course.minutes ? ` (${course.minutes} min)` : ""}
                        </span>
                      ))}
                    </p>
                  )}
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
                  ok ? "border-[#16a34a]/40" : "border-[#e11d48]/40"
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
                {/* Every wrong answer found in this bank so far was reported by
                    a learner who had to compose an email. One click, with the
                    id already filled in, is the cheapest audit we have. */}
                <p className="mt-3 border-t border-[var(--border)] pt-2.5 text-xs text-[var(--muted)]">
                  <a
                    href={reportHref(q.id, q.correct.join(""), sel.join(""))}
                    className="underline underline-offset-2 hover:text-[var(--fg)]"
                  >
                    Something wrong with this question?
                  </a>{" "}
                  <span className="opacity-70">{q.id}</span>
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * A prefilled report for one question.
 *
 * Every wrong answer found in this bank so far arrived as an email a learner
 * wrote by hand, which means the ones who did not feel like writing an email
 * found nothing. Carrying the id and both answers into the draft makes a report
 * actionable on arrival instead of "one of the caching questions looks off".
 */
function reportHref(id: string, keyed: string, chosen: string): string {
  const body = [
    `Question: ${id}`,
    `Marked answer: ${keyed || "(none recorded)"}`,
    `I answered: ${chosen || "(left blank)"}`,
    "",
    "What looks wrong:",
    "",
  ].join("\n");
  return (
    `mailto:${SITE.email}` +
    `?subject=${encodeURIComponent(`Mock exam question ${id}`)}` +
    `&body=${encodeURIComponent(body)}`
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
          ? "border-[#7c5cff] bg-[#7c5cff]/8"
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
          ? "border-[#7c5cff] bg-[#7c5cff]/8"
          : "border-[var(--border)] hover:border-[var(--muted)]"
      }`}
    >
      {children}
    </button>
  );
}
