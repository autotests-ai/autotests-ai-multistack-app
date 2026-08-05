from __future__ import annotations

from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch

import jwt
import pytest
from sqlalchemy.exc import IntegrityError

from app import create_app
from app.auth import validate_credentials
from app.config import Config, database_url
from app.jwt_util import create_token, extract_username
from app.seed import seed_data


def test_create_app_initializes_db():
    # Exercises the init_db=True branch that production (wsgi) uses.
    app = create_app(init_db=True)
    assert app is not None


def test_seed_is_idempotent(client):
    seed_data()
    seed_data()
    response = client.get("/api/items")
    assert response.status_code == 200
    assert len(response.get_json()["items"]) == 3


def test_database_url_from_parts(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.setenv("DB_HOST", "db.example")
    monkeypatch.setenv("DB_PORT", "6543")
    monkeypatch.setenv("DB_NAME", "demo")
    monkeypatch.setenv("DB_USER", "u")
    monkeypatch.setenv("DB_PASSWORD", "p")
    assert database_url() == "postgresql+psycopg://u:p@db.example:6543/demo"


@pytest.mark.parametrize(
    ("username", "password", "fragment"),
    [
        (None, "password1", "username is required"),
        ("", "password1", "username is required"),
        (12, "password1", "username is required"),
        ("user1", None, "password is required"),
        ("user1", "", "password is required"),
        ("user1", 12, "password is required"),
        ("ab", "password1", "username must be 3-64 characters"),
        ("a" * 65, "password1", "username must be 3-64 characters"),
        ("user1", "12345", "password must be 6-128 characters"),
        ("user1", "a" * 129, "password must be 6-128 characters"),
    ],
)
def test_validate_credentials_rejects(username, password, fragment):
    assert validate_credentials(username, password) == fragment


def test_validate_credentials_accepts():
    assert validate_credentials("user1", "password1") is None


def test_register_validation_errors(client):
    response = client.post(
        "/api/auth/register",
        json={"username": "ab", "password": "123"},
    )
    assert response.status_code == 400
    assert "message" in response.get_json()


def test_login_validation_errors(client):
    response = client.post("/api/auth/login", json={"username": "user1"})
    assert response.status_code == 400


def test_login_unknown_user(client):
    response = client.post(
        "/api/auth/login",
        json={"username": "nosuch", "password": "password1"},
    )
    assert response.status_code == 401
    assert response.get_json()["message"] == "Wrong login or password"


def test_me_rejects_garbage_token(client):
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer not.a.jwt"},
    )
    assert response.status_code == 401


def test_me_rejects_token_for_missing_user(client):
    token = create_token("ghost-user")
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 401


def test_extract_username_rejects_non_string_sub():
    now = datetime.now(timezone.utc)
    token = jwt.encode(
        {
            "sub": 123,
            "iat": now,
            "exp": now + timedelta(hours=1),
        },
        Config.JWT_SECRET,
        algorithm="HS256",
    )
    assert extract_username(token) is None


def test_extract_username_roundtrip():
    token = create_token("alice")
    assert extract_username(token) == "alice"


def test_register_maps_integrity_error_to_409(client):
    session = MagicMock()
    session.scalar.return_value = None
    session.commit.side_effect = IntegrityError("stmt", {}, Exception("dup"))

    with patch("app.routes.auth_routes.SessionLocal") as session_local:
        session_local.return_value.__enter__.return_value = session
        session_local.return_value.__exit__.return_value = False
        response = client.post(
            "/api/auth/register",
            json={"username": "raceuser", "password": "password1"},
        )
    assert response.status_code == 409
    assert response.get_json()["message"] == "Username already taken"
    session.rollback.assert_called_once()
