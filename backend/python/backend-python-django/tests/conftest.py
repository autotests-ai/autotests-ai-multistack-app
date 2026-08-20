from __future__ import annotations

import os

os.environ.setdefault("JWT_SECRET", "test-secret-key-at-least-32-characters-long")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
os.environ.setdefault("PYTEST_RUNNING", "1")

_pg = None
if os.environ.get("PYTEST_INTEGRATION") == "1":
    from testcontainers.postgres import PostgresContainer

    _pg = PostgresContainer("postgres:16-alpine", driver="psycopg")
    _pg.start()
    os.environ["DATABASE_URL"] = _pg.get_connection_url()
else:
    os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")

import pytest

from api.seed import seed_data


def pytest_unconfigure(config):
    global _pg
    if _pg is not None:
        _pg.stop()
        _pg = None


@pytest.fixture(autouse=True)
def _seed(db):
    seed_data()
