from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import jwt
import pytest
from django.conf import settings
from django.db import IntegrityError

from api.auth import validate_credentials
from api.jwt_util import create_token, extract_username
from api.seed import seed_data
from config.settings import build_databases

pytestmark = pytest.mark.django_db


def test_seed_is_idempotent(client):
    seed_data()
    seed_data()
    response = client.get("/api/items")
    assert response.status_code == 200
    assert len(response.json()["items"]) == 3


def test_cors_preflight(client):
    response = client.options("/api/health", HTTP_ORIGIN="http://localhost:5173")
    assert response.status_code == 204
    assert response["Access-Control-Allow-Origin"] == "http://localhost:5173"


def test_cors_rejects_unknown_origin(client):
    response = client.get("/api/health", HTTP_ORIGIN="https://evil.example.com")
    assert response.status_code == 200
    assert "Access-Control-Allow-Origin" not in response


def test_cors_skips_non_api(client):
    response = client.get("/", HTTP_ORIGIN="http://localhost:5173")
    assert "Access-Control-Allow-Origin" not in response


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


def test_validate_credentials_joins_every_failing_field():
    assert validate_credentials("", "") == "username is required; password is required"
    assert (
        validate_credentials("ab", "123")
        == "username must be 3-64 characters; password must be 6-128 characters"
    )


def test_unmapped_api_path_requires_authentication(client):
    # The reference authenticates /api/** before routing, so 404 would leak the API shape.
    response = client.get("/api/nope")

    assert response.status_code == 401
    assert response.json()["message"] == "Unauthorized"


def test_unmapped_api_method_requires_authentication(client):
    response = client.delete("/api/items")

    assert response.status_code == 401
    assert response.json()["message"] == "Unauthorized"


def test_register_validation_errors(client):
    response = client.post(
        "/api/auth/register",
        data=json.dumps({"username": "ab", "password": "123"}),
        content_type="application/json",
    )
    assert response.status_code == 400
    assert "message" in response.json()


def test_login_validation_errors(client):
    response = client.post(
        "/api/auth/login",
        data=json.dumps({"username": "user1"}),
        content_type="application/json",
    )
    assert response.status_code == 400


def test_login_unknown_user(client):
    response = client.post(
        "/api/auth/login",
        data=json.dumps({"username": "nosuch", "password": "password1"}),
        content_type="application/json",
    )
    assert response.status_code == 401
    assert response.json()["message"] == "Wrong login or password"


@pytest.mark.parametrize("path", ["/api/auth/register", "/api/auth/login"])
@pytest.mark.parametrize(
    "body", [b"", b"not-json", json.dumps(["user1", "password1"]).encode()]
)
def test_auth_rejects_a_body_that_is_not_a_json_object(client, path, body):
    response = client.post(path, data=body, content_type="application/json")

    assert response.status_code == 400
    assert response.json()["message"] == "Request body is not valid JSON"


def test_me_rejects_garbage_token(client):
    response = client.get("/api/auth/me", HTTP_AUTHORIZATION="Bearer not.a.jwt")
    assert response.status_code == 401


def test_me_rejects_token_for_missing_user(client):
    token = create_token("ghost-user")
    response = client.get("/api/auth/me", HTTP_AUTHORIZATION=f"Bearer {token}")
    assert response.status_code == 401


def test_extract_username_rejects_non_string_sub():
    now = datetime.now(timezone.utc)
    token = jwt.encode(
        {
            "sub": 123,
            "iat": now,
            "exp": now + timedelta(hours=1),
        },
        settings.JWT_SECRET,
        algorithm="HS256",
    )
    assert extract_username(token) is None


def test_extract_username_roundtrip():
    token = create_token("alice")
    assert extract_username(token) == "alice"


def test_register_maps_integrity_error_to_409(client):
    with patch(
        "api.views.User.objects.create",
        side_effect=IntegrityError("dup"),
    ):
        response = client.post(
            "/api/auth/register",
            data=json.dumps({"username": "raceuser", "password": "password1"}),
            content_type="application/json",
        )
    assert response.status_code == 409
    assert response.json()["message"] == "Username already taken"


def test_build_databases_sqlite_memory():
    databases = build_databases({"DATABASE_URL": "sqlite:///"})
    assert databases["default"]["ENGINE"] == "django.db.backends.sqlite3"
    assert databases["default"]["NAME"] == ":memory:"


def test_build_databases_sqlite_file():
    databases = build_databases({"DATABASE_URL": "sqlite:///tmp/test.db"})
    assert databases["default"]["NAME"] == "tmp/test.db"


def test_build_databases_postgres_url():
    databases = build_databases(
        {"DATABASE_URL": "postgresql://u:p@db.example:6543/demo"}
    )
    assert databases["default"]["ENGINE"] == "django.db.backends.postgresql"
    assert databases["default"]["HOST"] == "db.example"
    assert databases["default"]["PORT"] == "6543"
    assert databases["default"]["NAME"] == "demo"
    assert databases["default"]["USER"] == "u"
    assert databases["default"]["PASSWORD"] == "p"
    assert databases["default"]["TEST"]["NAME"] == "demo"


def test_build_databases_sqlalchemy_postgres_url():
    databases = build_databases(
        {"DATABASE_URL": "postgresql+psycopg://u:p@db.example:6543/demo"}
    )
    assert databases["default"]["ENGINE"] == "django.db.backends.postgresql"
    assert databases["default"]["NAME"] == "demo"


def test_build_databases_rejects_non_postgres_url():
    with pytest.raises(RuntimeError, match="Unsupported DATABASE_URL"):
        build_databases({"DATABASE_URL": "mysql://localhost/db"})


def test_build_databases_pytest_fallback():
    databases = build_databases({}, running_pytest=True)
    assert databases["default"]["NAME"] == ":memory:"


def test_build_databases_postgres_defaults():
    databases = build_databases(
        {
            "DB_HOST": "db.example",
            "DB_PORT": "6543",
            "DB_NAME": "demo",
            "DB_USER": "u",
            "DB_PASSWORD": "p",
        },
        running_pytest=False,
    )
    assert databases["default"] == {
        "ENGINE": "django.db.backends.postgresql",
        "HOST": "db.example",
        "PORT": "6543",
        "NAME": "demo",
        "USER": "u",
        "PASSWORD": "p",
    }
