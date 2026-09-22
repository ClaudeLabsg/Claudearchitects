import type { Metadata, Viewport } from "next";
import LiteBackdrop from "@/components/LiteBackdrop";
import PWARegister from "@/components/PWARegister";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { EXAMS, examStats } from "@/lib/exams";
import { SITE } from "@/lib/site";
import "./globals.css";

const TOTAL_QUESTIONS = EXAMS.reduce((n, e) => n + examStats(e.id).total, 0).toLocaleString();

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Claude Architects — Get Claude certified · Claude SG",
    template: "%s · Claude Architects",
  },
  description:
    `Claude Architects is the community hub for the Claude certification program — the Architect, Developer and Associate exams: how to get certified, a deep resource library, and ${TOTAL_QUESTIONS} free practice questions. A Claude SG community project.`,
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
      `How to get Claude certified, a deep resource library, and ${TOTAL_QUESTIONS} free practice questions. A Claude SG community project.`,
    url: SITE.url,
    siteName: "Claude Architects",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Claude Architects — Get Claude certified",
    description:
      `How to get Claude certified, a deep resource library, and ${TOTAL_QUESTIONS} free practice questions.`,
  },
};

export const viewport: Viewport = {
  themeColor: "#05060b",
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
        <LiteBackdrop />

        <SiteHeader />

        <main className="flex-1 w-full">{children}</main>

        <SiteFooter />
      </body>
    </html>
  );
}
