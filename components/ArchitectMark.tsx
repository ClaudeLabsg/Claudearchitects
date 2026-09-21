"use client";

import { useId } from "react";

/**
 * The Claude Architects mark: an apex-and-crossbar glyph that reads as both an
 * "A" and a drafted arch, sitting in a blueprint frame. Drawn inline so it
 * inherits the page's accent colours and needs no asset request.
 */
export default function ArchitectMark({
  className = "",
  from = "#7c5cff",
  to = "#22d3ee",
}: {
  className?: string;
  from?: string;
  to?: string;
}) {
  // useId keeps the gradient unique when the mark appears more than once.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const grad = `am-${uid}`;

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={`mark ${className}`}
    >
      <defs>
        <linearGradient id={grad} x1="2" y1="30" x2="30" y2="2">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
      </defs>

      {/* blueprint frame */}
      <rect
        x="1.1"
        y="1.1"
        width="29.8"
        height="29.8"
        rx="9.5"
        stroke={`url(#${grad})`}
        strokeOpacity="0.38"
        strokeWidth="1.4"
      />
      {/* corner ticks — the drafting detail */}
      <path
        d="M8 4.2h-2A1.8 1.8 0 0 0 4.2 6v2M24 27.8h2a1.8 1.8 0 0 0 1.8-1.8v-2"
        stroke={`url(#${grad})`}
        strokeOpacity="0.55"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      {/* the apex */}
      <path
        d="M7.8 24.4 16 8.2l8.2 16.2"
        stroke={`url(#${grad})`}
        strokeWidth="2.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* the crossbar */}
      <path
        d="M11.7 18.1h8.6"
        stroke={`url(#${grad})`}
        strokeWidth="2.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
