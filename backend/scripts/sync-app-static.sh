#!/usr/bin/env bash
# Materialize frontend → backend static (build artifact, not source).
# SSOT: frontend/_shared/frontend_javascript_app + frontend/javascript/vanilla/...
set -euo pipefail

# shellcheck source=paths.sh
source "$(cd "$(dirname "$0")" && pwd)/paths.sh"

rm -rf "$BACKEND_STATIC"
mkdir -p "$BACKEND_STATIC"

if [[ ! -d "$FRONTEND_JS_APP" ]]; then
  echo "STOP: missing $FRONTEND_JS_APP" >&2
  exit 1
fi
if [[ ! -d "$FRONTEND_JS_VANILLA" ]]; then
  echo "STOP: missing $FRONTEND_JS_VANILLA" >&2
  exit 1
fi

rsync -a "$FRONTEND_JS_APP/" "$BACKEND_STATIC/"
rsync -a \
  --exclude 'README.md' \
  "$FRONTEND_JS_VANILLA/" "$BACKEND_STATIC/"

echo "sync-app-static: frontend → $BACKEND_STATIC"
