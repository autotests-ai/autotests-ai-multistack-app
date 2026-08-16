from __future__ import annotations

import os
import sys
from pathlib import Path

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
        if database_url.startswith("sqlite"):
            name = database_url.removeprefix("sqlite:///")
            return {
                "default": {
                    "ENGINE": "django.db.backends.sqlite3",
                    "NAME": name if name else ":memory:",
                }
            }
        raise RuntimeError(f"Unsupported DATABASE_URL: {database_url}")
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
