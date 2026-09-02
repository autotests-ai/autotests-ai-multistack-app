"""WireMock scenario switch — mirrors java `api.MockScenarios` via Playwright APIRequest."""

from __future__ import annotations

from playwright.sync_api import APIRequestContext, Error

_TIMEOUT_MS = 5_000


def available(api: APIRequestContext) -> bool:
    """True when the stand exposes WireMock admin (mock profile only)."""
    try:
        response = api.get("/__admin/scenarios", timeout=_TIMEOUT_MS)
        return response.status == 200
    except Error:
        return False


def set_state(api: APIRequestContext, scenario: str, state: str) -> None:
    response = api.put(
        f"/__admin/scenarios/{scenario}/state",
        data={"state": state},
        timeout=_TIMEOUT_MS,
    )
    assert response.status == 200, response.text()


def reset_all(api: APIRequestContext) -> None:
    response = api.post("/__admin/scenarios/reset", timeout=_TIMEOUT_MS)
    assert response.status == 200, response.text()
