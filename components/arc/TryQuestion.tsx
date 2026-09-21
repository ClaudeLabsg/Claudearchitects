"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

export type DemoQuestion = {
  id: string;
  domain: string;
  question: string;
  options: { id: string; text: string }[];
  correct: string[];
  explanation: string;
};

export type Deck = {
  id: string;
  code: string;
  name: string;
  color: string; // bright hex — glows and dots
  deep: string;  // darker hex — text and borders on a light ground
  questions: DemoQuestion[];
};

export default function TryQuestion({ decks }: { decks: Deck[] }) {
  const [deckIdx, setDeckIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const deck = decks[deckIdx];
  const q = deck.questions[qIdx];
  const revealed = picked !== null;
  const gotIt = revealed && q.correct.includes(picked);

  const next = useCallback(() => {
    setPicked(null);
    setQIdx((n) => (n + 1) % deck.questions.length);
  }, [deck.questions.length]);

  const chooseDeck = useCallback((i: number) => {
    setDeckIdx(i);
    setQIdx(0);
    setPicked(null);
  }, []);

  // A–D / 1–4 pick the matching option, Enter moves on. Only while the card is
  // actually on screen, so we never swallow keys meant for the rest of the page.
  const inView = useRef(false);
  useEffect(() => {
    const el = cardRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([e]) => {
        inView.current = e.isIntersecting;
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!inView.current || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "Enter" && revealed) {
        next();
        return;
      }
      if (revealed) return;
      const k = e.key.toUpperCase();
      const byLetter = q.options.find((o) => o.id === k);
      const byNumber = /^[1-9]$/.test(k)
        ? q.options[Number(k) - 1]
        : undefined;
      const hit = byLetter ?? byNumber;
      if (hit) {
        e.preventDefault();
        setPicked(hit.id);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [q, revealed, next]);

  return (
    <div
      ref={cardRef}
      tabIndex={-1}
      className="outline-none"
      style={{ ["--accent" as string]: deck.color }}
    >
      {/* Exam selector */}
      <div className="arc-marquee -mx-4 mb-5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-2">
          {decks.map((d, i) => {
            const active = i === deckIdx;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => chooseDeck(i)}
                aria-pressed={active}
                style={
                  active
                    ? {
                        borderColor: d.deep,
                        boxShadow: `0 0 0 1px ${d.deep}40, 0 10px 30px -12px ${d.color}`,
                        color: d.deep,
                      }
                    : undefined
                }
                className={`relative shrink-0 rounded-full border px-4 py-2 text-xs font-semibold tracking-wide transition-all duration-300 ${
                  active
                    ? "bg-[var(--arc-surface-2)]"
                    : "border-[var(--arc-line)] text-[var(--arc-muted)] hover:border-[var(--arc-line-2)] hover:text-[var(--arc-fg)]"
                }`}
              >
                <span
                  className="mr-2 inline-block h-1.5 w-1.5 rounded-full align-middle transition-all"
                  style={{
                    background: active ? d.color : "currentColor",
                    boxShadow: active ? `0 0 10px ${d.color}` : undefined,
                  }}
                />
                {d.code}
              </button>
            );
          })}
        </div>
      </div>

      {/* Question card */}
      <div
        className="relative overflow-hidden rounded-3xl border border-[var(--arc-line)] bg-gradient-to-b from-[var(--arc-surface-2)] to-[var(--arc-surface)] p-5 backdrop-blur-xl sm:p-7"
        style={{ boxShadow: `0 40px 120px -60px ${deck.color}` }}
      >
        {/* top accent line */}
        <div
          className="absolute inset-x-0 top-0 h-px opacity-70 transition-all duration-500"
          style={{
            background: `linear-gradient(90deg, transparent, ${deck.color}, transparent)`,
          }}
        />

        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span
            className="rounded-md px-2 py-1 font-semibold tracking-wide"
            style={{ background: `${deck.deep}14`, color: deck.deep }}
          >
            {deck.code}
          </span>
          <span className="rounded-md border border-[var(--arc-line)] px-2 py-1 text-[var(--arc-muted)]">
            {q.domain}
          </span>
          <span className="ml-auto font-mono text-[var(--arc-muted)]">
            {String(qIdx + 1).padStart(2, "0")} / {String(deck.questions.length).padStart(2, "0")}
          </span>
        </div>

        <h3 className="mt-4 text-base leading-relaxed text-[var(--arc-fg)] sm:text-lg">
          {q.question}
        </h3>

        <div className="mt-5 space-y-2.5" role="group" aria-label="Answer options">
          {q.options.map((o, i) => {
            const isCorrect = q.correct.includes(o.id);
            const isPicked = picked === o.id;

            let tone =
              "border-[var(--arc-line)] bg-[var(--arc-surface)] hover:bg-[var(--arc-surface-2)] hover:border-[var(--arc-line-2)]";
            let chip = "border-[var(--arc-line)] text-[var(--arc-muted)]";
            if (revealed && isCorrect) {
              tone = "border-[var(--arc-c)] bg-[var(--arc-c)]/[0.09]";
              chip = "border-transparent bg-[var(--arc-c)] text-[var(--arc-on-accent)]";
            } else if (revealed && isPicked) {
              tone = "border-[var(--arc-d)] bg-[var(--arc-d)]/[0.09]";
              chip = "border-transparent bg-[var(--arc-d)] text-white";
            } else if (revealed) {
              tone = "border-[var(--arc-line)] opacity-45";
            }

            return (
              <button
                key={o.id}
                type="button"
                disabled={revealed}
                onClick={() => setPicked(o.id)}
                style={{
                  transitionDelay: revealed ? "0ms" : `${i * 30}ms`,
                }}
                className={`group flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-300 ${tone} ${
                  revealed ? "cursor-default" : "cursor-pointer active:scale-[0.99]"
                }`}
              >
                <span
                  className={`mt-px inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border font-mono text-[11px] font-bold transition-colors ${chip}`}
                >
                  {o.id}
                </span>
                <span className="text-sm leading-relaxed text-[var(--arc-fg)]/90">
                  {o.text}
                </span>
              </button>
            );
          })}
        </div>

        {/* Result */}
        <div
          className={`grid transition-all duration-500 ease-out ${
            revealed ? "mt-5 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="rounded-2xl border border-[var(--arc-line)] bg-[var(--arc-surface-2)] p-4">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span
                  className={
                    gotIt ? "text-[var(--arc-c)]" : "text-[var(--arc-d)]"
                  }
                >
                  {gotIt ? "✓ Correct" : "✕ Not quite"}
                </span>
                <span className="text-[var(--arc-muted)]">
                  — answer {q.correct.join(", ")}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[var(--arc-muted)]">
                {q.explanation}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[var(--arc-line)] pt-4">
          <button
            type="button"
            onClick={next}
            className="arc-sheen rounded-xl border border-[var(--arc-line-2)] bg-[var(--arc-surface)] px-4 py-2 text-sm font-semibold text-[var(--arc-fg)] transition-colors hover:bg-[var(--arc-surface-2)]"
          >
            <span className="arc-sheen-bar" />
            {revealed ? "Next question →" : "Skip →"}
          </button>
          <Link
            href={`/mockexams/${deck.id}`}
            className="rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
            style={{ color: deck.deep }}
          >
            Full {deck.code} bank →
          </Link>
          <span className="ml-auto hidden text-[11px] text-[var(--arc-muted)] sm:block">
            Tip: press{" "}
            <kbd className="rounded border border-[var(--arc-line)] px-1.5 py-0.5 font-mono">
              A
            </kbd>
            –
            <kbd className="rounded border border-[var(--arc-line)] px-1.5 py-0.5 font-mono">
              D
            </kbd>{" "}
            to answer
          </span>
        </div>
      </div>
    </div>
  );
}
