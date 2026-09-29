import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://claudearchitects.org";

/**
 * Crawlers named explicitly.
 *
 * `User-agent: *` already allows all of these, but several are governed by
 * opt-out conventions where operators look for their own token before deciding
 * what a wildcard means — so being named removes ambiguity rather than adding
 * permission.
 *
 * Note what two of these actually control: Google-Extended governs whether
 * content may be used for Gemini and Vertex AI training, and Applebot-Extended
 * the equivalent for Apple. Neither affects search ranking. Allowing them is a
 * deliberate choice to let this material train assistants, which suits a free
 * community study resource — but it is a licensing decision rather than an SEO
 * one, and should be revisited if that ever stops being true.
 */
const CRAWLERS = [
  // OpenAI
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  // Perplexity
  "PerplexityBot",
  "Perplexity-User",
  // Anthropic
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  // Training opt-in for Google / Apple (see note above)
  "Google-Extended",
  "Applebot-Extended",
  // Meta
  "meta-externalagent",
  // Classic search
  "Googlebot",
  "Bingbot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      ...CRAWLERS.map((userAgent) => ({ userAgent, allow: "/" })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
