// Understand a screen recording before it goes anywhere near the video.
//   node engine/understand_footage.mjs <project> <video> [--transcript] [--threshold 0.3]
// Writes out/footage/scene_NNN.jpg (one frame per scene change), out/footage/contact_sheet.jpg,
// out/footage_report.md (for people) and out/footage_report.json (for preflight).
//
// - Scenes: ffmpeg scene-change detection, topped up with evenly spaced frames (6 to 24 frames).
// - Privacy scan: when `tesseract` is installed, every frame is OCR'd and emails, phone numbers,
//   tokens and the project's "privateTerms" are flagged with their frame regions. Without tesseract
//   the report says so, and Claude must read every frame itself.
// - Transcript (optional, --transcript): ElevenLabs speech-to-text, only when the recording has
//   audible sound. Uses the same ElevenLabs key; costs a few credits.
import { mkdirSync, writeFileSync, readdirSync, rmSync, readFileSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import path from 'node:path';
import { projectDir, readJSON, arg, elevenLabsKey } from './lib.mjs';

const project = projectDir();
const video = process.argv[3];
if (!video || video.startsWith('--')) { console.error('Usage: understand_footage.mjs <project> <video> [--transcript] [--threshold 0.3]'); process.exit(2); }
const cfg = readJSON(path.join(project, 'project.json'));
const outDir = path.join(project, 'out/footage');
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

// ---- metadata -------------------------------------------------------------------------------
const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=codec_type,width,height,avg_frame_rate', '-of', 'json', video]).toString());
const v = probe.streams.find((s) => s.codec_type === 'video');
const hasAudio = probe.streams.some((s) => s.codec_type === 'audio');
const duration = +probe.format.duration;
const [fn, fd] = v.avg_frame_rate.split('/').map(Number);
let meanVolume = null;
if (hasAudio) {
  const r = spawnSync('ffmpeg', ['-i', video, '-vn', '-af', 'volumedetect', '-f', 'null', '-'], { encoding: 'utf8' });
  meanVolume = +(r.stderr.match(/mean_volume: (-?[\d.]+) dB/)?.[1] ?? -91);
}
const silent = !hasAudio || meanVolume < -50;

// ---- scenes ---------------------------------------------------------------------------------
const threshold = arg('--threshold') || '0.3';
const sd = spawnSync('ffmpeg', ['-i', video, '-vf', `select='gt(scene,${threshold})',showinfo`, '-an', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 64e6 });
let times = [0, ...[...sd.stderr.matchAll(/pts_time:([\d.]+)/g)].map((m) => +m[1])];
const MIN = 6, MAX = 24;
if (times.length < MIN) for (let i = 1; i < MIN; i++) times.push((duration * i) / MIN);
times = [...new Set(times.map((t) => Math.round(t * 10) / 10))].sort((a, b) => a - b);
if (times.length > MAX) times = Array.from({ length: MAX }, (_, i) => times[Math.floor((i * times.length) / MAX)]);
const FRAME_W = 1280, scale = v.width / FRAME_W;
const frames = times.map((t, i) => {
  const file = `scene_${String(i + 1).padStart(3, '0')}.jpg`;
  execFileSync('ffmpeg', ['-v', 'error', '-ss', String(t), '-i', video, '-frames:v', '1', '-vf', `scale=${FRAME_W}:-2`, '-q:v', '3', path.join(outDir, file)]);
  return { file, time: t };
});
const cols = 4, rows = Math.ceil(frames.length / cols);
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', path.join(outDir, 'scene_%03d.jpg'), '-vf', `scale=480:-2,tile=${cols}x${rows}`, '-frames:v', '1', path.join(outDir, 'contact_sheet.jpg')]);

// ---- privacy scan (OCR) ---------------------------------------------------------------------
const PATTERNS = [
  ['email', /[\w.+-]+@[\w-]+\.[\w.-]+/],
  ['phone', /\+?\d[\d\s().-]{7,}\d/],
  ['token', /\b(sk|pk|rk|ghp|gho|github_pat|xox[abp]|AKIA|AIza)[_-]?[A-Za-z0-9_-]{8,}/],
  ['long secret', /\b[A-Za-z0-9_-]{32,}\b/],
];
const terms = (cfg.privateTerms || []).filter(Boolean);
const ocr = spawnSync('tesseract', ['--version']).status === 0;
const flags = [];
if (ocr) {
  for (const f of frames) {
    // Image bytes go in on stdin: tesseract's image library rewrites some paths (macOS /tmp).
    const tsv = spawnSync('tesseract', ['stdin', '-', '--psm', '11', 'tsv'], { input: readFileSync(path.join(outDir, f.file)), encoding: 'utf8' }).stdout || '';
    const words = tsv.split('\n').slice(1).map((l) => l.split('\t')).filter((c) => c.length >= 12 && c[11]?.trim());
    // Rebuild lines so phone numbers and emails split across words are still caught.
    const lines = {};
    for (const c of words) (lines[`${c[2]}-${c[3]}-${c[4]}`] ||= []).push(c);
    for (const ws of Object.values(lines)) {
      const text = ws.map((c) => c[11]).join(' ');
      const hits = PATTERNS.filter(([, re]) => re.test(text)).map(([k]) => k)
        .concat(terms.filter((t) => text.toLowerCase().includes(t.toLowerCase())).map((t) => `private term "${t}"`));
      if (!hits.length) continue;
      const x = Math.min(...ws.map((c) => +c[6])), y = Math.min(...ws.map((c) => +c[7]));
      const x2 = Math.max(...ws.map((c) => +c[6] + +c[8])), y2 = Math.max(...ws.map((c) => +c[7] + +c[9]));
      flags.push({ frame: f.file, time: f.time, kinds: hits, text: text.slice(0, 80),
        region: [x, y, x2 - x, y2 - y].map((n) => Math.round(n * scale)).join(':') });
    }
  }
}

// ---- transcript (optional) ------------------------------------------------------------------
let transcript = null;
if (process.argv.includes('--transcript')) {
  if (silent) transcript = { skipped: hasAudio ? `audio is silent (mean ${meanVolume} dB)` : 'no audio track' };
  else {
    const key = elevenLabsKey(project);
    if (!key) transcript = { skipped: 'no ElevenLabs key' };
    else {
      const mp3 = path.join(outDir, 'audio.mp3');
      execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', video, '-vn', '-ac', '1', '-ar', '16000', '-b:a', '48k', mp3]);
      const form = new FormData();
      form.append('model_id', 'scribe_v1');
      form.append('file', new Blob([readFileSync(mp3)], { type: 'audio/mpeg' }), 'audio.mp3');
      const res = await fetch('https://api.elevenlabs.io/v1/speech-to-text', { method: 'POST', headers: { 'xi-api-key': key }, body: form });
      const j = await res.json().catch(() => ({}));
      transcript = res.ok ? { text: j.text } : { skipped: `speech-to-text failed (HTTP ${res.status}: ${j.detail?.message || ''})` };
      rmSync(mp3, { force: true });
      if (transcript.text) {
        for (const [k, re] of PATTERNS.slice(0, 3)) if (re.test(transcript.text)) flags.push({ frame: 'transcript', time: null, kinds: [k], text: transcript.text.match(re)[0], region: 'audio' });
      }
    }
  }
}

// ---- report ---------------------------------------------------------------------------------
// The same text usually sits in the same place for many frames: list it once with every time seen.
const groupMap = new Map();
for (const f of flags) {
  const k = `${f.text}|${f.region}`;
  if (!groupMap.has(k)) groupMap.set(k, { ...f, times: [] });
  groupMap.get(k).times.push(f.time == null ? 'audio' : `${f.time}s`);
}
const groups = [...groupMap.values()];
const pad = 12;
const blurList = [...new Set(groups.filter((g) => g.region !== 'audio').map((g) => {
  const [x, y, w, h] = g.region.split(':').map(Number);
  return [Math.max(0, x - pad), Math.max(0, y - pad), w + 2 * pad, h + 2 * pad].join(':');
}))].join(';');

const report = {
  video: path.basename(video), duration, width: v.width, height: v.height, fps: fd ? +(fn / fd).toFixed(2) : null,
  audio: hasAudio ? (silent ? `silent (mean ${meanVolume} dB)` : `audible (mean ${meanVolume} dB)`) : 'none',
  frames, ocr, flags, groups, suggestedBlur: blurList, transcript, privateTerms: terms,
};
writeFileSync(path.join(project, 'out/footage_report.json'), JSON.stringify(report, null, 2));
const md = `# Footage report: ${report.video}

| | |
|---|---|
| Duration | ${duration.toFixed(1)} s |
| Resolution | ${v.width}x${v.height} at ${report.fps} fps |
| Audio | ${report.audio} |
| Frames reviewed | ${frames.length} (scene changes, threshold ${threshold}) |
| Contact sheet | \`out/footage/contact_sheet.jpg\` |
| Text scan (OCR) | ${ocr ? `tesseract: ${flags.filter((f) => f.frame !== 'transcript').length} flagged line(s)` : '**not run: tesseract is not installed. Claude must read every frame and list private text below.**'} |
| Transcript | ${transcript ? (transcript.text ? 'done (below)' : `skipped: ${transcript.skipped}`) : 'not requested'} |

## Frames

| # | Time | Frame |
|---|---|---|
${frames.map((f, i) => `| ${i + 1} | ${f.time.toFixed(1)} s | \`out/footage/${f.file}\` |`).join('\n')}

## Privacy flags

${groups.length ? `| What | Text | Region x:y:w:h (source pixels) | Seen at |
|---|---|---|---|
${groups.map((g) => `| ${g.kinds.join(', ')} | ${g.text.replace(/\|/g, '/')} | ${g.region} | ${g.times.join(', ')} |`).join('\n')}
${blurList ? `\nTo pixelate these regions (padded 12 px): \`--blur "${blurList}"\`\n` : ''}` : ocr ? 'None found by OCR. Still look at every frame: OCR misses small or stylized text.' : 'OCR not available. Claude: view every frame and list here every name, email, phone number, meeting title, client name or token you can read, with its frame and position.'}

## Decision (record with confirm.mjs, by the user)

- **crop**: keep the footage, cropped to a region with nothing private (\`prep_footage.mjs --crop\`).
- **blur**: keep the footage and blur the flagged regions (\`prep_footage.mjs --blur x:y:w:h;...\`).
- **placeholders**: no real footage; show the workflow with catalog mockups and placeholder data.
- **none**: leave the recording out.
${transcript?.text ? `\n## Transcript\n\n${transcript.text}\n` : ''}`;
writeFileSync(path.join(project, 'out/footage_report.md'), md);
console.log(`${frames.length} frames, ${groups.length} private item(s) flagged, OCR ${ocr ? 'on' : 'OFF (tesseract not installed)'}\nReport: ${path.join(project, 'out/footage_report.md')}`);
