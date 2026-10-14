// Shared helpers for the engine scripts. Every script takes the project folder as its first argument.
import { readFileSync, existsSync, copyFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

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
