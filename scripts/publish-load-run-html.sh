#!/usr/bin/env bash
# Copy JMeter/Gatling/k6/Locust/Tank/Vegeta/Artillery/Goose/NBomber/wrk HTML to load.autotests.ai/runs/{injector}::{backend}/{run_id}/.
# Teaching job load-tests calls this after the injector smoke. Not Allure.
#
#   HTML_DIR=build/jmeter/report RUN_ID=123 \
#     INJECTOR=java-jmeter BACKEND=backend-java-spring \
#     bash scripts/publish-load-run-html.sh
#
# GHA: LOAD_HOST + LOAD_USER + DEPLOY_SSH_KEY (same secret as deploy-backend-load).
# Laptop: ssh alias load-sut (LOAD_SSH_HOST).
# PATCH_BOARD=0 (GHA smoke): copy HTML only, do not overwrite featured ramp numbers.
#
set -euo pipefail
export COPYFILE_DISABLE=1

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PATCH="$ROOT/scripts/patch-load-matrix-run.py"
REMOTE_WWW="/var/www/load.autotests.ai"
REMOTE_TMP="/tmp/load-run-html"
KEYFILE=""

log() { printf '\n=== %s\n' "$*"; }

cleanup() {
  if [ -n "$KEYFILE" ] && [ -f "$KEYFILE" ]; then
    rm -f "$KEYFILE"
  fi
}
trap cleanup EXIT

usage() {
  sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'
  exit 2
}

while [ $# -gt 0 ]; do
  case "$1" in
    --html) HTML_DIR="$2"; shift 2 ;;
    --injector) INJECTOR="$2"; shift 2 ;;
    --backend) BACKEND="$2"; shift 2 ;;
    --run-id) RUN_ID="$2"; shift 2 ;;
    --github) GITHUB_URL="$2"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    -h|--help) usage ;;
    *) echo "STOP: unknown arg $1" >&2; usage ;;
  esac
done

INJECTOR="${INJECTOR:-${LOAD_LANG:+${LOAD_LANG}-${LOAD_TOOL}}}"
BACKEND="${BACKEND:-${BACKEND_LANG:+backend-${BACKEND_LANG}-${BACKEND_FRAMEWORK}}}"
RUN_ID="${RUN_ID:-${GITHUB_RUN_ID:-}}"
GITHUB_URL="${GITHUB_URL:-}"
DRY_RUN="${DRY_RUN:-0}"
PATCH_BOARD="${PATCH_BOARD:-1}"

if [ -z "$INJECTOR" ] || [ -z "$BACKEND" ] || [ -z "$RUN_ID" ]; then
  echo "STOP: need INJECTOR, BACKEND, RUN_ID (or LOAD_LANG+LOAD_TOOL, BACKEND_LANG+BACKEND_FRAMEWORK, GITHUB_RUN_ID)" >&2
  exit 1
fi
if [[ "$RUN_ID" == *'/'* ]] || [[ "$INJECTOR" == *'/'* ]] || [[ "$BACKEND" == *'/'* ]]; then
  echo "STOP: injector/backend/run-id must be path-safe" >&2
  exit 1
fi

resolve_html_dir() {
  local dir="${HTML_DIR:-}"
  if [ -z "$dir" ]; then
    local module="${MODULE_DIR:-}"
    if [ -z "$module" ]; then
      echo "STOP: set HTML_DIR or MODULE_DIR" >&2
      return 1
    fi
    case "${LOAD_TOOL:-}" in
      jmeter) dir="${module}/build/jmeter/report" ;;
      gatling)
        dir="$(find "${module}/build/reports/gatling" -mindepth 1 -maxdepth 1 -type d 2>/dev/null \
          | while IFS= read -r candidate; do
              [ -f "${candidate}/index.html" ] && printf '%s\n' "$candidate"
            done | sort | tail -1)"
        ;;
      k6) dir="${module}/build/k6/report" ;;
      locust) dir="${module}/build/locust/report" ;;
      tank) dir="${module}/build/tank/report" ;;
      vegeta) dir="${module}/build/vegeta/report" ;;
      artillery) dir="${module}/build/artillery/report" ;;
      goose) dir="${module}/build/goose/report" ;;
      nbomber) dir="${module}/build/nbomber/report" ;;
      wrk) dir="${module}/build/wrk/report" ;;
      *)
        echo "STOP: set HTML_DIR or LOAD_TOOL=jmeter|gatling|k6|locust|tank|vegeta|artillery|goose|nbomber|wrk" >&2
        return 1
        ;;
    esac
  fi
  if [ -f "${dir}/index.html" ]; then
    printf '%s\n' "$dir"
    return 0
  fi
  if [ -f "${dir}/report/index.html" ]; then
    printf '%s\n' "${dir}/report"
    return 0
  fi
  echo "STOP: no index.html under ${dir}" >&2
  return 1
}

HTML="$(resolve_html_dir)"
TOOL_HTML_RE='Apache JMeter Dashboard|[Gg]atling|k6 report|k6-web-dashboard|xk6-dashboard|Grafana k6|[Ll]ocust|Yandex\.Tank|[Vv]egeta|[Aa]rtillery|[Gg]oose|[Nn][Bb]omber|wrk'

if grep -q 'Stub. Replace' "${HTML}/index.html"; then
  echo "STOP: ${HTML}/index.html is the stub, not a tool dashboard" >&2
  exit 1
fi
if ! grep -Eq "$TOOL_HTML_RE" "${HTML}/index.html"; then
  echo "STOP: ${HTML}/index.html is not a JMeter/Gatling/k6/Locust/Tank/Vegeta/Artillery/Goose/NBomber/wrk dashboard" >&2
  exit 1
fi

KEY="${INJECTOR}::${BACKEND}"
REPORT="/runs/${KEY}/${RUN_ID}/"
if [ -z "$GITHUB_URL" ] && [ -n "${GITHUB_SERVER_URL:-}" ] && [ -n "${GITHUB_REPOSITORY:-}" ]; then
  GITHUB_URL="${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${RUN_ID}"
fi

VALUES=()
if [ -f "${HTML}/statistics.json" ]; then
  while IFS= read -r line; do
    VALUES+=("$line")
  done < <(python3 -c '
import json, sys
from pathlib import Path
total = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))["Total"]
p95 = int(round(float(total["pct2ResTime"])))
rps = float(total["throughput"])
print(f"p95 {p95}ms")
print(f"{rps:.1f} rps")
' "${HTML}/statistics.json")
elif [ -f "${HTML}/summary.json" ]; then
  while IFS= read -r line; do
    VALUES+=("$line")
  done < <(python3 -c '
import json, sys
from pathlib import Path

data = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
metrics = data.get("metrics") or data
duration = metrics.get("http_req_duration") or {}
reqs = metrics.get("http_reqs") or {}
values = duration.get("values") if isinstance(duration.get("values"), dict) else duration
req_values = reqs.get("values") if isinstance(reqs.get("values"), dict) else reqs
p95 = values.get("p(95)")
if p95 is None:
    p95 = values.get("p95")
rate = req_values.get("rate")
if p95 is None or rate is None:
    raise SystemExit("STOP: k6 summary.json missing p95/rate")
print(f"p95 {int(round(float(p95)))}ms")
print(f"{float(rate):.1f} rps")
' "${HTML}/summary.json")
fi

if [ -n "${LOAD_SSH_HOST:-}" ]; then
  DEST="$LOAD_SSH_HOST"
elif [ -n "${LOAD_HOST:-}" ]; then
  DEST="${LOAD_USER:-qaguru}@${LOAD_HOST}"
elif [ -n "${DEPLOY_HOST:-}" ]; then
  DEST="${DEPLOY_USER:-qaguru}@${DEPLOY_HOST}"
else
  DEST="load-sut"
fi

SSH_OPTS=(-o BatchMode=yes -o StrictHostKeyChecking=accept-new)
if [ -n "${DEPLOY_SSH_KEY:-}" ]; then
  if [ -f "$DEPLOY_SSH_KEY" ]; then
    SSH_OPTS+=(-i "$DEPLOY_SSH_KEY" -o IdentitiesOnly=yes)
  else
    KEYFILE="$(mktemp)"
    printf '%s\n' "$DEPLOY_SSH_KEY" | sed 's/\r$//' > "$KEYFILE"
    chmod 600 "$KEYFILE"
    SSH_OPTS+=(-i "$KEYFILE" -o IdentitiesOnly=yes)
  fi
fi

ssh_c() { ssh "${SSH_OPTS[@]}" "$DEST" "$@"; }
scp_c() { scp "${SSH_OPTS[@]}" "$@"; }

log "html ${HTML} → ${DEST}:${REMOTE_WWW}${REPORT}"
echo "report ${REPORT}"
if [ "$DRY_RUN" = "1" ]; then
  echo "dry-run dest=${DEST} key=${KEY} run=${RUN_ID} github=${GITHUB_URL:-}"
  exit 0
fi

ssh_c "rm -rf ${REMOTE_TMP} && mkdir -p ${REMOTE_TMP}"
TAR_OPTS=(--exclude='._*' --exclude='.DS_Store')
if tar --help 2>&1 | grep -q -- '--no-xattrs'; then
  TAR_OPTS+=(--no-xattrs)
fi
COPYFILE_DISABLE=1 tar -C "$HTML" "${TAR_OPTS[@]}" -cf - . \
  | ssh_c "tar -C ${REMOTE_TMP} -xf -"

REMOTE_RUN="${REMOTE_WWW}/runs/${KEY}/${RUN_ID}"
ssh_c bash -s <<REMOTE
set -euo pipefail
sudo install -d -m 755 '${REMOTE_WWW}/runs/${KEY}'
sudo rm -rf '${REMOTE_RUN}'
sudo mkdir -p '${REMOTE_RUN}'
sudo cp -a ${REMOTE_TMP}/. '${REMOTE_RUN}/'
sudo chown -R root:root '${REMOTE_RUN}'
sudo find '${REMOTE_RUN}' -type d -exec chmod 755 {} +
sudo find '${REMOTE_RUN}' -type f -exec chmod 644 {} +
test -f '${REMOTE_RUN}/index.html'
REMOTE

if [ "$PATCH_BOARD" != "0" ]; then
  scp_c "$PATCH" "${DEST}:/tmp/patch-load-matrix-run.py"
  META="$(mktemp)"
  python3 - "$META" "$INJECTOR" "$BACKEND" "$REPORT" "$GITHUB_URL" "${VALUES[@]+"${VALUES[@]}"}" <<'PY'
import json, sys
from pathlib import Path
path, injector, backend, report, github, *values = sys.argv[1:]
payload = {
    "injector": injector,
    "backend": backend,
    "report": report,
    "github": github,
    "values": values,
}
Path(path).write_text(json.dumps(payload), encoding="utf-8")
PY
  scp_c "$META" "${DEST}:/tmp/load-run-meta.json"
  rm -f "$META"
  ssh_c "sudo python3 /tmp/patch-load-matrix-run.py --matrix ${REMOTE_WWW}/matrix.json --from-json /tmp/load-run-meta.json"
else
  echo "skip board patch PATCH_BOARD=0 (HTML at ${REPORT})"
fi

URL="https://load.autotests.ai${REPORT}"
log "smoke ${URL}index.html"
curl -sfS -o /tmp/load-run-index.html -w 'index %{http_code} bytes=%{size_download}\n' "${URL}"
curl -sfS -o /dev/null -w 'index.html %{http_code}\n' "${URL}index.html"
if grep -q 'Stub. Replace' /tmp/load-run-index.html; then
  echo "STOP: live HTML is still the stub" >&2
  exit 1
fi
if ! grep -Eq "$TOOL_HTML_RE" /tmp/load-run-index.html; then
  echo "STOP: live HTML is not a JMeter/Gatling/k6/Locust/Tank/Vegeta/Artillery/Goose/NBomber/wrk dashboard" >&2
  exit 1
fi
echo "ok ${URL}"
