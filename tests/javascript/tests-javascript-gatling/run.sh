#!/usr/bin/env bash
# Gatling JavaScript SDK school. Smoke (default) or closed load.
#
#   ./run.sh
#   GATLING_PROFILE=smoke API_BASE_URL=http://localhost:8800 ./run.sh
#   GATLING_PROFILE=load GATLING_USERS=10 GATLING_DURING_SECONDS=60 ./run.sh
#
# Reports land in build/reports/gatling/ (same simulation.log + HTML as JVM Gatling).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
RESULTS="${ROOT}/build/reports/gatling"
mkdir -p "${RESULTS}"

if ! command -v node >/dev/null 2>&1; then
  echo "STOP: node is not on PATH (need Node 22+ for @gatling.io JS SDK)" >&2
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
exec npx gatling run \
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
