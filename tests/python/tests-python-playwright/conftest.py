"""Playwright fixtures ≈ Java TestBase (APIRequest + browser / Selenoid wss)."""

from __future__ import annotations

import allure
import pytest
from playwright.sync_api import Playwright, sync_playwright

from config import TestConfig, load_config
from pages.app import App
from playwright_runtime import PlaywrightRuntime


@pytest.fixture(scope="session")
def config() -> TestConfig:
    return load_config()


@pytest.fixture(scope="session")
def playwright() -> Playwright:
    with sync_playwright() as pw:
        yield pw


@pytest.fixture(scope="session")
def api(playwright: Playwright, config: TestConfig):
    ctx = playwright.request.new_context(base_url=config.api_base_url.rstrip("/"))
    yield ctx
    ctx.dispose()


@pytest.fixture
def runtime(playwright: Playwright, config: TestConfig, api) -> PlaywrightRuntime:
    session = PlaywrightRuntime(playwright, config, api)
    yield session
    session.close()


@pytest.fixture
def app(runtime: PlaywrightRuntime) -> App:
    return runtime.app


def pytest_runtest_setup(item: pytest.Item) -> None:
    """Allure layer from pytest markers (LAYERS.md). mock/screenshot stay slices."""
    if item.get_closest_marker("api"):
        allure.dynamic.label("layer", "api")
    elif item.get_closest_marker("manual"):
        allure.dynamic.label("layer", "manual")
        allure.dynamic.label("ALLURE_MANUAL", "true")
    elif item.get_closest_marker("infra") or item.get_closest_marker("infra_backend") or item.get_closest_marker(
        "infra_frontend"
    ):
        allure.dynamic.label("layer", "infra")
    elif item.get_closest_marker("ui"):
        allure.dynamic.label("layer", "ui")
    elif item.get_closest_marker("e2e") or item.get_closest_marker("screenshot"):
        allure.dynamic.label("layer", "e2e")
    elif item.get_closest_marker("mock"):
        allure.dynamic.label("layer", "ui")
