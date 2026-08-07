from __future__ import annotations

import json

import pytest

pytestmark = pytest.mark.django_db


def test_login_seed_user(client):
    response = client.post(
        "/api/auth/login",
        data=json.dumps({"username": "user1", "password": "password1"}),
        content_type="application/json",
    )
    assert response.status_code == 200
    body = response.json()
    assert body["username"] == "user1"
    assert body["redirectUrl"] == "/"
    assert body["token"]


def test_register_and_me(client):
    response = client.post(
        "/api/auth/register",
        data=json.dumps({"username": "newuser", "password": "password123"}),
        content_type="application/json",
    )
    assert response.status_code == 201
    token = response.json()["token"]

    me = client.get("/api/auth/me", HTTP_AUTHORIZATION=f"Bearer {token}")
    assert me.status_code == 200
    assert me.json() == {"username": "newuser"}


def test_me_unauthorized(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401
    assert response.json()["message"] == "Unauthorized"


def test_login_wrong_password(client):
    response = client.post(
        "/api/auth/login",
        data=json.dumps({"username": "user1", "password": "wrongpass"}),
        content_type="application/json",
    )
    assert response.status_code == 401
    assert response.json()["message"] == "Wrong login or password"


def test_register_conflict(client):
    response = client.post(
        "/api/auth/register",
        data=json.dumps({"username": "user1", "password": "password1"}),
        content_type="application/json",
    )
    assert response.status_code == 409


def test_logout(client):
    response = client.post("/api/auth/logout")
    assert response.status_code == 204


def test_delete_account(client):
    register = client.post(
        "/api/auth/register",
        data=json.dumps({"username": "deleteme", "password": "password123"}),
        content_type="application/json",
    )
    token = register.json()["token"]

    deleted = client.delete("/api/auth/me", HTTP_AUTHORIZATION=f"Bearer {token}")
    assert deleted.status_code == 204
    assert deleted.content == b""

    # Stateless JWT: the token still verifies, but the user row it names is gone.
    me = client.get("/api/auth/me", HTTP_AUTHORIZATION=f"Bearer {token}")
    assert me.status_code == 401


def test_delete_account_unauthorized(client):
    response = client.delete("/api/auth/me")
    assert response.status_code == 401
    assert response.json()["message"] == "Unauthorized"


def test_login_after_delete(client):
    register = client.post(
        "/api/auth/register",
        data=json.dumps({"username": "gonesoon", "password": "password123"}),
        content_type="application/json",
    )
    token = register.json()["token"]
    client.delete("/api/auth/me", HTTP_AUTHORIZATION=f"Bearer {token}")

    response = client.post(
        "/api/auth/login",
        data=json.dumps({"username": "gonesoon", "password": "password123"}),
        content_type="application/json",
    )
    assert response.status_code == 401
    assert response.json()["message"] == "Wrong login or password"
