#!/usr/bin/env bash
# Idempotent: create per-backend databases (safe on existing volumes).
# Naming: reference_app_{language}_{stack} — mirrors backend module id without "backend-".
set -euo pipefail

export PGPASSWORD="${POSTGRES_PASSWORD:-reference}"
HOST="${PGHOST:-postgres}"
USER="${POSTGRES_USER:-reference}"

for db in reference_app_java_spring reference_app_python_flask \
          reference_app_python_fastapi reference_app_python_django \
          reference_app_kotlin_spring reference_app_go_gin; do
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
