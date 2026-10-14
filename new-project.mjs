// Create a new video project folder from the kit.
//   node new-project.mjs <folder> --title "Automated Meeting Attendance" [--brand byteit]
// The folder gets: intake/ (drop inputs here), src/ (page + brand assets), audio/, out/,
// project.json, vo.json and a starter index.html with the title and CTA scenes.
import { mkdirSync, copyFileSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { KIT, readJSON, arg, findBrand, applyBrand } from './engine/lib.mjs';

const dir = process.argv[2];
const title = arg('--title');
const brandName = arg('--brand') || 'byteit';
if (!dir || dir.startsWith('--') || !title) {
  console.error('Usage: node new-project.mjs <folder> --title "Video title" [--brand byteit]');
  process.exit(2);
}
if (existsSync(path.join(dir, 'project.json'))) { console.error(`${dir} already has a project.json`); process.exit(1); }
const brandDir = findBrand(dir, brandName);
if (!brandDir) { console.error(`Unknown brand "${brandName}": build it first with engine/brand_dna.mjs into <projects folder>/brands/${brandName}/`); process.exit(1); }
const brand = readJSON(path.join(brandDir, 'brand.json'));

for (const d of ['intake', 'src', 'audio', 'out']) mkdirSync(path.join(dir, d), { recursive: true });
for (const f of ['base.css', 'player.js']) copyFileSync(path.join(KIT, 'templates', f), path.join(dir, 'src', f));
copyFileSync(path.join(KIT, 'INTAKE.md'), path.join(dir, 'intake/INTAKE.md'));

const fill = (s) => s
  .replaceAll('{{ICONS}}', readFileSync(path.join(KIT, 'templates/icons.svg.html'), 'utf8').trim())
  .replaceAll('{{TITLE}}', title).replaceAll('{{BRAND}}', brand.name).replaceAll('{{EYEBROW}}', 'Automation Case Study')
  .replaceAll('{{TAGLINE}}', brand.tagline).replaceAll('{{WEBSITE}}', brand.website).replaceAll('{{PHONE}}', brand.phone);
writeFileSync(path.join(dir, 'src/index.html'), fill(readFileSync(path.join(KIT, 'templates/starter.html'), 'utf8')));
writeFileSync(path.join(dir, 'src/timeline.js'), 'window.VO = {};\nwindow.VO_REF = {};\n');

const slug = path.basename(path.resolve(dir));
writeFileSync(path.join(dir, 'project.json'), JSON.stringify({
  title, output: `${brand.name}_${slug}`.replace(/[^\w-]+/g, '_'), targetSeconds: [120, 240],
}, null, 2) + '\n');
applyBrand(dir, brandDir, brandName);
writeFileSync(path.join(dir, 'vo.json'), JSON.stringify([
  { id: 's99_cta', text: `${brand.spokenName}. ${brand.tagline}` },
], null, 2) + '\n');
writeFileSync(path.join(dir, '.gitignore'), '.env\naudio/*.mp3\nout/\n');
console.log(`Created ${dir}\nNext: put the inputs in ${path.join(dir, 'intake')}/ and run the preflight:\n  node ${path.join(KIT, 'engine/preflight.mjs')} ${dir} --stage inputs`);
