#!/usr/bin/env bash
# Grafana k6 TypeScript school (native .ts). Smoke (default) or closed load.
#
#   ./run.sh
#   K6_PROFILE=smoke API_BASE_URL=http://localhost:8800 ./run.sh
#   K6_PROFILE=load LOAD_VUS=10 LOAD_DURING_SECONDS=60 ./run.sh
#
# Do not pass K6_VUS / K6_DURATION — those are k6 engine knobs and would
# fight the script scenarios. Do not tsc → JS. Do not xk6.
# JSON overlay + HTML report land in build/k6/.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
OUT_DIR="${ROOT}/build/k6"
REPORT_DIR="${OUT_DIR}/report"
mkdir -p "${REPORT_DIR}"

if ! command -v k6 >/dev/null 2>&1; then
  echo "STOP: k6 is not on PATH" >&2
  exit 1
fi

export K6_WEB_DASHBOARD="${K6_WEB_DASHBOARD:-true}"
export K6_WEB_DASHBOARD_HOST="${K6_WEB_DASHBOARD_HOST:-127.0.0.1}"
export K6_WEB_DASHBOARD_PORT="${K6_WEB_DASHBOARD_PORT:--1}"
export K6_WEB_DASHBOARD_EXPORT="${K6_WEB_DASHBOARD_EXPORT:-${REPORT_DIR}/index.html}"
export K6_WEB_DASHBOARD_OPEN="${K6_WEB_DASHBOARD_OPEN:-false}"

# Copy summary next to the dashboard so publish-load-run-html.sh can read p95/rps.
exec k6 run \
  --out "json=${OUT_DIR}/results.json" \
  --summary-export "${REPORT_DIR}/summary.json" \
  "$@" \
  "${ROOT}/src/auth-api.ts"
