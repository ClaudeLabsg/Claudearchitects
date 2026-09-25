// Study-notes PDF: combines the hand-distilled domain notes in
// study-notes/<EXAM>/*.html with an answer key built from content/<EXAM>.json,
// then prints it to PDF with headless Chromium.
//
// Usage:
//   npm run study-notes                    # CCDV-F (default)
//   npm run study-notes -- --exam CCDV-F
//   npm run study-notes -- --no-key        # notes only, skip the answer key
// Chromium: CHROME_PATH, else the first of a few common locations.

import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const EXAM = opt("exam", "CCDV-F");
const WITH_KEY = !args.includes("--no-key");

const NOTES_DIR = join(ROOT, "study-notes", EXAM);
const HTML_OUT = join(ROOT, "study-notes", `${EXAM}-study-notes.html`);
const PDF_OUT = join(ROOT, "study-notes", `${EXAM}-study-notes.pdf`);

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const slug = (s) => s.replace(/ & /g, "-").replace(/\s+/g, "-");

const bank = JSON.parse(readFileSync(join(ROOT, "content", `${EXAM}.json`), "utf8"));
const objectives = JSON.parse(readFileSync(join(ROOT, "data", "objectives.json"), "utf8"))[EXAM];

// Domain order follows the objectives file; any extra domains in the bank go last.
const domains = [...objectives.domains.map((d) => d.name)];
for (const q of bank) if (!domains.includes(q.domain)) domains.push(q.domain);
const count = (d) => bank.filter((q) => q.domain === d).length;

const notesFor = (d) => {
  const f = join(NOTES_DIR, `${slug(d)}.html`);
  return existsSync(f) ? readFileSync(f, "utf8") : `<h2>${esc(d)}</h2><p><em>No notes yet.</em></p>`;
};

const keyFor = (d) =>
  bank
    .filter((q) => q.domain === d)
    .map((q) => {
      const byId = Object.fromEntries(q.options.map((o) => [o.id, o.text]));
      const answer = q.correct.map((c) => `<strong>${c}.</strong> ${esc(byId[c])}`).join("<br>");
      return `<div class="q"><div class="qid">${q.id}${q.type === "multi" ? " · select all that apply" : ""}</div>
<p class="stem">${esc(q.question)}</p>
<p class="ans">${answer}</p>
<p class="why">${esc(q.explanation)}</p></div>`;
    })
    .join("\n");

const css = `
@page { size: A4; margin: 16mm 15mm 18mm; }
* { box-sizing: border-box; }
body { font-family: "DejaVu Sans", "Helvetica Neue", Arial, sans-serif; font-size: 9.6pt; line-height: 1.45; color: #1c1b19; margin: 0; }
h1 { font-size: 26pt; margin: 0 0 6pt; letter-spacing: -0.5pt; }
h2 { font-size: 16pt; color: #9a3f1f; border-bottom: 1.5pt solid #d97757; padding-bottom: 3pt; margin: 0 0 8pt; }
h3 { font-size: 11.5pt; margin: 14pt 0 4pt; color: #2b2a27; break-after: avoid; }
p { margin: 3pt 0 6pt; }
ul, ol { margin: 2pt 0 6pt; padding-left: 15pt; }
li { margin: 1.5pt 0; }
code { font-family: "DejaVu Sans Mono", Menlo, monospace; font-size: 8.4pt; background: #f3efe8; padding: 0 2pt; border-radius: 2pt; }
table { width: 100%; border-collapse: collapse; margin: 4pt 0 8pt; font-size: 8.8pt; break-inside: avoid; }
th, td { border: 0.6pt solid #d9d3c7; padding: 3pt 5pt; vertical-align: top; text-align: left; }
table.vs th:first-child { background: #e6f2ea; } table.vs th:last-child { background: #f8e6e1; }
.ref { color: #7a766d; font-size: 8pt; font-style: italic; }
ul.check { list-style: none; padding-left: 2pt; } ul.check li::before { content: "☐ "; color: #9a3f1f; }
.cover { height: 250mm; display: flex; flex-direction: column; justify-content: center; }
.cover .kicker { color: #9a3f1f; font-weight: 700; letter-spacing: 1pt; text-transform: uppercase; font-size: 10pt; }
.cover .sub { font-size: 13pt; color: #55524b; margin-bottom: 18pt; }
.cover .meta { font-size: 9pt; color: #6f6b62; margin-top: 24pt; }
section { break-before: page; }
.toc td:last-child { text-align: right; width: 70pt; }
.q { break-inside: avoid; border-left: 2pt solid #e4ddd0; padding: 2pt 0 2pt 7pt; margin: 0 0 7pt; font-size: 8.4pt; }
.q .qid { font-weight: 700; color: #9a3f1f; font-size: 7.8pt; }
.q .stem { margin: 1pt 0 2pt; } .q .ans { margin: 2pt 0; background: #eef6f0; padding: 2pt 4pt; }
.q .why { margin: 2pt 0 0; color: #45423c; }
`;

const toc = domains
  .map((d) => {
    const o = objectives.domains.find((x) => x.name === d);
    const obj = o ? `<ul>${o.objectives.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : "";
    return `<tr><td><strong>${esc(d)}</strong>${obj}</td><td>${count(d)} questions</td></tr>`;
  })
  .join("");

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${EXAM} Study Notes</title><style>${css}</style></head><body>
<div class="cover">
  <div class="kicker">Claude Architects · Study notes</div>
  <h1>${EXAM} — Claude Certified Developer, Foundation</h1>
  <div class="sub">Key concepts, correct-vs-distractor patterns and a quick-recall checklist for every domain, distilled from the ${bank.length}-question practice bank.</div>
  <table class="toc"><tr><th>Domain &amp; official objectives</th><th>Bank</th></tr>${toc}</table>
  <div class="meta">Part 1: domain notes.${WITH_KEY ? " Part 2: full answer key with explanations, grouped by domain." : ""}<br>
  Community study material, not affiliated with or endorsed by Anthropic.</div>
</div>
${domains.map((d) => `<section>${notesFor(d)}</section>`).join("\n")}
${WITH_KEY ? domains.map((d) => `<section><h2>Answer key — ${esc(d)}</h2>${keyFor(d)}</section>`).join("\n") : ""}
</body></html>`;

writeFileSync(HTML_OUT, html);

const candidates = [
  process.env.CHROME_PATH,
  ...(existsSync("/opt/pw-browsers")
    ? readdirSync("/opt/pw-browsers").filter((d) => d.startsWith("chromium-")).map((d) => `/opt/pw-browsers/${d}/chrome-linux/chrome`)
    : []),
  "/usr/bin/chromium",
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);
const chrome = candidates.find((p) => existsSync(p));
if (!chrome) {
  console.log(`Wrote ${HTML_OUT}. No Chromium found — set CHROME_PATH, or print the HTML to PDF from a browser.`);
  process.exit(0);
}
execFileSync(chrome, [
  "--headless", "--no-sandbox", "--disable-gpu", "--no-pdf-header-footer",
  `--print-to-pdf=${PDF_OUT}`, `file://${HTML_OUT}`,
], { stdio: "inherit" });
console.log(`Wrote ${PDF_OUT}`);
