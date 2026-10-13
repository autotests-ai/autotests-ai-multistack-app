"""Appium session in Selene's browser ≈ Java MobileTestBase (Selenide + SelenideAppium).

Same shape as Iakiv Kramarenko's selene-in-action mobile lessons: the Appium
driver is handed to `browser.config.driver`, Selene waits log as Allure steps.
"""

from __future__ import annotations

import allure
import allure_commons
import pytest
from selene import browser, support

import attachments
import drivers
from config import TestConfig, load_config
from screens.login_screen import LoginScreen


@pytest.fixture(scope="session")
def config() -> TestConfig:
    return load_config()


@pytest.fixture
def driver(config: TestConfig):
    with allure.step("Init app session"):
        browser.config.driver = drivers.create(config)
    browser.config.timeout = 30
    browser.config._wait_decorator = support._logging.wait_with(
        context=allure_commons._allure.StepContext
    )
    drv = browser.driver
    recording = attachments.start_recording(drv, config)
    yield drv
    session_id = drv.session_id
    try:
        attachments.live_artifacts(drv, config, recording)
    finally:
        with allure.step(f"Tear down app session {session_id}"):
            browser.quit()
    attachments.session_artifacts(session_id, config)


@pytest.fixture
def login_screen(driver) -> LoginScreen:
    return LoginScreen()


def pytest_runtest_setup(item: pytest.Item) -> None:
    allure.dynamic.label("layer", "e2e")
    allure.dynamic.label("framework", "selene")
    allure.dynamic.label("scope", "mobile")


@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """Failing-state screenshot while the session is still alive (before fixture teardown)."""
    outcome = yield
    report = outcome.get_result()
    drv = item.funcargs.get("driver")
    if report.when == "call" and report.failed and drv is not None:
        attachments.screenshot(drv, "Screenshot on failure")
