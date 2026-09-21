"use client";

import { useEffect, useState } from "react";

/**
 * Cycles through words in place.
 *
 * The words share one grid cell and are separated vertically rather than by
 * opacity alone: the outgoing word slides up and out while the incoming one
 * rises into its place, and the cell clips both. That avoids the two failure
 * modes of a plain cross-fade — ghosting (both words legible at once) and a
 * blank gap (neither word visible) — because at every instant exactly one word
 * occupies the slot. Words waiting their turn are parked below with no
 * transition, so they never animate on the way to the queue.
 */
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

  const move =
    "transition-all duration-[520ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]";

  return (
    <span
      // pb/-mb give descenders room so `overflow-hidden` can't clip them
      className={`inline-grid overflow-hidden align-bottom pb-[0.16em] -mb-[0.16em] ${className}`}
    >
      {words.map((w, n) => (
        <span
          key={w}
          aria-hidden={n === cur ? undefined : "true"}
          style={{ gridArea: "1 / 1" }}
          className={`justify-self-start whitespace-nowrap ${
            n === cur
              ? `translate-y-0 opacity-100 ${move}`
              : n === prev
                ? `-translate-y-[115%] opacity-0 ${move}`
                : "translate-y-[115%] opacity-0 transition-none"
          }`}
        >
          {w}
        </span>
      ))}
    </span>
  );
}
