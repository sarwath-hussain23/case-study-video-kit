// Pre-flight checks. Run each stage before moving on; FAIL blocks, WARN needs a human decision.
//   node engine/preflight.mjs <project> --stage inputs   before reading the inputs or writing anything
//   node engine/preflight.mjs <project> --stage script   after vo.json and index.html are written, before any TTS spend
//   node engine/preflight.mjs <project> --stage render   after TTS, before the long render
// Behind an HTTP proxy run with NODE_USE_ENV_PROXY=1 (the inputs stage calls the ElevenLabs API).
import { existsSync, readdirSync, readFileSync, statSync, openSync, readSync, closeSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { KIT, projectDir, readJSON, arg, elevenLabsKey, docxText, chromeInstalled, installHint } from './lib.mjs';

const project = projectDir();
const stage = arg('--stage');
if (!['inputs', 'script', 'render'].includes(stage)) { console.error('Pass --stage inputs|script|render'); process.exit(2); }
const cfg = readJSON(path.join(project, 'project.json'));
const intake = path.join(project, 'intake');
const results = [];
const check = (level, ok, msg) => results.push({ level: ok ? 'PASS' : level, msg });
const has = (cmd, args = ['-version']) => { try { execFileSync(cmd, args, { stdio: 'ignore' }); return true; } catch { return false; } };

const DOC_EXT = ['.docx', '.pdf', '.md', '.txt'];
const intakeFiles = existsSync(intake) ? readdirSync(intake) : [];
const docs = intakeFiles.filter((f) => DOC_EXT.includes(path.extname(f).toLowerCase()) && f !== 'INTAKE.md');

function docText() {
  return docs.map((f) => {
    const p = path.join(intake, f), ext = path.extname(f).toLowerCase();
    if (ext === '.docx') { try { return docxText(p); } catch { return ''; } }
    if (ext === '.pdf') { try { return execFileSync('pdftotext', [p, '-']).toString(); } catch { return ''; } }
    return readFileSync(p, 'utf8');
  }).join('\n');
}

function pngWidth(file) {
  const fd = openSync(file, 'r'), b = Buffer.alloc(24);
  readSync(fd, b, 0, 24, 0); closeSync(fd);
  return b.toString('ascii', 1, 4) === 'PNG' ? b.readUInt32BE(16) : null;
}

const vo = () => readJSON(path.join(project, 'vo.json'));
const html = () => readFileSync(path.join(project, 'src/index.html'), 'utf8');
const sceneIds = (h) => [...h.matchAll(/<section class="scene[^"]*" id="([^"]+)"([^>]*)>/g)].map((m) => ({ id: m[1], fixed: /data-fixed="([\d.]+)"/.exec(m[2])?.[1], tail: /data-tail="([\d.]+)"/.exec(m[2])?.[1] }));

if (stage === 'inputs') {
  // Tools
  const node = +process.versions.node.split('.')[0];
  check('FAIL', node >= 18, `Node.js ${process.versions.node} (need 18+; install: ${installHint('node')})`);
  check('FAIL', has('ffmpeg') && has('ffprobe'), `ffmpeg and ffprobe installed (install: ${installHint('ffmpeg')})`);
  check('FAIL', chromeInstalled(), `Google Chrome installed, renders the frames (install: ${installHint('chrome')})`);
  check('FAIL', existsSync(path.join(KIT, 'node_modules/playwright-core')), `playwright-core installed (run: npm install, in ${KIT})`);

  // Inputs
  check('FAIL', docs.length > 0, `Use-case document in intake/ (${DOC_EXT.join(', ')})${docs.length ? ': ' + docs.join(', ') : ''}`);
  if (docs.length) {
    const text = docText();
    check('WARN', text.trim().length > 500, 'Document text is readable (scanned PDFs need OCR first)');
    for (const section of ['problem', 'solution', 'result']) check('WARN', new RegExp(section, 'i').test(text), `Document mentions a "${section}" section`);
    check('WARN', /\d+\s*%|\d+\s*(min|hour|hr|day|x)\b/i.test(text), 'Document has at least one measurable result (%, minutes, hours...)');
  }
  if (cfg.brand === 'byteit' && !cfg.brandWebsite) results.push({ level: 'INFO', msg: 'No brand website given: the video uses the ByteIT brand' });

  check('WARN', existsSync(path.join(project, 'BRAND-DNA.md')), `Brand DNA guideline present (BRAND-DNA.md for brand "${cfg.brand}"); build it with brand_dna.mjs for a new brand`);
  const logo = path.join(project, 'src/assets/logo.png');
  const w = existsSync(logo) ? pngWidth(logo) : null;
  check('WARN', w && w >= 600, `Logo is at least 600 px wide (now ${w ?? 'missing'} px; small logos look soft at full size)`);

  const videos = intakeFiles.filter((f) => /\.(mp4|mov|m4v|webm)$/i.test(f));
  for (const v of videos) {
    const info = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width:format=duration', '-of', 'json', path.join(intake, v)]).toString();
    const j = JSON.parse(info), width = j.streams?.[0]?.width, dur = +j.format?.duration;
    check('WARN', width >= 1280, `Recording ${v} is at least 1280 px wide (${width} px)`);
    check('WARN', dur >= 20 && dur <= 600, `Recording ${v} is 20 s to 10 min long (${dur.toFixed(0)} s)`);
  }
  if (!videos.length) results.push({ level: 'INFO', msg: 'No screen recording in intake/: the video will have no "under the hood" footage' });

  // ElevenLabs
  const key = elevenLabsKey(project);
  check('FAIL', !!key, 'ELEVENLABS_API_KEY set (env, project .env or projects-folder .env)');
  if (key) {
    check('FAIL', key.startsWith('sk_'), 'Key starts with sk_ (a different value means the key ID or the placeholder was pasted; copy the secret key from ElevenLabs > API Keys)');
    try {
      const res = await fetch('https://api.elevenlabs.io/v1/user/subscription', { headers: { 'xi-api-key': key } });
      if (res.status === 401 && (await res.text()).includes('missing_permissions')) {
        results.push({ level: 'WARN', msg: 'Key works but cannot read the subscription (restricted key): check credits and plan by hand' });
      } else {
        check('FAIL', res.ok, `ElevenLabs accepts the key (HTTP ${res.status})`);
        if (res.ok) {
          const s = await res.json();
          const left = s.character_limit - s.character_count;
          check('FAIL', left >= 6000, `ElevenLabs credits left: ${left} (a 3-minute video with retakes needs about 6000)`);
          check('WARN', s.tier !== 'free', `ElevenLabs plan "${s.tier}" allows commercial use (the free plan does not)`);
        }
      }
    } catch (e) {
      check('FAIL', false, `Reach api.elevenlabs.io (${e.cause?.code || e.message}). Behind a proxy, run with NODE_USE_ENV_PROXY=1`);
    }
  }
}

if (stage === 'script') {
  const lines = vo(), h = html(), scenes = sceneIds(h);
  const ids = lines.map((l) => l.id);
  const form = path.join(intake, 'INTAKE.md');
  check('FAIL', existsSync(form) && !/_{4,}/.test(readFileSync(form, 'utf8')), 'intake/INTAKE.md drafted from the inputs and confirmed by the user (no ____ blanks left)');
  check('FAIL', new Set(ids).size === ids.length, 'vo.json scene ids are unique');
  for (const s of scenes) check('FAIL', ids.includes(s.id) || s.fixed, `Scene ${s.id} has a voiceover line or data-fixed`);
  for (const id of ids) check('FAIL', scenes.some((s) => s.id === id), `vo.json line ${id} has a scene in index.html`);
  check('FAIL', !h.includes('{{'), 'index.html has no unfilled {{placeholders}}');

  const words = lines.reduce((n, l) => n + l.text.split(/\s+/).length, 0);
  const est = words / 150 * 60 + lines.length * 1.6 + scenes.reduce((n, s) => n + (+s.fixed || 0) + (+s.tail || 0), 0);
  const [lo, hi] = cfg.targetSeconds;
  check('WARN', est >= lo && est <= hi, `Estimated length ${Math.round(est)} s (${words} words at 150 wpm) is inside the ${lo}-${hi} s target`);
  for (const l of lines) for (const sent of l.text.split(/(?<=[.?!])\s+/)) {
    check('WARN', sent.split(/\s+/).length <= 25, `${l.id}: sentence under 25 words ("${sent.slice(0, 50)}...")`);
  }

  // Every number in the narration and on screen must trace back to the source document.
  const src = docText().replace(/,/g, '');
  const shown = h.replace(/<(script|svg|style)[\s\S]*?<\/\1>/g, '').replace(/<[^>]+>/g, ' ');
  const nums = new Set([...(lines.map((l) => l.text).join(' ') + ' ' + shown).matchAll(/\b\d+(?:\.\d+)?\s*%|\b\d+\s*[–-]\s*\d+\s*(?:min|minutes|hours|%)/g)].map((m) => m[0].replace(/\s+/g, ' ')));
  for (const n of nums) {
    const core = n.match(/\d+(?:\.\d+)?/g);
    check(src.length > 500 ? 'FAIL' : 'WARN', core.every((d) => src.includes(d)), `Figure "${n}" appears in the source document`);
  }
  results.push({ level: 'INFO', msg: 'Human check: spelled-out numbers ("ninety-five percent") match the on-screen figures' });
}

if (stage === 'render') {
  const lines = vo(), h = html();
  for (const l of lines) check('FAIL', existsSync(path.join(project, `audio/${l.id}.wav`)), `Voiceover audio/${l.id}.wav exists`);
  const tl = readFileSync(path.join(project, 'src/timeline.js'), 'utf8');
  for (const l of lines) check('FAIL', tl.includes(`"${l.id}"`), `src/timeline.js has a duration for ${l.id}`);
  const wavTime = lines.map((l) => existsSync(path.join(project, `audio/${l.id}.wav`)) ? statSync(path.join(project, `audio/${l.id}.wav`)).mtimeMs : 0);
  check('WARN', Math.min(...wavTime) >= statSync(path.join(project, 'vo.json')).mtimeMs, 'Voiceover is newer than vo.json (re-run tts.mjs after script edits)');
  for (const m of h.matchAll(/data-footage="([^"]+)" data-frames="(\d+)"/g)) {
    const dir = path.join(project, 'src', m[1]);
    const n = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.jpg')).length : 0;
    check('FAIL', n === +m[2], `Footage ${m[1]} has ${m[2]} frames (found ${n})`);
  }
  for (const f of ['brand.css', 'base.css', 'player.js', 'assets/logo.png']) check('FAIL', existsSync(path.join(project, 'src', f)), `src/${f} exists`);
}

const order = { FAIL: 0, WARN: 1, INFO: 2, PASS: 3 };
for (const r of results.sort((a, b) => order[a.level] - order[b.level])) console.log(`${r.level.padEnd(4)}  ${r.msg}`);
const fails = results.filter((r) => r.level === 'FAIL').length, warns = results.filter((r) => r.level === 'WARN').length;
console.log(`\n${stage}: ${fails} fail, ${warns} warn`);
process.exit(fails ? 1 : 0);
