"""Welcome panel screenshot — java WelcomePanelScreenshotTests (390, 768, 1280)."""

from __future__ import annotations

import allure
import pytest

from pages.login_page import LoginPage
import screenshot_helper
import viewport_helper

pytestmark = [pytest.mark.e2e, pytest.mark.screenshot]

_VIEWPORT_HEIGHT = 900


@allure.epic("Authentication")
@allure.feature("Welcome panel")
@allure.severity(allure.severity_level.MINOR)
@allure.title("Welcome panel screenshot")
class TestWelcomePanelScreenshot:
    @pytest.mark.parametrize("viewport_width", [390, 768, 1280], ids=lambda w: f"{w}px")
    def test_welcome_panel_matches_screenshot(
        self, login_page: LoginPage, config, viewport_width: int
    ):
        allure.dynamic.title(f"Welcome panel matches screenshot at {viewport_width}px")
        viewport_helper.set_viewport(login_page.driver, viewport_width, _VIEWPORT_HEIGHT)
        home = (
            login_page.open_page()
            .fill_and_submit_form("user1", "password1")
            .should_have_welcome_message(f"Welcome, {config.welcome_username}!")
        )
        screenshot_helper.capture_and_compare(
            home.welcome_panel_element(),
            "welcome-panel",
            viewport_width,
            f"welcome-panel-{viewport_width}",
        )
