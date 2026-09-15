#!/usr/bin/env bash
# Official tag1consulting/goose Rust school. Smoke (default) or closed VU load.
#
#   ./run.sh
#   GOOSE_PROFILE=smoke API_BASE_URL=http://localhost:8800 ./run.sh
#   GOOSE_PROFILE=load LOAD_VUS=10 LOAD_RAMP_SECONDS=10 LOAD_DURING_SECONDS=60 ./run.sh
#
# JSONL overlay + HTML report land in build/goose/. Not wrk, not vegeta, not open rps.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
SRC="${ROOT}/src"
OUT_DIR="${ROOT}/build/goose"
REPORT_DIR="${OUT_DIR}/report"
PROFILE="${GOOSE_PROFILE:-smoke}"
API_BASE_URL="${API_BASE_URL:-http://localhost:8800}"
API_BASE_URL="${API_BASE_URL%/}"
export API_BASE_URL
export GOOSE_PROFILE="${PROFILE}"
export LOAD_USERNAME="${LOAD_USERNAME:-user1}"
export LOAD_PASSWORD="${LOAD_PASSWORD:-password1}"
export GOOSE_JSONL="${GOOSE_JSONL:-${OUT_DIR}/results.json}"
export GOOSE_HTML="${GOOSE_HTML:-${OUT_DIR}/goose-report.html}"
mkdir -p "${REPORT_DIR}"
cd "${ROOT}"

if [ -f "${HOME}/.cargo/env" ]; then
  # shellcheck source=/dev/null
  . "${HOME}/.cargo/env"
fi

if ! command -v cargo >/dev/null 2>&1; then
  echo "STOP: cargo is not on PATH (rustup 1.88 / official tag1consulting/goose, not Docker, not wrk)" >&2
  exit 1
fi

if [ "${PROFILE}" = "load" ]; then
  export LOAD_VUS="${LOAD_VUS:-10}"
  export LOAD_RAMP_SECONDS="${LOAD_RAMP_SECONDS:-10}"
  export LOAD_DURING_SECONDS="${LOAD_DURING_SECONDS:-60}"
else
  export LOAD_VUS=1
  export LOAD_RAMP_SECONDS=0
  export LOAD_DURING_SECONDS=30
fi

python3 - <<'PY'
import os
import sys
from urllib.parse import urlparse

url = os.environ.get("API_BASE_URL", "")
lower = url.lower()
allow = os.environ.get("GOOSE_ALLOW_PUBLIC", "false").lower() == "true"
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
        "Pass GOOSE_ALLOW_PUBLIC=true when the host is the dedicated load stand."
    )
PY

rm -f "${OUT_DIR}/results.json" "${GOOSE_HTML}"
mkdir -p "${OUT_DIR}"

cargo build --release --offline 2>/dev/null || cargo build --release
./target/release/tests-rust-goose

if [ ! -s "${OUT_DIR}/results.json" ]; then
  echo "STOP: goose JSONL is empty (transactions did not write samples)" >&2
  exit 1
fi
if [ ! -s "${GOOSE_HTML}" ]; then
  echo "STOP: goose HTML report is empty (${GOOSE_HTML})" >&2
  exit 1
fi
cp "${GOOSE_HTML}" "${REPORT_DIR}/index.html"

python3 "${SRC}/report.py" "${OUT_DIR}/results.json" "${REPORT_DIR}"
