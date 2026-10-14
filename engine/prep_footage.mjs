// Turn a screen recording into the JPG frame sequence the player shows inside a "hood" scene.
//   node engine/prep_footage.mjs <project> <video> --probe 30
//       -> out/footage_probe.png (full-size frame at 30 s) to decide the crop
//   node engine/prep_footage.mjs <project> <video> --crop W:H:X:Y [--blur "x:y:w:h;x:y:w:h"] [--fps 5] [--width 1440]
//       -> src/assets/footage/f_0001.jpg ... and prints the frame count for data-frames
// Run understand_footage.mjs first. Crop out, or blur (regions in source-video pixels, as listed in
// out/footage_report.md), anything private: account names, emails, tokens, client data.
// The crop, blur and frame count are recorded in project.json "footage" for preflight.
import { mkdirSync, rmSync, readdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { projectDir, arg, readJSON } from './lib.mjs';

const project = projectDir();
const video = process.argv[3];
if (!video) { console.error('Usage: prep_footage.mjs <project> <video> (--probe SECONDS | --crop W:H:X:Y)'); process.exit(2); }

const probe = arg('--probe');
if (probe) {
  const out = path.join(project, 'out/footage_probe.png');
  mkdirSync(path.dirname(out), { recursive: true });
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', probe, '-i', video, '-frames:v', '1', out]);
  console.log(out);
  process.exit(0);
}

const crop = arg('--crop');
if (!crop) { console.error('Pass --crop W:H:X:Y (use --probe first to pick it)'); process.exit(2); }
const dir = path.join(project, 'src/assets/footage');
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
// Pixelate the private regions first (in source coordinates; unreadable at any size), then crop and scale.
const blur = (arg('--blur') || '').split(';').map((r) => r.trim()).filter(Boolean);
const chain = [`[0:v]fps=${arg('--fps') || 5}[s0]`];
blur.forEach((r, i) => {
  const [x, y, w, h] = r.split(':').map(Number);
  chain.push(`[s${i}]split=2[a${i}][b${i}]`, `[b${i}]crop=${w}:${h}:${x}:${y},scale='max(2,iw/16)':'max(2,ih/16)',scale=${w}:${h}:flags=neighbor[bb${i}]`, `[a${i}][bb${i}]overlay=${x}:${y}[s${i + 1}]`);
});
chain.push(`[s${blur.length}]crop=${crop},scale=${arg('--width') || 1440}:-2[out]`);
execFileSync('ffmpeg', ['-v', 'error', '-i', video, '-filter_complex', chain.join(';'), '-map', '[out]', '-q:v', '3', path.join(dir, 'f_%04d.jpg')]);
const frames = readdirSync(dir).filter((f) => f.endsWith('.jpg')).length;
const cfgFile = path.join(project, 'project.json'), cfg = readJSON(cfgFile);
cfg.footage = { source: path.basename(video), crop, blur, frames };
writeFileSync(cfgFile, JSON.stringify(cfg, null, 2) + '\n');
console.log(`frames: ${frames}  (set data-frames to this)`);
