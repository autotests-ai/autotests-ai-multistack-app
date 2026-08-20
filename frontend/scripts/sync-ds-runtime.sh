#!/usr/bin/env bash
# Refresh the lean DS runtime snapshot:
#   design-system css/js/templates → frontend/_shared/frontend-javascript-app
# Product overlay (app-base.js, env-hosts.js) is not touched.
# /stack/ board lives in projects/autotests-ai-home/stack-matrix/overlay/
# Do not edit the snapshot by hand — re-run this script.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
MONOREPO_ROOT="$(cd "$REPO_ROOT/../../.." && pwd)"
while [[ "$MONOREPO_ROOT" != "/" && ! -f "$MONOREPO_ROOT/projects/autotests-ai-multistack-home/matrix.yaml" ]]; do
  MONOREPO_ROOT="$(dirname "$MONOREPO_ROOT")"
done
if [[ ! -f "$MONOREPO_ROOT/projects/autotests-ai-multistack-home/matrix.yaml" ]]; then
  echo "STOP: cannot find monorepo root (projects/autotests-ai-multistack-home/matrix.yaml) from $REPO_ROOT" >&2
  exit 1
fi

DS="$MONOREPO_ROOT/projects/design-system-home/design-system"
DEST="$REPO_ROOT/frontend/_shared/frontend-javascript-app"

if [[ ! -d "$DS" ]]; then
  echo "STOP: design-system missing at $DS" >&2
  exit 1
fi

CSS_FILES=(
  badge.css
  button.css
  header.css
  icon-btn.css
  icon.css
  input.css
  lang-toggle.css
  link.css
  page.css
  panel.css
  plaque-divider.css
  plaque-field-seg-layout.css
  plaque-field-seg.css
  plaque-field.css
  plaque-number.css
  poll-toggle.css
  sticky.css
  tokens.css
)
JS_FILES=(
  dom-utils.js
  header-metrics-wrap.js
  header.js
  poll-toggle.js
  theme-icons.js
)
TEMPLATE_FILES=(
  header.html
)

copy_subset() {
  local src_dir="$1" dest_dir="$2"
  shift 2
  mkdir -p "$dest_dir"
  local name
  for name in "$@"; do
    if [[ ! -f "$src_dir/$name" ]]; then
      echo "STOP: missing $src_dir/$name" >&2
      exit 1
    fi
    cp "$src_dir/$name" "$dest_dir/$name"
  done
}

copy_subset "$DS/css" "$DEST/css" "${CSS_FILES[@]}"
copy_subset "$DS/js" "$DEST/js" "${JS_FILES[@]}"
copy_subset "$DS/templates" "$DEST/templates" "${TEMPLATE_FILES[@]}"

cat > "$DEST/README.md" <<'EOF'
# frontend-javascript-app

**Vendor** lean design-system runtime snapshot — not etalon.

SSOT is `projects/design-system-home/design-system/` (`css/`, `js/`, `templates/`).
Do not edit this tree by hand; refresh from the ethalon or live clone root:

```bash
bash frontend/scripts/sync-ds-runtime.sh
```

Product overlay (not copied from design-system): `js/app-base.js`,
`js/env-hosts.js` (from `sync-stack-matrix.py`).

The `/stack/` board is not in this snapshot — inbox
`projects/autotests-ai-home/stack-matrix/overlay/`.

Packed into each frontend nginx image as `UI_RUNTIME` (module `Dockerfile`).
EOF

FANOUT_DS="$REPO_ROOT/frontend/typescript/frontend-typescript-react/vendor/ds"
mkdir -p "$FANOUT_DS"
rsync -a --delete "$DEST/" "$FANOUT_DS/"

echo "sync-ds-runtime: $DS → $DEST"
echo "sync-ds-runtime fan-out: $FANOUT_DS"
