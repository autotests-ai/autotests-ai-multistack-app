#!/usr/bin/env bash
# Official PragmaticFlow/NBomber C# school. Smoke (default) or closed copies load.
#
#   ./run.sh
#   NBOBBER_PROFILE=smoke API_BASE_URL=http://localhost:8800 ./run.sh
#   NBOBBER_PROFILE=load LOAD_VUS=10 LOAD_RAMP_SECONDS=10 LOAD_DURING_SECONDS=60 ./run.sh
#
# JSONL overlay + HTML report land in build/nbomber/. Not open rps, not JMeter, not Docker.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
SRC="${ROOT}/src"
OUT_DIR="${ROOT}/build/nbomber"
REPORT_DIR="${OUT_DIR}/report"
PROFILE="${NBOBBER_PROFILE:-smoke}"
API_BASE_URL="${API_BASE_URL:-http://localhost:8800}"
API_BASE_URL="${API_BASE_URL%/}"
export API_BASE_URL
export NBOBBER_PROFILE="${PROFILE}"
export LOAD_USERNAME="${LOAD_USERNAME:-user1}"
export LOAD_PASSWORD="${LOAD_PASSWORD:-password1}"
export NBOBBER_JSONL="${NBOBBER_JSONL:-${OUT_DIR}/results.json}"
mkdir -p "${REPORT_DIR}"
cd "${ROOT}"

if [ -x "${HOME}/.dotnet/dotnet" ]; then
  export DOTNET_ROOT="${HOME}/.dotnet"
  export PATH="${HOME}/.dotnet:${PATH}"
fi

if ! command -v dotnet >/dev/null 2>&1; then
  echo "STOP: dotnet is not on PATH (.NET SDK 8 / official PragmaticFlow/NBomber, not Docker, not mono)" >&2
  exit 1
fi

if [ "${PROFILE}" = "load" ]; then
  export LOAD_VUS="${LOAD_VUS:-10}"
  export LOAD_RAMP_SECONDS="${LOAD_RAMP_SECONDS:-10}"
  export LOAD_DURING_SECONDS="${LOAD_DURING_SECONDS:-60}"
else
  export LOAD_VUS=1
  export LOAD_RAMP_SECONDS=0
  export LOAD_DURING_SECONDS=1
fi

python3 - <<'PY'
import os
import sys
from urllib.parse import urlparse

url = os.environ.get("API_BASE_URL", "")
lower = url.lower()
allow = os.environ.get("NBOBBER_ALLOW_PUBLIC", "false").lower() == "true"
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
        "Pass NBOBBER_ALLOW_PUBLIC=true when the host is the dedicated load stand."
    )
PY

rm -f "${OUT_DIR}/results.json"
mkdir -p "${OUT_DIR}"

dotnet build -c Release --nologo --no-restore 2>/dev/null || dotnet build -c Release --nologo
dotnet run -c Release --no-build --nologo

if [ ! -s "${OUT_DIR}/results.json" ]; then
  echo "STOP: nbomber JSONL is empty (scenario did not write samples)" >&2
  exit 1
fi

python3 "${SRC}/report.py" "${OUT_DIR}/results.json" "${REPORT_DIR}"
if [ ! -s "${REPORT_DIR}/index.html" ]; then
  echo "STOP: NBomber HtmlReport is missing (${REPORT_DIR}/index.html)" >&2
  exit 1
fi
