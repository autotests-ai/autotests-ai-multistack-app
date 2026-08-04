#!/usr/bin/env bash
# docker-entrypoint-initdb.d (first volume only). Same DB list as ensure-databases.sh.
# Naming: reference_app_{language}_{stack}
set -euo pipefail

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<-EOSQL
  SELECT 'CREATE DATABASE reference_app_java_spring'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'reference_app_java_spring')\gexec
  SELECT 'CREATE DATABASE reference_app_python_flask'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'reference_app_python_flask')\gexec
  SELECT 'CREATE DATABASE reference_app_python_fastapi'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'reference_app_python_fastapi')\gexec
  SELECT 'CREATE DATABASE reference_app_python_django'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'reference_app_python_django')\gexec
  SELECT 'CREATE DATABASE reference_app_kotlin_spring'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'reference_app_kotlin_spring')\gexec
  SELECT 'CREATE DATABASE reference_app_go_gin'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'reference_app_go_gin')\gexec
EOSQL
