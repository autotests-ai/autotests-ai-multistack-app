#!/usr/bin/env bash
# Write CI launch axes into allure-results/environment.properties
# so Allure Report / TestOps show them under «Окружение».
#
# Reads workflow env (see ci.yml). No-op when ALLURE_RESULTS or all axes are unset.
set -euo pipefail

if [[ -z "${ALLURE_RESULTS:-}" ]]; then
  echo "write-allure-environment: ALLURE_RESULTS unset — skip"
  exit 0
fi

mkdir -p "$ALLURE_RESULTS"
props="${ALLURE_RESULTS}/environment.properties"
tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT

# Keep in sync with workflow env axes in .github/workflows/ci.yml.
axes=(BROWSER OS ENDPOINT VERSION BRANCH)

for key in "${axes[@]}"; do
  val="${!key:-}"
  [[ -n "$val" ]] || continue
  val="${val//$'\n'/ }"
  printf '%s=%s\n' "$key" "$val" >> "$tmp"
done

if [[ ! -s "$tmp" ]]; then
  echo "write-allure-environment: no axes set — skip"
  exit 0
fi

mv "$tmp" "$props"
trap - EXIT
echo "Wrote ${props} ($(wc -l <"$props" | tr -d ' ') keys)"
