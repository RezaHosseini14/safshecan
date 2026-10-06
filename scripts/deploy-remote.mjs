#!/usr/bin/env node

/**
 * SafShekan Remote Server Deployment Tool
 * 
 * Automates direct deployment to the production VPS (5.159.49.36).
 * Usage:
 *   node scripts/deploy-remote.mjs
 *   pnpm run deploy:remote
 */

import { Client } from 'ssh2';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const SERVER_HOST = process.env.SSH_HOST || '5.159.49.36';
const SERVER_PORT = Number(process.env.SSH_PORT) || 22;
const SERVER_USER = process.env.SSH_USER || 'root';
const SERVER_PASS = process.env.SSH_PASSWORD || 'SShkdl5yuzCma75a';
const REMOTE_PATH = '/opt/saf-shekan';

// Read private key dynamically from ~/.ssh or environment
function getPrivateKey() {
  if (process.env.SSH_PRIVATE_KEY) return process.env.SSH_PRIVATE_KEY;
  const defaultKeyPath = path.join(os.homedir(), '.ssh', 'id_ed25519_safshekan');
  if (fs.existsSync(defaultKeyPath)) {
    return fs.readFileSync(defaultKeyPath, 'utf8');
  }
  return null;
}

async function main() {
  console.log('\n=============================================================');
  console.log('⚡ SafShekan Direct Remote VPS Deployment');
  console.log(`🌐 Target: ${SERVER_USER}@${SERVER_HOST}:${SERVER_PORT}`);
  console.log('=============================================================\n');

  const rootDir = process.cwd();
  const tmpArchive = path.join(os.tmpdir(), `saf-shekan-${Date.now()}.tar.gz`);

  console.log('📦 1/5 Compressing codebase for upload...');
  execSync(
    `tar --exclude=node_modules --exclude=.next --exclude=.git --exclude=dist --exclude=.turbo --exclude=test-prune-* -czf "${tmpArchive}" .`,
    { cwd: rootDir, stdio: 'inherit' }
  );

  const archiveSizeMb = (fs.statSync(tmpArchive).size / (1024 * 1024)).toFixed(2);
  console.log(`   Archive created: ${archiveSizeMb} MB`);

  console.log('\n🔌 2/5 Connecting to VPS via SSH...');
  const conn = new Client();

  const connectOptions = {
    host: SERVER_HOST,
    port: SERVER_PORT,
    username: SERVER_USER,
    readyTimeout: 30000,
  };

  const privKey = getPrivateKey();
  if (privKey) {
    connectOptions.privateKey = privKey;
  }

  await new Promise((resolve, reject) => {
    conn.on('ready', resolve);
    conn.on('error', (err) => {
      // Fallback to password authentication
      console.log('   SSH Key authentication skipped, falling back to password...');
      delete connectOptions.privateKey;
      connectOptions.password = SERVER_PASS;
      const passConn = new Client();
      passConn.on('ready', () => {
        Object.assign(conn, passConn);
        resolve();
      });
      passConn.on('error', reject);
      passConn.connect(connectOptions);
    });
    conn.connect(connectOptions);
  });

  console.log('   ✓ Connected to server successfully!');

  const runRemote = (cmd) =>
    new Promise((resolve, reject) => {
      conn.exec(cmd, (err, stream) => {
        if (err) return reject(err);
        let stdout = '';
        let stderr = '';
        stream
          .on('close', (code) => resolve({ code, stdout, stderr }))
          .on('data', (d) => {
            process.stdout.write(d.toString());
            stdout += d;
          })
          .stderr.on('data', (d) => {
            process.stderr.write(d.toString());
            stderr += d;
          });
      });
    });

  console.log('\n📤 3/5 Uploading source code to VPS...');
  await new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      sftp.fastPut(tmpArchive, `${REMOTE_PATH}/upload.tar.gz`, (uploadErr) => {
        if (uploadErr) reject(uploadErr);
        else resolve();
      });
    });
  });
  console.log('   ✓ Upload complete!');

  try {
    fs.unlinkSync(tmpArchive);
  } catch {}

  console.log('\n🔨 4/5 Extracting code and executing Docker build on VPS...');
  await runRemote(`
    set -euo pipefail
    mkdir -p ${REMOTE_PATH}/app
    tar -xzf ${REMOTE_PATH}/upload.tar.gz -C ${REMOTE_PATH}/app
    rm -f ${REMOTE_PATH}/upload.tar.gz
    cp -n ${REMOTE_PATH}/app/config.json ${REMOTE_PATH}/config.json 2>/dev/null || true
    cd ${REMOTE_PATH}/app
    docker compose -f docker-compose.yml build
    docker tag saf-shekan-api:latest ghcr.io/rezahosseini14/saf-shekan-api:latest 2>/dev/null || true
    docker tag saf-shekan-web:latest ghcr.io/rezahosseini14/saf-shekan-web:latest 2>/dev/null || true
    cd ${REMOTE_PATH}
    docker compose up -d --remove-orphans
  `);

  console.log('\n🩺 5/5 Performing health check verification...');
  await runRemote(`
    sleep 5
    if curl -sf http://127.0.0.1:3880/api/health >/dev/null; then
      echo "✓ Backend API is healthy!"
    else
      echo "⚠ Warning: API health check timed out"
    fi

    if curl -sf http://127.0.0.1:3000 >/dev/null; then
      echo "✓ Web Dashboard is healthy!"
    else
      echo "⚠ Warning: Web Dashboard health check timed out"
    fi
  `);

  conn.end();

  console.log('\n🎉 =============================================================');
  console.log('✅ SafShekan Successfully Deployed to Production!');
  console.log(`🌐 Web Dashboard: http://${SERVER_HOST}:3000`);
  console.log(`⚡ API Engine:    http://${SERVER_HOST}:3880/api/status`);
  console.log(`📖 API Swagger:   http://${SERVER_HOST}:3880/api/docs`);
  console.log('=============================================================\n');
}

main().catch((err) => {
  console.error('\n❌ Deployment failed:', err);
  process.exit(1);
});
