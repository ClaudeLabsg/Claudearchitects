import type { MetadataRoute } from "next";
import { EXAMS } from "@/lib/exams";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://claudecode.sg";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes = [
    "",
    "/certification",
    "/mockexams",
    "/resources",
    "/about",
  ].map((p) => ({
    url: `${SITE_URL}${p}`,
    lastModified: now,
  }));
  const examRoutes = EXAMS.map((e) => ({
    url: `${SITE_URL}/mockexams/${e.id}`,
    lastModified: now,
  }));
  return [...staticRoutes, ...examRoutes];
}
