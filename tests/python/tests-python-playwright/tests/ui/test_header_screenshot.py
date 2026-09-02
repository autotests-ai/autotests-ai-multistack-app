from __future__ import annotations

import allure
import pytest

from pages.app import App
from screenshot_helper import capture_and_compare

pytestmark = [pytest.mark.ui, pytest.mark.screenshot]


@allure.epic("Header")
@allure.feature("Header")
@allure.severity(allure.severity_level.MINOR)
@allure.title("Header screenshot")
class TestHeaderScreenshot:
    @allure.title("Header bar matches screenshot")
    @pytest.mark.parametrize("viewport_width", [390, 768, 1280])
    def test_header_bar_matches_screenshot(self, app: App, viewport_width: int):
        app.header.set_viewport(viewport_width, 900)
        app.login.open()
        app.header.root.wait_for()
        capture_and_compare(
            app.header.root, "header", viewport_width, f"header-{viewport_width}"
        )
        app.header.reset_viewport()
