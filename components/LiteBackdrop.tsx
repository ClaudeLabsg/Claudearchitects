"use client";

import { usePathname } from "next/navigation";
import ShaderCanvas from "@/components/arc/ShaderCanvas";

/**
 * Ambient backdrop for the light pages — the same WebGL field as the dark
 * hero, in its light variant: drifting violet / cyan / magenta tints over a
 * pale ground, with the drafted grid receding below. Fixed, so it stays put
 * while content scrolls.
 *
 * The CSS aurora underneath is the fallback when WebGL is unavailable.
 *
 * The landing page renders its own instances, so this sits out on `/`.
 */
export default function LiteBackdrop() {
  const isHome = usePathname() === "/";
  if (isHome) return null;

  return (
    <div className="lite-aurora" aria-hidden="true">
      <div className="lite-bloom" />
      <ShaderCanvas variant="light" className="absolute inset-0" />
      <div className="lite-mesh" />
    </div>
  );
}
