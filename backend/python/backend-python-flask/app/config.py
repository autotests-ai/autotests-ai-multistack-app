from __future__ import annotations

import os


def database_url() -> str:
    if url := os.environ.get("DATABASE_URL"):
        return url
    host = os.environ.get("DB_HOST", "localhost")
    port = os.environ.get("DB_PORT", "5432")
    name = os.environ.get("DB_NAME", "reference_app_python_flask")
    user = os.environ.get("DB_USER", "reference")
    password = os.environ.get("DB_PASSWORD", "reference")
    return f"postgresql+psycopg://{user}:{password}@{host}:{port}/{name}"


class Config:
    SERVICE_NAME = "backend-python-flask"
    SQLALCHEMY_DATABASE_URI = database_url()
    JWT_SECRET = os.environ.get(
        "JWT_SECRET",
        "reference-app-dev-secret-change-in-production-min-32-chars",
    )
    JWT_EXPIRATION_MS = int(os.environ.get("JWT_EXPIRATION_MS", "86400000"))
    POST_AUTH_REDIRECT = "/"
