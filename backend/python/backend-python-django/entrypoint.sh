#!/bin/sh
set -eu
export DJANGO_SETTINGS_MODULE="${DJANGO_SETTINGS_MODULE:-config.settings}"
python manage.py migrate --noinput
python -c "import django; django.setup(); from api.seed import seed_data; seed_data()"
exec gunicorn --bind "0.0.0.0:${SERVER_PORT:-8080}" --workers 2 config.wsgi:application
