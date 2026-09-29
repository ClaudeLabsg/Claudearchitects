import type { Metadata } from "next";

import { EXAMS, examStats } from "./exams";
import { COMMUNITY, SITE } from "./site";
import type { ExamMeta } from "./types";

/* ------------------------------------------------------------------ *
 * Structured data
 *
 * What an answer engine repeats about this site is whatever the markup
 * asserts — at scale, and without the caveats a human reader would see in the
 * footer. So the rule here is that nothing is claimed which the site does not
 * actually do:
 *
 *   - `Organization`, never `EducationalOrganization`. The latter describes an
 *     institution that teaches and credentials. Anthropic issues these
 *     certifications; this site publishes practice material and disclaims any
 *     affiliation.
 *   - No `Course`. There are no courses here, only question banks.
 *   - No `EducationalOccupationalCredential` offered by us. Marking the
 *     credential up as ours would tell every assistant that this site awards
 *     it.
 *   - Exam pages are `Quiz`, which is what they are, with `about` naming the
 *     certification they prepare for.
 *
 * Anything unconfirmed is omitted rather than guessed.
 * ------------------------------------------------------------------ */

export const ORG_ID = `${SITE.url}/#organization`;
export const WEBSITE_ID = `${SITE.url}/#website`;

/** Absolute URL for a site-relative path. */
export function abs(path: string): string {
  return path === "/" ? SITE.url : `${SITE.url}${path}`;
}

export function organization() {
  return {
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE.brand,
    url: SITE.url,
    logo: {
      "@type": "ImageObject",
      url: abs("/logo.png"),
    },
    description:
      "An independent, community-run study resource for Anthropic's Claude certification program. Not affiliated with, endorsed by, or sponsored by Anthropic.",
    parentOrganization: {
      "@type": "Organization",
      name: "Claude Singapore Community",
      url: "https://claudecode.sg",
    },
    // Only links the site already publishes; nothing inferred.
    sameAs: COMMUNITY.map((c) => c.href),
  };
}

export function website() {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE.brand,
    url: SITE.url,
    inLanguage: "en",
    publisher: { "@id": ORG_ID },
    // No SearchAction: the site has no search endpoint, and advertising one
    // that does not exist is a broken promise to the crawler.
  };
}

export function webPage(opts: {
  path: string;
  name: string;
  description: string;
}) {
  return {
    "@type": "WebPage",
    "@id": `${abs(opts.path)}#webpage`,
    url: abs(opts.path),
    name: opts.name,
    description: opts.description,
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": ORG_ID },
    inLanguage: "en",
  };
}

export function breadcrumbs(trail: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: abs(t.path),
    })),
  };
}

/**
 * FAQ markup must mirror question-and-answer content the visitor can actually
 * see on the page — markup-only FAQs are a structured-data policy violation
 * and get the whole page's rich results dropped. Callers pass the same array
 * they render.
 */
export function faqPage(items: { q: string; a: string }[]) {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/**
 * One exam's practice bank.
 *
 * `Quiz` is the honest type: these pages are self-assessment question sets.
 * `about` names the certification the bank prepares for without asserting that
 * this site awards or administers it.
 */
export function examQuiz(exam: ExamMeta, domains: string[]) {
  const stats = examStats(exam.id);
  return {
    "@type": "Quiz",
    "@id": `${abs(`/mockexams/${exam.id}`)}#quiz`,
    url: abs(`/mockexams/${exam.id}`),
    name: `${exam.code} practice questions and mock exam`,
    description: `${stats.total} free practice questions for ${exam.name} (${exam.code}), with explanations and a full timed mock exam. Community-written study items, not real exam questions.`,
    learningResourceType: "Practice exam",
    educationalLevel: exam.level,
    isAccessibleForFree: true,
    inLanguage: "en",
    publisher: { "@id": ORG_ID },
    isPartOf: { "@id": WEBSITE_ID },
    about: {
      "@type": "Thing",
      name: `${exam.name} (${exam.code})`,
      description: exam.description,
    },
    // The exam domains this bank assesses, straight from the published
    // blueprint the banks are tagged against.
    assesses: domains,
  };
}

/** Every exam as one list, for the /mockexams index. */
export function examList() {
  return {
    "@type": "ItemList",
    name: "Claude certification mock exams",
    itemListElement: EXAMS.map((e, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${e.code} — ${e.name}`,
      url: abs(`/mockexams/${e.id}`),
    })),
  };
}

/** Wrap entities as a single @graph document. */
export function graph(...entities: object[]) {
  return { "@context": "https://schema.org", "@graph": entities };
}

/**
 * The social card.
 *
 * Next attaches the file-based `opengraph-image` automatically — but only
 * while a route leaves `openGraph` alone. Defining it to get a per-route title
 * replaces the inherited block, images included, and the card silently
 * vanishes from every page but the homepage. Nothing in the build warns about
 * it; the only symptom is shared links rendering bare. Restating the image
 * here is what buys per-route titles without losing it.
 *
 * The path carries no content hash on purpose: Next serves the same image with
 * or without its cache-busting query, and a hash pinned here would rot the
 * moment the card is redesigned.
 */
const OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "Claude Architects — get Claude certified, with free practice questions",
};

/**
 * Per-route metadata.
 *
 * Next merges `openGraph` by replacement, not deep merge — a route that sets
 * any Open Graph field drops every field inherited from the layout. So the
 * whole block is rebuilt here rather than patched, which is also what keeps
 * each route's social card describing that route instead of the homepage.
 *
 * `alternates.canonical` is relative; `metadataBase` in the layout resolves it,
 * so the canonical host follows the deployment rather than being hardcoded.
 */
export function pageMetadata(opts: {
  path: string;
  /** Page title. Runs through the layout's "%s · Claude Architects" template. */
  title?: string;
  /** Full title for social cards, where no template is applied. */
  ogTitle: string;
  description: string;
}): Metadata {
  return {
    ...(opts.title ? { title: opts.title } : {}),
    description: opts.description,
    alternates: { canonical: opts.path },
    openGraph: {
      title: opts.ogTitle,
      description: opts.description,
      url: abs(opts.path),
      siteName: SITE.brand,
      type: "website",
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: opts.ogTitle,
      description: opts.description,
      images: [OG_IMAGE.url],
    },
  };
}
