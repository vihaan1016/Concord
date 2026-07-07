// Screenshot every .slide section in docs/deck.html at high DPI, for PPTX assembly.
//   node scripts/deck-slide-shots.mjs
import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { mkdirSync } from "node:fs";

const html = resolve("docs/deck.html");
const outDir = resolve("docs/deck-assets/slides");
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
await page.goto(pathToFileURL(html).href, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(500);

const count = await page.locator(".slide").count();
for (let i = 0; i < count; i++) {
  const file = resolve(outDir, `slide-${String(i + 1).padStart(2, "0")}.png`);
  await page.locator(".slide").nth(i).screenshot({ path: file });
  console.log("wrote", file);
}

await browser.close();
console.log(`done — ${count} slides`);
