import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { t } from '../src/index.ts';

const ARABIC = /[\u0600-\u06FF]/;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const SKIP_DIRS = new Set(['node_modules', 'dist', '.next', 'out', 'coverage', 'messages']);

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = path.join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (name === 'test' || name === '__tests__') continue;
      walk(full, out);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(name) || name.endsWith('.d.ts')) continue;
    if (/\.test\.(ts|tsx)$/.test(name)) continue;
    out.push(full);
  }
  return out;
}

function lineOf(source: string, index: number): number {
  return source.slice(0, index).split('\n').length;
}

function quotedPersian(source: string): string[] {
  const hits: string[] = [];
  let i = 0;
  while (i < source.length) {
    if (source.startsWith('//', i)) {
      const next = source.indexOf('\n', i);
      i = next < 0 ? source.length : next + 1;
      continue;
    }
    if (source.startsWith('/*', i)) {
      const next = source.indexOf('*/', i + 2);
      i = next < 0 ? source.length : next + 2;
      continue;
    }
    const quote = source[i];
    if (quote !== '"' && quote !== "'" && quote !== '`') {
      i += 1;
      continue;
    }
    const start = i;
    i += 1;
    let body = '';
    while (i < source.length) {
      if (source[i] === '\\') {
        body += source.slice(i, i + 2);
        i += 2;
        continue;
      }
      if (quote === '`' && source[i] === '$' && source[i + 1] === '{') {
        i += 2;
        let depth = 1;
        while (i < source.length && depth > 0) {
          if (source[i] === '{') depth += 1;
          else if (source[i] === '}') depth -= 1;
          i += 1;
        }
        continue;
      }
      if (source[i] === quote) break;
      body += source[i];
      i += 1;
    }
    if (ARABIC.test(body)) hits.push(`${lineOf(source, start)}:${body.slice(0, 80)}`);
    i += 1;
  }
  return hits;
}

function barePersian(source: string): string[] {
  let stripped = '';
  let i = 0;
  while (i < source.length) {
    if (source.startsWith('//', i)) {
      const next = source.indexOf('\n', i);
      stripped += '\n';
      i = next < 0 ? source.length : next + 1;
      continue;
    }
    if (source.startsWith('/*', i)) {
      const next = source.indexOf('*/', i + 2);
      i = next < 0 ? source.length : next + 2;
      continue;
    }
    const quote = source[i];
    if (quote === '"' || quote === "'" || quote === '`') {
      i += 1;
      while (i < source.length) {
        if (source[i] === '\\') {
          i += 2;
          continue;
        }
        if (quote === '`' && source[i] === '$' && source[i + 1] === '{') {
          i += 2;
          let depth = 1;
          while (i < source.length && depth > 0) {
            if (source[i] === '{') depth += 1;
            else if (source[i] === '}') depth -= 1;
            i += 1;
          }
          continue;
        }
        if (source[i] === quote) {
          i += 1;
          break;
        }
        i += 1;
      }
      stripped += ' ';
      continue;
    }
    stripped += source[i];
    i += 1;
  }
  const hits: string[] = [];
  stripped.split('\n').forEach((line, index) => {
    if (ARABIC.test(line)) hits.push(`${index + 1}:${line.trim().slice(0, 80)}`);
  });
  return hits;
}

describe('fa catalog', () => {
  it('renders a namespaced message', () => {
    expect(t('engine', 'disarmed')).toBe('موتور سرخطی با موفقیت غیرفعال شد.');
    expect(t('engine', 'targetPassed', { time: '08:45:00.000' })).toContain('08:45:00.000');
  });

  it('rejects Persian copy outside the message catalog', () => {
    const files = [...walk(path.join(ROOT, 'apps')), ...walk(path.join(ROOT, 'packages'))];
    const failures: string[] = [];
    for (const file of files) {
      if (file.includes(`${path.sep}packages${path.sep}i18n${path.sep}`)) continue;
      const source = readFileSync(file, 'utf8');
      const hits = [...quotedPersian(source), ...barePersian(source)];
      if (hits.length > 0) failures.push(`${path.relative(ROOT, file)}\n  ${hits.join('\n  ')}`);
    }
    expect(failures).toEqual([]);
  });
});
