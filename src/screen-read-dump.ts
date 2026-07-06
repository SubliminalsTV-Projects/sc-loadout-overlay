// Standalone tester for screen-read.ts — OCR + classify a screenshot file.
//   npm run screen-read-dump -- <image.jpg> [more.jpg ...]
// Prints the fabricator item (resolved to catalog UUID) or tracked-mission title.

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadCatalog, ocrImage, classifyScreen } from "./screen-read.js";

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, "..", "data");

async function main() {
  const args = process.argv.slice(2);
  if (!args.length) { console.error("usage: screen-read-dump <image> [image...]"); process.exit(1); }
  const catalog = loadCatalog(dataDir);
  console.log(`catalog: ${catalog.length} items\n`);
  for (const img of args) {
    const ocr = await ocrImage(img);
    const read = classifyScreen(ocr, catalog);
    const tag = img.split(/[\\/]/).pop();
    if (read.kind === "fabricator") {
      console.log(`${tag}\n  FABRICATOR  "${read.nameRaw}"`);
      console.log(`    -> ${read.name ?? "(unresolved)"}  [${read.match}]  item=${read.item ?? "-"}`);
      console.log(`    crop=${read.crop.x},${read.crop.y} ${read.crop.w}x${read.crop.h}  (frame ${ocr.w}x${ocr.h})`);
    } else if (read.kind === "mission") {
      console.log(`${tag}\n  MISSION  "${read.titleRaw}"`);
    } else {
      console.log(`${tag}\n  (no fabricator / mission detected; ${ocr.lines.length} lines)`);
    }
    console.log();
  }
}

main();
