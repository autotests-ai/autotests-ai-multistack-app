#!/usr/bin/env bash
# Idempotent: create per-backend databases (safe on existing volumes).
# Naming: multistack_app_{language}_{stack} — mirrors backend module id without "backend-".
set -euo pipefail

export PGPASSWORD="${POSTGRES_PASSWORD:-multistack}"
HOST="${PGHOST:-postgres}"
USER="${POSTGRES_USER:-multistack}"

for db in multistack_app_java_spring multistack_app_python_flask \
          multistack_app_python_fastapi multistack_app_python_django \
          multistack_app_kotlin_spring multistack_app_go_gin \
          multistack_app_go_stdlib multistack_app_javascript_express \
          multistack_app_javascript_nest multistack_app_typescript_express \
          multistack_app_typescript_nest multistack_app_csharp_aspnet \
          multistack_app_rust_axum; do
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
