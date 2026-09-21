"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV } from "@/lib/site";

/**
 * The landing page runs the dark "Blueprint" identity; every other page keeps
 * the Claude SG cream palette. The header switches between the two.
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

  if (!isHome) {
    return (
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-white/65 backdrop-blur-xl backdrop-saturate-150 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_10px_30px_-26px_rgba(58,70,140,0.7)]">
        <div className="mx-auto max-w-6xl px-4 py-2.5 flex flex-col gap-2 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0"
            aria-label="Claude Architects — home"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Claude SG community"
              className="logo-mark h-9 w-auto"
            />
            <span className="hidden sm:inline text-sm font-semibold border-l border-[var(--border)] pl-2 text-[var(--fg)]">
              claudearchitects<span className="text-[#5b3fe0]">.org</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1 overflow-x-auto text-sm">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
                className={`relative whitespace-nowrap rounded-lg px-3 py-1.5 transition-colors hover:text-[var(--fg)] hover:bg-white/70 ${
                  pathname === item.href
                    ? "text-[var(--fg)] font-medium"
                    : "text-[var(--muted)]"
                }`}
              >
                {item.label}
                {pathname === item.href && (
                  <span className="absolute inset-x-3 -bottom-px h-px bg-gradient-to-r from-transparent via-[#7c5cff] to-transparent" />
                )}
              </Link>
            ))}
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
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2.5"
          aria-label="Claude Architects — home"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt=""
            className="h-8 w-auto rounded-md bg-white px-1.5 py-0.5 transition-transform duration-300 group-hover:scale-105"
          />
          <span className="flex flex-col leading-none">
            <span className="text-[12px] font-semibold tracking-[0.12em] text-[var(--arc-fg)] sm:text-[13px]">
              CLAUDEARCHITECTS
              <span className="text-[var(--arc-b)]">.ORG</span>
            </span>
            <span className="mt-0.5 text-[9px] tracking-[0.22em] text-[var(--arc-muted)]">
              CLAUDE CERTIFIED
            </span>
          </span>
        </Link>

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
