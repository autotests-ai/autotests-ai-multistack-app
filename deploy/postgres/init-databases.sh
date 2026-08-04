#!/usr/bin/env bash
# docker-entrypoint-initdb.d (first volume only). Same DB list as ensure-databases.sh.
set -euo pipefail

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<-EOSQL
  SELECT 'CREATE DATABASE reference_app_java'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'reference_app_java')\gexec
  SELECT 'CREATE DATABASE reference_app_flask'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'reference_app_flask')\gexec
  SELECT 'CREATE DATABASE reference_app_fastapi'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'reference_app_fastapi')\gexec
  SELECT 'CREATE DATABASE reference_app_django'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'reference_app_django')\gexec
  SELECT 'CREATE DATABASE reference_app_kotlin'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'reference_app_kotlin')\gexec
EOSQL
