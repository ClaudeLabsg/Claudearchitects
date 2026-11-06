"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV } from "@/lib/site";

/** The exams are the reason people come — the header keeps a direct route to
 *  them on every page and at every width, not just on the landing page. */
const EXAMS_HREF = "/mockexams";

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
  const onExams = pathname.startsWith(EXAMS_HREF);

  // The wordmark carries the name, so the link needs an accessible label of
  // its own only through the image's alt text. Width/height are the intrinsic
  // pixels of the asset: without them the header reflows as the image loads.
  const brand = (
    <Link
      href="/"
      className="group flex shrink-0 items-center"
      aria-label="claudearchitects.org — home"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/wordmark.webp"
        alt="claudearchitects.org"
        width={600}
        height={73}
        className="h-6 w-auto transition-opacity duration-200 group-hover:opacity-80 sm:h-7"
      />
    </Link>
  );

  // One call to action, on every page at every width.
  //
  // The exams are what the site is for, so they get the loud slot outright
  // rather than sharing it. Two competing buttons meant neither won.
  const examsCta = (
    <Link
      href={EXAMS_HREF}
      aria-current={onExams ? "page" : undefined}
      className={
        dark
          ? "arc-sheen relative inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[var(--arc-a)] to-[var(--arc-b)] px-3.5 py-1.5 text-sm font-semibold text-[var(--arc-on-accent)] shadow-[0_10px_30px_-12px_var(--arc-a)] transition-transform duration-200 hover:scale-[1.03] sm:px-4"
          : "relative inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#5b3fe0] to-[#7c5cff] px-3.5 py-1.5 text-sm font-semibold text-white shadow-[0_10px_30px_-14px_rgba(91,63,224,0.9)] transition-transform duration-200 hover:scale-[1.03] sm:px-4"
      }
    >
      {dark && <span className="arc-sheen-bar" />}
      <span className="relative flex h-1.5 w-1.5">
        <span className="arc-ring absolute inset-0 rounded-full bg-current opacity-80" />
        <span className="relative h-1.5 w-1.5 rounded-full bg-current" />
      </span>
      Mock exams
    </Link>
  );

  // Nav links, with the exams entry weighted above the rest.
  const navLinks = NAV.map((item) => {
    const active = pathname === item.href;
    const isExams = item.href === EXAMS_HREF;

    // The CTA button points at the same place and is far louder, so the text
    // link would only render the words "Mock Exams" twice, side by side.
    const base = isExams ? "hidden " : "";

    if (dark) {
      return (
        <Link
          key={item.href}
          href={item.href}
          aria-current={active ? "page" : undefined}
          className={`${base}relative whitespace-nowrap rounded-lg px-3 py-1.5 transition-colors ${
            active
              ? "text-[var(--arc-fg)]"
              : "text-[var(--arc-muted)] hover:text-[var(--arc-fg)]"
          }`}
        >
          {item.label}
          {active && (
            <span className="absolute inset-x-3 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--arc-b)] to-transparent" />
          )}
        </Link>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={`${base}relative whitespace-nowrap rounded-lg px-3 py-1.5 transition-colors hover:bg-white/70 hover:text-[var(--fg)] ${
          active ? "font-medium text-[var(--fg)]" : "text-[var(--muted)]"
        }`}
      >
        {item.label}
        {active && (
          <span className="absolute inset-x-3 bottom-0 h-px bg-gradient-to-r from-transparent via-[#7c5cff] to-transparent" />
        )}
      </Link>
    );
  });

  if (!isHome) {
    return (
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-white/65 backdrop-blur-xl backdrop-saturate-150 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_10px_30px_-26px_rgba(58,70,140,0.7)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 sm:h-16 sm:flex-nowrap">
          {brand}

          <div className="order-2 ml-auto flex shrink-0 items-center gap-2 sm:order-3 sm:ml-0">
            {examsCta}
          </div>

          <nav className="order-3 -mx-1 flex w-full items-center gap-1 overflow-x-auto px-1 text-sm sm:order-2 sm:ml-auto sm:w-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {navLinks}
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
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 sm:h-16 sm:flex-nowrap">
          {brand}

          <div className="order-2 ml-auto flex shrink-0 items-center gap-2 sm:order-3 sm:ml-0">
            {examsCta}
          </div>

          <nav className="order-3 -mx-1 flex w-full items-center gap-0.5 overflow-x-auto px-1 text-sm sm:order-2 sm:ml-auto sm:w-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {navLinks}
          </nav>
        </div>
    </header>
  );
}
