// Synthesize a royalty-free music bed + transition whooshes matched to out/timeline.json.
// Writes audio/music.wav and audio/sfx.wav (48 kHz mono, full video length).
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { projectDir } from './lib.mjs';

const root = projectDir();
const { duration, timeline } = JSON.parse(readFileSync(path.join(root, 'out/timeline.json'), 'utf8'));
const SR = 48000, N = Math.ceil(duration * SR);
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

function writeWav(file, data) {
  const buf = Buffer.alloc(44 + data.length * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + data.length * 2, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(data.length * 2, 40);
  let peak = 0; for (const v of data) peak = Math.max(peak, Math.abs(v));
  const g = 0.89 / (peak || 1);
  data.forEach((v, i) => buf.writeInt16LE(Math.round(v * g * 32767), 44 + i * 2));
  writeFileSync(file, buf);
}

// --- Music: warm pad + soft plucked arpeggio, 96 BPM, Cmaj9 / Am9 / Fmaj9 / G6 ---
const music = new Float32Array(N);
const BPM = 96, beat = 60 / BPM, bar = beat * 4;
const chords = [[48, 55, 59, 62, 64], [45, 52, 55, 59, 60], [41, 48, 52, 55, 57], [43, 50, 54, 57, 59]];
const arp = [0, 2, 3, 4, 3, 2, 1, 2];
for (let i = 0; i < N; i++) {
  const t = i / SR, b = Math.floor(t / bar), c = chords[b % 4], tb = t - b * bar;
  // pad with 1.2 s crossfade between chords
  const fadeIn = Math.min(1, tb / 1.2);
  const prev = chords[(b + 3) % 4];
  let pad = 0;
  for (const m of c) pad += fadeIn * (Math.sin(2 * Math.PI * hz(m) * t) + 0.3 * Math.sin(2 * Math.PI * hz(m) * 2.003 * t));
  if (b > 0) for (const m of prev) pad += (1 - fadeIn) * (Math.sin(2 * Math.PI * hz(m) * t) + 0.3 * Math.sin(2 * Math.PI * hz(m) * 2.003 * t));
  pad *= 0.05 * (0.85 + 0.15 * Math.sin(2 * Math.PI * 0.25 * t));
  // 8th-note pluck, one octave up
  const step = Math.floor(t / (beat / 2)), ts = t - step * (beat / 2);
  const pm = c[arp[step % 8]] + 12;
  const pluck = 0.09 * Math.exp(-ts * 7) * Math.sin(2 * Math.PI * hz(pm) * t) * Math.min(1, ts * 400);
  // soft sub pulse on beats
  const tbt = t % beat;
  const sub = 0.12 * Math.exp(-tbt * 9) * Math.sin(2 * Math.PI * hz(c[0] - 12) * t);
  music[i] = pad + pluck + sub;
}
// Fade in 1 s, fade out last 3 s
for (let i = 0; i < N; i++) {
  const t = i / SR;
  music[i] *= Math.min(1, t / 1) * Math.min(1, (duration - t) / 3);
}
writeWav(path.join(root, 'audio/music.wav'), music);

// --- SFX: filtered-noise whoosh into each scene change ---
const sfx = new Float32Array(N);
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
for (const s of timeline.slice(1)) {
  const len = 0.7, start = Math.max(0, s.start - 0.35);
  let lp = 0;
  for (let k = 0; k < len * SR; k++) {
    const i = Math.floor(start * SR) + k; if (i >= N) break;
    const x = k / (len * SR);
    const cut = 0.02 + 0.25 * Math.sin(Math.PI * x); // sweep filter up and down
    lp += cut * (rand() - lp);
    sfx[i] += lp * Math.pow(Math.sin(Math.PI * x), 2);
  }
}
writeWav(path.join(root, 'audio/sfx.wav'), sfx);
console.log('music + sfx written', duration.toFixed(2));
