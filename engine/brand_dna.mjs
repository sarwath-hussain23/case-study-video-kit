// Build a brand pack from a brand DNA file.
//   node engine/brand_dna.mjs <brand-dna.json> [--out <folder>]
// Default output: <folder of the dna file>. The pack gets brand.css, brand.json, logo.png, fonts/
// and BRAND-DNA.md (the human-readable guideline). Client packs belong in <projects folder>/brands/,
// never inside the kit, because the kit is a public repository.
//
// Network: Google Fonts (fonts.googleapis.com, fonts.gstatic.com) and the logo host.
// An SVG logo is rasterized with Chrome, so run unsandboxed in that case.
import { writeFileSync, mkdirSync, existsSync, copyFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { KIT, readJSON, arg } from './lib.mjs';

const dnaFile = process.argv[2];
if (!dnaFile || !existsSync(dnaFile)) { console.error('Usage: node engine/brand_dna.mjs <brand-dna.json> [--out <folder>]'); process.exit(2); }
const dna = readJSON(dnaFile);
const out = path.resolve(arg('--out') || path.dirname(dnaFile));
mkdirSync(path.join(out, 'fonts'), { recursive: true });
const warn = [];

// ---- colors + contrast -------------------------------------------------------------------
const ROLES = ['primary-dark', 'primary-dark-2', 'primary', 'primary-deep', 'secondary', 'accent', 'accent-2', 'alert', 'ink', 'gray', 'line'];
for (const r of ROLES) if (!/^#[0-9a-fA-F]{6}$/.test(dna.colors?.[r] || '')) { console.error(`colors.${r} must be a #RRGGBB hex`); process.exit(1); }
const lum = (h) => {
  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const C = dna.colors, W = '#FFFFFF';
// Where each pair appears in the video, and the WCAG minimum for that text size.
const pairs = [
  ['White text on primary-dark (dark scenes)', W, C['primary-dark'], 4.5],
  ['White text on primary (results band)', W, C.primary, 4.5],
  ['White text on primary-deep (results band end)', W, C['primary-deep'], 4.5],
  ['Primary-dark headlines on white', C['primary-dark'], W, 4.5],
  ['Primary highlight words on white', C.primary, W, 3],
  ['Accent eyebrows and step numbers on white', C.accent, W, 3],
  ['Accent eyebrows on primary-dark', C.accent, C['primary-dark'], 3],
  ['Alert labels on white', C.alert, W, 3],
];
// Roles Claude inferred rather than read off the site are shown as guesses at Gate 1A.
const derived = new Set(dna.derived || []);
for (const r of derived) if (!ROLES.includes(r)) { console.error(`derived: "${r}" is not a color role`); process.exit(1); }
if (derived.size) warn.push(`Derived (not seen on the site), confirm at Gate 1A: ${[...derived].join(', ')}`);

const contrast = pairs.map(([label, fg, bgc, min]) => {
  const r = ratio(fg, bgc);
  if (r < min) warn.push(`Low contrast: ${label} is ${r.toFixed(2)}:1, needs ${min}:1`);
  return { label, r, min };
});

// ---- font ----------------------------------------------------------------------------------
const family = dna.font.family, slug = family.toLowerCase().replace(/[^a-z0-9]+/g, '-');
const weights = dna.font.weights || [300, 400, 500, 600, 700, 800];
let faces = '';
if (dna.font.googleFont) {
  const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weights.join(';')}&display=block`, { headers: { 'User-Agent': UA } })).text();
  for (const w of weights) {
    // Each weight has several unicode-range blocks; the "latin" block covers English text.
    const block = css.split('/*').find((b) => b.startsWith(' latin */') && b.includes(`font-weight: ${w};`));
    const url = block?.match(/url\((https:[^)]+\.woff2)\)/)?.[1];
    if (!url) { warn.push(`Google Fonts has no ${family} ${w}; that weight falls back to the nearest one`); continue; }
    writeFileSync(path.join(out, 'fonts', `${slug}-${w}.woff2`), Buffer.from(await (await fetch(url)).arrayBuffer()));
    faces += `@font-face{font-family:"${family}";font-weight:${w};src:url(assets/fonts/${slug}-${w}.woff2) format("woff2");font-display:block}\n`;
  }
  // Google Fonts are mostly under the SIL Open Font License, which must travel with the files.
  const ofl = await fetch(`https://raw.githubusercontent.com/google/fonts/main/ofl/${family.toLowerCase().replace(/[^a-z0-9]/g, '')}/OFL.txt`).catch(() => null);
  if (ofl?.ok) writeFileSync(path.join(out, 'fonts', 'OFL.txt'), await ofl.text());
  else warn.push(`Add the font license to fonts/ (see https://fonts.google.com/specimen/${family.replace(/ /g, '+')}/license)`);
} else if (dna.font.files) {
  for (const [w, file] of Object.entries(dna.font.files)) {
    copyFileSync(path.resolve(path.dirname(dnaFile), file), path.join(out, 'fonts', `${slug}-${w}.woff2`));
    faces += `@font-face{font-family:"${family}";font-weight:${w};src:url(assets/fonts/${slug}-${w}.woff2) format("woff2");font-display:block}\n`;
  }
} else {
  warn.push(`No font files for "${family}": the video uses the fallback stack (${dna.font.fallback})`);
}

// ---- logo ----------------------------------------------------------------------------------
const logoOut = path.join(out, 'logo.png');
const src = dna.logo?.url || (dna.logo?.file && path.resolve(path.dirname(dnaFile), dna.logo.file));
if (!src) { console.error('logo.url or logo.file is required'); process.exit(1); }
const raw = path.join(out, 'logo-source' + (path.extname(src.split(/[?#]/)[0]).toLowerCase() || '.png'));
if (/^https?:/.test(src)) writeFileSync(raw, Buffer.from(await (await fetch(src)).arrayBuffer()));
else copyFileSync(src, raw);
if (raw.endsWith('.svg')) {
  const { chromium } = await import('playwright-core');
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1200, height: 1200 } });
  await page.goto(pathToFileURL(raw).href);
  await page.evaluate(() => { const s = document.querySelector('svg'); const r = s.viewBox.baseVal; s.setAttribute('width', 1200); s.setAttribute('height', Math.round(1200 * (r.height || s.height.baseVal.value) / (r.width || s.width.baseVal.value))); });
  await page.locator('svg').screenshot({ path: logoOut, omitBackground: true });
  await browser.close();
} else {
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', raw, logoOut]);
  rmSync(raw); // keep only the PNG; an SVG source stays next to it for later re-exports
}
const logoW = +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=width', '-of', 'csv=p=0', logoOut]).toString().trim();
if (logoW < 600) warn.push(`Logo is ${logoW} px wide; under 600 px it looks soft at full size. Ask for an SVG or a larger PNG.`);

// ---- write the pack -------------------------------------------------------------------------
const fallback = dna.font.fallback || 'Helvetica,Arial,sans-serif';
// Background motif: the large shape behind light scenes (.bg-arc). Pick the one closest to the site.
const MOTIFS = {
  arc: '',
  dots: '#stage .bg-arc{border-radius:0;right:-60px;top:-60px;width:900px;height:1200px;background:radial-gradient(color-mix(in srgb,var(--primary) 22%,transparent) 3px,transparent 3.5px) 0 0/40px 40px;-webkit-mask-image:linear-gradient(225deg,#000 20%,transparent 70%);mask-image:linear-gradient(225deg,#000 20%,transparent 70%)}',
  bars: '#stage .bg-arc{border-radius:0;right:-300px;top:-300px;width:900px;height:1700px;transform:rotate(20deg);background:repeating-linear-gradient(90deg,color-mix(in srgb,var(--accent) 14%,transparent) 0 46px,transparent 46px 110px)}',
  none: '#stage .bg-arc{display:none}',
};
const motif = dna.motif || 'arc';
if (!(motif in MOTIFS)) { console.error(`motif must be one of: ${Object.keys(MOTIFS).join(', ')}`); process.exit(1); }
writeFileSync(path.join(out, 'brand.css'), `/* ${dna.name} brand pack, generated by brand_dna.mjs from ${path.basename(dnaFile)}. Source: ${dna.source}. Edit the DNA file, not this file. */
${faces}
:root{
  --font:"${family}",${fallback};
${ROLES.map((r) => `  --${r}:${C[r]};`).join('\n')}
  --ease:cubic-bezier(.2,.8,.2,1); --back:cubic-bezier(.34,1.56,.64,1);
}
${MOTIFS[motif] ? `/* motif: ${motif} */\n${MOTIFS[motif]}\n` : ''}`);
const kitDefault = readJSON(path.join(KIT, 'brands/byteit/brand.json'));
writeFileSync(path.join(out, 'brand.json'), JSON.stringify({
  name: dna.name, spokenName: dna.spokenName || dna.name, website: dna.website, phone: dna.phone, tagline: dna.tagline,
  voice: dna.voice || kitDefault.voice, voiceCandidates: dna.voiceCandidates || kitDefault.voiceCandidates, pronounce: dna.pronounce || {},
}, null, 2) + '\n');

const d = dna.dna || {};
const list = (a) => (a || []).map((x) => `- ${x}`).join('\n') || '- (none recorded)';
writeFileSync(path.join(out, 'BRAND-DNA.md'), `# ${dna.name} brand DNA

Source: ${dna.source}

## Palette

| Role | Hex | Used for | Source |
|---|---|---|---|
${[['primary-dark', 'Dark scenes, headlines'], ['primary-dark-2', 'Second dark tone'], ['primary', 'Highlight words, "present" states, results band'],
  ['primary-deep', 'Results band gradient end'], ['secondary', 'Second accent'], ['accent', 'Eyebrows, step numbers, underline swoosh'],
  ['accent-2', 'Softer accent on dark backgrounds'], ['alert', 'Absent, filtered, blocked'], ['ink', 'Body text'], ['gray', 'Soft panels, background motif'], ['line', 'Dividers']]
  .map(([r, use]) => `| ${r} | \`${C[r]}\` | ${use} | ${derived.has(r) ? '**derived (guess)**' : 'website'} |`).join('\n')}

${d.paletteNotes || ''}

## Contrast checks (WCAG)

| Pair | Ratio | Minimum | Result |
|---|---|---|---|
${contrast.map((c) => `| ${c.label} | ${c.r.toFixed(2)}:1 | ${c.min}:1 | ${c.r >= c.min ? 'pass' : '**fails**'} |`).join('\n')}

## Typography

- Family: **${family}** (${dna.font.googleFont ? 'Google Fonts' : dna.font.files ? 'supplied files' : 'not embedded, fallback used'}), weights ${weights.join(', ')}
${d.typography ? d.typography.map((t) => `- ${t}`).join('\n') : ''}

## Logo

- File: \`logo.png\`, ${logoW} px wide (source: ${src})
${d.logoNotes ? `- ${d.logoNotes}` : ''}

## Visual motifs

Background motif in the video: **${motif}** (arc, dots, bars or none).

${list(d.motifs)}

## Personality and tone of voice

${d.toneOfVoice || ''}

${list(d.personality)}

**Headlines from the brand's own site:**

${list(d.headlineSamples)}

## Do / don't

${list(d.do)}
${list(d.doNot)}

## Call to action

- Website: ${dna.website}
- Phone: ${dna.phone || 'n/a'}
- Tagline used on the end card: "${dna.tagline}"
`);

for (const w of warn) console.log(`WARN  ${w}`);
console.log(`Brand pack written to ${out} (${warn.length} warnings)`);
