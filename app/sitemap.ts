import { execFileSync } from "node:child_process";
import type { MetadataRoute } from "next";
import { EXAMS } from "@/lib/exams";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://claudearchitects.org";

/**
 * When the content behind a route last actually changed.
 *
 * Build time is the easy answer and the wrong one: every route would claim to
 * have changed on every deploy, so `lastmod` stops carrying information and
 * crawlers learn to ignore it. Asking git for the last commit that touched the
 * files behind each route gives a date that means something.
 *
 * Falls back to build time when git is unavailable, or the checkout too
 * shallow to answer — no worse than the previous behaviour.
 */
const BUILD_TIME = new Date();

function lastModified(paths: string[]): Date {
  try {
    const out = execFileSync("git", ["log", "-1", "--format=%cI", "--", ...paths], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    const d = out ? new Date(out) : null;
    return d && !Number.isNaN(d.getTime()) ? d : BUILD_TIME;
  } catch {
    return BUILD_TIME;
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    { path: "", files: ["app/page.tsx"] },
    { path: "/certification", files: ["app/certification/page.tsx", "lib/exams.ts"] },
    { path: "/mockexams", files: ["app/mockexams/page.tsx"] },
    { path: "/resources", files: ["app/resources/page.tsx", "data/objectives.json"] },
    { path: "/about", files: ["app/about/page.tsx"] },
  ].map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: lastModified(r.files),
  }));

  // An exam page changes when its question bank does, which is the edit a
  // crawler actually cares about.
  const examRoutes = EXAMS.map((e) => ({
    url: `${SITE_URL}/mockexams/${e.id}`,
    lastModified: lastModified([`content/${e.id}.json`, "app/mockexams/[exam]/page.tsx"]),
  }));

  return [...staticRoutes, ...examRoutes];
}
