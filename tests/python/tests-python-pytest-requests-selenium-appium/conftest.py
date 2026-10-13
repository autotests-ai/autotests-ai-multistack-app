"""Appium session fixture ≈ Java MobileTestBase (one session per test, Allure artifacts)."""

from __future__ import annotations

import allure
import pytest

import attachments
import drivers
from config import TestConfig, load_config
from screens.login_screen import LoginScreen


@pytest.fixture(scope="session")
def config() -> TestConfig:
    return load_config()


@pytest.fixture
def driver(config: TestConfig):
    drv = drivers.create(config)
    recording = attachments.start_recording(drv, config)
    yield drv
    session_id = drv.session_id
    try:
        attachments.live_artifacts(drv, config, recording)
    finally:
        drv.quit()
    attachments.session_artifacts(session_id, config)


@pytest.fixture
def login_screen(driver) -> LoginScreen:
    return LoginScreen(driver)


def pytest_runtest_setup(item: pytest.Item) -> None:
    allure.dynamic.label("layer", "e2e")
    allure.dynamic.label("framework", "selenium")
    allure.dynamic.label("scope", "mobile")


@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """Failing-state screenshot while the session is still alive (before fixture teardown)."""
    outcome = yield
    report = outcome.get_result()
    drv = item.funcargs.get("driver")
    if report.when == "call" and report.failed and drv is not None:
        attachments.screenshot(drv, "Screenshot on failure")
