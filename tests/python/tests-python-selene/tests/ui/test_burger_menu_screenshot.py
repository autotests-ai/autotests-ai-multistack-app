"""Burger menu screenshot — java BurgerMenuScreenshotTests (390, 768)."""

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
@allure.feature("Burger menu")
@allure.severity(allure.severity_level.MINOR)
@allure.title("Burger menu screenshot")
class TestBurgerMenuScreenshot:
    @pytest.fixture(autouse=True)
    def _reset_viewport(self, login_page: LoginPage):
        yield
        viewport_helper.reset_viewport(login_page.driver)

    @pytest.mark.parametrize("viewport_width", [390, 768], ids=lambda w: f"{w}px")
    @allure.title("Open burger menu matches screenshot")
    def test_open_menu_matches_screenshot(
        self, login_page: LoginPage, header: HeaderComponent, viewport_width: int
    ):
        allure.dynamic.title(f"Open burger menu matches screenshot at {viewport_width}px")
        viewport_helper.set_viewport(login_page.driver, viewport_width, _VIEWPORT_HEIGHT)
        login_page.open_page()
        header.open_menu()
        screenshot_helper.capture_and_compare(
            header.menu_panel(),
            "burger-menu",
            viewport_width,
            f"burger-menu-{viewport_width}",
        )
