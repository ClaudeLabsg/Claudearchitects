import type { ExamMeta } from "@/lib/types";

/**
 * A certification badge, or a neutral stand-in when we don't hold the real
 * artwork. Deliberately does NOT fall back to another exam's badge — the
 * Architect badge has "FOUNDATIONS" printed on it, so showing it for the
 * Professional exam would state something untrue.
 */
export default function ExamBadge({
  exam,
  size = 64,
  className = "",
}: {
  exam: ExamMeta;
  size?: number;
  className?: string;
}) {
  if (exam.badge) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={exam.badge}
        alt={`${exam.name} badge`}
        style={{
          width: size,
          height: size,
          filter: `drop-shadow(0 8px 22px ${exam.neon}55)`,
        }}
        className={`shrink-0 object-contain ${className}`}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={`${exam.name} — badge artwork not available`}
      title="Official badge artwork not yet available"
      style={{
        width: size,
        height: size,
        borderColor: `${exam.deep}55`,
        color: exam.deep,
        fontSize: Math.max(10, Math.round(size * 0.17)),
      }}
      className={`flex shrink-0 flex-col items-center justify-center rounded-full border-2 border-dashed bg-white/60 text-center font-mono font-bold leading-tight ${className}`}
    >
      {exam.code}
    </span>
  );
}
