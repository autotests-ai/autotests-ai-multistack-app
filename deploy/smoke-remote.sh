#!/usr/bin/env bash
# Post-deploy smoke for backend-java-spring.reference-app-copy.autotests.ai (strict TLS — no curl -k).
set -euo pipefail

BASE_URL="${1:-https://backend-java-spring.reference-app-copy.autotests.ai}"
BASE_URL="${BASE_URL%/}"
UI_PATH="${SMOKE_UI_PATH:-/frontend_typescript_react/}"
SERVICE_NAME="${SMOKE_SERVICE_NAME:-reference-app-copy}"

echo "=== TLS + GET ${BASE_URL}/ (expect 404 — empty root) ==="
code="$(curl --noproxy '*' -s -o /dev/null -w '%{http_code}' "${BASE_URL}/")"
echo "HTTP ${code}"
[[ "$code" == "404" ]] || { echo "FAIL: expected 404 at host root" >&2; exit 1; }

echo "=== GET ${BASE_URL}${UI_PATH} ==="
code="$(curl --noproxy '*' -s -o /dev/null -w '%{http_code}' "${BASE_URL}${UI_PATH}")"
echo "HTTP ${code}"
[[ "$code" == "200" ]] || { echo "FAIL: expected 200 at UI mount" >&2; exit 1; }

echo "=== GET ${BASE_URL}/api/health ==="
body="$(curl --noproxy '*' -fsSL "${BASE_URL}/api/health")"
echo "$body" | grep -q '"status":"ok"' || { echo "FAIL: missing ok status" >&2; exit 1; }
echo "$body" | grep -q "$SERVICE_NAME" || { echo "FAIL: missing ${SERVICE_NAME} service" >&2; exit 1; }

echo "Smoke OK: ${BASE_URL}${UI_PATH}"
