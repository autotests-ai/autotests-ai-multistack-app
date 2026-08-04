#!/usr/bin/env bash
# Post-deploy smoke — matrix backends × active frontends (strict TLS).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec python "${SCRIPT_DIR}/smoke_matrix.py" "$@"
