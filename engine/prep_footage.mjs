// Turn a screen recording into the JPG frame sequence the player shows inside a "hood" scene.
//   node engine/prep_footage.mjs <project> <video> --probe 30
//       -> out/footage_probe.png (full-size frame at 30 s) to decide the crop
//   node engine/prep_footage.mjs <project> <video> --crop W:H:X:Y [--fps 5] [--width 1440]
//       -> src/assets/footage/f_0001.jpg ... and prints the frame count for data-frames
// Crop out anything private (account names, emails, tokens) before it reaches the video.
import { mkdirSync, rmSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { projectDir, arg } from './lib.mjs';

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
execFileSync('ffmpeg', ['-v', 'error', '-i', video, '-vf', `fps=${arg('--fps') || 5},crop=${crop},scale=${arg('--width') || 1440}:-2`,
  '-q:v', '3', path.join(dir, 'f_%04d.jpg')]);
console.log(`frames: ${readdirSync(dir).length}  (set data-frames to this)`);
