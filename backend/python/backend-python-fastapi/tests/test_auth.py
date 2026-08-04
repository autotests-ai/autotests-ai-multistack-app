from __future__ import annotations


def test_login_seed_user(client):
    response = client.post(
        "/api/auth/login",
        json={"username": "user1", "password": "password1"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["username"] == "user1"
    assert body["redirectUrl"] == "/"
    assert body["token"]


def test_register_and_me(client):
    response = client.post(
        "/api/auth/register",
        json={"username": "newuser", "password": "password123"},
    )
    assert response.status_code == 201
    token = response.json()["token"]

    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json() == {"username": "newuser"}


def test_me_unauthorized(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401
    assert response.json()["message"] == "Unauthorized"


def test_login_wrong_password(client):
    response = client.post(
        "/api/auth/login",
        json={"username": "user1", "password": "wrongpass"},
    )
    assert response.status_code == 401
    assert response.json()["message"] == "Wrong login or password"


def test_register_conflict(client):
    response = client.post(
        "/api/auth/register",
        json={"username": "user1", "password": "password1"},
    )
    assert response.status_code == 409


def test_logout(client):
    response = client.post("/api/auth/logout")
    assert response.status_code == 204
