#!/usr/bin/env bash
# docker-entrypoint-initdb.d (first volume only). Same DB list as ensure-databases.sh.
# Naming: multistack_app_{language}_{stack}
set -euo pipefail

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<-EOSQL
  SELECT 'CREATE DATABASE multistack_app_java_spring'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'multistack_app_java_spring')\gexec
  SELECT 'CREATE DATABASE multistack_app_python_flask'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'multistack_app_python_flask')\gexec
  SELECT 'CREATE DATABASE multistack_app_python_fastapi'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'multistack_app_python_fastapi')\gexec
  SELECT 'CREATE DATABASE multistack_app_python_django'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'multistack_app_python_django')\gexec
  SELECT 'CREATE DATABASE multistack_app_kotlin_spring'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'multistack_app_kotlin_spring')\gexec
  SELECT 'CREATE DATABASE multistack_app_go_gin'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'multistack_app_go_gin')\gexec
  SELECT 'CREATE DATABASE multistack_app_go_stdlib'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'multistack_app_go_stdlib')\gexec
  SELECT 'CREATE DATABASE multistack_app_javascript_express'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'multistack_app_javascript_express')\gexec
  SELECT 'CREATE DATABASE multistack_app_javascript_nest'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'multistack_app_javascript_nest')\gexec
  SELECT 'CREATE DATABASE multistack_app_typescript_express'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'multistack_app_typescript_express')\gexec
  SELECT 'CREATE DATABASE multistack_app_typescript_nest'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'multistack_app_typescript_nest')\gexec
EOSQL
