"use client";

import { usePathname } from "next/navigation";

/**
 * Ambient backdrop for the light pages — the CSS counterpart of the landing
 * page's WebGL hero: slow drifting aurora blooms in violet / cyan / magenta
 * behind a masked blueprint grid. Fixed, so it stays put while content scrolls.
 *
 * The landing page renders its own shader, so this sits out on `/`.
 */
export default function LiteBackdrop() {
  const isHome = usePathname() === "/";
  if (isHome) return null;

  return (
    <div className="lite-aurora" aria-hidden="true">
      <div className="lite-bloom" />
      <div className="lite-mesh" />
    </div>
  );
}
