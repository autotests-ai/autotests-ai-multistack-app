#!/usr/bin/env bash
# Official artillery.io JavaScript school (YAML + processor.js). Smoke or open arrivalRate.
#
#   ./run.sh
#   ARTILLERY_PROFILE=smoke API_BASE_URL=http://localhost:8800 ./run.sh
#   ARTILLERY_PROFILE=load LOAD_RPS=10 LOAD_DURING_SECONDS=60 ./run.sh
#
# JSONL overlay + HTML report land in build/artillery/. Not k6, not Gatling JS, not closed VU.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
SRC="${ROOT}/src"
OUT_DIR="${ROOT}/build/artillery"
REPORT_DIR="${OUT_DIR}/report"
PROFILE="${ARTILLERY_PROFILE:-smoke}"
API_BASE_URL="${API_BASE_URL:-http://localhost:8800}"
API_BASE_URL="${API_BASE_URL%/}"
export API_BASE_URL
export ARTILLERY_PROFILE="${PROFILE}"
export LOAD_USERNAME="${LOAD_USERNAME:-user1}"
export LOAD_PASSWORD="${LOAD_PASSWORD:-password1}"
export ARTILLERY_JSONL="${ARTILLERY_JSONL:-${OUT_DIR}/results.json}"
mkdir -p "${REPORT_DIR}"
cd "${ROOT}"

if ! command -v artillery >/dev/null 2>&1; then
  echo "STOP: artillery is not on PATH (official artillery.io 2.0.34, not k6, not npx)" >&2
  exit 1
fi

if [ "${PROFILE}" = "load" ]; then
  export LOAD_RPS="${LOAD_RPS:-10}"
  export LOAD_DURING_SECONDS="${LOAD_DURING_SECONDS:-60}"
else
  export LOAD_RPS=1
  export LOAD_DURING_SECONDS=25
fi

python3 - <<'PY'
import os
import sys

url = os.environ.get("API_BASE_URL", "").lower()
allow = os.environ.get("ARTILLERY_ALLOW_PUBLIC", "false").lower() == "true"
if ("autotests.ai" in url or "qa.guru" in url) and not allow:
    sys.exit(
        f"Refusing {os.environ.get('API_BASE_URL')} — isolated SUT only. "
        "Pass ARTILLERY_ALLOW_PUBLIC=true when the host is a dedicated load stand."
    )
PY

OVERRIDES="$(python3 - <<'PY'
import json
import os

print(
    json.dumps(
        {
            "config": {
                "target": os.environ["API_BASE_URL"],
                "phases": [
                    {
                        "duration": int(os.environ["LOAD_DURING_SECONDS"]),
                        "arrivalRate": int(os.environ["LOAD_RPS"]),
                        "name": "auth-api",
                    }
                ],
            }
        }
    )
)
PY
)"

OFFICIAL_JSON="${OUT_DIR}/artillery-report.json"
rm -f "${OUT_DIR}/results.json" "${OFFICIAL_JSON}"
mkdir -p "${OUT_DIR}"

artillery run \
  --output "${OFFICIAL_JSON}" \
  --target "${API_BASE_URL}" \
  --overrides "${OVERRIDES}" \
  "${SRC}/auth-api.yml"

if [ ! -s "${OUT_DIR}/results.json" ]; then
  echo "STOP: artillery JSONL is empty (processor did not write samples)" >&2
  exit 1
fi
if [ ! -s "${OFFICIAL_JSON}" ]; then
  echo "STOP: artillery official JSON report is empty (${OFFICIAL_JSON})" >&2
  exit 1
fi

# Native HTML: `artillery report` when it still writes the official page. 2.0.34
# lists the subcommand but only prints a deprecation notice — same 2.0.21 template.
# Drop a previous index.html first: grep on a leftover native page would skip regenerate.
rm -f "${REPORT_DIR}/index.html"
if ! artillery report --output "${REPORT_DIR}/index.html" "${OFFICIAL_JSON}" 2>/dev/null \
  || ! grep -q '<title>Artillery report</title>' "${REPORT_DIR}/index.html"; then
  node "${SRC}/artillery-report.js" --output "${REPORT_DIR}/index.html" "${OFFICIAL_JSON}"
fi
if [ ! -s "${REPORT_DIR}/index.html" ]; then
  echo "STOP: artillery HTML report is missing (${REPORT_DIR}/index.html)" >&2
  exit 1
fi

python3 "${SRC}/report.py" "${OUT_DIR}/results.json" "${REPORT_DIR}"
