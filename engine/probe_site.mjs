// Read a brand's website without a browser tool: runs templates/brand-probe.js in headless Chrome.
//   node engine/probe_site.mjs <url> <output-folder>
// Writes <output-folder>/probe.json, shot-top.png, shot-middle.png, shot-bottom.png and, when the
// home-page link holds an inline SVG logo, logo-inline.svg.
// Inside the Claude Code sandbox, Chrome cannot start: run this command unsandboxed.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { KIT } from './lib.mjs';

const [url, outDir] = process.argv.slice(2);
if (!url || !outDir) { console.error('Usage: node engine/probe_site.mjs <url> <output-folder>'); process.exit(2); }
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => page.waitForTimeout(3000));

// Scroll through once so lazy sections render, taking three screenshots on the way.
const height = await page.evaluate(() => document.documentElement.scrollHeight);
await page.screenshot({ path: path.join(outDir, 'shot-top.png') });
await page.evaluate((y) => window.scrollTo(0, y), height / 2); await page.waitForTimeout(1200);
await page.screenshot({ path: path.join(outDir, 'shot-middle.png') });
await page.evaluate((y) => window.scrollTo(0, y), height); await page.waitForTimeout(1200);
await page.screenshot({ path: path.join(outDir, 'shot-bottom.png') });
await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(500);

const probe = await page.evaluate(readFileSync(path.join(KIT, 'templates/brand-probe.js'), 'utf8'));
await browser.close();

writeFileSync(path.join(outDir, 'probe.json'), JSON.stringify(probe, null, 2));
const svg = probe.logos.find((l) => l.homeLink && l.inlineSvg);
if (svg) writeFileSync(path.join(outDir, 'logo-inline.svg'), svg.inlineSvg);
console.log(`${probe.title}\nfonts: ${probe.fonts.map((f) => f[0]).join(', ')}\nlogo candidates: ${probe.logos.length}${svg ? ' (inline SVG saved)' : ''}\nwrote ${outDir}`);
