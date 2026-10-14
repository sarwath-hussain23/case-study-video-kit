// Shared helpers for the engine scripts. Every script takes the project folder as its first argument.
// Works on macOS and Windows.
import { readFileSync, existsSync, copyFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { inflateRawSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const IS_WIN = process.platform === 'win32';

// Node's fetch ignores HTTP(S)_PROXY unless NODE_USE_ENV_PROXY=1 is set at startup. When a proxy is
// configured (corporate networks, sandboxes), restart this script once with that flag so nobody has
// to remember it, on any OS or shell.
if (process.argv[1] && (process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy) && !process.env.NODE_USE_ENV_PROXY) {
  const r = spawnSync(process.execPath, [...process.execArgv, ...process.argv.slice(1)], { stdio: 'inherit', env: { ...process.env, NODE_USE_ENV_PROXY: '1' } });
  process.exit(r.status ?? 1);
}

// Google Chrome locations. Playwright's channel 'chrome' finds the same installs.
export function chromeInstalled() {
  const win = [process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)'], process.env.LOCALAPPDATA]
    .filter(Boolean).map((d) => path.join(d, 'Google/Chrome/Application/chrome.exe'));
  return [...win, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome'].some(existsSync);
}

// How to install a missing tool on this OS (Claude runs these after the user agrees).
export function installHint(tool) {
  const mac = { node: 'brew install node', ffmpeg: 'brew install ffmpeg', chrome: 'brew install --cask google-chrome', git: 'brew install git' };
  const win = { node: 'winget install OpenJS.NodeJS.LTS', ffmpeg: 'winget install Gyan.FFmpeg', chrome: 'winget install Google.Chrome', git: 'winget install Git.Git' };
  return (IS_WIN ? win : mac)[tool] + (IS_WIN ? '  (then open a new terminal)' : '  (needs Homebrew: https://brew.sh)');
}

// Text of a .docx without external tools: read word/document.xml straight from the zip.
export function docxText(file) {
  const buf = readFileSync(file);
  let eocd = buf.length - 22;
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  if (eocd < 0) return '';
  let p = buf.readUInt32LE(eocd + 16);
  for (let i = 0, n = buf.readUInt16LE(eocd + 10); i < n; i++) {
    const nameLen = buf.readUInt16LE(p + 28), extra = buf.readUInt16LE(p + 30), comment = buf.readUInt16LE(p + 32);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    if (name === 'word/document.xml') {
      const method = buf.readUInt16LE(p + 10), size = buf.readUInt32LE(p + 20), local = buf.readUInt32LE(p + 42);
      const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
      const data = buf.subarray(start, start + size);
      const xml = (method === 8 ? inflateRawSync(data) : data).toString('utf8');
      return xml.replace(/<\/w:p>/g, '\n').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    }
    p += 46 + nameLen + extra + comment;
  }
  return '';
}

export function projectDir() {
  const dir = process.argv[2];
  if (!dir || dir.startsWith('--') || !existsSync(path.join(dir, 'project.json'))) {
    console.error('Usage: node <script> <project-folder> [options]   (folder must contain project.json)');
    process.exit(2);
  }
  return path.resolve(dir);
}

export const readJSON = (file) => JSON.parse(readFileSync(file, 'utf8'));
export const arg = (name) => { const i = process.argv.indexOf(name); return i > -1 ? process.argv[i + 1] : undefined; };

// ElevenLabs key: environment first, then <project>/.env, then the .env in the folder that holds the
// projects (one key for all projects). Never put a .env inside the kit: the kit gets shared.
export function elevenLabsKey(project) {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY.trim();
  for (const f of [path.join(project, '.env'), path.join(project, '..', '.env')]) {
    const m = existsSync(f) && readFileSync(f, 'utf8').match(/^ELEVENLABS_API_KEY=(.+)$/m);
    if (m) return m[1].trim();
  }
  return null;
}

// Brand packs: <projects folder>/brands/<name> (client brands, kept out of the public kit) first,
// then <kit>/brands/<name>.
export function findBrand(project, name) {
  return [path.join(path.dirname(path.resolve(project)), 'brands', name), path.join(KIT, 'brands', name)]
    .find((d) => existsSync(path.join(d, 'brand.json')));
}

// Copy a brand pack into a project: CSS tokens, logo, fonts, DNA guideline, voice and pronunciations.
// When the project already has a page, the old brand's name, website, phone and tagline are swapped.
export function applyBrand(project, brandDir, brandName) {
  const brand = readJSON(path.join(brandDir, 'brand.json'));
  const cfgFile = path.join(project, 'project.json');
  const cfg = existsSync(cfgFile) ? readJSON(cfgFile) : {};
  const page = path.join(project, 'src/index.html');
  if (cfg.brand && existsSync(page)) {
    const old = readJSON(path.join(findBrand(project, cfg.brand), 'brand.json'));
    for (const f of [page, path.join(project, 'vo.json')].filter(existsSync)) {
      let text = readFileSync(f, 'utf8');
      for (const k of ['tagline', 'website', 'phone', 'spokenName', 'name']) if (old[k]) text = text.split(old[k]).join(brand[k] || '');
      writeFileSync(f, text);
    }
  }
  mkdirSync(path.join(project, 'src/assets/fonts'), { recursive: true });
  copyFileSync(path.join(brandDir, 'brand.css'), path.join(project, 'src/brand.css'));
  copyFileSync(path.join(brandDir, 'logo.png'), path.join(project, 'src/assets/logo.png'));
  for (const f of readdirSync(path.join(brandDir, 'fonts')).filter((f) => /\.(woff2?|ttf|otf|txt)$/i.test(f))) copyFileSync(path.join(brandDir, 'fonts', f), path.join(project, 'src/assets/fonts', f));
  if (existsSync(path.join(brandDir, 'BRAND-DNA.md'))) copyFileSync(path.join(brandDir, 'BRAND-DNA.md'), path.join(project, 'BRAND-DNA.md'));
  Object.assign(cfg, { brand: brandName, voice: brand.voice, voiceCandidates: brand.voiceCandidates,
    pronounce: { ...(cfg.pronounce || {}), ...(brand.pronounce || {}) } });
  writeFileSync(cfgFile, JSON.stringify(cfg, null, 2) + '\n');
  return brand;
}
