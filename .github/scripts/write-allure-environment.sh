#!/usr/bin/env bash
# Write CI launch axes into allure-results/environment.properties so Report 3 /
# TestOps show them under «Окружение». No-op when ALLURE_RESULTS or all axes unset.
set -euo pipefail

if [[ -z "${ALLURE_RESULTS:-}" ]]; then
  echo "write-allure-environment: ALLURE_RESULTS unset — skip"
  exit 0
fi

mkdir -p "$ALLURE_RESULTS"
props="${ALLURE_RESULTS}/environment.properties"
tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT

append() {
  local key="$1" val="${2:-}"
  [[ -n "$val" ]] || return 0
  val="${val//$'\n'/ }"
  printf '%s=%s\n' "$key" "$val" >> "$tmp"
}

# Keys match workflow env / sandbox-style axes (visible in TestOps Environment).
append BROWSER "${BROWSER:-}"
append OS "${OS:-}"
append ENDPOINT "${ENDPOINT:-}"
append VERSION "${VERSION:-}"
append BRANCH "${BRANCH:-}"

if [[ ! -s "$tmp" ]]; then
  echo "write-allure-environment: no axes set — skip"
  exit 0
fi

mv "$tmp" "$props"
trap - EXIT
echo "Wrote Allure environment → ${props}"
cat "$props"
