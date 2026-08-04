#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/home/reference_app_copy/reference-app-copy}"
REPO_URL="${REPO_URL:-https://github.com/autotests-ai/reference-app-copy.git}"

# Host publish ports (matrix.yaml / compose). Edge optional locally; prod host nginx splits.
export SERVER_PORT="${SERVER_PORT:-8700}"
export WEB_PORT="${WEB_PORT:-8701}"
export BACKEND_JAVA_PORT="${BACKEND_JAVA_PORT:-8800}"
export BACKEND_KOTLIN_PORT="${BACKEND_KOTLIN_PORT:-8810}"
export BACKEND_FLASK_PORT="${BACKEND_FLASK_PORT:-8820}"

SKIP_BUILD="${SKIP_BUILD:-0}"
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
  docker compose up -d --force-recreate --no-build --remove-orphans
else
  docker compose build
  docker compose up -d --force-recreate --remove-orphans
fi

# Health: published backend ports (host nginx upstreams).
health_ports=(
  "${BACKEND_JAVA_PORT}:reference-app-copy"
  "${BACKEND_KOTLIN_PORT}:backend-kotlin-spring"
  "${BACKEND_FLASK_PORT}:backend-python-flask"
)

for entry in "${health_ports[@]}"; do
  port="${entry%%:*}"
  expect="${entry##*:}"
  url="http://127.0.0.1:${port}/api/health"
  for i in $(seq 1 "$MAX_ATTEMPTS"); do
    if body="$(curl --noproxy '*' -fsS "$url" 2>/dev/null)" \
      && echo "$body" | grep -q '"status":"ok"' \
      && echo "$body" | grep -q "$expect"; then
      echo "Health OK: $url ($expect, attempt $i)"
      break
    fi
    if [[ "$i" -eq "$MAX_ATTEMPTS" ]]; then
      echo "FAIL: health not ok after ${MAX_ATTEMPTS} attempts: $url (expect $expect)" >&2
      exit 1
    fi
    sleep "$SLEEP_SECS"
  done
done

if [[ -f deploy/nginx/sync-nginx.sh ]]; then
  bash deploy/nginx/sync-nginx.sh
fi

bash deploy/smoke-remote.sh

echo "Deploy OK ($(git rev-parse --short HEAD))"
