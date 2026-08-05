#!/usr/bin/env bash
# Frontend component tests + coverage + SonarQube upload + quality gate poll.
# Soft-skip when SONAR_TOKEN unset or host unreachable (unless SONAR_REQUIRED=true).
# Env: SONAR_TOKEN, SONAR_HOST_URL, SONAR_PROJECT_KEY, SONAR_REQUIRED, FRONTEND_DIR
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=../../backend/scripts/paths.sh
source "$REPO_ROOT/backend/scripts/paths.sh"

if [[ -n "${FRONTEND_DIR:-}" ]]; then
  if [[ "${FRONTEND_DIR}" = /* ]]; then
    MODULE_DIR="$FRONTEND_DIR"
  else
    MODULE_DIR="$REPO_ROOT/$FRONTEND_DIR"
  fi
else
  MODULE_DIR="$FRONTEND_TS_REACT"
fi

cd "$MODULE_DIR"

export SONAR_HOST_URL="${SONAR_HOST_URL:-https://sonar.qa.guru}"
export SONAR_PROJECT_KEY="${SONAR_PROJECT_KEY:-reference-app-copy-frontend-typescript-react}"
export SONAR_REQUIRED="${SONAR_REQUIRED:-false}"

echo "==> component tests + coverage (${SONAR_PROJECT_KEY})"
npm ci
npm test -- --coverage

if [[ -z "${SONAR_TOKEN:-}" ]]; then
  msg="SONAR_TOKEN unset — skip sonar upload"
  if [[ "$SONAR_REQUIRED" == "true" ]]; then
    echo "ERROR: $msg (SONAR_REQUIRED=true)" >&2
    exit 1
  fi
  echo "WARNING: $msg"
  exit 0
fi

if ! curl -sf --max-time 15 "${SONAR_HOST_URL%/}/api/system/status" >/dev/null; then
  msg="Sonar host unreachable: ${SONAR_HOST_URL}"
  if [[ "$SONAR_REQUIRED" == "true" ]]; then
    echo "ERROR: $msg" >&2
    exit 1
  fi
  echo "WARNING: $msg — skip upload"
  exit 0
fi

echo "==> sonar scan → ${SONAR_HOST_URL} (${SONAR_PROJECT_KEY})"
# Token via env only (SONAR_TOKEN) — never argv (canon: docs/sonar/GITHUB-ACTIONS.md).
npx --yes @sonar/scan \
  -Dsonar.host.url="${SONAR_HOST_URL}" \
  -Dsonar.projectKey="${SONAR_PROJECT_KEY}" \
  -Dsonar.projectName="${SONAR_PROJECT_KEY}"

echo "==> quality gate poll"
REPORT_TASK="$MODULE_DIR/.scannerwork/report-task.txt"
bash "$REPO_ROOT/scripts/ci-sonar-gate.sh" "$REPORT_TASK" "$SONAR_PROJECT_KEY"
