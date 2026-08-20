from __future__ import annotations

import pytest

pytestmark = pytest.mark.integration


@pytest.fixture(autouse=True)
def _require_postgres():
    from app.db import engine

    if engine.dialect.name != "postgresql":
        pytest.skip("set PYTEST_INTEGRATION=1 (Testcontainers PostgreSQL)")


def test_health_against_postgres(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.get_json()["status"] == "ok"


def test_items_come_from_postgres(client):
    response = client.get("/api/items")
    assert response.status_code == 200
    body = response.get_json()
    assert body["source"] == "postgresql"
    assert len(body["items"]) == 3
    assert body["items"][0]["name"] == "Alpha"


def test_register_login_me_against_postgres(client):
    register = client.post(
        "/api/auth/register",
        json={"username": "pguser", "password": "password123"},
    )
    assert register.status_code == 201
    token = register.get_json()["token"]

    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.get_json() == {"username": "pguser"}

    login = client.post(
        "/api/auth/login",
        json={"username": "pguser", "password": "password123"},
    )
    assert login.status_code == 200
    assert login.get_json()["username"] == "pguser"
