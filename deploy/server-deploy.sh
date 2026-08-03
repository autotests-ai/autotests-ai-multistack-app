#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/home/selenoid/reference-app-copy}"
REPO_URL="${REPO_URL:-https://github.com/autotests-ai/reference-app-copy.git}"
export SERVER_PORT="${SERVER_PORT:-8084}"
PUBLIC_URL="${PUBLIC_URL:-https://reference-app-copy.autotests.ai}"
SKIP_BUILD="${SKIP_BUILD:-0}"
HEALTH_URL="http://127.0.0.1:${SERVER_PORT}/api/health"
MAX_ATTEMPTS="${HEALTH_POLL_ATTEMPTS:-30}"
SLEEP_SECS="${HEALTH_POLL_SLEEP:-2}"

if [[ ! -d "$APP_DIR/.git" ]]; then
  sudo mkdir -p "$APP_DIR"
  sudo chown "$(whoami):$(whoami)" "$APP_DIR"
  git -c http.proxy= -c https.proxy= clone "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"
git -c http.proxy= -c https.proxy= fetch --all
git reset --hard origin/main

if [[ "$SKIP_BUILD" == "1" ]]; then
  docker compose up -d --no-build --remove-orphans
else
  docker compose build backend
  docker compose up -d --remove-orphans
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

bash deploy/smoke-remote.sh "$PUBLIC_URL"

if [[ -f deploy/nginx/reference-app-copy.autotests.ai.conf ]]; then
  sudo NGINX_CONF_SRC=./deploy/nginx/reference-app-copy.autotests.ai.conf \
    NGINX_SITE_NAME=reference-app-copy \
    bash deploy/nginx/sync-nginx.sh
fi

echo "Deploy OK: ${PUBLIC_URL} ($(git rev-parse --short HEAD))"
