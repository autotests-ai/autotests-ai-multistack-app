#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/home/reference_app_copy/reference-app-copy}"
REPO_URL="${REPO_URL:-https://github.com/autotests-ai/reference-app-copy.git}"
export SERVER_PORT="${SERVER_PORT:-8800}"
PUBLIC_URL="${PUBLIC_URL:-https://backend_java_spring.reference-app-copy.autotests.ai}"
SKIP_BUILD="${SKIP_BUILD:-0}"
HEALTH_URL="http://127.0.0.1:${SERVER_PORT}/api/health"
MAX_ATTEMPTS="${HEALTH_POLL_ATTEMPTS:-30}"
SLEEP_SECS="${HEALTH_POLL_SLEEP:-2}"
NGINX_CONF="deploy/nginx/backend_java_spring.reference-app-copy.autotests.ai.conf"

if [[ ! -d "$APP_DIR/.git" ]]; then
  sudo mkdir -p "$APP_DIR"
  sudo chown "$(whoami):$(whoami)" "$APP_DIR"
  git -c http.proxy= -c https.proxy= clone "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"
git -c http.proxy= -c https.proxy= fetch --all
git reset --hard origin/main

if [[ "$SKIP_BUILD" == "1" ]]; then
  docker compose up -d --force-recreate --no-build --remove-orphans
else
  docker compose build backend web
  docker compose up -d --force-recreate --remove-orphans
fi

for i in $(seq 1 "$MAX_ATTEMPTS"); do
  if curl --noproxy '*' -fsS "$HEALTH_URL" | grep -q '"status":"ok"'; then
    echo "Health OK: $HEALTH_URL (attempt $i)"
    break
  fi
  if [[ "$i" -eq "$MAX_ATTEMPTS" ]]; then
    echo "FAIL: health not ok after ${MAX_ATTEMPTS} attempts: $HEALTH_URL" >&2
    exit 1
  fi
  sleep "$SLEEP_SECS"
done

if [[ -f "$NGINX_CONF" ]]; then
  sudo NGINX_CONF_SRC="./${NGINX_CONF}" \
    NGINX_SITE_NAME=backend_java_spring.reference-app-copy \
    SSL_DOMAIN=backend_java_spring.reference-app-copy.autotests.ai \
    bash deploy/nginx/sync-nginx.sh
fi

bash deploy/smoke-remote.sh "$PUBLIC_URL"

echo "Deploy OK: ${PUBLIC_URL} ($(git rev-parse --short HEAD))"
