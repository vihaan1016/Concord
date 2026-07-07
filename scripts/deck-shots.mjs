// Capture real app screenshots for the deck (Landing + Docs — both render
// fully without a configured DEX). Start `frontend` dev server first:
//   cd frontend && npm run dev   # http://localhost:5173
//   node scripts/deck-shots.mjs
import { chromium } from "playwright";
import { resolve } from "node:path";

const BASE = process.env.DECK_BASE_URL || "http://localhost:5173";
const OUT = resolve("docs/deck-assets");

const shots = [
  { path: "/", file: "landing.png", wait: 4200 },   // gooey intro plays ~3.2s
  { path: "/docs", file: "docs.png", wait: 800 },
];

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 2,
});

for (const s of shots) {
  await page.goto(`${BASE}${s.path}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(s.wait);
  const file = resolve(OUT, s.file);
  await page.screenshot({ path: file });
  console.log("wrote", file);
}

await browser.close();
