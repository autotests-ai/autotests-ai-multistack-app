from __future__ import annotations

import uuid

import allure
import pytest

pytestmark = pytest.mark.integration


@pytest.fixture(autouse=True)
def _require_postgres():
    from app.db import engine

    if engine.dialect.name != "postgresql":
        pytest.skip("set PYTEST_INTEGRATION=1 (Testcontainers PostgreSQL)")


@allure.epic("Application wiring")
@allure.feature("PostgreSQL and schema seed")
@allure.severity(allure.severity_level.BLOCKER)
@allure.title("GET /api/health — full stack reports the active backend module")
def test_health_reports_active_backend_module(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    body = response.get_json()
    assert body["status"] == "ok"
    assert body["service"] == "backend-python-flask"


@allure.epic("Application wiring")
@allure.feature("PostgreSQL and schema seed")
@allure.severity(allure.severity_level.BLOCKER)
@allure.title("GET /api/items — catalogue is served from PostgreSQL with seed")
def test_items_are_wired_to_postgresql(client):
    response = client.get("/api/items")
    assert response.status_code == 200
    body = response.get_json()
    assert body["source"] == "postgresql"
    assert [item["name"] for item in body["items"]] == ["Alpha", "Beta", "Gamma"]


@allure.epic("Authentication")
@allure.feature("Account lifecycle")
@allure.severity(allure.severity_level.CRITICAL)
@allure.title("register → login → me → logout (stateless: token survives) → delete → me is 401")
def test_account_lifecycle_round_trip(client):
    username = "int_" + uuid.uuid4().hex[:8]
    password = "password123"

    register = client.post(
        "/api/auth/register",
        json={"username": username, "password": password},
    )
    assert register.status_code == 201
    assert register.get_json()["username"] == username

    login = client.post(
        "/api/auth/login",
        json={"username": username, "password": password},
    )
    assert login.status_code == 200
    token = login.get_json()["token"]
    assert token

    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.get_json() == {"username": username}

    logout = client.post(
        "/api/auth/logout",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert logout.status_code == 204

    after_logout = client.get(
        "/api/auth/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert after_logout.status_code == 200
    assert after_logout.get_json() == {"username": username}

    deleted = client.delete(
        "/api/auth/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert deleted.status_code == 204

    after_delete = client.get(
        "/api/auth/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert after_delete.status_code == 401
