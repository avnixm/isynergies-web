import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import strip from 'strip-comments';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.css', '.mjs']);
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'dist', 'build']);
const SKIP_FILES = new Set(['.next-env.d.ts']);

function walk(dir, out) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) walk(full, out);
    } else if (EXT.has(path.extname(e.name)) && !SKIP_FILES.has(e.name)) {
      out.push(full);
    }
  }
}

const files = [];
walk(path.join(ROOT, 'app'), files);
walk(path.join(ROOT, 'scripts'), files);
walk(path.join(ROOT, 'lib'), files);
if (fs.existsSync(path.join(ROOT, 'types'))) walk(path.join(ROOT, 'types'), files);
['next.config.ts', 'drizzle.config.ts', 'eslint.config.mjs', 'postcss.config.mjs'].forEach((name) => {
  const p = path.join(ROOT, name);
  if (fs.existsSync(p) && EXT.has(path.extname(p))) files.push(p);
});

let ok = 0;
let err = 0;
for (const f of files) {
  try {
    const raw = fs.readFileSync(f, 'utf8');
    const out = strip(raw, { preserveNewlines: true });
    if (raw !== out) {
      fs.writeFileSync(f, out, 'utf8');
      ok++;
      console.log('Stripped:', path.relative(ROOT, f));
    }
  } catch (e) {
    err++;
    console.error('Error', f, e.message);
  }
}
console.log('Done. Stripped:', ok, 'Errors:', err);
if (ok > 0) {
  console.warn('Note: strip-comments can corrupt "//" inside strings (e.g. URLs). Check and fix any breakage.');
}
