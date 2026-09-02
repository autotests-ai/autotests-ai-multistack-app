from __future__ import annotations

import allure
import pytest
from playwright.sync_api import expect

from pages.app import App
from screenshot_helper import capture_and_compare

pytestmark = [pytest.mark.e2e, pytest.mark.screenshot]


@allure.epic("Authentication")
@allure.feature("Welcome panel")
@allure.severity(allure.severity_level.MINOR)
@allure.title("Welcome panel screenshot")
class TestWelcomePanelScreenshot:
    @allure.title("Welcome panel matches screenshot")
    @pytest.mark.parametrize("viewport_width", [390, 768, 1280])
    def test_welcome_panel_matches_screenshot(self, app: App, config, viewport_width: int):
        app.header.set_viewport(viewport_width, 900)
        app.login.open().login("user1", "password1")
        expect(app.home.welcome_message).to_contain_text(f"Welcome, {config.welcome_username}!")
        capture_and_compare(
            app.home.welcome_panel,
            "welcome-panel",
            viewport_width,
            f"welcome-panel-{viewport_width}",
        )
