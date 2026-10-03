// mirror_feed.mjs — refresh data/feed.json from the live Blogger feed.
// The school-safe mirror: GitHub runners fetch blogspot (unblocked there), the repo
// serves the same JSON the JSONP path would have received, the app reads it
// same-origin / jsdelivr / raw when the blog itself is blocked on the user's net.
import { writeFileSync, mkdirSync } from "node:fs";

const SOURCES = [
  "https://ixlstudy.blogspot.com/feeds/posts/default?alt=json&max-results=50",
  "https://www.blogger.com/feeds/4196838597539783048/posts/default?alt=json&max-results=50",
];

let ok = null;
for (const url of SOURCES) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const text = await r.text();
    const data = JSON.parse(text); // validate before writing anything
    const entries = (data.feed && data.feed.entry) || [];
    if (!entries.length) throw new Error("no entries");
    ok = text;
    console.log("fetched " + entries.length + " entries from " + url);
    break;
  } catch (e) {
    console.log("source failed: " + url + " (" + e.message + ")");
  }
}
if (ok === null) {
  console.error("all feed sources failed — keeping the existing mirror");
  process.exit(1);
}
mkdirSync("data", { recursive: true });
writeFileSync("data/feed.json", ok);
console.log("data/feed.json written (" + ok.length + " bytes)");
