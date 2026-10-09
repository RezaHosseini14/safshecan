import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * API-only: Nest backend on :3000.
 * For UI + API together, use `pnpm dev:ui` (Next :3000 → Nest :3001).
 */
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const child = spawn(
  'pnpm',
  [
    'exec',
    'turbo',
    'run',
    'dev',
    '--filter=@saf-shekan/backend',
    '--filter=@saf-shekan/core',
  ],
  {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      PORT: '3000',
      SAF_SHEKAN_WEB_DEV: '0',
    },
  }
);

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
