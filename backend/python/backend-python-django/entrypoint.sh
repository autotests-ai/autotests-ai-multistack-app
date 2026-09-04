#!/bin/sh
set -eu
export DJANGO_SETTINGS_MODULE="${DJANGO_SETTINGS_MODULE:-config.settings}"
export PROMETHEUS_MULTIPROC_DIR="${PROMETHEUS_MULTIPROC_DIR:-/tmp/prometheus-multiproc}"
mkdir -p "$PROMETHEUS_MULTIPROC_DIR"
python manage.py migrate --noinput
python -c "import django; django.setup(); from api.seed import seed_data; seed_data()"
python -m api.observability &
exec gunicorn --bind "0.0.0.0:${SERVER_PORT:-8080}" --workers 2 --config gunicorn.conf.py config.wsgi:application
