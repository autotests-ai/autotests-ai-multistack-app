from __future__ import annotations

import os

import pytest

# In-memory SQLite before app imports bind the engine.
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["JWT_SECRET"] = "test-secret-key-at-least-32-characters-long"

from app import create_app  # noqa: E402
from app.db import apply_schema  # noqa: E402
from app.seed import seed_data  # noqa: E402


@pytest.fixture()
def client():
    apply_schema()
    seed_data()
    app = create_app(init_db=False)
    app.config["TESTING"] = True
    with app.test_client() as test_client:
        yield test_client
