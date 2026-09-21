"use client";

import { useEffect, useState } from "react";

/**
 * Cycles through words in place. All words are stacked in one grid cell so the
 * headline never reflows as they swap.
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
  const [i, setI] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setI((n) => (n + 1) % words.length), interval);
    return () => clearInterval(id);
  }, [words.length, interval]);

  return (
    <span className={`inline-grid align-bottom ${className}`}>
      {words.map((w, n) => (
        <span
          key={w}
          aria-hidden={n === i ? undefined : "true"}
          style={{ gridArea: "1 / 1" }}
          // The outgoing word clears out first (fast, no delay); the incoming
          // one only starts after it has gone, so the two never cross-fade on
          // top of each other.
          className={`justify-self-start whitespace-nowrap transition-all ease-out ${
            n === i
              ? "opacity-100 translate-y-0 blur-0 duration-500 delay-[240ms]"
              : "opacity-0 translate-y-3 blur-[4px] duration-200 delay-0"
          }`}
        >
          {w}
        </span>
      ))}
    </span>
  );
}
