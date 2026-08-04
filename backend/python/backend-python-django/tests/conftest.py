from __future__ import annotations

import os

os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("JWT_SECRET", "test-secret-key-at-least-32-characters-long")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import pytest

from api.seed import seed_data


@pytest.fixture(autouse=True)
def _seed(db):
    seed_data()
