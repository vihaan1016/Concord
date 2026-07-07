// Build docs/Concord_Deck.pptx from the per-slide screenshots (docs/deck-assets/slides/*.png),
// then inject varied native PowerPoint slide transitions into the raw OOXML.
//   node scripts/deck-slide-shots.mjs   (regenerate screenshots first if deck.html changed)
//   node scripts/render-pptx.mjs
import pptxgen from "pptxgenjs";
import { resolve } from "node:path";
import { readdirSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";

const slidesDir = resolve("docs/deck-assets/slides");
const out = resolve("docs/Concord_Deck.pptx");

const files = readdirSync(slidesDir)
  .filter((f) => f.endsWith(".png"))
  .sort();

if (files.length === 0) throw new Error("no slide PNGs found — run scripts/deck-slide-shots.mjs first");

const pptx = new pptxgen();
pptx.defineLayout({ name: "CONCORD_16x9", width: 13.333, height: 7.5 });
pptx.layout = "CONCORD_16x9";

for (const file of files) {
  const slide = pptx.addSlide();
  slide.addImage({ path: resolve(slidesDir, file), x: 0, y: 0, w: 13.333, h: 7.5 });
}

await pptx.writeFile({ fileName: out });
console.log("wrote", out);

// ---------------------------------------------------------------------------
// pptxgenjs has no public transition API; PowerPoint's OOXML does
// (<p:transition> on each slideN.xml). Inject a rotating set of transitions
// directly into the generated .pptx (a zip) so the deck isn't one flat cut.
// ---------------------------------------------------------------------------
const TRANSITIONS = [
  '<p:transition spd="med"><p:fade/></p:transition>',
  '<p:transition spd="med"><p:push dir="l"/></p:transition>',
  '<p:transition spd="med"><p:wipe dir="l"/></p:transition>',
  '<p:transition spd="med"><p:cover dir="l"/></p:transition>',
  '<p:transition spd="fast"><p:cut/></p:transition>',
  '<p:transition spd="med"><p:pull dir="r"/></p:transition>',
];

const work = resolve(".pptx-transition-work");
execSync(`rm -rf "${work}" && mkdir -p "${work}"`);
execSync(`unzip -q "${out}" -d "${work}"`);

const slidesXmlDir = resolve(work, "ppt", "slides");
const slideFiles = readdirSync(slidesXmlDir)
  .filter((f) => /^slide\d+\.xml$/.test(f))
  .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));

for (let i = 0; i < slideFiles.length; i++) {
  const path = resolve(slidesXmlDir, slideFiles[i]);
  const transition = TRANSITIONS[i % TRANSITIONS.length];
  let xml = execSync(`cat "${path}"`).toString();
  // <p:transition> must be the last child of <p:sld>, immediately before </p:sld>.
  xml = xml.replace(/<\/p:sld>\s*$/, `${transition}</p:sld>`);
  execSync(`cat > "${path}"`, { input: xml });
}

execSync(`rm -f "${out}"`);
execSync(`cd "${work}" && zip -qr "${out}" .`);
execSync(`rm -rf "${work}"`);
console.log("injected transitions:", TRANSITIONS.map((t) => t.match(/<p:(\w+)(?:\s[^>]*)?\/>/)[1]).join(", "));
console.log("rewrote", out, "with transitions");
