#!/usr/bin/env bash
# Host deploy — ports/health/services from deploy/matrix.yaml (SSOT).
# Usage:
#   bash deploy/server-deploy.sh
#   BACKENDS=backend-java-spring FRONTENDS=frontend-typescript-react SKIP_BUILD=1 bash deploy/server-deploy.sh
#   DEPLOY_MODE=all SKIP_BUILD=1 bash deploy/server-deploy.sh
set -euo pipefail

APP_DIR="${APP_DIR:-/home/reference_app_copy/reference-app-copy}"
REPO_URL="${REPO_URL:-https://github.com/autotests-ai/reference-app-copy.git}"
DEPLOY_MODE="${DEPLOY_MODE:-default}"
SKIP_BUILD="${SKIP_BUILD:-0}"
MAX_ATTEMPTS="${HEALTH_POLL_ATTEMPTS:-30}"
SLEEP_SECS="${HEALTH_POLL_SLEEP:-2}"
BACKENDS="${BACKENDS:-backend-java-spring}"
FRONTENDS="${FRONTENDS:-frontend-typescript-react}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MATRIX_QUERY=(python "${SCRIPT_DIR}/matrix_query.py")

if [[ ! -d "$APP_DIR/.git" ]]; then
  sudo mkdir -p "$APP_DIR"
  sudo chown "$(whoami):$(whoami)" "$APP_DIR"
  git clone "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"
git fetch --all
git reset --hard origin/main

if [[ "$DEPLOY_MODE" == "all" ]]; then
  BACKENDS="$("${MATRIX_QUERY[@]}" ids backends --mode all --csv)"
  FRONTENDS="$("${MATRIX_QUERY[@]}" ids frontends --mode all --csv)"
fi

services_line="$("${MATRIX_QUERY[@]}" compose-services --mode default --backends "$BACKENDS" --frontends "$FRONTENDS")"
# shellcheck disable=SC2206
services=($services_line)

if [[ "$SKIP_BUILD" == "1" ]]; then
  docker compose up -d --force-recreate --no-build --remove-orphans "${services[@]}"
else
  build_services=()
  for svc in "${services[@]}"; do
    [[ "$svc" == postgres || "$svc" == postgres-ensure-dbs ]] && continue
    build_services+=("$svc")
  done
  docker compose build "${build_services[@]}"
  docker compose up -d --force-recreate --remove-orphans "${services[@]}"
fi

while IFS=$'\t' read -r kind _id port expect; do
  [[ -z "${kind:-}" ]] && continue
  if [[ "$kind" == "backend" ]]; then
    url="http://127.0.0.1:${port}/api/health"
    for i in $(seq 1 "$MAX_ATTEMPTS"); do
      if body="$(curl -fsS "$url" 2>/dev/null)" \
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
  else
    url="http://127.0.0.1:${port}/"
    for i in $(seq 1 "$MAX_ATTEMPTS"); do
      code="$(curl -s -o /dev/null -w '%{http_code}' "$url" 2>/dev/null || true)"
      if [[ "$code" == "200" ]]; then
        echo "Health OK: $url (HTTP $code, attempt $i)"
        break
      fi
      if [[ "$i" -eq "$MAX_ATTEMPTS" ]]; then
        echo "FAIL: frontend not ok after ${MAX_ATTEMPTS} attempts: $url (got $code)" >&2
        exit 1
      fi
      sleep "$SLEEP_SECS"
    done
  fi
done < <("${MATRIX_QUERY[@]}" health --mode default --backends "$BACKENDS" --frontends "$FRONTENDS")

if [[ -f deploy/nginx/sync-nginx.sh ]]; then
  bash deploy/nginx/sync-nginx.sh
fi

bash deploy/smoke-remote.sh --backends "$BACKENDS" --frontends "$FRONTENDS"

echo "Deploy OK ($(git rev-parse --short HEAD)) mode=${DEPLOY_MODE} backends=${BACKENDS} frontends=${FRONTENDS}"
