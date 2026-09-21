"use client";

import { useEffect, useState, type CSSProperties } from "react";

/**
 * Cycles through words in place.
 *
 * The words share one grid cell and are separated vertically rather than by
 * opacity alone: the outgoing word slides up and out while the incoming one
 * rises into its place, and the cell clips both. That avoids the two failure
 * modes of a plain cross-fade — ghosting (both words legible at once) and a
 * blank gap (neither word visible) — because at every instant exactly one word
 * occupies the slot.
 *
 * The movement is written as inline `transform` rather than Tailwind's
 * `translate-y-*` utilities on purpose. Those compile to the standalone
 * `translate` property fed by @property-registered custom properties; where
 * those don't resolve, the whole declaration is dropped and the words collapse
 * back into a cross-fade on top of each other. An explicit transform has no
 * such dependency.
 */
const EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)";

const base: CSSProperties = {
  gridArea: "1 / 1",
  justifySelf: "start",
  whiteSpace: "nowrap",
  willChange: "transform, opacity",
};

export default function RotatingWord({
  words,
  interval = 2600,
  className = "",
}: {
  words: string[];
  interval?: number;
  className?: string;
}) {
  const [{ cur, prev }, setState] = useState({ cur: 0, prev: -1 });

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      setState((s) => ({ cur: (s.cur + 1) % words.length, prev: s.cur }));
    }, interval);
    return () => clearInterval(id);
  }, [words.length, interval]);

  function styleFor(n: number): CSSProperties {
    if (n === cur) {
      return {
        ...base,
        transform: "translateY(0)",
        opacity: 1,
        transition: `transform 520ms ${EASE}, opacity 300ms ease-out`,
      };
    }
    if (n === prev) {
      return {
        ...base,
        transform: "translateY(-118%)",
        opacity: 0,
        transition: `transform 520ms ${EASE}, opacity 420ms ease-in`,
      };
    }
    // Waiting its turn: parked below with no transition, so it never animates
    // on the way back to the queue.
    return {
      ...base,
      transform: "translateY(118%)",
      opacity: 0,
      transition: "none",
    };
  }

  return (
    <span
      // pb/-mb give descenders room so the clip can't cut them off.
      // NOTE: `className` (the gradient) goes on each word, never here. With
      // `background-clip: text` on this wrapper, the gradient would be masked
      // by every descendant glyph at its *untransformed* position — the words
      // would all paint on top of each other no matter what transform or
      // opacity the children carry.
      className="inline-grid overflow-hidden align-bottom pb-[0.16em] -mb-[0.16em]"
    >
      {words.map((w, n) => (
        <span
          key={w}
          aria-hidden={n === cur ? undefined : "true"}
          style={styleFor(n)}
          className={className}
        >
          {w}
        </span>
      ))}
    </span>
  );
}
