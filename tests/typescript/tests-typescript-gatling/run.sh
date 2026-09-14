#!/usr/bin/env bash
# Gatling TypeScript SDK school (*.gatling.ts). Smoke (default) or closed load.
# The CLI compiles TypeScript — do not tsc → JS. Do not copy tests-javascript-gatling.
#
#   ./run.sh
#   GATLING_PROFILE=smoke API_BASE_URL=http://localhost:8800 ./run.sh
#   GATLING_PROFILE=load GATLING_USERS=10 GATLING_DURING_SECONDS=60 ./run.sh
#
# Reports land in build/reports/gatling/ (same binary simulation.log + HTML as JVM / JS SDK).
# Injector canon: Node 26 (apt NodeSource node_26.x, not nvm, not a second runtime).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
RESULTS="${ROOT}/build/reports/gatling"
mkdir -p "${RESULTS}"

if ! command -v node >/dev/null 2>&1; then
  echo "STOP: node is not on PATH (injector canon Node 26 via apt NodeSource, not nvm)" >&2
  exit 1
fi
if [[ ! -x "${ROOT}/node_modules/.bin/gatling" ]]; then
  echo "STOP: run npm ci in ${ROOT} first" >&2
  exit 1
fi

API_BASE_URL="${API_BASE_URL:-http://localhost:8800}"
GATLING_PROFILE="${GATLING_PROFILE:-smoke}"
GATLING_USERS="${GATLING_USERS:-1}"
GATLING_DURING_SECONDS="${GATLING_DURING_SECONDS:-30}"
GATLING_P95_MS="${GATLING_P95_MS:-2000}"
GATLING_ALLOW_PUBLIC="${GATLING_ALLOW_PUBLIC:-false}"
LOAD_USERNAME="${LOAD_USERNAME:-user1}"
LOAD_PASSWORD="${LOAD_PASSWORD:-password1}"

cd "${ROOT}"
exec npx gatling run --typescript \
  --simulation authApiSimulation \
  --results-folder "${RESULTS}" \
  apiBaseUrl="${API_BASE_URL}" \
  username="${LOAD_USERNAME}" \
  password="${LOAD_PASSWORD}" \
  profile="${GATLING_PROFILE}" \
  users="${GATLING_USERS}" \
  duringSeconds="${GATLING_DURING_SECONDS}" \
  p95Ms="${GATLING_P95_MS}" \
  allowPublic="${GATLING_ALLOW_PUBLIC}"
