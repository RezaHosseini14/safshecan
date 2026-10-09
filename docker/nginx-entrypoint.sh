#!/bin/sh
set -eu

mkdir -p /etc/nginx/certs

if [ ! -s /etc/nginx/certs/server.crt ] || [ ! -s /etc/nginx/certs/server.key ]; then
  if ! command -v openssl >/dev/null 2>&1; then
    apk add --no-cache openssl
  fi
  host="${TLS_HOST:-127.0.0.1}"
  openssl req -x509 -nodes -days 825 -newkey rsa:2048 \
    -keyout /etc/nginx/certs/server.key \
    -out /etc/nginx/certs/server.crt \
    -subj "/CN=${host}" \
    -addext "subjectAltName=IP:${host}"
fi

exec /docker-entrypoint.sh nginx -g 'daemon off;'
