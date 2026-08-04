#!/usr/bin/env bash
# Idempotent: create per-backend databases (safe on existing volumes).
set -euo pipefail

export PGPASSWORD="${POSTGRES_PASSWORD:-reference}"
HOST="${PGHOST:-postgres}"
USER="${POSTGRES_USER:-reference}"

for db in reference_app_java reference_app_flask reference_app_fastapi \
          reference_app_django reference_app_kotlin; do
  exists="$(psql -h "$HOST" -U "$USER" -d postgres -tAc \
    "SELECT 1 FROM pg_database WHERE datname='${db}'")"
  if [[ "$exists" != "1" ]]; then
    psql -h "$HOST" -U "$USER" -d postgres -v ON_ERROR_STOP=1 \
      -c "CREATE DATABASE ${db}"
    echo "created database ${db}"
  else
    echo "database ${db} already exists"
  fi
done
