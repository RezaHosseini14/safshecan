import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const backendDir = path.join(rootDir, 'apps', 'backend');
const backendDistDir = path.join(backendDir, 'dist');
const backendDataDistDir = path.join(backendDistDir, 'data');
const backendDataSrcDir = path.join(backendDir, 'src', 'data');

console.log('⚡ [1/3] Building @saf-shekan/core shared package...');
execSync('pnpm --filter @saf-shekan/core build', {
  cwd: rootDir,
  stdio: 'inherit',
});

console.log('\n⚙️ [2/3] Compiling @saf-shekan/backend TypeScript with tsc...');
execSync('pnpm --filter @saf-shekan/backend build', {
  cwd: rootDir,
  stdio: 'inherit',
});

console.log('\n📊 [3/3] Copying TSE data assets (symbols and historical IPOs)...');
if (fs.existsSync(backendDataSrcDir)) {
  if (!fs.existsSync(backendDataDistDir)) {
    fs.mkdirSync(backendDataDistDir, { recursive: true });
  }
  fs.cpSync(backendDataSrcDir, backendDataDistDir, { recursive: true });
  console.log('✓ TSE Data assets copied to backend dist/data.');
}

console.log('\n🎉 Backend monorepo build completed (API-only; UI lives in apps/frontend).');
