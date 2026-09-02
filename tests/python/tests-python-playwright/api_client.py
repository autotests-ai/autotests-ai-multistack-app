"""HTTP helpers — Playwright APIRequest analog of java AuthApiClient (not httpx)."""

from __future__ import annotations

import re
import uuid
from dataclasses import dataclass

from playwright.sync_api import APIRequestContext, APIResponse

from config import TestConfig

_TIMEOUT_MS = 10_000
WRONG_CREDENTIALS_MESSAGE = "Wrong login or password"


@dataclass
class ApiResponse:
    """Thin wrapper so tests can keep Rest Assured / httpx-shaped `.status_code`."""

    status_code: int
    _raw: APIResponse

    def json(self) -> object:
        return self._raw.json()

    @property
    def text(self) -> str:
        return self._raw.text()


def api_root(base_url: str) -> str:
    """Backend mount above the frontend segment (or the origin on root deploys)."""
    return re.sub(r"/frontend-[^/]+/?$", "", base_url.rstrip("/"))


def api_base(config: TestConfig) -> str:
    return config.api_base_url.rstrip("/")


def username() -> str:
    """Throwaway identity; backend @Size(min=3, max=64)."""
    return f"user_{uuid.uuid4().hex[:10]}"


def _path(path: str) -> str:
    return path if path.startswith("/") else f"/{path}"


def _headers(*, token: str | None = None, json_body: bool = False) -> dict[str, str]:
    headers: dict[str, str] = {}
    if json_body:
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


def request(
    api: APIRequestContext,
    method: str,
    path: str,
    *,
    json: dict | None = None,
    data: str | None = None,
    token: str | None = None,
) -> ApiResponse:
    headers = _headers(token=token, json_body=json is not None or data is not None)
    kwargs: dict = {"headers": headers, "timeout": _TIMEOUT_MS}
    if json is not None:
        kwargs["data"] = json
    elif data is not None:
        kwargs["data"] = data
    verb = method.lower()
    raw = getattr(api, verb)(_path(path), **kwargs)
    return ApiResponse(status_code=raw.status, _raw=raw)


def login(api: APIRequestContext, name: str, password: str) -> str:
    response = request(api, "POST", "/api/auth/login", json={"username": name, "password": password})
    assert response.status_code == 200, response.text
    return response.json()["token"]


def register(api: APIRequestContext, name: str, password: str) -> str:
    response = request(
        api, "POST", "/api/auth/register", json={"username": name, "password": password}
    )
    assert response.status_code == 201, response.text
    return response.json()["token"]


def delete_account(api: APIRequestContext, token: str) -> None:
    response = request(api, "DELETE", "/api/auth/me", token=token)
    assert response.status_code == 204, response.text


def delete_account_quietly(api: APIRequestContext, name: str, password: str) -> None:
    """Log in as the user the test registered and DELETE /api/auth/me.

    Best-effort by design: a failed cleanup (user never created, stand down)
    must not mask the test's own result.
    """
    try:
        delete_account(api, login(api, name, password))
    except (AssertionError, KeyError, ValueError):
        pass
