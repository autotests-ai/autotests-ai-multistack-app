#!/usr/bin/env bash
# Poll local backend health until ok or timeout (post compose up).
set -euo pipefail

export SERVER_PORT="${SERVER_PORT:-8084}"
HEALTH_URL="http://127.0.0.1:${SERVER_PORT}/api/health"
MAX_ATTEMPTS="${HEALTH_POLL_ATTEMPTS:-30}"
SLEEP_SECS="${HEALTH_POLL_SLEEP:-2}"

for i in $(seq 1 "$MAX_ATTEMPTS"); do
  if curl -fsS "$HEALTH_URL" | grep -q '"status":"ok"'; then
    echo "Health OK: $HEALTH_URL (attempt $i)"
    exit 0
  fi
  sleep "$SLEEP_SECS"
done

echo "FAIL: health not ok after ${MAX_ATTEMPTS} attempts: $HEALTH_URL" >&2
exit 1
