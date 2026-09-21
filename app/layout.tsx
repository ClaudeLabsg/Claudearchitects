import type { Metadata, Viewport } from "next";
import Link from "next/link";
import PWARegister from "@/components/PWARegister";
import "./globals.css";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://claudecode.sg";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Claude SG · Certification Practice",
    template: "%s · Claude SG",
  },
  description:
    "Free practice exams and full mock tests for the Claude certifications — Associate, Developer and Architect — built by the Claude SG community. Practice mode with explanations, timed quizzes and score-report-style mock exams.",
  applicationName: "Claude SG Certification Practice",
  appleWebApp: { capable: true, title: "Claude SG Prep", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
  keywords: [
    "Claude certification",
    "Claude Certified Associate",
    "Claude Certified Developer",
    "Claude Certified Architect",
    "CCAO-F",
    "CCDV-F",
    "CCAR-F",
    "CCAR-P",
    "practice exam",
    "mock exam",
    "Claude SG",
  ],
  openGraph: {
    title: "Claude SG · Certification Practice",
    description:
      "Free practice + mock exams for the Claude certifications, by the Claude SG community.",
    url: SITE_URL,
    siteName: "Claude SG Certification Practice",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Claude SG · Certification Practice",
    description:
      "Free practice + mock exams for the Claude certifications, by the Claude SG community.",
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
          <div className="mx-auto max-w-5xl px-4 h-16 flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center"
              aria-label="Claude SG community — home"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="Claude SG community"
                className="logo-mark h-10 sm:h-12 w-auto"
              />
            </Link>
            <nav className="flex items-center gap-4 text-sm text-[var(--muted)]">
              <Link href="/" className="hover:text-[var(--fg)] transition-colors">
                Exams
              </Link>
              <Link
                href="/about"
                className="hover:text-[var(--fg)] transition-colors"
              >
                About
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1 w-full">{children}</main>

        <footer className="border-t border-[var(--border)] mt-16">
          <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-[var(--muted)] space-y-2">
            <p>
              A free study aid for Claude certifications, built by the{" "}
              <strong className="text-[var(--fg)] font-medium">
                Claude SG community
              </strong>
              .{" "}
              <a
                href="https://t.me/claudesg"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-[var(--fg)]"
              >
                Join the community →
              </a>
            </p>
            <p className="text-xs">
              Not affiliated with, endorsed by, or sponsored by Anthropic.
              &ldquo;Claude&rdquo; is a trademark of Anthropic. Practice
              questions are original, community-written items aligned to the
              published exam objectives — they are not real exam questions.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
