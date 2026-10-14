// The user's sign-off at an approval gate. Only a person can run this: it needs a real terminal
// and a typed "yes". Claude prepares the material and gives the user this command.
//   node confirm.mjs <project> brand                 Gate 1A: BRAND-DNA.md
//   node confirm.mjs <project> facts                 Gate 1:  intake/INTAKE.md (no "(guess)" left)
//   node confirm.mjs <project> footage --mode crop   Footage: out/footage_report.md, mode crop|blur|placeholders|none
//   node confirm.mjs <project> script                Gate 2:  vo.json (the voiceover is generated only after this)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import os from 'node:os';
import path from 'node:path';
import { readJSON, GATE_FILES, gateHash, arg } from './engine/lib.mjs';

const project = process.argv[2] && path.resolve(process.argv[2]);
const gate = process.argv[3];
if (!project || !existsSync(path.join(project, 'project.json')) || !GATE_FILES[gate]) {
  console.error('Usage: node confirm.mjs <project> brand|facts|footage|script [--mode crop|blur|placeholders|none]');
  process.exit(2);
}
if (!process.stdin.isTTY) {
  console.error('This is your sign-off, so you run it yourself: open a terminal window and paste the command there.');
  process.exit(1);
}
const cfgFile = path.join(project, 'project.json');
const cfg = readJSON(cfgFile);
const files = GATE_FILES[gate].map((f) => path.join(project, f));
for (const f of files) if (!existsSync(f)) { console.error(`Nothing to confirm yet: ${f} does not exist.`); process.exit(1); }

const show = gate === 'footage' ? path.join(project, 'out/footage_report.md') : files[0];
if (gate === 'facts') {
  // Only the answer lines ("- question: answer") count, not the form's own instructions.
  const answers = readFileSync(files[0], 'utf8').split('\n').filter((l) => /^- .+:/.test(l));
  if (answers.some((l) => /_{4,}|\(guess\)/i.test(l))) {
    console.error(`INTAKE.md still has blanks or "(guess)" answers. Correct them (or tell Claude), then run this again.\n  ${files[0]}`);
    process.exit(1);
  }
}
const mode = arg('--mode');
if (gate === 'footage' && !['crop', 'blur', 'placeholders', 'none'].includes(mode)) {
  console.error('Choose what happens to the recording: --mode crop | blur | placeholders | none'); process.exit(2);
}

const what = {
  brand: 'the brand DNA (colors, font, logo, tone of voice)',
  facts: 'the facts and figures in the intake form',
  footage: `the footage decision: ${mode}`,
  script: 'the voiceover script (the voice is generated after this)',
}[gate];
console.log(`\nYou are approving ${what}.\nReview: ${show}\n`);
const rl = createInterface({ input: process.stdin, output: process.stdout });
const answer = (await rl.question('Type yes to approve, anything else to cancel: ').catch(() => '')).trim().toLowerCase();
rl.close();
if (answer !== 'yes') { console.log('Not approved. Nothing changed.'); process.exit(1); }

cfg.confirmations = { ...(cfg.confirmations || {}), [gate]: { at: new Date().toISOString(), by: os.userInfo().username, hash: gateHash(project, gate), ...(mode && { mode }) } };
if (gate === 'footage') cfg.footageMode = mode;
writeFileSync(cfgFile, JSON.stringify(cfg, null, 2) + '\n');
console.log(`Approved: ${what}.`);
