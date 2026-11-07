import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const MSG = path.join(ROOT, 'packages/i18n/messages/fa');

function flatten(obj, prefix = '') {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      out.push(...flatten(v, p));
    } else {
      out.push(p);
    }
  }
  return out;
}

const catalogs = {};
for (const f of fs.readdirSync(MSG)) {
  if (!f.endsWith('.json')) continue;
  const ns = f.replace('.json', '');
  catalogs[ns] = new Set(flatten(JSON.parse(fs.readFileSync(path.join(MSG, f), 'utf8'))));
}

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      if (name === 'node_modules' || name === 'test' || name === '__tests__') continue;
      walk(full, files);
    } else if (
      /\.(ts|tsx)$/.test(name) &&
      !name.endsWith('.d.ts') &&
      !/\.test\.(ts|tsx)$/.test(name)
    ) {
      files.push(full);
    }
  }
  return files;
}

function hasKey(ns, key) {
  const top = ns.split('.')[0];
  const set = catalogs[top];
  if (!set) return false;
  if (set.has(key)) return true;
  if (ns.includes('.')) {
    const sub = ns.split('.').slice(1).join('.');
    if (set.has(`${sub}.${key}`)) return true;
  }
  return false;
}

const scanRoots = [
  path.join(ROOT, 'apps/frontend/src'),
  path.join(ROOT, 'apps/backend/src'),
  path.join(ROOT, 'packages/core/src'),
].filter((p) => fs.existsSync(p));

const files = scanRoots.flatMap((dir) => walk(dir));
const missing = [];

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const vars = {};
  const decl = /const\s+(\w+)\s*=\s*useTranslations\(\s*['"]([^'"]+)['"]\s*\)/g;
  let m;
  while ((m = decl.exec(src))) {
    vars[m[1]] = m[2];
  }

  const call = /\b(\w+)\(\s*['"]([^'"]+)['"]/g;
  while ((m = call.exec(src))) {
    if (!Object.hasOwn(vars, m[1])) continue;
    const ns = vars[m[1]];
    const key = m[2];
    if (key.includes('.')) {
      // dynamic keys like alert.${hit.kind} — skip
      continue;
    }
    if (!hasKey(ns, key)) {
      missing.push({ file: path.relative(ROOT, file), ns, key });
    }
  }
}

const tCallPat = /\bt\(\s*['"](\w+)['"]\s*,\s*['"]([^'"]+)['"]/g;
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  let tMatch;
  tCallPat.lastIndex = 0;
  while ((tMatch = tCallPat.exec(src))) {
    const ns = tMatch[1];
    const key = tMatch[2];
    if (!catalogs[ns]?.has(key)) {
      missing.push({ file: path.relative(ROOT, file), ns, key });
    }
  }
}

const uniq = new Map();
for (const item of missing) {
  uniq.set(`${item.ns}:${item.key}`, item);
}

const list = [...uniq.values()].sort((a, b) =>
  a.ns.localeCompare(b.ns) || a.key.localeCompare(b.key),
);

for (const item of list) {
  console.log(`${item.ns}.${item.key}  (${item.file})`);
}
console.log('---');
console.log('total missing', list.length);
process.exit(list.length > 0 ? 1 : 0);
