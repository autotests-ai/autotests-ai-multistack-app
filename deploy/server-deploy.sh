#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/home/selenoid/reference-app-copy}"
REPO_URL="${REPO_URL:-https://github.com/autotests-ai/reference-app-copy.git}"
export SERVER_PORT="${SERVER_PORT:-8084}"
PUBLIC_URL="${PUBLIC_URL:-https://reference-app-copy.autotests.ai}"

if [[ ! -d "$APP_DIR/.git" ]]; then
  sudo mkdir -p "$APP_DIR"
  sudo chown "$(whoami):$(whoami)" "$APP_DIR"
  git clone "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"
git fetch --all
git reset --hard origin/main

docker compose build backend
docker compose up -d --remove-orphans

bash deploy/health-poll.sh
bash deploy/smoke-remote.sh "$PUBLIC_URL"

if [[ -f deploy/nginx/reference-app-copy.autotests.ai.conf ]]; then
  sudo NGINX_CONF_SRC=./deploy/nginx/reference-app-copy.autotests.ai.conf \
    NGINX_SITE_NAME=reference-app-copy \
    bash deploy/nginx/sync-nginx.sh
fi

echo "Deploy OK: ${PUBLIC_URL}"
