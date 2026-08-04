from __future__ import annotations

import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get(
    "DJANGO_SECRET_KEY",
    "django-insecure-reference-app-copy-dev-only",
)

DEBUG = os.environ.get("DJANGO_DEBUG", "0") == "1"

ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [
    "api.apps.ApiConfig",
]

MIDDLEWARE = [
    "django.middleware.common.CommonMiddleware",
    "api.middleware.CorsMiddleware",
]

ROOT_URLCONF = "config.urls"

WSGI_APPLICATION = "config.wsgi.application"

_RUNNING_PYTEST = (
    "pytest" in sys.modules
    or any("pytest" in arg for arg in sys.argv)
    or os.environ.get("PYTEST_RUNNING") == "1"
)

if database_url := os.environ.get("DATABASE_URL"):
    if database_url.startswith("sqlite"):
        name = database_url.removeprefix("sqlite:///")
        DATABASES = {
            "default": {
                "ENGINE": "django.db.backends.sqlite3",
                "NAME": name if name else ":memory:",
            }
        }
    else:
        raise RuntimeError(f"Unsupported DATABASE_URL: {database_url}")
elif _RUNNING_PYTEST:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": ":memory:",
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "HOST": os.environ.get("DB_HOST", "localhost"),
            "PORT": os.environ.get("DB_PORT", "5432"),
            "NAME": os.environ.get("DB_NAME", "reference_app_python_django"),
            "USER": os.environ.get("DB_USER", "reference"),
            "PASSWORD": os.environ.get("DB_PASSWORD", "reference"),
        }
    }

AUTH_PASSWORD_VALIDATORS: list = []

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = False
USE_TZ = True

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

SERVICE_NAME = "backend-python-django"
JWT_SECRET = os.environ.get(
    "JWT_SECRET",
    "reference-app-dev-secret-change-in-production-min-32-chars",
)
JWT_EXPIRATION_MS = int(os.environ.get("JWT_EXPIRATION_MS", "86400000"))
POST_AUTH_REDIRECT = "/"
