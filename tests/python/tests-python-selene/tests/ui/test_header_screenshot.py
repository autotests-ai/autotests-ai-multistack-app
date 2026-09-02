"""Header screenshot — java HeaderScreenshotTests (390, 768, 1280)."""

from __future__ import annotations

import allure
import pytest

from pages.header_component import HeaderComponent
from pages.login_page import LoginPage
import screenshot_helper
import viewport_helper

pytestmark = [pytest.mark.ui, pytest.mark.screenshot]

_VIEWPORT_HEIGHT = 900


@allure.epic("Header")
@allure.feature("Header")
@allure.severity(allure.severity_level.MINOR)
@allure.title("Header screenshot")
class TestHeaderScreenshot:
    @pytest.fixture(autouse=True)
    def _reset_viewport(self, login_page: LoginPage):
        yield
        viewport_helper.reset_viewport(login_page.driver)

    @pytest.mark.parametrize("viewport_width", [390, 768, 1280], ids=lambda w: f"{w}px")
    @allure.title("Header bar matches screenshot")
    def test_header_bar_matches_screenshot(
        self, login_page: LoginPage, header: HeaderComponent, viewport_width: int
    ):
        allure.dynamic.title(f"Header bar matches screenshot at {viewport_width}px")
        viewport_helper.set_viewport(login_page.driver, viewport_width, _VIEWPORT_HEIGHT)
        login_page.open_page()
        screenshot_helper.capture_and_compare(
            header.header_panel(),
            "header",
            viewport_width,
            f"header-{viewport_width}",
        )
