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
export default function Image() {
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
        <div style={{ display: "flex", alignItems: "center", fontSize: 30 }}>
          <span style={{ color: "#8d97b5" }}>claude</span>
          <span style={{ color: "#ffffff", fontWeight: 700 }}>architects</span>
          <span style={{ color: "#22d3ee" }}>.org</span>
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
