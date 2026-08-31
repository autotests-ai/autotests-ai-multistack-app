#!/usr/bin/env bash
# GHA tests-lane Gradle path (one checkout, sequential layers).
# Canon: tests/java/tests-java-gradle-junit5-allure3-selenide/.github/actions/{mock,api,e2e}
# Do not pass -DremoteUrl on mock (local CFT). E2E: append-java-remote-url.sh
# (Selenoid for selenide/selenium, empty remoteUrl for playwright).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

TESTS_UI_LIBRARY="${TESTS_UI_LIBRARY:-selenide}"
BACKEND_LANG="${BACKEND_LANG:-java}"
BACKEND_FRAMEWORK="${BACKEND_FRAMEWORK:-spring}"
FRONTEND_LANG="${FRONTEND_LANG:-typescript}"
FRONTEND_FRAMEWORK="${FRONTEND_FRAMEWORK:-react}"
MODULE="${ROOT}/tests/java/tests-java-gradle-junit5-allure3-${TESTS_UI_LIBRARY}"
FRONTEND_DIR="${ROOT}/frontend/${FRONTEND_LANG}/frontend-${FRONTEND_LANG}-${FRONTEND_FRAMEWORK}"
FRONTEND_IMAGE="ghcr.io/autotests-ai/autotests-ai-multistack-app-frontend-${FRONTEND_LANG}-${FRONTEND_FRAMEWORK}:mock-local"
MERGE="${ROOT}/allure-results-ci"
REMOTE_URL_SH="${ROOT}/tests/.github/actions/append-java-remote-url.sh"
SCREENSHOT_OS="${SCREENSHOT_OS:-linux}"
SCREENSHOT_BROWSER="${SCREENSHOT_BROWSER:-chrome}"
MOCK_GATEWAY_PORT="${MOCK_GATEWAY_PORT:-9911}"
PUBLIC_HOST="${PUBLIC_HOST:-autotests.ai}"
STAGE_PUBLIC_HOST="${STAGE_PUBLIC_HOST:-stage.autotests.ai}"
STACK_MOUNT="${STACK_MOUNT:-stack}"

is_true() {
  case "${1:-}" in
    true|TRUE|True|yes|YES|1) return 0 ;;
    *) return 1 ;;
  esac
}

compose() {
  if docker compose version >/dev/null 2>&1; then
    docker compose "$@"
  else
    docker-compose "$@"
  fi
}

host_for_stand() {
  case "$1" in
    stage) printf '%s' "${STAGE_PUBLIC_HOST}" ;;
    prod) printf '%s' "${PUBLIC_HOST}" ;;
    *)
      echo "unknown stand: $1 (expected stage|prod)" >&2
      exit 2
      ;;
  esac
}

ui_url() {
  local stand="$1"
  if [ "$stand" = stage ] && [ -n "${STAGE_APP_URL:-}" ]; then
    printf '%s' "${STAGE_APP_URL}"
    return
  fi
  if [ "$stand" = prod ] && [ -n "${APP_URL:-}" ]; then
    printf '%s' "${APP_URL}"
    return
  fi
  printf 'https://%s/%s/backend-%s-%s/frontend-%s-%s/' \
    "$(host_for_stand "$stand")" "$STACK_MOUNT" \
    "$BACKEND_LANG" "$BACKEND_FRAMEWORK" \
    "$FRONTEND_LANG" "$FRONTEND_FRAMEWORK"
}

api_health_url() {
  printf 'https://%s/%s/backend-%s-%s/api/health' \
    "$(host_for_stand "$1")" "$STACK_MOUNT" "$BACKEND_LANG" "$BACKEND_FRAMEWORK"
}

merge_allure() {
  local src="${MODULE}/build/allure-results"
  mkdir -p "$MERGE"
  if [ -d "$src" ]; then
    cp -R "$src/." "$MERGE/"
  fi
}

run_gradle() {
  local label="$1"
  shift
  echo "==> ${label}"
  local code=0
  (
    cd "$MODULE"
    ./gradlew --console=plain test "$@"
  ) || code=$?
  merge_allure
  return "$code"
}

need_cft() {
  if is_true "${RUN_MOCK:-false}"; then
    return 0
  fi
  if [ "$TESTS_UI_LIBRARY" = playwright ] && {
    is_true "${RUN_E2E:-false}" || is_true "${RUN_SCREENSHOTS:-false}"
  }; then
    return 0
  fi
  return 1
}

cmd_prepare() {
  if [ ! -d "$MODULE" ]; then
    echo "STOP: tests cell missing: ${MODULE}" >&2
    exit 1
  fi
  test -f "${MODULE}/gradlew"
  command -v java >/dev/null
  java -version
  if is_true "${RUN_MOCK:-false}"; then
    command -v docker >/dev/null
    compose version
    test -d "$FRONTEND_DIR"
    test -f "${FRONTEND_DIR}/Dockerfile"
  fi
  if need_cft; then
    local installer="${MODULE}/scripts/install-chrome-for-testing.sh"
    test -x "$installer" || chmod +x "$installer"
    if ! "$installer" --verify; then
      "$installer"
    fi
  fi
}

cmd_mock() {
  if [ ! -d "$MODULE" ]; then
    echo "STOP: tests cell missing: ${MODULE}" >&2
    exit 1
  fi
  command -v docker >/dev/null
  local exit_code=0
  cleanup_mock() {
    IMAGE_TAG=mock-local MOCK_GATEWAY_PORT="${MOCK_GATEWAY_PORT}" \
      compose --profile mock down -v --remove-orphans || true
  }
  trap cleanup_mock EXIT

  echo "==> docker build mock frontend ${FRONTEND_IMAGE}"
  docker build -t "$FRONTEND_IMAGE" -f "${FRONTEND_DIR}/Dockerfile" "$FRONTEND_DIR"

  echo "==> compose mock stand-gateway :${MOCK_GATEWAY_PORT}"
  IMAGE_TAG=mock-local MOCK_GATEWAY_PORT="${MOCK_GATEWAY_PORT}" \
    compose --profile mock up -d stand-gateway
  curl -fsS --retry 30 --retry-delay 2 --retry-all-errors \
    "http://127.0.0.1:${MOCK_GATEWAY_PORT}/api/health"

  # No append-java-remote-url — mock is local CFT (GHA mock action).
  run_gradle "ui mock" -Denv=mock -DincludeTags=ui -DexcludeTags=screenshot || exit_code=$?

  if is_true "${RUN_SCREENSHOTS:-true}" || is_true "${UPDATE_MOCK_SCREENSHOTS:-false}"; then
    local shot_args=(-Denv=mock -DincludeTags=screenshot)
    if is_true "${UPDATE_MOCK_SCREENSHOTS:-false}"; then
      shot_args+=(-DupdateScreenshots=true)
    fi
    SCREENSHOT_OS="${SCREENSHOT_OS}" SCREENSHOT_BROWSER="${SCREENSHOT_BROWSER}" \
      run_gradle "screenshot mock" "${shot_args[@]}" || exit_code=$?
  fi

  trap - EXIT
  cleanup_mock
  return "$exit_code"
}

cmd_api() {
  local stand="${1:?stand (stage|prod)}"
  local url
  url="$(api_health_url "$stand")"
  echo "==> API ${url}"
  curl -fsS --retry 30 --retry-delay 2 --retry-all-errors "$url"
  run_gradle "api ${stand}" -Denv="$stand" -DincludeTags=api
}

cmd_e2e() {
  local stand="${1:?stand (stage|prod)}"
  local url exit_code=0
  url="$(ui_url "$stand")"
  echo "==> UI ${url}"
  curl -fsS --retry 30 --retry-delay 2 --retry-all-errors "$url"

  # GHA e2e: source append-java-remote-url.sh (playwright → empty; others → Selenoid).
  run_e2e_gradle() {
    local label="$1"
    shift
    echo "==> ${label}"
    local code=0
    (
      cd "$MODULE"
      ARGS=("$@")
      # shellcheck disable=SC1090
      source "$REMOTE_URL_SH"
      ./gradlew --console=plain test "${ARGS[@]}"
    ) || code=$?
    merge_allure
    return "$code"
  }

  if is_true "${RUN_E2E:-true}"; then
    run_e2e_gradle "e2e ${stand}" -Denv="$stand" -DincludeTags=e2e -DexcludeTags=screenshot || exit_code=$?
  fi

  local update_flag=false
  if [ "$stand" = stage ] && is_true "${UPDATE_STAGE_SCREENSHOTS:-false}"; then
    update_flag=true
  fi
  if [ "$stand" = prod ] && is_true "${UPDATE_E2E_SCREENSHOTS:-false}"; then
    update_flag=true
  fi

  if is_true "${RUN_SCREENSHOTS:-true}" || is_true "$update_flag"; then
    local shot_args=(-Denv="$stand" -DincludeTags=screenshot)
    if is_true "$update_flag"; then
      shot_args+=(-DupdateScreenshots=true)
    fi
    SCREENSHOT_OS="${SCREENSHOT_OS}" SCREENSHOT_BROWSER="${SCREENSHOT_BROWSER}" \
      run_e2e_gradle "screenshot ${stand}" "${shot_args[@]}" || exit_code=$?
  fi

  return "$exit_code"
}

usage() {
  echo "usage: $0 prepare | mock | api <stage|prod> | e2e <stage|prod>" >&2
  exit 2
}

cmd="${1:-}"
shift || true
case "$cmd" in
  prepare) cmd_prepare ;;
  mock) cmd_mock ;;
  api) cmd_api "${1:-}" ;;
  e2e) cmd_e2e "${1:-}" ;;
  *) usage ;;
esac
