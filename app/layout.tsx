import type { Metadata, Viewport } from "next";
import Link from "next/link";
import PWARegister from "@/components/PWARegister";
import { NAV, SITE, COMMUNITY } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Claude Architects — Get Claude certified · Claude SG",
    template: "%s · Claude Architects",
  },
  description:
    "Claude Architects is the community hub for the Claude certification program — the Architect, Developer and Associate exams: how to get certified, a deep resource library, and 1,700+ free practice questions. A Claude SG community project.",
  applicationName: "Claude Architects",
  appleWebApp: { capable: true, title: "Claude Architects", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
  keywords: [
    "Claude certification",
    "Claude Certified Architect",
    "Claude Certified Developer",
    "Claude Certified Associate",
    "CCA-F",
    "CCAR-F",
    "CCAR-P",
    "CCDV-F",
    "Claude exam",
    "Claude SG",
    "practice exam",
    "mock exam",
  ],
  openGraph: {
    title: "Claude Architects — Get Claude certified",
    description:
      "How to get Claude certified, a deep resource library, and 1,700+ free practice questions. A Claude SG community project.",
    url: SITE.url,
    siteName: "Claude Architects",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Claude Architects — Get Claude certified",
    description:
      "How to get Claude certified, a deep resource library, and 1,700+ free practice questions.",
  },
};

export const viewport: Viewport = {
  themeColor: "#c2683f",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <PWARegister />

        <header className="border-b border-[var(--border)] sticky top-0 z-20 backdrop-blur bg-[var(--bg)]/80">
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
                Claude Architects
              </span>
            </Link>

            <nav className="flex items-center gap-1 overflow-x-auto text-sm">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="whitespace-nowrap rounded-lg px-3 py-1.5 text-[var(--muted)] hover:text-[var(--fg)] hover:bg-[var(--card)] transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <main className="flex-1 w-full">{children}</main>

        <footer className="border-t border-[var(--border)] mt-16">
          <div className="mx-auto max-w-6xl px-4 py-10 grid gap-8 sm:grid-cols-3">
            <div>
              <div className="font-semibold">Claude Architects</div>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {SITE.tagline}
              </p>
              <p className="mt-3 text-xs text-[var(--muted)]">
                A project of the{" "}
                <a
                  href="https://t.me/claudesg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-[var(--fg)]"
                >
                  Claude SG community
                </a>
                .
              </p>
            </div>

            <div>
              <div className="text-sm font-semibold">Explore</div>
              <ul className="mt-2 space-y-1.5 text-sm">
                {NAV.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-[var(--muted)] hover:text-[var(--fg)]"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-sm font-semibold">Community</div>
              <ul className="mt-2 space-y-1.5 text-sm">
                {COMMUNITY.map((c) => (
                  <li key={c.href}>
                    <a
                      href={c.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--muted)] hover:text-[var(--fg)]"
                    >
                      {c.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-[var(--border)]">
            <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-[var(--muted)]">
              Not affiliated with, endorsed by, or sponsored by Anthropic.
              &ldquo;Claude&rdquo; and the certification names are trademarks of
              their respective owner. Practice questions are original,
              community-written study items aligned to the published exam
              objectives — they are not real exam questions. Always confirm
              current exam details with the vendor before registering.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
