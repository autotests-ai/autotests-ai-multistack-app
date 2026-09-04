"""HTTP helpers — mirrors java AuthApiClient + request specs for the api layer."""

from __future__ import annotations

import re
import uuid

import requests

from config import TestConfig

_TIMEOUT_S = 10
WRONG_CREDENTIALS_MESSAGE = "Wrong login or password"


def api_root(base_url: str) -> str:
    """Backend mount above the frontend segment (or the origin on root deploys)."""
    return re.sub(r"/frontend-[^/]+/?$", "", base_url.rstrip("/"))


def api_base(config: TestConfig) -> str:
    return config.api_base_url.rstrip("/")


def username() -> str:
    """Throwaway identity; backend @Size(min=3, max=64)."""
    return f"user_{uuid.uuid4().hex[:10]}"


def _url(config: TestConfig, path: str) -> str:
    suffix = path if path.startswith("/") else f"/{path}"
    return api_base(config) + suffix


def _headers(*, token: str | None = None, json_body: bool = False) -> dict[str, str]:
    headers: dict[str, str] = {}
    if json_body:
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


def request(
    config: TestConfig,
    method: str,
    path: str,
    *,
    json: dict | None = None,
    data: str | None = None,
    token: str | None = None,
) -> requests.Response:
    return requests.request(
        method,
        _url(config, path),
        json=json,
        data=data,
        headers=_headers(token=token, json_body=json is not None or data is not None),
        timeout=_TIMEOUT_S,
    )


def login(config: TestConfig, name: str, password: str) -> str:
    response = request(
        config, "POST", "/api/auth/login", json={"username": name, "password": password}
    )
    assert response.status_code == 200, response.text
    return response.json()["token"]


def register(config: TestConfig, name: str, password: str) -> str:
    response = request(
        config, "POST", "/api/auth/register", json={"username": name, "password": password}
    )
    assert response.status_code == 201, response.text
    return response.json()["token"]


def delete_account(config: TestConfig, token: str) -> None:
    response = request(config, "DELETE", "/api/auth/me", token=token)
    assert response.status_code == 204, response.text


def delete_account_quietly(config: TestConfig, name: str, password: str) -> None:
    """Log in as the user the test registered and DELETE /api/auth/me.

    Best-effort by design: a failed cleanup (user never created, stand down)
    must not mask the test's own result.
    """
    try:
        delete_account(config, login(config, name, password))
    except (AssertionError, requests.RequestException, KeyError, ValueError):
        pass
