"""Login form screenshot — java LoginScreenshotTests (390, 768, 1280)."""

from __future__ import annotations

import allure
import pytest

from pages.login_page import LoginPage
import screenshot_helper
import viewport_helper

pytestmark = [pytest.mark.ui, pytest.mark.screenshot]

_VIEWPORT_HEIGHT = 900


@allure.epic("Authentication")
@allure.feature("Login form")
@allure.severity(allure.severity_level.MINOR)
@allure.title("Login form screenshot")
class TestLoginScreenshot:
    @pytest.mark.parametrize("viewport_width", [390, 768, 1280], ids=lambda w: f"{w}px")
    @allure.title("Login form matches screenshot")
    def test_login_form_matches_screenshot(self, login_page: LoginPage, viewport_width: int):
        allure.dynamic.title(f"Login form matches screenshot at {viewport_width}px")
        viewport_helper.set_viewport(login_page.driver, viewport_width, _VIEWPORT_HEIGHT)
        login_page.open_page()
        screenshot_helper.capture_and_compare(
            login_page.login_form_panel(),
            "login",
            viewport_width,
            f"login-{viewport_width}",
        )
