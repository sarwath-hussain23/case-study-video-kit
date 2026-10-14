// Render <project>/src/index.html to video frames with system Chrome.
//   node engine/render.mjs <project>                -> out/video_silent.mp4 + out/timeline.json
//   node engine/render.mjs <project> --stills 5,20  -> out/still_<t>.png for quick QA
// Chrome cannot start inside the Claude Code Bash sandbox; run this command unsandboxed.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const FPS = 30;
import { projectDir } from './lib.mjs';

const root = projectDir();
mkdirSync(path.join(root, 'out'), { recursive: true });
const url = pathToFileURL(path.join(root, 'src/index.html')).href + '?render=1';
const stillsArg = process.argv.indexOf('--stills');

const browser = await chromium.launch({ channel: 'chrome', args: ['--allow-file-access-from-files'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await page.goto(url);
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(e.message));
await page.evaluate(() => window.READY).catch(() => {});
const { duration, timeline } = await page.evaluate(() => ({ duration: window.DURATION, timeline: window.TIMELINE }));
if (!duration) {
  console.error(`Cannot build the timeline: ${pageErrors[0] || 'no scenes found'}.`);
  console.error('Most often the voiceover has not been generated yet: run engine/tts.mjs first.');
  await browser.close();
  process.exit(1);
}
writeFileSync(path.join(root, 'out/timeline.json'), JSON.stringify({ duration, timeline }, null, 2));
console.log(`duration ${duration.toFixed(2)}s`);

if (stillsArg > -1) {
  for (const t of process.argv[stillsArg + 1].split(',').map(Number)) {
    await page.evaluate((t) => window.seek(t), t);
    await page.screenshot({ path: path.join(root, `out/still_${t}.png`) });
  }
} else {
  const total = Math.ceil(duration * FPS);
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(FPS),
    path.join(root, 'out/video_silent.mp4')], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((r) => ff.on('close', r));
  for (let f = 0; f < total; f++) {
    await page.evaluate((t) => window.seek(t), f / FPS);
    const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (f % 300 === 0) console.log(`frame ${f}/${total}`);
  }
  ff.stdin.end();
  await done;
}
await browser.close();
