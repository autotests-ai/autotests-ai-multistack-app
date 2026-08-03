#!/usr/bin/env bash
# Wire design-system embed, then materialize UI into backend-java-spring static.
set -euo pipefail

# shellcheck source=paths.sh
source "$(cd "$(dirname "$0")" && pwd)/paths.sh"
export MONOREPO_ROOT UI="${UI:-design-system-embed}" SCREENS="${SCREENS:-}"

"$REPO_ROOT/backend/scripts/wire-ui.sh"

mkdir -p "$BACKEND_STATIC"

for d in css js templates; do
  rsync -a "$FRONTEND_JS_EMBED/$d/" "$BACKEND_STATIC/$d/"
done

for f in allure-shell.css allure-shell.js; do
  if [[ -f "$FRONTEND_JS_EMBED/$f" ]]; then
    cp -a "$FRONTEND_JS_EMBED/$f" "$BACKEND_STATIC/"
  fi
done

rsync -a "$FRONTEND_JS_STATIC/" "$BACKEND_STATIC/"

echo "sync-app-static: frontend/javascript/* → backend/java/backend-java-spring/src/main/resources/static/"
