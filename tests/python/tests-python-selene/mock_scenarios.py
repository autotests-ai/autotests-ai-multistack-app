"""WireMock scenario switch — mirrors java `api.MockScenarios`."""

from __future__ import annotations

import httpx

from config import TestConfig

_TIMEOUT_S = 5


def _admin(config: TestConfig, path: str) -> str:
    return config.api_base_url.rstrip("/") + path


def available(config: TestConfig) -> bool:
    """True when the stand exposes WireMock admin (mock profile only)."""
    try:
        response = httpx.get(_admin(config, "/__admin/scenarios"), timeout=_TIMEOUT_S)
        return response.status_code == 200
    except httpx.HTTPError:
        return False


def set_state(config: TestConfig, scenario: str, state: str) -> None:
    response = httpx.put(
        _admin(config, f"/__admin/scenarios/{scenario}/state"),
        json={"state": state},
        timeout=_TIMEOUT_S,
    )
    assert response.status_code == 200, response.text


def reset_all(config: TestConfig) -> None:
    response = httpx.post(_admin(config, "/__admin/scenarios/reset"), timeout=_TIMEOUT_S)
    assert response.status_code == 200, response.text
