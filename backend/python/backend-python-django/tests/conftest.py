from __future__ import annotations

import os

os.environ.setdefault("JWT_SECRET", "test-secret-key-at-least-32-characters-long")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
os.environ.setdefault("PYTEST_RUNNING", "1")

# Unit: sqlite. Integration: Testcontainers URL is applied in
# django_db_modify_db_settings — pytest-django loads settings from pytest.ini
# before this file, so DATABASE_URL cannot bind Postgres at import time.
if os.environ.get("PYTEST_INTEGRATION") != "1":
    os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")

import allure
import pytest

from api.seed import seed_data

_pg = None


def pytest_runtest_setup(item: pytest.Item) -> None:
    allure.dynamic.label("module", "backend-python-django")
    allure.dynamic.label("language", "python")
    if item.get_closest_marker("integration"):
        allure.dynamic.label("layer", "integration")
        allure.dynamic.tag("integration")
    else:
        allure.dynamic.label("layer", "unit")


@pytest.fixture(scope="session")
def django_db_modify_db_settings(
    django_db_modify_db_settings_tox_suffix,
    django_db_modify_db_settings_xdist_suffix,
):
    """Point Django at Testcontainers PostgreSQL for the integration slice."""
    global _pg
    if os.environ.get("PYTEST_INTEGRATION") != "1":
        return
    from django.conf import settings
    from testcontainers.postgres import PostgresContainer

    from config.settings import build_databases

    _pg = PostgresContainer("postgres:16-alpine", driver="psycopg")
    _pg.start()
    os.environ["DATABASE_URL"] = _pg.get_connection_url()
    settings.DATABASES = build_databases(os.environ, running_pytest=False)


def pytest_unconfigure(config):
    global _pg
    if _pg is not None:
        _pg.stop()
        _pg = None


@pytest.fixture(autouse=True)
def _seed(db):
    seed_data()
