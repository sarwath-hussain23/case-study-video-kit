// Voiceover via ElevenLabs.
//   node engine/tts.mjs <project>                      -> audio/<id>.wav, audio/durations.json, src/timeline.js
//   node engine/tts.mjs <project> --samples eric,brian -> out/voice_samples/<name>.mp3 (first 2 VO lines)
// Voice, model and settings come from project.json "voice". "pronounce" maps written words to spoken
// forms (e.g. {"n8n": "n-eight-n"}) and is applied only to the audio, never to captions.
// The first full run saves audio/ref.json: the VO lengths the scene cues are authored against.
// Delete audio/ref.json only if you re-time every cue by hand.
// Behind an HTTP proxy run with NODE_USE_ENV_PROXY=1.
import { writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { projectDir, readJSON, arg, elevenLabsKey, gateStatus, gateHash } from './lib.mjs';

const project = projectDir();
const cfg = readJSON(path.join(project, 'project.json'));
const key = elevenLabsKey(project);
if (!key) { console.error('Missing ELEVENLABS_API_KEY (env, <project>/.env or <projects folder>/.env)'); process.exit(1); }

const spoken = (s) => Object.entries(cfg.pronounce || {}).reduce((t, [w, say]) => t.split(w).join(say), s);
const lines = readJSON(path.join(project, 'vo.json')).map((l) => ({ ...l, text: spoken(l.text) }));

async function speak(voiceId, text, prev, next) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, model_id: cfg.voice.model, voice_settings: cfg.voice.settings, previous_text: prev, next_text: next }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

const samples = arg('--samples');
if (samples) {
  const catalog = cfg.voiceCandidates || {};
  const dir = path.join(project, 'out/voice_samples');
  mkdirSync(dir, { recursive: true });
  const text = lines.slice(0, 2).map((l) => l.text).join(' ');
  for (const name of samples.split(',')) {
    const id = catalog[name] || name;
    writeFileSync(path.join(dir, `${name}.mp3`), await speak(id, text));
    console.log(`${name}: out/voice_samples/${name}.mp3`);
  }
  process.exit(0);
}

// Credits are spent only on a script the user approved (confirm.mjs ... script).
const sg = gateStatus(project, cfg, 'script');
if (!sg.ok) { console.error(`The script is not approved yet. ${sg.why}`); process.exit(1); }

const durations = {};
for (const [i, { id, text }] of lines.entries()) {
  const mp3 = path.join(project, `audio/${id}.mp3`), wav = path.join(project, `audio/${id}.wav`);
  writeFileSync(mp3, await speak(cfg.voice.id, text, lines[i - 1]?.text, lines[i + 1]?.text));
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', mp3, '-ar', '48000', '-ac', '1', wav]);
  durations[id] = +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', wav]).toString().trim();
  console.log(`${id}: ${durations[id].toFixed(2)}s`);
}
const refFile = path.join(project, 'audio/ref.json');
writeFileSync(path.join(project, 'audio/durations.json'), JSON.stringify(durations, null, 2));
// Fingerprint of the script this voiceover was made from (preflight compares it with vo.json).
writeFileSync(path.join(project, 'audio/vo.fingerprint'), gateHash(project, 'script'));
if (!existsSync(refFile)) copyFileSync(path.join(project, 'audio/durations.json'), refFile);
writeFileSync(path.join(project, 'src/timeline.js'),
  `window.VO = ${JSON.stringify(durations, null, 2)};\nwindow.VO_REF = ${JSON.stringify(readJSON(refFile), null, 2)};\n`);
console.log('total VO', Object.values(durations).reduce((a, b) => a + b, 0).toFixed(1) + 's');
