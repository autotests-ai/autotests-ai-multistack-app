from __future__ import annotations

import allure
import pytest

from pages.app import App
from screenshot_helper import capture_and_compare

pytestmark = [pytest.mark.ui, pytest.mark.screenshot]


@allure.epic("Home")
@allure.feature("Home layout")
@allure.severity(allure.severity_level.MINOR)
@allure.title("Home layout screenshot")
class TestHomeLayoutScreenshot:
    @allure.title("Home layout matches screenshot at 1280px")
    def test_home_layout_matches_screenshot(self, app: App):
        app.header.set_viewport(1280, 900)
        app.home.open().should_show_settled_health_and_items()
        capture_and_compare(app.home.layout, "home-layout", 1280, "home-layout-1280")
