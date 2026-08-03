#!/usr/bin/env bash
# Materialize only the assets the Spring app pages need into backend static.
# Full design-system catalog stays in frontend/ (_shared embed + _catalog preview).
set -euo pipefail

# shellcheck source=paths.sh
source "$(cd "$(dirname "$0")" && pwd)/paths.sh"
export MONOREPO_ROOT UI="${UI:-design-system-embed}" SCREENS="${SCREENS:-}"

"$REPO_ROOT/backend/scripts/wire-ui.sh"

# App page CSS (HTML links) + transitive @import deps from design-system.
APP_CSS=(
  tokens.css
  link.css
  input.css
  button.css
  panel.css
  sticky.css
  plaque-field.css
  plaque-divider.css
  plaque-field-seg.css
  plaque-field-seg-layout.css
  plaque-number.css
  icon.css
  icon-btn.css
  lang-toggle.css
  header.css
)

# header.js module graph + template.
APP_JS=(
  header.js
  theme-icons.js
  dom-utils.js
  header-metrics-wrap.js
)

APP_TEMPLATES=(
  header.html
)

rm -rf "$BACKEND_STATIC"
mkdir -p "$BACKEND_STATIC/css" "$BACKEND_STATIC/js" "$BACKEND_STATIC/templates"

for f in "${APP_CSS[@]}"; do
  src="$FRONTEND_JS_EMBED/css/$f"
  if [[ ! -f "$src" ]]; then
    echo "STOP: missing app CSS: $src" >&2
    exit 1
  fi
  cp -a "$src" "$BACKEND_STATIC/css/"
done

for f in "${APP_JS[@]}"; do
  src="$FRONTEND_JS_EMBED/js/$f"
  if [[ ! -f "$src" ]]; then
    echo "STOP: missing app JS: $src" >&2
    exit 1
  fi
  cp -a "$src" "$BACKEND_STATIC/js/"
done

for f in "${APP_TEMPLATES[@]}"; do
  src="$FRONTEND_JS_EMBED/templates/$f"
  if [[ ! -f "$src" ]]; then
    echo "STOP: missing app template: $src" >&2
    exit 1
  fi
  cp -a "$src" "$BACKEND_STATIC/templates/"
done

# Product pages + app-only css/js (auth.css, app.css, page.css, auth.js, app.js).
rsync -a \
  --exclude 'js/autotests-builder.js' \
  "$FRONTEND_JS_VANILLA/" "$BACKEND_STATIC/"

echo "sync-app-static: lean app assets → backend/java/backend_java_spring/src/main/resources/static/"
