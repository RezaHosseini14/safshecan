import { spawn, execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

try {
  // 1. Initial build to make sure dist exists with full decorator metadata
  execSync('npx tsc', { cwd: __dirname, stdio: 'inherit' });
} catch (err) {
  console.error('[Dev] Initial compilation error:', err.message);
}

// 2. Start tsc in watch mode
const tscProc = spawn('npx', ['tsc', '-w', '--preserveWatchOutput'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true,
});

// 3. Start node server with native file watcher
const nodeProc = spawn(
  process.execPath,
  ['--watch-path=dist', '--watch', 'dist/index.js'],
  {
    cwd: __dirname,
    stdio: 'inherit',
  }
);

function cleanup() {
  try {
    tscProc.kill();
  } catch {}
  try {
    nodeProc.kill();
  } catch {}
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
nodeProc.on('exit', (code) => {
  if (code && code !== 0) {
    cleanup();
  }
});
