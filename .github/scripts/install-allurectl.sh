#!/usr/bin/env bash
# Put pinned allurectl on PATH from $RUNNER_TEMP/allurectl-bin.
# Cache hit (actions/cache restored the dir) → no GitHub download.
# Does not invoke setup-allurectl: that action always calls GitHub API
# (getReleaseByTag + getWorkflowRun) and stores the binary under
# $RUNNER_TOOL_CACHE/allurectl/<ver>/<goarch>/ plus a sibling `.complete`.
set -euo pipefail

VERSION="${ALLURECTL_VERSION:?ALLURECTL_VERSION is required}"
DEST="${RUNNER_TEMP:?}/allurectl-bin"
BIN="${DEST}/allurectl"

mkdir -p "$DEST"

bin_ok() {
  [[ -x "$BIN" ]] && "$BIN" --version >/dev/null 2>&1
}

if bin_ok; then
  echo "allurectl ${VERSION} restored from cache (${BIN})"
else
  rm -f "$BIN"
  case "${RUNNER_OS:-}" in
    Linux) os=linux ;;
    macOS) os=darwin ;;
    *)
      echo "unsupported RUNNER_OS=${RUNNER_OS:-}" >&2
      exit 1
      ;;
  esac
  case "${RUNNER_ARCH:-}" in
    X64) arch=amd64 ;;
    ARM64) arch=arm64 ;;
    *)
      echo "unsupported RUNNER_ARCH=${RUNNER_ARCH:-}" >&2
      exit 1
      ;;
  esac
  url="https://github.com/allure-framework/allurectl/releases/download/${VERSION}/allurectl_${os}_${arch}"
  echo "Downloading ${url}"
  curl -fsSL --connect-timeout 10 --max-time 45 -o "$BIN" "$url"
  chmod +x "$BIN"
  if ! bin_ok; then
    echo "downloaded allurectl is not executable" >&2
    exit 1
  fi
  "$BIN" --version
fi

if [[ -n "${GITHUB_PATH:-}" ]]; then
  echo "$DEST" >> "$GITHUB_PATH"
fi
if [[ -n "${GITHUB_ENV:-}" && -n "${ALLURE_TOKEN:-}" ]]; then
  echo "ALLURE_TOKEN=${ALLURE_TOKEN}" >> "$GITHUB_ENV"
fi
# setup-allurectl used a numeric workflow id from the GitHub API; filename is stable
# without that extra call. Token/endpoint already come from job/workflow env.
if [[ -n "${GITHUB_ENV:-}" && -z "${ALLURE_JOB_UID:-}" ]]; then
  echo "ALLURE_JOB_UID=${GITHUB_REPOSITORY}/actions/workflows/ci.yml" >> "$GITHUB_ENV"
fi
