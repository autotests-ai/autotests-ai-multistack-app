#!/usr/bin/env bash
# Wire design-system primitives into frontend/_shared/frontend_javascript_embed (symlinks).
set -euo pipefail

# shellcheck source=paths.sh
source "$(cd "$(dirname "$0")" && pwd)/paths.sh"
export MONOREPO_ROOT UI="${UI:-design-system-embed}" SCREENS="${SCREENS:-}"
MANIFEST="${MANIFEST:-$MONOREPO_ROOT/stacks/_contract/ui.manifest.yaml}"

FRONTEND="$FRONTEND_JS_EMBED"
DS="$MONOREPO_ROOT/projects/design-system-home/design-system"

mkdir -p "$FRONTEND"

if [[ "$UI" == "design-system-embed" ]]; then
  for d in css js templates; do
    rel="$(python -c "import os; print(os.path.relpath('$DS/$d', '$FRONTEND'))")"
    ln -sfn "$rel" "$FRONTEND/$d"
  done
  echo "wire-ui: design-system → frontend/_shared/frontend_javascript_embed"
elif [[ "$UI" == "plain" ]]; then
  echo "wire-ui: plain (skip design-system embed)"
else
  echo "STOP: unknown UI mode: $UI (expected design-system-embed or plain)" >&2
  exit 1
fi

if [[ -n "$SCREENS" ]]; then
  if [[ ! -f "$MANIFEST" ]]; then
    echo "STOP: ui manifest missing at $MANIFEST" >&2
    exit 1
  fi
  python - "$MANIFEST" "$MONOREPO_ROOT" "$REPO_ROOT" "$SCREENS" <<'PY'
import os
import shutil
import sys

import yaml

manifest_path, monorepo, project, screens_csv = sys.argv[1:5]
screens = [s.strip() for s in screens_csv.split(",") if s.strip()]
data = yaml.safe_load(open(manifest_path))
catalog = data.get("screens", {})

for sid in screens:
    if sid not in catalog:
        raise SystemExit(f"STOP: unknown screen {sid!r} — see stacks/_contract/ui.manifest.yaml")
    entry = catalog[sid]
    src = os.path.join(monorepo, entry["canon"])
    dest = os.path.join(project, entry["dest"])
    if not os.path.isfile(src):
        raise SystemExit(f"STOP: canon screen missing: {src}")
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    shutil.copy2(src, dest)
    print(f"wire-ui: screen {sid} → {entry['dest']}")
PY
fi
