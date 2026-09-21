"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { COMMUNITY, NAV, SITE } from "@/lib/site";

const DISCLAIMER = `Not affiliated with, endorsed by, or sponsored by Anthropic. "Claude" and the certification names are trademarks of their respective owner. Practice questions are original, community-written study items aligned to the published exam objectives — they are not real exam questions. Always confirm current exam details with the vendor before registering.`;

export default function SiteFooter() {
  // The landing page now ends on the light ground too, so the footer is light
  // everywhere — only its top margin differs.
  const isHome = usePathname() === "/";

  // On the landing page the body canvas is dark (it backs the hero), so the
  // footer paints its own light ground. Elsewhere it stays transparent, which
  // lets the fixed aurora backdrop show through.
  const shell = `relative border-t border-[var(--border)] ${
    isHome ? "bg-[var(--bg)]" : "mt-16"
  }`;
  const heading = "";
  const muted = "text-[var(--muted)]";
  const hover = "hover:text-[var(--fg)]";
  const rule = "border-t border-[var(--border)]";

  return (
    <footer className={shell}>
      {isHome && (
        <div
          aria-hidden
          className="lite-hairline pointer-events-none absolute inset-x-0 top-0"
        />
      )}

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <div className={`font-semibold ${heading}`}>Claude Architects</div>
          <p className={`mt-2 text-sm ${muted}`}>{SITE.tagline}</p>
          <p className={`mt-4 text-xs ${muted}`}>Brought to you by</p>
          <a
            href="https://t.me/claudesg"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Claude Singapore Community"
            className="mt-2 inline-block rounded-xl bg-white px-3 py-2 shadow-[0_1px_2px_rgba(16,20,38,0.05),0_10px_26px_-18px_rgba(58,70,140,0.8)] transition-transform duration-300 hover:-translate-y-0.5"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Claude Singapore Community"
              width={1322}
              height={435}
              className="h-8 w-auto"
            />
          </a>
        </div>

        <div>
          <div className={`text-sm font-semibold ${heading}`}>Explore</div>
          <ul className="mt-2 space-y-1.5 text-sm">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={`${muted} ${hover}`}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className={`text-sm font-semibold ${heading}`}>Community</div>
          <ul className="mt-2 space-y-1.5 text-sm">
            {COMMUNITY.map((c) => (
              <li key={c.href}>
                <a
                  href={c.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${muted} ${hover}`}
                >
                  {c.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={rule}>
        <p className={`mx-auto max-w-6xl px-4 py-5 text-xs ${muted}`}>
          {DISCLAIMER}
        </p>
      </div>
    </footer>
  );
}
