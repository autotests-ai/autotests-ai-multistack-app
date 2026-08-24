#!/usr/bin/env bash
# Sourced by layer actions (not .github/scripts, not a ci-helpers composite).
#   source "${GITHUB_WORKSPACE}/.github/actions/setup-allurectl/allurectl-run.sh"
#   run_with_allurectl <command...>
# Also executable: ./allurectl-run.sh <command...>

_ALLURECTL_RUN_SH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"

write_allure_environment() {
  if [[ -z "${ALLURE_RESULTS:-}" ]]; then
    echo "write-allure-environment: ALLURE_RESULTS unset — skip"
    return 0
  fi
  mkdir -p "$ALLURE_RESULTS"
  props="${ALLURE_RESULTS}/environment.properties"
  tmp="$(mktemp)"
  for key in BROWSER OS ENDPOINT VERSION BRANCH; do
    val="${!key:-}"
    [[ -n "$val" ]] || continue
    val="${val//$'\n'/ }"
    printf '%s=%s\n' "$key" "$val" >> "$tmp"
  done
  if [[ ! -s "$tmp" ]]; then
    echo "write-allure-environment: no axes set — skip"
    rm -f "$tmp"
    return 0
  fi
  mv "$tmp" "$props"
  echo "Wrote ${props} ($(wc -l <"$props" | tr -d ' ') keys)"
}

run_with_allurectl() {
  if [[ "$#" -eq 0 ]]; then
    echo "usage: run_with_allurectl <command...>" >&2
    return 2
  fi
  run_then_write_env() {
    set +e
    "$@"
    local code=$?
    set -e
    write_allure_environment || echo "warning: failed to write environment.properties (tests exit code unchanged)" >&2
    return "$code"
  }
  fallback() {
    if [[ "${GITHUB_ACTIONS:-false}" == "true" ]]; then
      echo "::warning title=TestOps live upload unavailable::Running tests without allurectl; raw results remain available for fallback."
    else
      echo "TestOps live upload unavailable — running tests without allurectl"
    fi
    run_then_write_env "$@"
    return $?
  }
  if [[ "${ALLURE_LIVE_ENABLED:-false}" != "true" ]] || ! command -v allurectl >/dev/null 2>&1; then
    fallback "$@"
    return $?
  fi
  for name in ALLURE_ENDPOINT ALLURE_TOKEN ALLURE_PROJECT_ID ALLURE_RESULTS ALLURE_LAUNCH_ID ALLURE_JOB_RUN_ID; do
    if [[ -z "${!name:-}" ]]; then
      echo "Missing ${name}"
      fallback "$@"
      return $?
    fi
  done
  echo "Streaming Allure results to launch ${ALLURE_LAUNCH_ID}, job-run ${ALLURE_JOB_RUN_ID}"
  export _ALLURECTL_HELPER="${_ALLURECTL_RUN_SH}"
  allurectl --http-timeout 1m watch \
    --job-run-child \
    --continue-on-error \
    -- \
    bash -c '
      set -euo pipefail
      # shellcheck source=/dev/null
      source "${_ALLURECTL_HELPER}"
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
      write_allure_environment || echo "warning: failed to write environment.properties (tests exit code unchanged)" >&2
      exit "$code"
    ' bash "$@"
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  run_with_allurectl "$@"
fi
