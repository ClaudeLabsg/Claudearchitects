"use client";

import { useCallback, useRef } from "react";

/**
 * A card that tracks the pointer: a coloured glow follows the cursor behind the
 * border and a soft sheen follows it across the surface. Optionally tilts.
 */
export default function SpotlightCard({
  children,
  spot = "#7c5cff",
  tilt = false,
  className = "",
}: {
  children: React.ReactNode;
  spot?: string;
  tilt?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      el.style.setProperty("--mx", `${x}px`);
      el.style.setProperty("--my", `${y}px`);
      if (tilt) {
        const rx = ((y / r.height) - 0.5) * -5;
        const ry = ((x / r.width) - 0.5) * 5;
        el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      }
    },
    [tilt],
  );

  const onLeave = useCallback(() => {
    const el = ref.current;
    if (el && tilt) el.style.transform = "";
  }, [tilt]);

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ ["--spot" as string]: spot }}
      className={`arc-spot transition-transform duration-300 ease-out ${className}`}
    >
      {children}
    </div>
  );
}
