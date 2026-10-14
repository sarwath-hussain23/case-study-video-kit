// Switch an existing project to another brand pack (for example after building a client's Brand DNA).
//   node engine/use_brand.mjs <project> <brand>
// Copies the pack's CSS, logo, fonts and BRAND-DNA.md, sets the voice and pronunciations in
// project.json, and swaps the old brand's name, website, phone and tagline in src/index.html.
import { projectDir, findBrand, applyBrand } from './lib.mjs';

const project = projectDir();
const name = process.argv[3];
const dir = name && findBrand(project, name);
if (!dir) { console.error(`Usage: use_brand.mjs <project> <brand>  (no brand pack "${name}" found)`); process.exit(2); }
const brand = applyBrand(project, dir, name);
console.log(`${project} now uses ${brand.name} (${dir})`);
