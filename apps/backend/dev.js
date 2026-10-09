import { spawn, execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// API-only Nest on :3000 by default.
// `pnpm dev:ui` sets SAF_SHEKAN_WEB_DEV=1 so Nest moves to :3001 for Next HMR on :3000.
const webDev =
  process.env.SAF_SHEKAN_WEB_DEV === '1' || process.env.SAF_SHEKAN_WEB_DEV === 'true';
if (webDev) {
  process.env.PORT = '3001';
} else {
  // Force :3000 even if a stale PORT=3001 remains from a prior `dev:ui` run.
  process.env.PORT = '3000';
}

// Prevent watch restarts from opening a new browser tab every time dist rebuilds.
process.env.SAF_SHEKAN_SKIP_BROWSER = '1';

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
  env: process.env,
});

// 3. Start node with --watch on the module graph only (not the whole dist tree).
// Watching all of dist restarts the API whenever runtime writes hit dist/data
// (e.g. symbols.json cache) or when tsc emits .d.ts/.map files.
const nodeProc = spawn(process.execPath, ['--watch', '--watch-preserve-output', 'dist/index.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: process.env,
});

let shuttingDown = false;

function cleanup() {
  if (shuttingDown) return;
  shuttingDown = true;
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
// Keep tsc+parent alive even if the watched script crashes; node --watch will retry on next change.
nodeProc.on('exit', (code, signal) => {
  if (shuttingDown) return;
  console.error(`[Dev] API watcher exited (code=${code}, signal=${signal}). Leaving tsc running.`);
});
