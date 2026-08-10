#!/usr/bin/env bash
# Stream Allure results to TestOps when the shared job-run context is available.
#
# Contract for students:
#   1. The test command exit code always wins.
#   2. Missing/broken TestOps → same command without allurectl (raw results stay).
#   3. Layer/suite/feature meta comes from test-code labels, not from this wrapper.
#   4. Launch axes (BROWSER/OS/ENDPOINT/VERSION/BRANCH) are written once *after*
#      the run into allure-results/environment.properties (survives `gradle clean`).
set -euo pipefail

if [[ "$#" -eq 0 ]]; then
  echo "usage: $0 <test-command> [args...]" >&2
  exit 2
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WRITE_ENV="${SCRIPT_DIR}/write-allure-environment.sh"

write_allure_environment() {
  [[ -n "${ALLURE_RESULTS:-}" ]] || return 0
  if ! bash "$WRITE_ENV"; then
    echo "warning: failed to write environment.properties (tests exit code unchanged)" >&2
  fi
}

# Run the payload, then write Environment — even when tests failed.
run_then_write_env() {
  set +e
  "$@"
  local code=$?
  set -e
  write_allure_environment
  return "$code"
}

fallback() {
  if [[ "${GITHUB_ACTIONS:-false}" == "true" ]]; then
    echo "::warning title=TestOps live upload unavailable::Running tests without allurectl; raw results remain available for fallback."
  else
    echo "TestOps live upload unavailable — running tests without allurectl"
  fi
  run_then_write_env "$@"
  exit $?
}

if [[ "${ALLURE_LIVE_ENABLED:-false}" != "true" ]] ||
   ! command -v allurectl >/dev/null 2>&1; then
  fallback "$@"
fi

required=(
  ALLURE_ENDPOINT
  ALLURE_TOKEN
  ALLURE_PROJECT_ID
  ALLURE_RESULTS
  ALLURE_LAUNCH_ID
  ALLURE_JOB_RUN_ID
)
for name in "${required[@]}"; do
  if [[ -z "${!name:-}" ]]; then
    echo "Missing ${name}"
    fallback "$@"
  fi
done

echo "Streaming Allure results to launch ${ALLURE_LAUNCH_ID}, job-run ${ALLURE_JOB_RUN_ID}"

# allurectl watch may inject a selective testplan (existing cases only).
# Ordinary CI already filters with -DincludeTags / npm scripts — keeping the plan
# would skip brand-new tests and still look green. Keep the plan only when
# TestOps UI reruns set ALLURE_KEEP_TESTPLAN=true.
export WRITE_ALLURE_ENVIRONMENT="$WRITE_ENV"
allurectl --http-timeout 1m watch \
  --job-run-child \
  --continue-on-error \
  -- \
  bash -c '
    set -euo pipefail

    if [[ "${ALLURE_KEEP_TESTPLAN:-false}" != "true" ]]; then
      if [[ -n "${ALLURE_TESTPLAN_PATH:-}" ]]; then
        echo "Ignoring TestOps testplan (${ALLURE_TESTPLAN_PATH}); CI layer filters own the selection"
        rm -f "${ALLURE_TESTPLAN_PATH}"
        unset ALLURE_TESTPLAN_PATH
      fi
      rm -f .allure/testplan.json
    else
      echo "Keeping TestOps testplan (ALLURE_KEEP_TESTPLAN=true)"
    fi

    set +e
    "$@"
    code=$?
    set -e

    if [[ -n "${WRITE_ALLURE_ENVIRONMENT:-}" ]]; then
      bash "${WRITE_ALLURE_ENVIRONMENT}" \
        || echo "warning: failed to write environment.properties (tests exit code unchanged)" >&2
    fi
    exit "$code"
  ' bash "$@"
