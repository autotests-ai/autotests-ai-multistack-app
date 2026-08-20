# Catalog CD (matrix clone SPA sidecars)

SSOT: [`catalog_github.yml`](catalog_github.yml).

Live copy (same filename):

`projects/autotests-ai-multistack-home/autotests-ai-multistack-app/.github/workflows/catalog_github.yml`

**Do not** fold this into matrix clone [`ci.yml`](../../../autotests-ai-multistack-app/.github/workflows/ci.yml) (teaching: one `FRONTEND`, sonar, e2e).  
**Do not** copy over takeaway `ci.yml` — that is [`singlestack_github.yml`](../../tests/_tests-meta/.github/_ethalon/singlestack_github.yml).

## What this is

Catalog SPA list is **not** hardcoded: [`catalog-cd-matrix.py`](../../frontend/scripts/catalog-cd-matrix.py) reads clone [`deploy/matrix.yaml`](../../../autotests-ai-multistack-app/deploy/matrix.yaml) and skips the one frontend with `teaching: true` (canon: `frontend-typescript-react`).

Build + GHCR push + SSH `compose pull/up` on stage then prod. No unit / sonar / e2e matrix. No backends × frontends cartesian.

Vue nginx images keep official `prodDevtools` hooks for the browser extension. Angular stays Analog's production optimizer (no plugin-name filter). One image tag (`IMAGE_TAG` = SHA, `:latest` on `main` only).

## Sync

Edit **this** file, copy byte-for-byte onto the live clone path above. Nested push is explicit. Host deploy checks out that SHA.

Pins: [`gha-actions.yaml`](../../tests/_tests-meta/.github/_ethalon/gha-actions.yaml).
