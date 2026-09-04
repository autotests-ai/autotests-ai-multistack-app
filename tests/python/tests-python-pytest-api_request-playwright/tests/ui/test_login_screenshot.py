from __future__ import annotations

import allure
import pytest

from pages.app import App
from screenshot_helper import capture_and_compare

pytestmark = [pytest.mark.ui, pytest.mark.screenshot]


@allure.epic("Authentication")
@allure.feature("Login form")
@allure.severity(allure.severity_level.MINOR)
@allure.title("Login form screenshot")
class TestLoginScreenshot:
    @allure.title("Login form matches screenshot")
    @pytest.mark.parametrize("viewport_width", [390, 768, 1280])
    def test_login_form_matches_screenshot(self, app: App, viewport_width: int):
        app.header.set_viewport(viewport_width, 900)
        app.login.open()
        capture_and_compare(
            app.login.login_form, "login", viewport_width, f"login-{viewport_width}"
        )
