// Place each VO clip at its scene's voStart, duck music under VO, add whooshes, mux with video.
// Output: out/<project.json output>.mp4
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

import { projectDir, readJSON } from './lib.mjs';

const root = projectDir();
const output = `out/${readJSON(path.join(root, 'project.json')).output}.mp4`;
const { duration, timeline } = JSON.parse(readFileSync(path.join(root, 'out/timeline.json'), 'utf8'));
const vo = timeline.filter((s) => s.vo > 0);

const args = ['-y', '-v', 'error', '-i', 'out/video_silent.mp4', '-i', 'audio/music.wav', '-i', 'audio/sfx.wav'];
vo.forEach((s) => args.push('-i', `audio/${s.id}.wav`));

const voLabels = vo.map((s, i) => {
  const ms = Math.round(s.voStart * 1000);
  return `[${i + 3}:a]adelay=${ms}|${ms}[v${i}]`;
});
const filter = [
  ...voLabels,
  `${vo.map((_, i) => `[v${i}]`).join('')}amix=inputs=${vo.length}:normalize=0:duration=longest,apad=whole_dur=${duration.toFixed(3)},highpass=f=80,acompressor=threshold=-18dB:ratio=3:attack=5:release=120,asplit=2[vo][key]`,
  `[1:a]volume=0.22[mus]`,
  `[mus][key]sidechaincompress=threshold=0.03:ratio=6:attack=40:release=500[duck]`,
  `[2:a]volume=0.10[sfx]`,
  `[vo][duck][sfx]amix=inputs=3:normalize=0:duration=first,loudnorm=I=-16:TP=-1.5:LRA=11[aout]`,
].join(';');

args.push('-filter_complex', filter, '-map', '0:v', '-map', '[aout]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
  '-ar', '48000', '-shortest', '-movflags', '+faststart', output);
execFileSync('ffmpeg', args, { cwd: root, stdio: 'inherit' });
console.log(output);
