"""Home layout screenshot — java HomeLayoutScreenshotTests (1280 only)."""

from __future__ import annotations

import allure
import pytest

from pages.home_page import HomePage
import screenshot_helper
import viewport_helper

pytestmark = [pytest.mark.ui, pytest.mark.screenshot]

_VIEWPORT_WIDTH = 1280
_VIEWPORT_HEIGHT = 900


@allure.epic("Home")
@allure.feature("Home layout")
@allure.severity(allure.severity_level.MINOR)
@allure.title("Home layout screenshot")
class TestHomeLayoutScreenshot:
    @allure.title("Home layout matches screenshot at 1280px")
    def test_home_layout_matches_screenshot(self, home_page: HomePage):
        viewport_helper.set_viewport(home_page.driver, _VIEWPORT_WIDTH, _VIEWPORT_HEIGHT)
        home_page.open_page().should_show_layout_and_health()
        screenshot_helper.capture_and_compare(
            home_page.layout_panel(),
            "home-layout",
            _VIEWPORT_WIDTH,
            f"home-layout-{_VIEWPORT_WIDTH}",
        )
