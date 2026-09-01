#!/usr/bin/env bash
# JaCoCo analog: 100% on the exported ConfigReader helpers (not client.go / mustAPIBaseURL).
set -euo pipefail
cd "$(dirname "$0")"
go test ./tests/infra -coverprofile=coverage.out -coverpkg=. -count=1
need=(ClosedConfigReader ResolveBaseURL ResolveAPIBaseURL LoadConfig)
fail=0
for name in "${need[@]}"; do
  line=$(go tool cover -func=coverage.out | grep "config.go:" | grep -F "${name}" | head -1 || true)
  if [[ -z "${line}" ]]; then
    echo "ERROR: no coverage line for ${name}" >&2
    fail=1
    continue
  fi
  pct="${line##*$'\t'}"
  pct="${pct%%%}"
  if [[ "${pct}" != "100.0" ]]; then
    echo "ERROR: ${name} coverage ${pct}% (want 100.0%)" >&2
    echo "  ${line}" >&2
    fail=1
  fi
done
if [[ "${fail}" -ne 0 ]]; then
  go tool cover -func=coverage.out | grep 'config.go:' || true
  exit 1
fi
echo "ConfigReader analog: ${need[*]} at 100.0%"
