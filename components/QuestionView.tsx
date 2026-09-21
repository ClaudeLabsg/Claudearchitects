"use client";

import type { Question } from "@/lib/types";

interface Props {
  question: Question;
  index: number;
  total: number;
  selected: string[];
  onToggle: (optionId: string) => void;
  revealed: boolean; // show correct/incorrect + explanation
}

export default function QuestionView({
  question,
  index,
  total,
  selected,
  onToggle,
  revealed,
}: Props) {
  const correct = new Set(question.correct);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between text-xs text-[var(--muted)] mb-3">
        <span>
          Question {index + 1} of {total}
        </span>
        <span className="flex items-center gap-2">
          <span className="rounded-md border border-[var(--border)] px-2 py-0.5">
            {question.domain}
          </span>
          {question.type === "multi" && (
            <span className="rounded-md bg-[#7c5cff]/12 text-[#5b3fe0] px-2 py-0.5 font-medium">
              Select all that apply
            </span>
          )}
        </span>
      </div>

      <h2 className="text-lg font-medium leading-relaxed whitespace-pre-wrap">
        {question.question}
      </h2>

      <div
        className="mt-5 space-y-2.5"
        role={question.type === "multi" ? "group" : "radiogroup"}
        aria-label="Answer options"
      >
        {question.options.map((opt) => {
          const isSelected = selected.includes(opt.id);
          const isCorrect = correct.has(opt.id);

          let cls =
            "border-[var(--border)] bg-[var(--card)] hover:border-[var(--muted)]";
          if (revealed) {
            if (isCorrect)
              cls = "border-[#16a34a] bg-[#16a34a]/10";
            else if (isSelected && !isCorrect)
              cls = "border-[#e11d48] bg-[#e11d48]/10";
            else cls = "border-[var(--border)] opacity-70";
          } else if (isSelected) {
            cls = "border-[#7c5cff] bg-[#7c5cff]/8";
          }

          return (
            <button
              key={opt.id}
              type="button"
              role={question.type === "multi" ? "checkbox" : "radio"}
              aria-checked={isSelected}
              disabled={revealed}
              onClick={() => onToggle(opt.id)}
              className={`w-full text-left rounded-xl border px-4 py-3 flex gap-3 items-start transition-colors ${cls} ${
                revealed ? "cursor-default" : "cursor-pointer"
              }`}
            >
              <span
                className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-semibold ${
                  isSelected
                    ? "border-transparent bg-[#7c5cff] text-white"
                    : "border-[var(--border)] text-[var(--muted)]"
                } ${
                  revealed && isCorrect
                    ? "!bg-[#16a34a] !text-white"
                    : revealed && isSelected && !isCorrect
                      ? "!bg-[#e11d48] !text-white"
                      : ""
                }`}
              >
                {opt.id}
              </span>
              <span className="text-sm leading-relaxed">{opt.text}</span>
            </button>
          );
        })}
      </div>

      {revealed && (
        <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 animate-fade-in">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-1.5">
            Explanation · correct answer:{" "}
            <span className="text-[#16a34a]">
              {question.correct.join(", ")}
            </span>
          </p>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-[var(--fg)]">
            {question.explanation}
          </p>
        </div>
      )}
    </div>
  );
}
