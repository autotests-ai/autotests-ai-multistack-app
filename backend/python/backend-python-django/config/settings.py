from __future__ import annotations

import os
import sys
from pathlib import Path
from urllib.parse import unquote, urlparse

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get(
    "DJANGO_SECRET_KEY",
    "django-insecure-autotests-ai-multistack-app-dev-only",
)

DEBUG = os.environ.get("DJANGO_DEBUG", "0") == "1"

ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [
    "api.apps.ApiConfig",
]

MIDDLEWARE = [
    "django.middleware.common.CommonMiddleware",
    "api.middleware.CorsMiddleware",
    "api.middleware.ApiBoundaryMiddleware",
]

ROOT_URLCONF = "config.urls"

WSGI_APPLICATION = "config.wsgi.application"

_RUNNING_PYTEST = (
    "pytest" in sys.modules
    or any("pytest" in arg for arg in sys.argv)
    or os.environ.get("PYTEST_RUNNING") == "1"
)


def _database_from_url(url: str) -> dict:
    if url.startswith("sqlite"):
        name = url.removeprefix("sqlite:///")
        return {
            "default": {
                "ENGINE": "django.db.backends.sqlite3",
                "NAME": name if name else ":memory:",
            }
        }
    normalized = url
    for prefix in (
        "postgresql+psycopg://",
        "postgresql+psycopg2://",
        "postgres://",
        "postgresql://",
    ):
        if normalized.startswith(prefix):
            normalized = "postgresql://" + normalized[len(prefix) :]
            break
    else:
        raise RuntimeError(f"Unsupported DATABASE_URL: {url}")
    parsed = urlparse(normalized)
    name = unquote(parsed.path.lstrip("/"))
    config = {
        "ENGINE": "django.db.backends.postgresql",
        "HOST": parsed.hostname or "localhost",
        "PORT": str(parsed.port or 5432),
        "NAME": name,
        "USER": unquote(parsed.username or ""),
        "PASSWORD": unquote(parsed.password or ""),
        # Integration: Testcontainers DB is already empty — reuse it as the test DB.
        "TEST": {"NAME": name},
    }
    return {"default": config}


def build_databases(
    environ: dict | None = None,
    *,
    running_pytest: bool | None = None,
) -> dict:
    """Resolve DATABASES from the environment.

    Extracted so unit tests can exercise the sqlite / postgres / pytest
    branches without reloading Django settings mid-suite.
    """
    env = environ if environ is not None else os.environ
    under_pytest = _RUNNING_PYTEST if running_pytest is None else running_pytest
    if database_url := env.get("DATABASE_URL"):
        return _database_from_url(database_url)
    if under_pytest:
        return {
            "default": {
                "ENGINE": "django.db.backends.sqlite3",
                "NAME": ":memory:",
            }
        }
    return {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "HOST": env.get("DB_HOST", "localhost"),
            "PORT": env.get("DB_PORT", "5432"),
            "NAME": env.get("DB_NAME", "multistack_app_python_django"),
            "USER": env.get("DB_USER", "multistack"),
            "PASSWORD": env.get("DB_PASSWORD", "multistack"),
        }
    }


DATABASES = build_databases()

AUTH_PASSWORD_VALIDATORS: list = []

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = False
USE_TZ = True

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

SERVICE_NAME = "backend-python-django"
JWT_SECRET = os.environ.get(
    "JWT_SECRET",
    "multistack-dev-secret-change-in-production-min-32-chars",
)
JWT_EXPIRATION_MS = int(os.environ.get("JWT_EXPIRATION_MS", "86400000"))
POST_AUTH_REDIRECT = "/"
