// Central site configuration — one source of truth for branding, navigation,
// community links, official resources, downloads and prep courses.

export const SITE = {
  brand: "Claude Architects",
  parent: "Claude SG",
  tagline:
    "Get Claude certified — practice, resources and the community behind the Architect exam.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://claude-sg-web.vercel.app",
};

export const NAV: { href: string; label: string }[] = [
  { href: "/", label: "Home" },
  { href: "/certification", label: "Certification" },
  { href: "/mockexams", label: "Mock Exams" },
  { href: "/resources", label: "Resources" },
  { href: "/about", label: "About" },
];

export const COMMUNITY: { label: string; href: string; blurb: string }[] = [
  { label: "Telegram — Claude SG", href: "https://t.me/claudesg", blurb: "Main community chat" },
  { label: "Telegram — Claude Architects", href: "https://t.me/claudearchitects", blurb: "Architect-track chat" },
  { label: "LinkedIn", href: "https://linkedin.com/company/claudesg", blurb: "Updates & announcements" },
  { label: "YouTube", href: "https://youtube.com/@claudesg", blurb: "Talks & walkthroughs" },
  { label: "Luma", href: "https://lu.ma/claudesg", blurb: "Events & meetups" },
];

export const OFFICIAL: { label: string; href: string }[] = [
  { label: "Anthropic Partner Academy (free training)", href: "https://academy.claude.com/" },
  { label: "Claude Partner Network", href: "https://claude.com/partners" },
  { label: "Anthropic: four role-based certifications", href: "https://claude.com/blog/four-role-based-claude-certifications" },
  { label: "Claude SG — official exam page", href: "https://claudecode.sg/claude-architect-exam" },
];

// Three official PDFs (hosted on claudecode.sg, which the community owns).
export const PDFS: { label: string; desc: string; href: string }[] = [
  { label: "CCA-F Exam Infographic", desc: "The exam at a glance", href: "https://claudecode.sg/cca-f/cca-f-exam-infographic.pdf" },
  { label: "CCA-F Exam Policy", desc: "Official policies and rules", href: "https://claudecode.sg/cca-f/cca-f-exam-policy.pdf" },
  { label: "CCA-F Terms & Conditions", desc: "Terms and conditions", href: "https://claudecode.sg/cca-f/cca-f-terms-and-conditions.pdf" },
];

// Recommended Anthropic Academy prep courses.
export const PREP_COURSES: { label: string; href: string }[] = [
  { label: "Introduction to Agent Skills", href: "https://academy.claude.com/" },
  { label: "Introduction to Model Context Protocol", href: "https://academy.claude.com/" },
  { label: "Claude Code in Action", href: "https://academy.claude.com/" },
  { label: "Building with the Claude API", href: "https://academy.claude.com/" },
];

// How to register for the real exam (via the Claude SG partner network).
export const REGISTER_STEPS: { title: string; body: string }[] = [
  { title: "Complete the screening form", body: "Pick your exam and submit the short screening at claudecode.sg." },
  { title: "Get your partner-network email", body: "On approval you receive a free @claudecode.sg email and sign a short freelance developer agreement." },
  { title: "Take the proctored exam", body: "Follow the automated instructions to sit the exam (delivered via Pearson VUE). Pass and earn a Credly digital badge." },
];

// Who each track is aimed at, in Anthropic's own framing. Tracks group the
// exams: Architect has two levels, the others have one.
export const TRACKS: {
  track: string;
  audience: string;
  focus: string;
  partnerTier: string;
}[] = [
  {
    track: "Associate",
    audience:
      "For consultants, sellers and delivery leads who guide customers toward the right Claude use cases and set engagements up for success.",
    focus: "Using Claude well — Projects, prompting, context, responsible use.",
    partnerTier: "Does not count",
  },
  {
    track: "Developer",
    audience:
      "For engineers who build with the Claude API, Claude Code and Model Context Protocol — from first integration to production agents.",
    focus: "Building on Claude — Messages API, Agent SDK, tool use, MCP.",
    partnerTier: "Counts",
  },
  {
    track: "Architect",
    audience:
      "For partners who design Claude solutions end to end — choosing deployment platforms, shaping agentic architectures, and planning for evaluation, cost and safety.",
    focus:
      "Designing with Claude — architecture, agentic patterns, evaluation, scale and governance.",
    partnerTier: "Counts",
  },
];
