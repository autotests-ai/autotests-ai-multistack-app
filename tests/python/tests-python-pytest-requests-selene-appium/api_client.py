"""HTTP helpers — mirrors java AuthApiClient: arrange and clean up through the product API."""

from __future__ import annotations

import allure
import requests

from config import TestConfig

_TIMEOUT_S = 10


def login_response(config: TestConfig, name: str, password: str) -> requests.Response:
    return requests.post(
        f"{config.api_base}/auth/login",
        json={"username": name, "password": password},
        timeout=_TIMEOUT_S,
    )


@allure.step("API: register user {name}")
def register(config: TestConfig, name: str, password: str) -> str:
    response = requests.post(
        f"{config.api_base}/auth/register",
        json={"username": name, "password": password},
        timeout=_TIMEOUT_S,
    )
    assert response.status_code == 201, response.text
    return response.json()["token"]


@allure.step("API: login as {name}")
def login(config: TestConfig, name: str, password: str) -> str:
    response = login_response(config, name, password)
    assert response.status_code == 200, response.text
    return response.json()["token"]


@allure.step("API: delete current account")
def delete_account(config: TestConfig, token: str) -> None:
    response = requests.delete(
        f"{config.api_base}/auth/me",
        headers={"Authorization": f"Bearer {token}"},
        timeout=_TIMEOUT_S,
    )
    assert response.status_code == 204, response.text


def delete_account_quietly(config: TestConfig, name: str, password: str) -> None:
    """Cleanup that must not mask the test result: 401 = never created / already deleted."""
    try:
        response = login_response(config, name, password)
        if response.status_code == 401:
            return
        assert response.status_code == 200, response.text
        delete_account(config, response.json()["token"])
    except (AssertionError, requests.RequestException, KeyError, ValueError):
        pass
