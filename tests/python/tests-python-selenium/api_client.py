"""Cleanup through the product API — mirrors java AuthApiClient.deleteAccountQuietly."""

from __future__ import annotations

import re

import requests

from config import TestConfig

_TIMEOUT_S = 10


def api_root(base_url: str) -> str:
    """Backend mount above the frontend segment (or the origin on root deploys)."""
    return re.sub(r"/frontend-[^/]+/?$", "", base_url.rstrip("/"))


def delete_account_quietly(config: TestConfig, username: str, password: str) -> None:
    """Log in as the user the test registered and DELETE /api/auth/me.

    Best-effort by design: a failed cleanup (user never created, stand down)
    must not mask the test's own result.
    """
    root = api_root(config.base_url)
    try:
        login = requests.post(
            f"{root}/api/auth/login",
            json={"username": username, "password": password},
            timeout=_TIMEOUT_S,
        )
        if login.status_code != 200:
            return
        token = login.json()["token"]
        requests.delete(
            f"{root}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
            timeout=_TIMEOUT_S,
        )
    except requests.RequestException:
        pass
