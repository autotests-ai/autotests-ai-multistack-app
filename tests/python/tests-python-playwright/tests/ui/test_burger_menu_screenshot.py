from __future__ import annotations

import allure
import pytest

from pages.app import App
from screenshot_helper import capture_and_compare

pytestmark = [pytest.mark.ui, pytest.mark.screenshot]


@allure.epic("Header")
@allure.feature("Burger menu")
@allure.severity(allure.severity_level.MINOR)
@allure.title("Burger menu screenshot")
class TestBurgerMenuScreenshot:
    @allure.title("Open burger menu matches screenshot")
    @pytest.mark.parametrize("viewport_width", [390, 768])
    def test_open_menu_matches_screenshot(self, app: App, viewport_width: int):
        app.header.set_viewport(viewport_width, 900)
        app.login.open()
        app.header.open_menu()
        capture_and_compare(
            app.header.menu, "burger-menu", viewport_width, f"burger-menu-{viewport_width}"
        )
        app.header.reset_viewport()
