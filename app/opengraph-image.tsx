import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { EXAMS, examStats } from "@/lib/exams";

export const alt =
  "Claude Architects — get Claude certified, with free practice questions";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const total = EXAMS.reduce((n, e) => n + examStats(e.id).total, 0);

/**
 * The social card. Without one, every share on Telegram / LinkedIn / WhatsApp
 * renders as a bare text link. Built with next/og so the question count is
 * always the real number rather than a figure that drifts out of date.
 */
export default async function Image() {
  // Satori (which next/og renders through) cannot read WebP, so the card uses
  // a PNG export of the same wordmark rather than /wordmark.webp.
  //
  // Read from disk rather than fetch(new URL(..., import.meta.url)): the
  // bundler rewrites that to a relative /_next/static path, which has no
  // origin for fetch to resolve and fails the prerender. This route is
  // statically prerendered, so the read happens at build time.
  // Inlined as a data URI: Satori wants an ArrayBuffer or a URL, and readFile
  // hands back a Node Buffer, which it rejects.
  const wordmark = `data:image/png;base64,${(
    await readFile(join(process.cwd(), "app", "wordmark-og.png"))
  ).toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          backgroundColor: "#05060b",
          backgroundImage:
            "radial-gradient(900px circle at 78% 18%, rgba(124,92,255,0.42), transparent 60%), radial-gradient(760px circle at 12% 88%, rgba(34,211,238,0.30), transparent 62%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={wordmark}
            alt="claudearchitects.org"
            width={364}
            height={44}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 82,
              fontWeight: 700,
              color: "#e8ecf8",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
            }}
          >
            Become a Claude
          </div>
          <div style={{ display: "flex", fontSize: 82, fontWeight: 700, lineHeight: 1.05 }}>
            <span style={{ color: "#e8ecf8" }}>Certified&nbsp;</span>
            <span style={{ color: "#a99bff" }}>Architect</span>
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 26,
              fontSize: 30,
              color: "#8d97b5",
            }}
          >
            {total.toLocaleString()} free practice questions · 4 certifications
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              display: "flex",
              height: 8,
              width: 120,
              borderRadius: 99,
              backgroundImage: "linear-gradient(90deg, #7c5cff, #22d3ee)",
            }}
          />
          <div style={{ display: "flex", fontSize: 24, color: "#8d97b5" }}>
            Brought to you by Claude SG
          </div>
        </div>
      </div>
    ),
    size,
  );
}
