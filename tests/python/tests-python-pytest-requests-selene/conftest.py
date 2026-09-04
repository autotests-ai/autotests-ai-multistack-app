"""Driver fixture ≈ Java TestBase (Selene Configuration + remote Selenoid)."""

from __future__ import annotations

import allure
import pytest
from selene import browser
from selenium import webdriver
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.chrome.service import Service as ChromeService

import attachments
import har_capture
from config import TestConfig, load_config


@pytest.fixture(scope="session")
def config() -> TestConfig:
    return load_config()


@pytest.fixture
def selene_browser(config: TestConfig):
    options = ChromeOptions()
    width, height = _window_size(config.browser_size)
    options.add_argument(f"--window-size={width},{height}")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    if config.chrome_binary_path:
        options.binary_location = config.chrome_binary_path

    capture_har = config.enable_har or config.attach_har_logs
    if (capture_har or config.attach_browser_console_logs) and har_capture.supports_browser(
        config.browser
    ):
        har_capture.enable_performance_logging(
            options, browser_logs=config.attach_browser_console_logs
        )

    browser.config.base_url = config.base_url.rstrip("/")
    browser.config.timeout = 5
    browser.config.window_width = width
    browser.config.window_height = height
    browser.config.driver_options = options

    if config.remote_url:
        selenoid = "selenoid" in config.remote_url.lower()
        if selenoid:
            options.set_capability("browserVersion", config.browser_version)
            options.set_capability(
                "selenoid:options",
                {
                    "enableVNC": config.enable_vnc,
                    "enableVideo": config.enable_video,
                    "enableHAR": config.enable_har,
                    "headless": config.headless,
                    "name": "autotests-ai-multistack-python-pytest-requests-selene",
                },
            )
        elif config.headless:
            options.add_argument("--headless=new")
        browser.config.driver_remote_url = config.remote_url
        browser.config.driver_options = options
    else:
        if config.headless:
            options.add_argument("--headless=new")
        service = (
            ChromeService(executable_path=config.chromedriver_path)
            if config.chromedriver_path
            else ChromeService()
        )
        browser.config.driver = webdriver.Chrome(service=service, options=options)

    yield browser
    browser.quit()


def _window_size(browser_size: str) -> tuple[int, int]:
    parts = browser_size.lower().split("x")
    if len(parts) != 2:
        return 1740, 1080
    return int(parts[0].strip()), int(parts[1].strip())


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


@pytest.hookimpl(hookwrapper=True, tryfirst=True)
def pytest_runtest_makereport(item, call):
    """Attach on the test result (not fixture container) — parity with Java afterEach."""
    outcome = yield
    report = outcome.get_result()
    if report.when != "call":
        return
    br = item.funcargs.get("selene_browser")
    cfg = item.funcargs.get("config")
    if br is None or cfg is None:
        return
    try:
        _attach_after(br.driver, cfg)
    except Exception:
        pass


def _attach_after(drv, config: TestConfig) -> None:
    session_id = getattr(drv, "session_id", "") or ""

    if config.attach_browser_console_logs:
        attachments.browser_console_logs(drv)
    if config.attach_page_source:
        attachments.page_source(drv)
    if config.attach_har_logs:
        attachments.har_logs(drv, config.browser)
    if config.attach_last_screenshot:
        attachments.last_screenshot(drv)
    elif hasattr(drv, "get_screenshot_as_png"):
        try:
            allure.attach(
                drv.get_screenshot_as_png(),
                name="final-screenshot",
                attachment_type=allure.attachment_type.PNG,
            )
        except Exception:
            pass
    if config.enable_video and config.attach_video:
        attachments.video(config, session_id)
