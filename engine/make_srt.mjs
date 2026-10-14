// Build out/captions.srt from vo.json + out/timeline.json (sentence timing estimated by character share).
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { projectDir } from './lib.mjs';

const root = projectDir();
const vo = JSON.parse(readFileSync(path.join(root, 'vo.json'), 'utf8'));
const { timeline } = JSON.parse(readFileSync(path.join(root, 'out/timeline.json'), 'utf8'));
const ts = (t) => {
  const ms = Math.round(t * 1000), p = (n, w = 2) => String(n).padStart(w, '0');
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};

let n = 0, out = '';
for (const { id, text } of vo) {
  const s = timeline.find((x) => x.id === id);
  const parts = text.match(/[^.?!]+[.?!]+/g).map((x) => x.trim());
  const total = parts.reduce((a, p) => a + p.length, 0);
  let t = s.voStart;
  for (const p of parts) {
    const d = (p.length / total) * s.vo;
    out += `${++n}\n${ts(t)} --> ${ts(t + d)}\n${p}\n\n`;
    t += d;
  }
}
writeFileSync(path.join(root, 'out/captions.srt'), out);
console.log(`${n} captions`);
