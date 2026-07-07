// Render docs/deck.html -> docs/Concord_Deck.pdf (15 slides, 1280x720).
//   node scripts/render-deck.mjs
import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const html = resolve("docs/deck.html");
const out = resolve("docs/Concord_Deck.pdf");

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(html).href, { waitUntil: "networkidle" });
// Ensure webfonts (Syne / DM Serif Text / JetBrains Mono) are ready before printing.
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(600);
await page.pdf({
  path: out,
  width: "1280px",
  height: "720px",
  printBackground: true,
  pageRanges: "1-15",
});
await browser.close();
console.log("wrote", out);
