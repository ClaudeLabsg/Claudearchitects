import { readdirSync } from "node:fs";

/**
 * Ask search engines to re-crawl the site.
 *
 * There is no longer a general way to do this. Google removed its sitemap ping
 * endpoint in 2023 and Bing deprecated its own, so the only remaining push
 * mechanism is IndexNow — honoured by Bing, Yandex, Seznam and Naver, but NOT
 * by Google, which still requires Search Console. Worth running anyway: Bing's
 * index is what ChatGPT Search and Copilot answer from, so a stale page there
 * costs citations, not just rankings.
 *
 * Ownership is proved by serving a key file at the domain root. The engine
 * fetches it and checks the contents match the submitted key, so the file must
 * be deployed before this runs — otherwise every URL is rejected, and the
 * failure looks exactly like success.
 *
 *   node scripts/indexnow.mjs [--host claudearchitects.org] [--dry]
 */

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const HOST = flag("host", "claudearchitects.org");
const DRY = args.includes("--dry");

// The key is whatever key file is sitting in public/ — one source of truth, so
// rotating the key is a matter of swapping the file.
const keyFiles = readdirSync("public").filter((f) => /^[0-9a-f]{8,128}\.txt$/.test(f));
if (keyFiles.length !== 1) {
  console.error(
    `Expected exactly one IndexNow key file in public/, found ${keyFiles.length}.` +
      (keyFiles.length ? ` (${keyFiles.join(", ")})` : ""),
  );
  process.exit(1);
}
const key = keyFiles[0].replace(/\.txt$/, "");

const { EXAMS } = await import("../lib/exams.ts");
const urlList = [
  "/",
  "/certification",
  "/mockexams",
  "/resources",
  "/about",
  ...EXAMS.map((e) => `/mockexams/${e.id}`),
].map((p) => `https://${HOST}${p}`);

console.log(`host      ${HOST}`);
console.log(`key       ${key}`);
console.log(`keyfile   https://${HOST}/${keyFiles[0]}`);
console.log(`urls      ${urlList.length}`);

// Verify the key file is actually reachable first. Submitting before it is
// live fails on the engine's side, and the API still answers 200.
const probe = await fetch(`https://${HOST}/${keyFiles[0]}`);
const served = probe.ok ? (await probe.text()).trim() : null;
if (served !== key) {
  console.error(
    `\nKey file not serving correctly (status ${probe.status}, body ${JSON.stringify(served)}).` +
      `\nDeploy public/${keyFiles[0]} before submitting.`,
  );
  process.exit(1);
}
console.log("keyfile   verified\n");

if (DRY) {
  console.log("--dry: not submitting. URLs would be:");
  for (const u of urlList) console.log("  " + u);
  process.exit(0);
}

const res = await fetch("https://api.indexnow.org/IndexNow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host: HOST,
    key,
    keyLocation: `https://${HOST}/${keyFiles[0]}`,
    urlList,
  }),
});

// 200 accepted, 202 accepted but key still being validated. Both are fine;
// anything else is worth reading rather than ignoring.
const text = await res.text();
console.log(`IndexNow responded ${res.status} ${res.statusText}`);
if (text) console.log(text);
if (res.status !== 200 && res.status !== 202) process.exit(1);
console.log(`\nSubmitted ${urlList.length} URLs. Re-crawl is queued, not immediate.`);
