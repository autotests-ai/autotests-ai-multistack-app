# Shared frontend assets

Not part of the product URL matrix.

| Folder | Role |
|--------|------|
| `frontend-javascript-app/` | Staging lean DS snapshot (`sync-ds-runtime.sh`), then fan-out to each module `vendor/ds`. Not etalon — do not edit by hand. |
| `frontend-react-ui/` | Staging TSX wrappers from `design-system-home/react-ui/src` (`sync-react-ui.sh`, no CSS), then fan-out to `*react` `vendor/react-ui`. Not etalon. |
| `frontend-javascript-embed/` | Full design-system via `frontend/scripts/wire-ui.sh` (catalog / local DS work) |
