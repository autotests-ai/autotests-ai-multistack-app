#!/usr/bin/env bash
# Tests (Selenide) test-infra + JaCoCo + SonarQube upload + quality gate poll.
# Soft-skip when SONAR_TOKEN unset or host unreachable (unless SONAR_REQUIRED=true).
# Env: SONAR_TOKEN, SONAR_HOST_URL, SONAR_PROJECT_KEY, SONAR_REQUIRED
set -euo pipefail

# shellcheck source=paths.sh
source "$(cd "$(dirname "$0")" && pwd)/paths.sh"
cd "$TESTS_JAVA_GRADLE_JUNIT5_ALLURE3_SELENIDE"

export SONAR_HOST_URL="${SONAR_HOST_URL:-https://sonar.qa.guru}"
export SONAR_PROJECT_KEY="${SONAR_PROJECT_KEY:-reference-app-copy-tests-java-gradle-junit5-allure3-selenide}"
export SONAR_REQUIRED="${SONAR_REQUIRED:-false}"

echo "==> test-infra + jacoco (${SONAR_PROJECT_KEY})"
# Coverage gate slice = test-infra helpers; same filter CI uses in test-infra-tests.
./gradlew test jacocoTestReport \
  -Denv=reference_ci \
  -DincludeTags=test-infra \
  --no-daemon

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
./gradlew sonar --no-daemon \
  -Dsonar.host.url="${SONAR_HOST_URL}" \
  -Dsonar.projectKey="${SONAR_PROJECT_KEY}" \
  -Dsonar.projectName="${SONAR_PROJECT_KEY}"

echo "==> quality gate poll"
REPORT_TASK="$TESTS_JAVA_GRADLE_JUNIT5_ALLURE3_SELENIDE/build/sonar/report-task.txt"
bash "$REPO_ROOT/scripts/ci-sonar-gate.sh" "$REPORT_TASK" "$SONAR_PROJECT_KEY"
