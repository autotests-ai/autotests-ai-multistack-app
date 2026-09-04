#!/usr/bin/env bash
# Load SUT only. Stop every compose service except the keep-list (args).
# postgres is never stopped even if omitted from the keep-list.
# Do not call from stage/prod — those stands run more than one cell.
set -euo pipefail

COMPOSE="docker compose"
if [ -n "${DEPLOY_COMPOSE_PROJECT:-}" ]; then
  COMPOSE="${COMPOSE} --project-name ${DEPLOY_COMPOSE_PROJECT}"
fi
if [ -n "${DEPLOY_COMPOSE_ENV_FILE:-}" ]; then
  COMPOSE="${COMPOSE} --env-file ${DEPLOY_COMPOSE_ENV_FILE}"
fi

keep="$*"
available="$($COMPOSE config --services)"
while IFS= read -r s; do
  [ -n "$s" ] || continue
  if [ "$s" = "postgres" ]; then
    continue
  fi
  skip=false
  for k in $keep; do
    if [ "$s" = "$k" ]; then
      skip=true
      break
    fi
  done
  if [ "$skip" = false ]; then
    echo "load-sut: stop ${s}"
    $COMPOSE stop "$s"
  fi
done <<< "$available"
