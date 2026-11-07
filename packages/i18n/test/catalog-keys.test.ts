import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const auditScript = path.join(PKG_ROOT, 'scripts', 'audit-keys.mjs');

describe('message catalog', () => {
  it('defines every key referenced by useTranslations and t() in app packages', () => {
    let stdout = '';
    let exitCode = 0;
    try {
      stdout = execFileSync(process.execPath, [auditScript], {
        cwd: PKG_ROOT,
        encoding: 'utf8',
      });
    } catch (err: unknown) {
      exitCode = 1;
      if (err && typeof err === 'object' && 'stdout' in err) {
        stdout = String((err as { stdout?: string }).stdout ?? '');
      }
    }
    expect(exitCode, stdout || 'audit-keys failed').toBe(0);
  });
});
