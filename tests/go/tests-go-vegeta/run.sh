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

if [ "${PROFILE}" = "load" ]; then
  RATE="${LOAD_VUS:-10}"
  HOLD="${LOAD_DURING_SECONDS:-60}"
else
  RATE=1
  HOLD=25
fi

rm -f "${OUT_DIR}/results.bin" "${OUT_DIR}/results.json"

# Gob on stdout → tee keeps a binary copy; encode JSONL live so load_injector_*
# can scrape the same window (not vegeta_* names, not closed VU).
vegeta attack \
  -name=auth-api \
  -targets="${OUT_DIR}/targets.txt" \
  -rate="${RATE}/s" \
  -duration="${HOLD}s" \
  -timeout=15s \
| tee "${OUT_DIR}/results.bin" \
| vegeta encode -to=json > "${OUT_DIR}/results.json"
if [ ! -s "${OUT_DIR}/results.bin" ]; then
  echo "STOP: vegeta results.bin is empty" >&2
  exit 1
fi
if [ ! -s "${OUT_DIR}/results.json" ]; then
  echo "STOP: vegeta JSONL is empty (encode did not write samples)" >&2
  exit 1
fi

vegeta plot -output "${REPORT_DIR}/index.html" "${OUT_DIR}/results.bin"
vegeta report "${OUT_DIR}/results.bin" > "${OUT_DIR}/report.txt"
if [ ! -s "${REPORT_DIR}/index.html" ]; then
  echo "STOP: vegeta plot did not write ${REPORT_DIR}/index.html" >&2
  exit 1
fi

python3 "${SRC}/report.py" "${OUT_DIR}/results.json" "${REPORT_DIR}"
