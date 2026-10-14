// Print the text of a use-case document (.docx, .md, .txt; .pdf when pdftotext is installed).
//   node engine/read_doc.mjs <file>
// Works on macOS and Windows without extra tools for .docx. For a .pdf without pdftotext,
// read the file with your own file reader instead.
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { docxText } from './lib.mjs';

const file = process.argv[2];
if (!file) { console.error('Usage: node engine/read_doc.mjs <file>'); process.exit(2); }
const ext = path.extname(file).toLowerCase();
if (ext === '.docx') console.log(docxText(file));
else if (ext === '.pdf') {
  try { console.log(execFileSync('pdftotext', ['-layout', file, '-']).toString()); }
  catch { console.error('pdftotext is not installed: read the PDF directly instead.'); process.exit(1); }
} else console.log(readFileSync(file, 'utf8'));
