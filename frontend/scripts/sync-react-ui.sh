#!/usr/bin/env bash
# Refresh vendored @zero-design-system/react sources into frontend/_shared/frontend-react-ui.
# Run from monorepo (or nested repo when packages/react-ui is reachable via MONOREPO_ROOT).
set -euo pipefail

# shellcheck source=../../backend/scripts/paths.sh
source "$(cd "$(dirname "$0")/../.." && pwd)/backend/scripts/paths.sh"

SRC="$MONOREPO_ROOT/packages/react-ui/src"
DEST="$REPO_ROOT/frontend/_shared/frontend-react-ui"

if [[ ! -d "$SRC" ]]; then
  echo "STOP: react-ui sources missing at $SRC (is MONOREPO_ROOT correct?)" >&2
  exit 1
fi

mkdir -p "$DEST/src"
rsync -a --delete \
  --exclude='*.test.ts' \
  --exclude='*.test.tsx' \
  --exclude='test/' \
  "$SRC/" "$DEST/src/"

cat > "$DEST/package.json" <<'EOF'
{
  "name": "@zero-design-system/react",
  "version": "0.1.0-pilot",
  "private": true,
  "type": "module",
  "description": "Vendored react-ui sources for standalone autotests-ai-multistack-app builds (sync via frontend/scripts/sync-react-ui.sh)",
  "exports": {
    ".": "./src/index.ts"
  }
}
EOF

cat > "$DEST/README.md" <<'EOF'
# frontend-react-ui

Vendored copy of monorepo `packages/react-ui/src` for standalone Docker/GHA builds of
`autotests-ai-multistack-app` (no monorepo checkout on the build host).

**Deliberately test-stripped:** the sync excludes `*.test.tsx` / `test/`. Component quality
is guaranteed upstream in monorepo `packages/react-ui` (its own Vitest+RTL suite); this copy
is a build artifact, not a source of truth — do not edit by hand, re-run the sync instead.

Refresh from monorepo root:

```bash
bash frontend/scripts/sync-react-ui.sh
```

Consumed via Vite alias `@zero-design-system/react` → `src/index.ts`.
EOF

echo "sync-react-ui: $SRC → $DEST/src"
