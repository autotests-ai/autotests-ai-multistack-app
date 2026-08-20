from __future__ import annotations

import os

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("JWT_SECRET", "test-secret-key-at-least-32-characters-long")

_pg = None
if os.environ.get("PYTEST_INTEGRATION") == "1":
    from testcontainers.postgres import PostgresContainer

    _pg = PostgresContainer("postgres:16-alpine", driver="psycopg")
    _pg.start()
    os.environ["DATABASE_URL"] = _pg.get_connection_url()
else:
    os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")


def pytest_unconfigure(config):
    global _pg
    if _pg is not None:
        _pg.stop()
        _pg = None


@pytest.fixture()
def client():
    from app.db import apply_schema
    from app.main import create_app
    from app.seed import seed_data

    apply_schema()
    seed_data()
    app = create_app(init_db=False)
    with TestClient(app) as test_client:
        yield test_client
