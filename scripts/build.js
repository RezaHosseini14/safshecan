import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const coreDir = path.join(rootDir, 'packages', 'core');
const webDir = path.join(rootDir, 'apps', 'web');
const apiDir = path.join(rootDir, 'apps', 'api');

const webOutDir = path.join(webDir, 'out');
const apiDistDir = path.join(apiDir, 'dist');
const apiPublicDistDir = path.join(apiDistDir, 'public');
const apiPublicSrcDir = path.join(apiDir, 'src', 'public');
const apiDataDistDir = path.join(apiDistDir, 'data');
const apiDataSrcDir = path.join(apiDir, 'src', 'data');

console.log('⚡ [1/5] Building @saf-shekan/core shared package...');
execSync('pnpm --filter @saf-shekan/core build', {
  cwd: rootDir,
  stdio: 'inherit',
});

console.log('\n⚡ [2/5] Building @saf-shekan/web Next.js frontend with static export...');
execSync('pnpm --filter @saf-shekan/web build', {
  cwd: rootDir,
  stdio: 'inherit',
  env: { ...process.env, NEXT_EXPORT: 'true' },
});

console.log('\n⚙️ [3/5] Compiling @saf-shekan/api TypeScript Backend with tsc...');
execSync('pnpm --filter @saf-shekan/api build', {
  cwd: rootDir,
  stdio: 'inherit',
});

console.log('\n📦 [4/5] Packaging static web assets to api/dist/public and api/src/public...');
if (!fs.existsSync(apiPublicDistDir)) {
  fs.mkdirSync(apiPublicDistDir, { recursive: true });
}
if (!fs.existsSync(apiPublicSrcDir)) {
  fs.mkdirSync(apiPublicSrcDir, { recursive: true });
}

if (fs.existsSync(webOutDir)) {
  fs.cpSync(webOutDir, apiPublicDistDir, { recursive: true });
  fs.cpSync(webOutDir, apiPublicSrcDir, { recursive: true });
  console.log('✓ Next.js build synced to API public distribution.');
}

console.log('\n📊 [5/5] Copying TSE data assets (symbols and historical IPOs)...');
if (fs.existsSync(apiDataSrcDir)) {
  if (!fs.existsSync(apiDataDistDir)) {
    fs.mkdirSync(apiDataDistDir, { recursive: true });
  }
  fs.cpSync(apiDataSrcDir, apiDataDistDir, { recursive: true });
  console.log('✓ TSE Data assets copied to API dist/data.');
}

console.log('\n🎉 Monorepo build successfully completed! Ready for production.');
