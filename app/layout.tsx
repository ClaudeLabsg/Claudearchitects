import type { Metadata, Viewport } from "next";
import PWARegister from "@/components/PWARegister";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { SITE } from "@/lib/site";
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

        <SiteHeader />

        <main className="flex-1 w-full">{children}</main>

        <SiteFooter />
      </body>
    </html>
  );
}
