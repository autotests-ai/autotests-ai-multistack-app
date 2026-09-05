# Resolve MULTISTACK_API_BASE from MULTISTACK_ENV when the URL is not set.
# Same names as Android -Penv= and Appium -Denv=. Not a device host.
#
#   MULTISTACK_ENV=ci scripts/build-sim.sh
#   MULTISTACK_API_BASE=http://127.0.0.1:8080/api scripts/build-sim.sh   # wins
#
# Sourced from build-sim.sh / build-ipa.sh. Do not execute.

if [ -z "${MULTISTACK_API_BASE:-}" ] && [ -n "${MULTISTACK_ENV:-}" ]; then
  case "${MULTISTACK_ENV}" in
    ci) MULTISTACK_API_BASE="http://127.0.0.1:8800/api" ;;
    stage) MULTISTACK_API_BASE="https://stage.autotests.ai/stack/backend-java-spring/api" ;;
    prod) MULTISTACK_API_BASE="https://autotests.ai/stack/backend-java-spring/api" ;;
    mock)
      echo "STOP: native cell has no mock stand. MULTISTACK_ENV=ci|stage|prod." >&2
      exit 1
      ;;
    *)
      echo "STOP: unknown MULTISTACK_ENV=${MULTISTACK_ENV} (ci|stage|prod)." >&2
      exit 1
      ;;
  esac
  export MULTISTACK_API_BASE
fi
