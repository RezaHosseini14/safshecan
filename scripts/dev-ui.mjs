import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Optional HMR mode: Next.js on :3000 proxies /api+/ws to Nest on internal :3001.
 * Prefer `pnpm dev` for the normal single-port stack (Nest serves UI+API on :3000).
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
    '--filter=@saf-shekan/frontend',
    '--filter=@saf-shekan/core',
  ],
  {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      SAF_SHEKAN_WEB_DEV: '1',
    },
  }
);

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
