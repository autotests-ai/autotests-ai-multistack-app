#!/usr/bin/env bash
# Refresh vendored @zero-design-system/react wrappers into frontend/_shared/frontend-react-ui.
# TSX/.ts only — CSS stays in design-system / javascript-app (rsync --exclude styles).
# Run from ethalon or live clone root (MONOREPO_ROOT must reach design-system-home/react-ui).
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

SRC="$MONOREPO_ROOT/projects/design-system-home/react-ui/src"
DEST="$REPO_ROOT/frontend/_shared/frontend-react-ui"

if [[ ! -d "$SRC" ]]; then
  echo "STOP: react-ui sources missing at $SRC (is MONOREPO_ROOT correct?)" >&2
  exit 1
fi

mkdir -p "$DEST/src"
rsync -a --delete \
  --exclude='styles/' \
  --exclude='styles.ts' \
  --exclude='*.css' \
  --exclude='*.test.ts' \
  --exclude='*.test.tsx' \
  --exclude='test/' \
  "$SRC/" "$DEST/src/"
# rsync --exclude keeps leftover dest paths; drop CSS snapshot if a previous sync copied it.
rm -rf "$DEST/src/styles"
rm -f "$DEST/src/styles.ts"

cat > "$DEST/package.json" <<'EOF'
{
  "name": "@zero-design-system/react",
  "version": "0.1.0-pilot",
  "private": true,
  "type": "module",
  "description": "Vendored react-ui wrappers for standalone autotests-ai-multistack-app builds (sync via frontend/scripts/sync-react-ui.sh; TSX only, no CSS)",
  "exports": {
    ".": "./src/index.ts"
  }
}
EOF

cat > "$DEST/README.md" <<'EOF'
# frontend-react-ui

**Vendor** copy of monorepo `projects/design-system-home/react-ui/src` — not etalon.
TSX/.ts wrappers only (no `src/styles`). Primitive CSS is the javascript-app snapshot
(`sync-ds-runtime.sh`); the product imports it from `src/styles.ts`, not a package barrel.

**Deliberately test-stripped:** the sync excludes `*.test.tsx` / `test/` / `styles/`.
Component quality is guaranteed upstream in `projects/design-system-home/react-ui`;
this copy is a build artifact — do not edit by hand, re-run the sync instead.

Refresh from the ethalon or live clone root:

```bash
bash frontend/scripts/sync-react-ui.sh
```

Consumed via Vite alias `@zero-design-system/react` → `src/index.ts`.
EOF

echo "sync-react-ui: $SRC → $DEST/src"
