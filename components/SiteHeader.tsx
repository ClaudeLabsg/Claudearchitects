"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV } from "@/lib/site";

const CREDIT = "Brought to you by Claude SG";

/**
 * The landing page runs the dark "Blueprint" identity; every other page uses
 * its light counterpart. The header switches between the two.
 */
export default function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!isHome) return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  const dark = isHome;

  const brand = (
    <Link
      href="/"
      className={`group flex shrink-0 items-center gap-2.5 ${
        dark ? "wm-dark" : "wm-light"
      }`}
      aria-label="claudearchitects.org — home"
    >
      <span className="flex flex-col leading-none">
        <span
          className={`text-[15px] font-semibold tracking-tight ${
            dark ? "text-[var(--arc-fg)]" : "text-[var(--fg)]"
          }`}
        >
          <span className="opacity-60">claude</span>
          <span className="wm-grad font-bold">architects</span>
          <span className={dark ? "text-[#22d3ee]" : "text-[#5b3fe0]"}>
            .org
          </span>
        </span>
        <span
          className={`mt-1 hidden text-[8.5px] font-medium uppercase tracking-[0.15em] md:block ${
            dark ? "text-[var(--arc-muted)]" : "text-[var(--muted)]"
          }`}
        >
          {CREDIT}
        </span>
      </span>
    </Link>
  );

  if (!isHome) {
    return (
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-white/65 backdrop-blur-xl backdrop-saturate-150 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_10px_30px_-26px_rgba(58,70,140,0.7)]">
        <div className="mx-auto max-w-6xl px-4 py-2.5 flex flex-col gap-2 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
          {brand}

          <nav className="flex items-center gap-1 overflow-x-auto text-sm">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative whitespace-nowrap rounded-lg px-3 py-1.5 transition-colors hover:text-[var(--fg)] hover:bg-white/70 ${
                    active ? "text-[var(--fg)] font-medium" : "text-[var(--muted)]"
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute inset-x-3 -bottom-px h-px bg-gradient-to-r from-transparent via-[#7c5cff] to-transparent" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
    );
  }

  return (
    <header
      className={`arc sticky top-0 z-30 transition-all duration-500 ${
        scrolled
          ? "border-b border-[var(--arc-line)] bg-[#05060b]/80 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-2.5 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
        {brand}

        <div className="flex items-center gap-2">
          <nav className="flex items-center gap-0.5 overflow-x-auto text-sm">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative whitespace-nowrap rounded-lg px-3 py-1.5 transition-colors ${
                    active
                      ? "text-[var(--arc-fg)]"
                      : "text-[var(--arc-muted)] hover:text-[var(--arc-fg)]"
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute inset-x-3 -bottom-0.5 h-px bg-gradient-to-r from-transparent via-[var(--arc-b)] to-transparent" />
                  )}
                </Link>
              );
            })}
          </nav>

          <Link
            href="/mockexams"
            className="arc-sheen ml-1 hidden shrink-0 rounded-xl border border-[var(--arc-line-2)] bg-white/[0.06] px-4 py-1.5 text-sm font-semibold text-[var(--arc-fg)] transition-colors hover:bg-white/[0.12] sm:inline-block"
          >
            <span className="arc-sheen-bar" />
            Practice free
          </Link>
        </div>
      </div>
    </header>
  );
}
