#!/usr/bin/env bash
# Yandex.Tank + native phantom school. Smoke (default) or open-loop rps load.
#
#   ./run.sh
#   TANK_PROFILE=smoke API_BASE_URL=http://localhost:8800 ./run.sh
#   TANK_PROFILE=load LOAD_RPS=10 LOAD_DURING_SECONDS=60 ./run.sh
#
# phout overlay + HTML report land in build/tank/. Not docker-tank, not Overload.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
SRC="${ROOT}/src"
OUT_DIR="${ROOT}/build/tank"
REPORT_DIR="${OUT_DIR}/report"
VENV="${ROOT}/.venv"
PROFILE="${TANK_PROFILE:-smoke}"
API_BASE_URL="${API_BASE_URL:-http://localhost:8800}"
export API_BASE_URL
export TANK_PROFILE="${PROFILE}"
mkdir -p "${REPORT_DIR}"
cd "${ROOT}"

if ! command -v phantom >/dev/null 2>&1; then
  echo "STOP: phantom is not on PATH (native yandex-load phantom, not docker-tank)" >&2
  exit 1
fi

if [ ! -x "${VENV}/bin/yandex-tank" ]; then
  python3 -m venv "${VENV}"
  "${VENV}/bin/pip" install -q -U pip wheel
  "${VENV}/bin/pip" install -q -r "${ROOT}/requirements.txt"
  "${VENV}/bin/pip" install -q --no-deps yandextank==2.0.12
fi

"${VENV}/bin/python" "${SRC}/prepare.py"
rm -f "${OUT_DIR}/phout.log"
: > "${OUT_DIR}/phout.log"

"${VENV}/bin/yandex-tank" -n -i -c "${OUT_DIR}/load.yaml"
if [ ! -s "${OUT_DIR}/phout.log" ]; then
  echo "STOP: phantom phout is empty (tank/phantom did not shoot)" >&2
  exit 1
fi

"${VENV}/bin/python" "${SRC}/report.py" \
  "${OUT_DIR}/phout.log" \
  "${REPORT_DIR}" \
  "${REPORT_DIR}/summary.json"
