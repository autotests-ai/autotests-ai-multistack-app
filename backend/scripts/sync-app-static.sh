#!/usr/bin/env bash
# Wire design-system embed, then materialize UI into backend_java_spring static.
set -euo pipefail

# shellcheck source=paths.sh
source "$(cd "$(dirname "$0")" && pwd)/paths.sh"
export MONOREPO_ROOT UI="${UI:-design-system-embed}" SCREENS="${SCREENS:-}"

"$REPO_ROOT/backend/scripts/wire-ui.sh"

mkdir -p "$BACKEND_STATIC"

for d in css js templates; do
  rsync -a "$FRONTEND_JS_EMBED/$d/" "$BACKEND_STATIC/$d/"
done

rsync -a "$FRONTEND_JS_VANILLA/" "$BACKEND_STATIC/"

echo "sync-app-static: frontend/_shared + javascript/vanilla → backend/java/backend_java_spring/src/main/resources/static/"
