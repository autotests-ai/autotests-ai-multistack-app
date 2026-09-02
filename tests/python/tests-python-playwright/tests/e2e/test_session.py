from __future__ import annotations

import allure
import pytest
from playwright.sync_api import expect

from pages.app import App

pytestmark = pytest.mark.e2e


@allure.epic("Authentication")
@allure.feature("Session")
@allure.severity(allure.severity_level.CRITICAL)
@allure.title("Session")
class TestSession:
    @allure.title("Invalid token clears session and hides welcome")
    @pytest.mark.negative
    def test_invalid_token_clears_session(self, app: App):
        app.home.open_with_invalid_token().should_hide_welcome_panel().should_clear_auth_token()

    @allure.title("Session survives a page reload (token in localStorage)")
    @pytest.mark.positive
    def test_session_survives_reload(self, app: App):
        app.home.open_with_local_storage_authentication("user1", "password1")
        expect(app.home.welcome_message).to_contain_text("Welcome, user1!")
        app.home.reload()
        expect(app.home.welcome_message).to_contain_text("Welcome, user1!")
