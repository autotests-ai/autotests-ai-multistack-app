#!/usr/bin/env bash
# Poll Sonar quality gate for the current scan via report-task.txt (analysisId flow).
# Env: SONAR_TOKEN, SONAR_HOST_URL, SONAR_REQUIRED, SONAR_GATE_TIMEOUT, SONAR_GATE_POLL
set -euo pipefail

REPORT_TASK="${1:?report-task path required}"
PROJECT_KEY="${2:-}"

if [[ ! -f "$REPORT_TASK" ]]; then
  echo "ERROR: report-task not found: $REPORT_TASK (scanner upload may have failed)" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if command -v python >/dev/null 2>&1; then
  PY=python
elif command -v python3 >/dev/null 2>&1; then
  PY=python3
else
  echo "ERROR: python required for sonar-gate-wait.py" >&2
  exit 1
fi

ARGS=(--report-task "$REPORT_TASK")
if [[ -n "$PROJECT_KEY" ]]; then
  ARGS+=(--project-key "$PROJECT_KEY")
fi
if [[ -n "${SONAR_HOST_URL:-}" ]]; then
  ARGS+=(--url "$SONAR_HOST_URL")
fi
if [[ -n "${SONAR_GATE_TIMEOUT:-}" ]]; then
  ARGS+=(--timeout "$SONAR_GATE_TIMEOUT")
fi
if [[ -n "${SONAR_GATE_POLL:-}" ]]; then
  ARGS+=(--poll "$SONAR_GATE_POLL")
fi

export SONAR_TOKEN="${SONAR_TOKEN:-}"

set +e
"$PY" "$SCRIPT_DIR/sonar-gate-wait.py" "${ARGS[@]}"
rc=$?
set -e

if [[ $rc -eq 0 ]]; then
  exit 0
fi

if [[ "${SONAR_REQUIRED:-false}" == "true" ]]; then
  exit "$rc"
fi

echo "WARNING: quality gate poll failed — soft-fail (SONAR_REQUIRED=false)" >&2
exit 0
