#!/usr/bin/env bash
# Locust Python school. Smoke (default) or closed load.
#
#   ./run.sh
#   LOCUST_PROFILE=smoke API_BASE_URL=http://localhost:8800 ./run.sh
#   LOCUST_PROFILE=load LOAD_VUS=10 LOAD_DURING_SECONDS=60 ./run.sh
#
# JSON overlay + HTML report land in build/locust/. Do not pass locust web-UI flags.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
SRC="${ROOT}/src"
OUT_DIR="${ROOT}/build/locust"
REPORT_DIR="${OUT_DIR}/report"
VENV="${ROOT}/.venv"
PROFILE="${LOCUST_PROFILE:-smoke}"
API_BASE_URL="${API_BASE_URL:-http://localhost:8800}"
export API_BASE_URL
export LOCUST_PROFILE="${PROFILE}"
export LOCUST_JSONL="${LOCUST_JSONL:-${OUT_DIR}/results.json}"
mkdir -p "${REPORT_DIR}"

if [ ! -x "${VENV}/bin/locust" ]; then
  python3 -m venv "${VENV}"
  "${VENV}/bin/pip" install -q -r "${ROOT}/requirements.txt"
fi

ARGS=(
  -f "${SRC}/locustfile.py"
  --host "${API_BASE_URL}"
  --headless
  --html "${REPORT_DIR}/index.html"
)

if [ "${PROFILE}" = "load" ]; then
  USERS="${LOAD_VUS:-10}"
  HOLD="${LOAD_DURING_SECONDS:-60}"
  RAMP="${LOAD_RAMP_SECONDS:-10}"
  SPAWN="$(python3 -c "print(max(float(${USERS}) / float(${RAMP}), 0.1))")"
  TOTAL=$((HOLD + RAMP))
  ARGS+=(--users "${USERS}" --spawn-rate "${SPAWN}" --run-time "${TOTAL}s")
else
  ARGS+=(--users 1 --spawn-rate 1 --run-time 30s)
fi

"${VENV}/bin/locust" "${ARGS[@]}" "$@"

python3 - "${LOCUST_JSONL}" "${REPORT_DIR}/summary.json" <<'PY'
import json
import math
import sys
from datetime import datetime, timezone
from pathlib import Path

src, dest = Path(sys.argv[1]), Path(sys.argv[2])
elapsed: list[float] = []
ok = 0
fail = 0
times: list[int] = []


def parse_time(raw: object) -> int | None:
    text = str(raw or "").strip()
    if not text:
        return None
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    try:
        dt = datetime.fromisoformat(text)
    except ValueError:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return int(dt.timestamp() * 1000)


if src.is_file():
    for line in src.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line.startswith("{"):
            continue
        try:
            row = json.loads(line)
        except json.JSONDecodeError:
            continue
        if not isinstance(row, dict) or row.get("kind") != "locust":
            continue
        try:
            elapsed.append(max(float(row.get("elapsed_ms") or 0), 0))
        except (TypeError, ValueError):
            continue
        times.append(parse_time(row.get("time")) or 0)
        if row.get("ok") is False:
            fail += 1
        else:
            ok += 1

total = ok + fail
if total <= 0:
    raise SystemExit("STOP: locust results.json has no samples")
xs = sorted(elapsed)
if len(xs) == 1:
    p95 = xs[0]
else:
    k = (len(xs) - 1) * 0.95
    lo, hi = math.floor(k), math.ceil(k)
    p95 = xs[int(k)] if lo == hi else xs[lo] * (hi - k) + xs[hi] * (k - lo)
span = max((max(times) - min(times)) / 1000.0, 1.0) if times else 1.0
payload = {
    "metrics": {
        "http_req_duration": {"values": {"p(95)": p95}},
        "http_reqs": {"values": {"rate": total / span, "count": total, "fails": fail}},
    }
}
dest.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"p95 {int(round(p95))}ms")
print(f"{total / span:.1f} rps")
print(f"{total}/{total} ({fail} failed)")
PY
