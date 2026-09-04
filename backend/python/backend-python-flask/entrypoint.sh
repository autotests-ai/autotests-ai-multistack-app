#!/bin/sh
set -eu
export PROMETHEUS_MULTIPROC_DIR="${PROMETHEUS_MULTIPROC_DIR:-/tmp/prometheus-multiproc}"
mkdir -p "$PROMETHEUS_MULTIPROC_DIR"
python -m app.observability &
exec gunicorn --bind "0.0.0.0:${SERVER_PORT:-8080}" --workers 2 --config gunicorn.conf.py wsgi:app
