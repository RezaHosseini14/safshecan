#!/usr/bin/env bash
# Runs ON the VPS in $REMOTE_DIR (default /opt/saf-shekan).
# Required env: BACKEND_IMAGE, FRONTEND_IMAGE
# Optional: GHCR_USER, GHCR_TOKEN, TLS_HOST, REMOTE_DIR
set -euo pipefail

REMOTE_DIR="${REMOTE_DIR:-/opt/saf-shekan}"
TLS_HOST="${TLS_HOST:-safshekan.rmhosseini.ir}"
cd "$REMOTE_DIR"
unset COMPOSE_FILE COMPOSE_PATH || true
export COMPOSE_PROJECT_NAME=saf-shekan

echo "--> Deploy host: $(hostname) pwd=$(pwd)"
echo "--> Compose ports (must include 2030/2031/2032):"
grep -nE 'ports:|2030|2031|2032|BACKEND_PORT|FRONTEND_PORT|NGINX_PORT' docker-compose.yml || true

if [ -n "${GHCR_TOKEN:-}" ]; then
  echo "$GHCR_TOKEN" | docker login ghcr.io -u "${GHCR_USER:-}" --password-stdin
fi

touch .env
if grep -q '^BACKEND_IMAGE=' .env; then
  sed -i "s|^BACKEND_IMAGE=.*|BACKEND_IMAGE=${BACKEND_IMAGE}|" .env
else
  echo "BACKEND_IMAGE=${BACKEND_IMAGE}" >> .env
fi

if grep -q '^FRONTEND_IMAGE=' .env; then
  sed -i "s|^FRONTEND_IMAGE=.*|FRONTEND_IMAGE=${FRONTEND_IMAGE}|" .env
else
  echo "FRONTEND_IMAGE=${FRONTEND_IMAGE}" >> .env
fi

for kv in BACKEND_PORT=2030 FRONTEND_PORT=2031 NGINX_PORT=2032; do
  key=${kv%%=*}; val=${kv#*=}
  if grep -q "^${key}=" .env; then
    sed -i "s|^${key}=.*|${key}=${val}|" .env
  else
    echo "${key}=${val}" >> .env
  fi
done

for kv in \
  "CSRF_ALLOWED_ORIGINS=https://${TLS_HOST}" \
  "APP_URL=https://${TLS_HOST}"; do
  key=${kv%%=*}; val=${kv#*=}
  if grep -q "^${key}=" .env; then
    sed -i "s|^${key}=.*|${key}=${val}|" .env
  else
    echo "${key}=${val}" >> .env
  fi
done

if [ -z "${BACKEND_IMAGE:-}" ] || [ -z "${FRONTEND_IMAGE:-}" ]; then
  echo "::error::Build jobs did not pass backend/frontend image refs"
  exit 1
fi
echo "--> Target images: backend=${BACKEND_IMAGE} frontend=${FRONTEND_IMAGE}"
grep -E '^(BACKEND_IMAGE|FRONTEND_IMAGE)=' .env

if ! grep -q '^POSTGRES_PASSWORD=' .env; then
  echo "POSTGRES_PASSWORD=$(openssl rand -hex 24)" >> .env
fi
if ! grep -q '^REDIS_PASSWORD=' .env; then
  echo "REDIS_PASSWORD=$(openssl rand -hex 24)" >> .env
fi
if ! grep -q '^ENCRYPTION_MASTER_KEY=' .env; then
  echo "ENCRYPTION_MASTER_KEY=$(openssl rand -hex 32)" >> .env
fi
if ! grep -q '^JWT_ACCESS_SECRET=.\+' .env; then
  sed -i '/^JWT_ACCESS_SECRET=/d' .env || true
  echo "JWT_ACCESS_SECRET=$(openssl rand -base64 48)" >> .env
fi
if ! grep -q '^JWT_REFRESH_SECRET=.\+' .env; then
  sed -i '/^JWT_REFRESH_SECRET=/d' .env || true
  echo "JWT_REFRESH_SECRET=$(openssl rand -base64 48)" >> .env
fi
if ! grep -q '^JWT_PRIVATE_KEY=.\+' .env || ! grep -q '^JWT_PUBLIC_KEY=.\+' .env; then
  echo "--> Generating persistent JWT_PRIVATE_KEY / JWT_PUBLIC_KEY..."
  sed -i '/^JWT_PRIVATE_KEY=/d;/^JWT_PUBLIC_KEY=/d' .env || true
  jwt_tmp=$(mktemp -d)
  openssl genpkey -algorithm Ed25519 -out "$jwt_tmp/private.pem"
  openssl pkey -in "$jwt_tmp/private.pem" -pubout -out "$jwt_tmp/public.pem"
  priv_esc=$(awk 'NF {printf "%s\\n", $0}' "$jwt_tmp/private.pem")
  pub_esc=$(awk 'NF {printf "%s\\n", $0}' "$jwt_tmp/public.pem")
  printf 'JWT_PRIVATE_KEY="%s"\n' "$priv_esc" >> .env
  printf 'JWT_PUBLIC_KEY="%s"\n' "$pub_esc" >> .env
  rm -rf "$jwt_tmp"
fi
if ! grep -q '^JWT_KEY_ID=.\+' .env; then
  sed -i '/^JWT_KEY_ID=/d' .env || true
  echo "JWT_KEY_ID=safshekan-ed25519-v1" >> .env
fi
if ! grep -q '^INITIAL_ADMIN_USERNAME=.\+' .env; then
  echo "INITIAL_ADMIN_USERNAME=admin" >> .env
fi
if ! grep -q '^INITIAL_ADMIN_PASSWORD=.\+' .env; then
  echo "INITIAL_ADMIN_PASSWORD=SafShekan_Dev123!" >> .env
fi
if ! grep -q '^INITIAL_ADMIN_FULL_NAME=.\+' .env; then
  echo "INITIAL_ADMIN_FULL_NAME=System Administrator" >> .env
fi

sed -i '/^API_IMAGE=/d;/^WEB_IMAGE=/d' .env || true
docker rm -f saf-shekan-api saf-shekan-web 2>/dev/null || true

mkdir -p docker/certs
if [ ! -s docker/certs/server.crt ] || [ ! -s docker/certs/server.key ]; then
  echo "--> Creating the self-signed TLS certificate on the host..."
  SAN="DNS:${TLS_HOST}"
  case "${TLS_HOST}" in
    *[!0-9.]* ) ;;
    *) SAN="IP:${TLS_HOST}" ;;
  esac
  openssl req -x509 -nodes -days 825 -newkey rsa:2048 \
    -keyout docker/certs/server.key \
    -out docker/certs/server.crt \
    -subj "/CN=${TLS_HOST}" \
    -addext "subjectAltName=${SAN}"
fi

echo "--> Pulling latest container images..."
pulled=0
for attempt in 1 2 3 4 5; do
  if docker compose -f docker-compose.yml pull backend frontend; then
    pulled=1
    break
  fi
  echo "compose pull failed (attempt ${attempt}), retrying..."
  sleep $((attempt * 4))
done
if [ "$pulled" != 1 ]; then
  echo "::error::docker compose pull failed after 5 attempts"
  exit 1
fi

echo "--> Starting Postgres and Redis data layer..."
if ! docker compose -f docker-compose.yml up -d postgres redis --wait --wait-timeout 60; then
  echo "::error::Postgres or Redis failed to become healthy within 60s"
  docker compose -f docker-compose.yml ps || true
  docker logs saf-shekan-postgres --tail 50 || true
  docker logs saf-shekan-redis --tail 50 || true
  exit 1
fi

echo "--> Executing database migrations..."
if ! docker compose -f docker-compose.yml run --rm --no-deps backend \
  node apps/backend/dist/infrastructure/database/migrate.js; then
  echo "::error::Database migrations failed! Halting deployment to protect uptime."
  exit 1
fi

echo "--> Seeding RBAC, permissions, and initial admin (from INITIAL_ADMIN_* in .env)..."
if ! docker compose -f docker-compose.yml run --rm --no-deps backend \
  node apps/backend/dist/infrastructure/database/seed.js; then
  echo "::error::Database seed failed! Halting deployment to protect uptime."
  exit 1
fi

up_one() {
  local service="$1"
  local timeout="$2"
  echo "--> Starting ${service}..."
  if docker compose -f docker-compose.yml up -d --force-recreate --wait --wait-timeout "$timeout" "$service"; then
    return 0
  fi
  echo "--> ${service} failed; removing stale container_name and retrying once..."
  docker rm -f "saf-shekan-${service}" 2>/dev/null || true
  docker compose -f docker-compose.yml up -d --force-recreate --wait --wait-timeout "$timeout" "$service"
}

echo "--> Recreating app tier one service at a time (DB left running)..."
if ! up_one backend 180; then
  echo "::error::backend failed to become healthy"
  docker logs saf-shekan-backend --tail 120 || true
  exit 1
fi
if ! up_one frontend 180; then
  echo "::error::frontend failed to become healthy"
  docker logs saf-shekan-frontend --tail 120 || true
  exit 1
fi
if ! up_one nginx 120; then
  echo "::error::nginx failed to become healthy"
  docker logs saf-shekan-nginx --tail 120 || true
  exit 1
fi

echo "--> Asserting app containers exist and are running..."
for c in saf-shekan-backend saf-shekan-frontend saf-shekan-nginx; do
  if ! docker ps --format '{{.Names}}' | grep -qx "$c"; then
    echo "::error::Expected running container missing: $c"
    docker ps -a --filter name=saf-shekan || true
    exit 1
  fi
done

echo "--> Verifying the running containers use the freshly built images..."
EXPECTED_BACKEND_ID=$(docker image inspect --format '{{.Id}}' "$BACKEND_IMAGE" 2>/dev/null || echo '')
EXPECTED_FRONTEND_ID=$(docker image inspect --format '{{.Id}}' "$FRONTEND_IMAGE" 2>/dev/null || echo '')
RUNNING_BACKEND_ID=$(docker inspect --format '{{.Image}}' saf-shekan-backend 2>/dev/null || echo '')
RUNNING_FRONTEND_ID=$(docker inspect --format '{{.Image}}' saf-shekan-frontend 2>/dev/null || echo '')
echo "    backend:  running=${RUNNING_BACKEND_ID} expected=${EXPECTED_BACKEND_ID} (${BACKEND_IMAGE})"
echo "    frontend: running=${RUNNING_FRONTEND_ID} expected=${EXPECTED_FRONTEND_ID} (${FRONTEND_IMAGE})"
if [ -z "$RUNNING_BACKEND_ID" ] || [ "$RUNNING_BACKEND_ID" != "$EXPECTED_BACKEND_ID" ] \
  || [ -z "$RUNNING_FRONTEND_ID" ] || [ "$RUNNING_FRONTEND_ID" != "$EXPECTED_FRONTEND_ID" ]; then
  echo "::error::Running containers are not on the built images; the deployment did not take effect"
  docker ps --filter name=saf-shekan || true
  exit 1
fi

echo "--> Verifying published host ports (backend:2030 frontend:2031 nginx:2032)..."
docker ps --filter name=saf-shekan --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'
BACKEND_PORTS=$(docker port saf-shekan-backend 3000/tcp 2>/dev/null || true)
FRONTEND_PORTS=$(docker port saf-shekan-frontend 3000/tcp 2>/dev/null || true)
NGINX_PORTS=$(docker port saf-shekan-nginx 443/tcp 2>/dev/null || true)
echo "    backend 3000/tcp -> ${BACKEND_PORTS}"
echo "    frontend 3000/tcp -> ${FRONTEND_PORTS}"
echo "    nginx 443/tcp -> ${NGINX_PORTS}"
echo "$BACKEND_PORTS" | grep -qE '(:|::)2030$' || {
  echo "::error::backend is not published on host port 2030 (got: ${BACKEND_PORTS})"
  exit 1
}
echo "$FRONTEND_PORTS" | grep -qE '(:|::)2031$' || {
  echo "::error::frontend is not published on host port 2031 (got: ${FRONTEND_PORTS})"
  exit 1
}
echo "$NGINX_PORTS" | grep -qE '(:|::)2032$' || {
  echo "::error::nginx is not published on host port 2032 (got: ${NGINX_PORTS})"
  exit 1
}

echo "--> Local health probe via nginx on the VPS..."
if ! docker exec saf-shekan-nginx wget -qO- http://127.0.0.1/api/health; then
  echo "::error::nginx local /api/health failed after recreate"
  docker logs saf-shekan-backend --tail 80 || true
  docker logs saf-shekan-frontend --tail 80 || true
  docker logs saf-shekan-nginx --tail 80 || true
  exit 1
fi
echo ""

echo "--> Reloading nginx so the mounted config is applied..."
reloaded=0
for attempt in $(seq 1 20); do
  if docker exec saf-shekan-nginx nginx -s reload; then
    reloaded=1
    break
  fi
  sleep 2
done
if [ "$reloaded" != 1 ]; then
  echo "::error::nginx did not accept reload"
  docker logs saf-shekan-nginx --tail 80 || true
  exit 1
fi

echo "--> Cleaning up unused dangling images..."
docker image prune -f || true
echo "HOST_DEPLOY_OK"
