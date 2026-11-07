#!/usr/bin/env bash
# Install/configure host nginx + Let's Encrypt for safshekan.rmhosseini.ir
# Intended to run ON the VPS (self-hosted runner or SSH).
set -euo pipefail

DOMAIN="${DOMAIN:-safshekan.rmhosseini.ir}"
EMAIL="${CERTBOT_EMAIL:-admin@rmhosseini.ir}"
SITE_SRC="$(cd "$(dirname "$0")" && pwd)/host-nginx/${DOMAIN}.conf"
SITE_AVAIL="/etc/nginx/sites-available/${DOMAIN}"
SITE_ENABLED="/etc/nginx/sites-enabled/${DOMAIN}"
WEBROOT="/var/www/certbot"
APP_ENV="${SAFSHEKAN_ENV:-/opt/saf-shekan/.env}"

if [ ! -f "$SITE_SRC" ]; then
  echo "::error::Missing nginx template: $SITE_SRC"
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y nginx certbot python3-certbot-nginx curl

mkdir -p "$WEBROOT"
chown -R www-data:www-data "$WEBROOT" 2>/dev/null || true

if [ -L /etc/nginx/sites-enabled/default ]; then
  rm -f /etc/nginx/sites-enabled/default
fi

cp "$SITE_SRC" "$SITE_AVAIL"
ln -sfn "$SITE_AVAIL" "$SITE_ENABLED"

nginx -t
systemctl enable nginx
systemctl reload nginx

echo "--> Requesting/renewing Let's Encrypt cert for ${DOMAIN}..."
certbot --nginx \
  -d "$DOMAIN" \
  --non-interactive \
  --agree-tos \
  --email "$EMAIL" \
  --redirect \
  --keep-until-expiring \
  || certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "$EMAIL" --redirect

nginx -t
systemctl reload nginx

if [ -f "$APP_ENV" ]; then
  touch "$APP_ENV"
  for kv in \
    "CSRF_ALLOWED_ORIGINS=https://${DOMAIN}" \
    "APP_URL=https://${DOMAIN}" \
    "BACKEND_PORT=2030" \
    "FRONTEND_PORT=2031" \
    "NGINX_PORT=2032"; do
    key=${kv%%=*}
    val=${kv#*=}
    if grep -q "^${key}=" "$APP_ENV"; then
      sed -i "s|^${key}=.*|${key}=${val}|" "$APP_ENV"
    else
      echo "${key}=${val}" >> "$APP_ENV"
    fi
  done
  echo "--> Updated ${APP_ENV} public URLs / ports for https://${DOMAIN}"
fi

echo "--> Local health via host nginx..."
curl -fsS --resolve "${DOMAIN}:443:127.0.0.1" "https://${DOMAIN}/api/health" || \
  curl -fsS -H "Host: ${DOMAIN}" "http://127.0.0.1/api/health" || true
echo ""

echo "--> Public check (may go via Cloudflare):"
curl -fsSI "https://${DOMAIN}/api/health" | head -15 || \
  echo "WARN: public HTTPS check failed — set Cloudflare SSL to Full (strict); ensure 80/443 open."

echo "HOST_DOMAIN_OK domain=${DOMAIN}"
