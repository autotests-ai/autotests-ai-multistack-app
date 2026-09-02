from __future__ import annotations

import allure
import pytest
from playwright.sync_api import expect

from pages.app import App

pytestmark = [pytest.mark.ui, pytest.mark.mock]


@allure.epic("Home")
@allure.feature("Layout")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Home layout")
class TestHomeLayout:
    @allure.title("Home shows embedded header and reference layout")
    def test_home_shows_embedded_header_and_layout(self, app: App):
        app.home.open()
        expect(app.home.header).to_be_visible()
        app.home.should_show_layout()
