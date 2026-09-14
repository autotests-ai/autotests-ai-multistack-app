#!/usr/bin/env bash
# Official tsenart/vegeta school. Smoke (default) or open-loop rps load.
#
#   ./run.sh
#   VEGETA_PROFILE=smoke API_BASE_URL=http://localhost:8800 ./run.sh
#   VEGETA_PROFILE=load LOAD_VUS=10 LOAD_DURING_SECONDS=60 ./run.sh
#
# JSONL overlay + HTML report land in build/vegeta/. Not wrk, not hey, not closed VU.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
SRC="${ROOT}/src"
OUT_DIR="${ROOT}/build/vegeta"
REPORT_DIR="${OUT_DIR}/report"
PROFILE="${VEGETA_PROFILE:-smoke}"
API_BASE_URL="${API_BASE_URL:-http://localhost:8800}"
export API_BASE_URL
export VEGETA_PROFILE="${PROFILE}"
mkdir -p "${REPORT_DIR}"
cd "${ROOT}"

if ! command -v vegeta >/dev/null 2>&1; then
  echo "STOP: vegeta is not on PATH (official tsenart/vegeta, not wrk, not hey)" >&2
  exit 1
fi

python3 "${SRC}/prepare.py"
rm -f "${OUT_DIR}/results.bin" "${OUT_DIR}/results.json"
: > "${OUT_DIR}/results.json"

if [ "${PROFILE}" = "load" ]; then
  RATE="${LOAD_VUS:-10}"
  HOLD="${LOAD_DURING_SECONDS:-60}"
else
  RATE=1
  HOLD=25
fi

vegeta attack \
  -name=auth-api \
  -targets="${OUT_DIR}/targets.txt" \
  -rate="${RATE}/s" \
  -duration="${HOLD}s" \
  -timeout=15s \
  -output="${OUT_DIR}/results.bin"

if [ ! -s "${OUT_DIR}/results.bin" ]; then
  echo "STOP: vegeta results.bin is empty (attack did not shoot)" >&2
  exit 1
fi

vegeta encode -to=json "${OUT_DIR}/results.bin" > "${OUT_DIR}/results.json"
if [ ! -s "${OUT_DIR}/results.json" ]; then
  echo "STOP: vegeta JSONL is empty (encode did not write samples)" >&2
  exit 1
fi

python3 "${SRC}/report.py" "${OUT_DIR}/results.json" "${REPORT_DIR}"
