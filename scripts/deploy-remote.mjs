#!/usr/bin/env node

/**
 * SafShekan Remote Server Deployment Tool (OpenSSH-based)
 *
 * Usage:
 *   node scripts/deploy-remote.mjs
 *   pnpm run deploy:remote
 *
 * Auth (required — one of):
 *   SSH_PRIVATE_KEY env (written to a temp key file), or
 *   ~/.ssh/id_ed25519_safshekan, or
 *   default ssh-agent / default identity
 *
 * Optional: SSH_PASSWORD is NOT used (use key auth only).
 */

import { execFileSync, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const SERVER_HOST = process.env.SSH_HOST || '5.159.49.36';
const SERVER_PORT = String(process.env.SSH_PORT || 22);
const SERVER_USER = process.env.SSH_USER || 'root';
const REMOTE_PATH = '/opt/saf-shekan';
const TARGET = `${SERVER_USER}@${SERVER_HOST}`;

function resolveIdentityFile() {
  if (process.env.SSH_PRIVATE_KEY) {
    const tmpKey = path.join(os.tmpdir(), `safshekan-deploy-${process.pid}.key`);
    fs.writeFileSync(tmpKey, process.env.SSH_PRIVATE_KEY.replace(/\r\n/g, '\n'), {
      mode: 0o600,
    });
    return { path: tmpKey, cleanup: true };
  }
  const defaultKeyPath = path.join(os.homedir(), '.ssh', 'id_ed25519_safshekan');
  if (fs.existsSync(defaultKeyPath)) {
    return { path: defaultKeyPath, cleanup: false };
  }
  return { path: null, cleanup: false };
}

function sshArgs(identityPath, extra = []) {
  const args = [
    '-p',
    SERVER_PORT,
    '-o',
    'StrictHostKeyChecking=accept-new',
    '-o',
    'ConnectTimeout=30',
    '-o',
    'ServerAliveInterval=30',
  ];
  if (identityPath) {
    args.push('-i', identityPath);
  }
  args.push(...extra);
  return args;
}

function runSsh(identityPath, remoteCommand) {
  execFileSync(
    'ssh',
    [...sshArgs(identityPath), TARGET, remoteCommand],
    { stdio: 'inherit' }
  );
}

function runScp(identityPath, localPath, remotePath) {
  const args = [
    '-P',
    SERVER_PORT,
    '-o',
    'StrictHostKeyChecking=accept-new',
    '-o',
    'ConnectTimeout=30',
  ];
  if (identityPath) {
    args.push('-i', identityPath);
  }
  args.push(localPath, `${TARGET}:${remotePath}`);
  execFileSync('scp', args, { stdio: 'inherit' });
}

async function main() {
  console.log('\n=============================================================');
  console.log('SafShekan Direct Remote VPS Deployment');
  console.log(`Target: ${TARGET}:${SERVER_PORT}`);
  console.log('=============================================================\n');

  const identity = resolveIdentityFile();
  if (!identity.path) {
    console.log('No dedicated key found; using default ssh identity / agent.');
  } else {
    console.log(`Using identity: ${identity.path}`);
  }

  const rootDir = process.cwd();
  const tmpArchive = path.join(os.tmpdir(), `saf-shekan-${Date.now()}.tar.gz`);

  console.log('1/5 Compressing codebase for upload...');
  const tarExcludes = [
    '--exclude=node_modules',
    '--exclude=.next',
    '--exclude=.git',
    '--exclude=dist',
    '--exclude=.turbo',
    '--exclude=test-prune-*',
    '--exclude=.tmp-stitch',
    '--exclude=*.log',
    '--exclude=.saf-shekan-dev.err.log',
    '--exclude=.saf-shekan-dev.out.log',
  ].join(' ');
  execSync(`tar ${tarExcludes} -czf "${tmpArchive}" .`, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true,
  });

  const archiveSizeMb = (fs.statSync(tmpArchive).size / (1024 * 1024)).toFixed(2);
  console.log(`   Archive created: ${archiveSizeMb} MB`);

  console.log('\n2/5 Preparing remote directory...');
  runSsh(identity.path, `mkdir -p ${REMOTE_PATH}/app ${REMOTE_PATH}/docker`);

  console.log('\n3/5 Uploading source archive...');
  runScp(identity.path, tmpArchive, `${REMOTE_PATH}/upload.tar.gz`);
  try {
    fs.unlinkSync(tmpArchive);
  } catch {
    // ignore
  }
  console.log('   Upload complete!');

  console.log('\n4/5 Extracting, building images, starting nginx gateway...');
  runSsh(
    identity.path,
    `
    set -euo pipefail
    mkdir -p ${REMOTE_PATH}/app ${REMOTE_PATH}/docker
    tar -xzf ${REMOTE_PATH}/upload.tar.gz -C ${REMOTE_PATH}/app
    rm -f ${REMOTE_PATH}/upload.tar.gz

    if [ ! -f ${REMOTE_PATH}/config.json ]; then
      cp ${REMOTE_PATH}/app/apps/backend/config.json ${REMOTE_PATH}/config.json 2>/dev/null \
        || cp ${REMOTE_PATH}/app/config.json ${REMOTE_PATH}/config.json 2>/dev/null \
        || echo '{}' > ${REMOTE_PATH}/config.json
    fi

    cp ${REMOTE_PATH}/app/docker-compose.yml ${REMOTE_PATH}/docker-compose.yml
    cp ${REMOTE_PATH}/app/docker/nginx.conf ${REMOTE_PATH}/docker/nginx.conf

    cd ${REMOTE_PATH}/app
    docker compose -f docker-compose.yml build

    docker rm -f saf-shekan-api saf-shekan-web 2>/dev/null || true

    cd ${REMOTE_PATH}
    touch .env
    if grep -q '^BACKEND_IMAGE=' .env; then
      sed -i 's|^BACKEND_IMAGE=.*|BACKEND_IMAGE=saf-shekan-backend:latest|' .env
    else
      echo 'BACKEND_IMAGE=saf-shekan-backend:latest' >> .env
    fi
    if grep -q '^FRONTEND_IMAGE=' .env; then
      sed -i 's|^FRONTEND_IMAGE=.*|FRONTEND_IMAGE=saf-shekan-frontend:latest|' .env
    else
      echo 'FRONTEND_IMAGE=saf-shekan-frontend:latest' >> .env
    fi
    sed -i '/^API_IMAGE=/d;/^WEB_IMAGE=/d' .env || true

    docker compose up -d --remove-orphans
    docker image prune -f || true
    `
  );

  console.log('\n5/5 Health check verification...');
  runSsh(
    identity.path,
    `
    set -euo pipefail
    STACK_UP=false
    for i in $(seq 1 40); do
      if curl -sf http://127.0.0.1:3000/api/health >/dev/null \
        && curl -sf http://127.0.0.1:3000 >/dev/null; then
        STACK_UP=true
        echo "Stack healthy on attempt $i"
        curl -s http://127.0.0.1:3000/api/health
        echo ""
        break
      fi
      echo "Waiting for nginx :3000... ($i/40)"
      sleep 3
    done
    if [ "$STACK_UP" = false ]; then
      echo "Health check failed"
      docker compose -f ${REMOTE_PATH}/docker-compose.yml ps || true
      docker compose -f ${REMOTE_PATH}/docker-compose.yml logs --tail=80 || true
      exit 1
    fi
    `
  );

  if (identity.cleanup && identity.path) {
    try {
      fs.unlinkSync(identity.path);
    } catch {
      // ignore
    }
  }

  console.log('\n=============================================================');
  console.log('SafShekan Successfully Deployed to Production!');
  console.log(`Frontend:       http://${SERVER_HOST}:3000`);
  console.log(`Backend Engine: http://${SERVER_HOST}:3000/api/status`);
  console.log(`API Swagger:    http://${SERVER_HOST}:3000/api/docs`);
  console.log(`Health:         http://${SERVER_HOST}:3000/api/health`);
  console.log('=============================================================\n');
}

main().catch((err) => {
  console.error('\nDeployment failed:', err);
  process.exit(1);
});
