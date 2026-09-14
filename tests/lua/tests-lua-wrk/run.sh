#!/usr/bin/env bash
# Official wg/wrk Lua school. Smoke (default) or closed threads/connections load.
# wrk has no ramp — do not invent one. Not wrk2, not -R, not Vegeta, not hey.
#
#   ./run.sh
#   WRK_PROFILE=smoke API_BASE_URL=http://localhost:8800 ./run.sh
#   WRK_PROFILE=load WRK_THREADS=10 WRK_CONNECTIONS=10 LOAD_DURING_SECONDS=60 ./run.sh
#
# JSONL overlay + HTML report land in build/wrk/.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
SRC="${ROOT}/src"
OUT_DIR="${ROOT}/build/wrk"
REPORT_DIR="${OUT_DIR}/report"
PROFILE="${WRK_PROFILE:-smoke}"
API_BASE_URL="${API_BASE_URL:-http://localhost:8800}"
API_BASE_URL="${API_BASE_URL%/}"
export API_BASE_URL
export WRK_PROFILE="${PROFILE}"
export LOAD_USERNAME="${LOAD_USERNAME:-user1}"
export LOAD_PASSWORD="${LOAD_PASSWORD:-password1}"
export WRK_JSONL="${WRK_JSONL:-${OUT_DIR}/results.json}"
mkdir -p "${REPORT_DIR}"
cd "${ROOT}"

if ! command -v wrk >/dev/null 2>&1; then
  echo "STOP: wrk is not on PATH (official wg/wrk, not wrk2, not vegeta, not hey)" >&2
  exit 1
fi
if wrk -v 2>&1 | grep -qi 'wrk2'; then
  echo "STOP: wrk2 on PATH — need official wg/wrk" >&2
  exit 1
fi

if [ "${PROFILE}" = "load" ]; then
  THREADS="${WRK_THREADS:-10}"
  CONNECTIONS="${WRK_CONNECTIONS:-10}"
  HOLD="${LOAD_DURING_SECONDS:-60}"
else
  THREADS=1
  CONNECTIONS=1
  HOLD=10
fi

python3 - <<'PY'
import os
import sys
from urllib.parse import urlparse

url = os.environ.get("API_BASE_URL", "")
lower = url.lower()
allow = os.environ.get("WRK_ALLOW_PUBLIC", "false").lower() == "true"
host = (urlparse(url).hostname or "").lower()
is_load = host == "load.autotests.ai" or host.endswith(".load.autotests.ai")
shared = "autotests.ai" in lower or "qa.guru" in lower
if shared and not is_load:
    sys.exit(
        f"Refusing {url} — only load.autotests.ai is an allowed public SUT "
        "(not autotests.ai, not Box2)."
    )
if is_load and not allow:
    sys.exit(
        f"Refusing {url} — isolated SUT only. "
        "Pass WRK_ALLOW_PUBLIC=true when the host is the dedicated load stand."
    )
PY

rm -f "${OUT_DIR}/results.json"
mkdir -p "${OUT_DIR}"
: > "${OUT_DIR}/results.json"

echo "wrk host=${API_BASE_URL} profile=${PROFILE} -t${THREADS} -c${CONNECTIONS} -d${HOLD}s jsonl=${WRK_JSONL}" >&2

wrk -t"${THREADS}" -c"${CONNECTIONS}" -d"${HOLD}s" -T15s \
  -s "${SRC}/auth-api.lua" \
  "${API_BASE_URL}"

if [ ! -s "${OUT_DIR}/results.json" ]; then
  echo "STOP: wrk JSONL is empty (response() did not write samples)" >&2
  exit 1
fi

python3 "${SRC}/report.py" "${OUT_DIR}/results.json" "${REPORT_DIR}"
