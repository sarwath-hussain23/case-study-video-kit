// One-time setup on a new computer (macOS or Windows).
//   node setup.mjs [projects-folder]      default: <home>/case-studies
// Checks the tools, installs the kit's npm package, and creates the projects folder with an
// .env file waiting for the ElevenLabs key. Never overwrites an existing .env.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync, execFileSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { KIT, IS_WIN, chromeInstalled, installHint } from './engine/lib.mjs';

const projects = path.resolve(process.argv[2] || path.join(os.homedir(), 'case-studies'));
const has = (cmd) => { try { execFileSync(cmd, ['-version'], { stdio: 'ignore' }); return true; } catch { return false; } };
const missing = [];
if (+process.versions.node.split('.')[0] < 18) missing.push(['Node.js 18 or newer', installHint('node')]);
if (!has('ffmpeg') || !has('ffprobe')) missing.push(['ffmpeg', installHint('ffmpeg')]);
if (!chromeInstalled()) missing.push(['Google Chrome', installHint('chrome')]);

if (!existsSync(path.join(KIT, 'node_modules/playwright-core'))) {
  const r = spawnSync('npm', ['install', '--no-audit', '--no-fund'], { cwd: KIT, stdio: 'inherit', shell: IS_WIN });
  if (r.status !== 0) missing.push(['npm packages', `npm install  (in ${KIT})`]);
}

mkdirSync(path.join(projects, 'brands'), { recursive: true });
const env = path.join(projects, '.env');
if (!existsSync(env)) writeFileSync(env, 'ELEVENLABS_API_KEY=\n');
if (!existsSync(path.join(projects, '.gitignore'))) writeFileSync(path.join(projects, '.gitignore'), '.env\n');

console.log(missing.length ? 'Missing tools (install, then run setup again):' : 'All tools are installed.');
for (const [what, cmd] of missing) console.log(`  - ${what}: ${cmd}`);
console.log(`\nProjects folder: ${projects}`);
console.log(`ElevenLabs key file: ${env}`);
console.log(`Open it, paste your secret key (starts with sk_) after "=", and save:\n  ${IS_WIN ? `notepad "${env}"` : `open -e "${env}"`}`);
process.exit(missing.length ? 1 : 0);
