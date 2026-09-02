from __future__ import annotations

import allure
import pytest

from pages.home_page import HomePage

pytestmark = [pytest.mark.ui, pytest.mark.mock]


@allure.epic("Home")
@allure.feature("Home layout")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Home layout mount")
class TestHomeLayout:
    @allure.title("Home shows embedded header and reference layout")
    def test_home_layout_is_mounted(self, home_page: HomePage):
        home_page.open_page().should_show_embedded_header().should_show_layout()
