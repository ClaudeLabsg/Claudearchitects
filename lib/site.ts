// Central site configuration — one source of truth for branding, navigation,
// community links, official resources, downloads and prep courses.

export const SITE = {
  brand: "Claude Architects",
  parent: "Claude SG",
  tagline:
    "Get Claude certified — practice, resources and the community behind the Architect exam.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://claudearchitects.org",
  // Public contact address for the community. Published deliberately — it is
  // the address structured data and llms.txt hand to anyone, human or machine,
  // who needs to reach the people behind the site.
  email: "claudecodesg@gmail.com",
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

// ---------------------------------------------------------------------------
// Anthropic Partner Academy curricula.
//
// Taken from the published learning paths on anthropic-partners.skilljar.com,
// which list their courses without requiring a sign-in. Each exam has its OWN
// path and they are not interchangeable: Architect deliberately omits Claude
// Code in Action and Agent Skills, and adds three delivery-focused courses the
// Developer path does not have. Durations are recorded only where the Academy
// states one, rather than estimated.

export type Course = { label: string; href: string; minutes?: number };

const ACADEMY = "https://anthropic-partners.skilljar.com/path";

const c = (path: string, slug: string, label: string, minutes?: number): Course => ({
  label,
  href: `${ACADEMY}/${path}/${slug}`,
  ...(minutes ? { minutes } : {}),
});

const ASSOC = {
  aiCaps: c("claude-associate", "ai-capabilities-and-limitations", "AI Capabilities and Limitations"),
  claude101: c("claude-associate", "claude-101", "Claude 101"),
  foundations: c("claude-associate", "claude-platform-model-foundations", "Claude Platform & Model Foundations", 59),
  prompting: c("claude-associate", "prompting-task-execution", "Prompting & Task Execution", 53),
  evaluating: c("claude-associate", "evaluating-validating-claudes-output", "Evaluating & Validating Claude's Output"),
  cowork: c("claude-associate", "introduction-to-claude-cowork", "Introduction to Claude Cowork"),
  workflow: c("claude-associate", "workflow-integration-solution-design", "Workflow Integration & Solution Design"),
  governance: c("claude-associate", "governance-risk-responsible-use", "Governance, Risk & Responsible Use", 55),
};

const DEV = {
  aiCaps: c("claude-developer", "ai-capabilities-and-limitations", "AI Capabilities and Limitations"),
  fluency: c("claude-developer", "ai-fluency-for-builders", "AI Fluency for Builders"),
  foundations: c("claude-developer", "claude-platform-model-foundations", "Claude Platform & Model Foundations", 59),
  platform101: c("claude-developer", "claude-platform-101", "Claude Platform 101"),
  code101: c("claude-developer", "claude-code-101", "Claude Code 101"),
  codeInAction: c("claude-developer", "claude-code-in-action", "Claude Code in Action"),
  mcp: c("claude-developer", "introduction-to-model-context-protocol", "Introduction to Model Context Protocol"),
  skills: c("claude-developer", "introduction-to-agent-skills", "Introduction to Agent Skills"),
  subagents: c("claude-developer", "introduction-to-subagents", "Introduction to Subagents"),
};

const ARCH = {
  aiCaps: c("claude-architect", "ai-capabilities-and-limitations", "AI Capabilities and Limitations"),
  fluency: c("claude-architect", "ai-fluency-for-builders", "AI Fluency for Builders"),
  foundations: c("claude-architect", "claude-platform-model-foundations", "Claude Platform & Model Foundations", 59),
  platform101: c("claude-architect", "claude-platform-101", "Claude Platform 101"),
  code101: c("claude-architect", "claude-code-101", "Claude Code 101"),
  mcp: c("claude-architect", "introduction-to-model-context-protocol", "Introduction to Model Context Protocol"),
  subagents: c("claude-architect", "introduction-to-subagents", "Introduction to Subagents"),
  product: c("claude-architect", "product-foundations", "Product Foundations"),
  deployment: c("claude-architect", "deployment-architecture", "Deployment Architecture"),
  delivery: c("claude-architect", "delivery-methodology", "Delivery Methodology"),
};

// The official path for each exam, in the order the Academy lists it.
export const CURRICULUM: Record<string, Course[]> = {
  "CCAO-F": [ASSOC.aiCaps, ASSOC.claude101, ASSOC.foundations, ASSOC.prompting, ASSOC.evaluating, ASSOC.cowork, ASSOC.workflow, ASSOC.governance],
  "CCDV-F": [DEV.aiCaps, DEV.fluency, DEV.foundations, DEV.platform101, DEV.code101, DEV.codeInAction, DEV.mcp, DEV.skills, DEV.subagents],
  "CCAR-F": [ARCH.aiCaps, ARCH.fluency, ARCH.foundations, ARCH.platform101, ARCH.code101, ARCH.mcp, ARCH.subagents, ARCH.product, ARCH.deployment, ARCH.delivery],
  "CCAR-P": [ARCH.aiCaps, ARCH.fluency, ARCH.foundations, ARCH.platform101, ARCH.code101, ARCH.mcp, ARCH.subagents, ARCH.product, ARCH.deployment, ARCH.delivery],
};

// Which official course teaches each exam domain. The domain keys match the
// blueprint names in content/*.json exactly — a typo here silently yields no
// recommendation rather than an error, so they are worth checking against the
// bank if a domain ever stops producing a suggestion.
//
// Worth knowing: CCDV-F "Security and Safety" is 8.1% of the paper and the
// Developer path has no course dedicated to it. Claude Code in Action is the
// nearest thing, covering hooks and permission modes, which is why it appears
// there rather than an empty list.
export const DOMAIN_COURSES: Record<string, Record<string, Course[]>> = {
  "CCAO-F": {
    "Prompting and Task Execution": [ASSOC.prompting],
    "Output Evaluation and Validation": [ASSOC.evaluating],
    "Product and Model Selection": [ASSOC.foundations],
    "Workflow Integration and Solution Design": [ASSOC.workflow],
    "Configuration and Knowledge Management": [ASSOC.cowork, ASSOC.claude101],
    "Governance, Risk, and Responsible Use": [ASSOC.governance],
    "Troubleshooting and Optimization": [ASSOC.evaluating, ASSOC.foundations],
  },
  "CCDV-F": {
    "Agents and Workflows": [DEV.subagents, DEV.platform101],
    "Applications and Integration": [DEV.platform101],
    "Claude Code": [DEV.code101, DEV.codeInAction],
    "Eval, Testing, and Debugging": [DEV.codeInAction, DEV.fluency],
    "Model Selection and Optimization": [DEV.foundations, DEV.platform101],
    "Prompt and Context Engineering": [DEV.platform101, DEV.code101],
    "Security and Safety": [DEV.codeInAction],
    "Tools and MCPs": [DEV.mcp, DEV.skills, DEV.platform101],
  },
  "CCAR-F": {
    "Agentic Architecture & Orchestration": [ARCH.subagents, ARCH.platform101],
    "Tool Design & MCP Integration": [ARCH.mcp],
    "Claude Code Configuration & Workflows": [ARCH.code101, DEV.codeInAction],
    "Prompt Engineering & Structured Output": [ARCH.platform101],
    "Context Management & Reliability": [ARCH.code101, ARCH.platform101],
  },
  "CCAR-P": {
    "Solution Design & Architecture": [ARCH.product, ARCH.deployment],
    "Claude Models, Prompting & Context Engineering": [ARCH.foundations, ARCH.platform101],
    "Integration": [ARCH.deployment],
    "Evaluation, Testing & Optimization": [ARCH.delivery],
    "Governance, Safety & Risk Management": [ARCH.deployment],
    "Stakeholder Communication & Lifecycle Management": [ARCH.delivery],
    "Developer Productivity & Operational Enablement": [ARCH.delivery, DEV.codeInAction],
  },
};

// For the pages that show one generic list. The site's flagship is the
// Architect track, so that is the path shown; CURRICULUM has the correct,
// different list for each of the four exams.
export const PREP_COURSES: Course[] = CURRICULUM["CCAR-F"];

// How to register for the real exam (via the Claude SG partner network).
export const REGISTER_STEPS: { title: string; body: string }[] = [
  { title: "Complete the screening form", body: "Pick your exam and submit the short screening at claudecode.sg." },
  { title: "Get your partner-network email", body: "On approval you receive a free @claudecode.sg email and sign a short freelance developer agreement." },
  { title: "Register on Partner Academy", body: "Use your @claudecode.sg address to register for the exam on Anthropic Partner Academy — personal email addresses are not accepted." },
  { title: "Take the proctored exam", body: "Sit the exam through Pearson VUE. Pass and earn a Credly digital badge." },
];


// One card per certification. Audience wording follows Anthropic's own role
// framing; the Architect split is drawn from the two published blueprints —
// Foundations covers building (orchestration, Claude Code, MCP, tool use),
// Professional covers designing and running it (architecture, governance,
// safety, observability, delivery, enablement).
export const CERT_CARDS: Record<
  string,
  { short: string; audience: string; focus: string }
> = {
  "CCAO-F": {
    short: "Associate",
    audience:
      "For consultants, sellers and delivery leads who guide customers toward the right Claude use cases and set engagements up for success.",
    focus: "Using Claude well — Projects, prompting, context, responsible use.",
  },
  "CCDV-F": {
    short: "Developer",
    audience:
      "For engineers who build with the Claude API, Claude Code and Model Context Protocol — from first integration to production agents.",
    focus: "Building on Claude — Messages API, Agent SDK, tool use, MCP.",
  },
  "CCAR-F": {
    short: "Architect · Foundations",
    audience:
      "For partners who design Claude solutions end to end. Foundations is the hands-on level — it tests whether you can build the thing.",
    focus:
      "Multi-agent orchestration, agentic workflows, Claude Code tooling, context and session management, tool use, MCP integration.",
  },
  "CCAR-P": {
    short: "Architect · Professional",
    audience:
      "The same track one level up, for people accountable for the solution inside an organisation — it tests whether you can design, secure and deliver it.",
    focus:
      "Solution architecture, security, compliance and governance, safety and risk, evaluation strategy, observability and cost, stakeholder delivery, developer enablement.",
  },
};
