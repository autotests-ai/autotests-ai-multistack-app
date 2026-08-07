#!/usr/bin/env bash
# Stream Allure results when the shared TestOps context is available.
# Test execution is always the source of truth: missing/broken TestOps falls
# back to the unchanged command, and exec preserves its exit code.
set -euo pipefail

if [[ "$#" -eq 0 ]]; then
  echo "usage: $0 <test-command> [args...]" >&2
  exit 2
fi

fallback() {
  if [[ "${GITHUB_ACTIONS:-false}" == "true" ]]; then
    echo "::warning title=TestOps live upload unavailable::Running tests without allurectl; raw results remain available for fallback."
  else
    echo "TestOps live upload unavailable — running tests without allurectl"
  fi
  exec "$@"
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
# Child watchers must not stop the shared parent; publish-allure-report owns that lifecycle.
exec allurectl --http-timeout 1m watch \
  --job-run-child \
  --continue-on-error \
  -- "$@"
