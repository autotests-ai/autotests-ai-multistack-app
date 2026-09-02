from __future__ import annotations

import allure
import pytest
from playwright.sync_api import expect

from pages.app import App

pytestmark = pytest.mark.e2e


@allure.epic("Authentication")
@allure.feature("Logout")
@allure.severity(allure.severity_level.CRITICAL)
@allure.title("Logout")
class TestLogout:
    @allure.title("User can logout after form login")
    @pytest.mark.positive
    def test_should_logout_after_form_login(self, app: App):
        app.login.open().login("user1", "password1")
        expect(app.home.welcome_message).to_contain_text("Welcome, user1!")
        app.home.logout()
        expect(app.login.form_title).to_contain_text("Login Form")

    @allure.title("User can logout after localStorage authentication")
    @pytest.mark.positive
    def test_should_logout_after_local_storage_authentication(self, app: App):
        app.home.open_with_local_storage_authentication("user1", "password1").should_show_session_actions()
        expect(app.home.welcome_message).to_contain_text("Welcome, user1!")
        app.home.logout()
        expect(app.login.form_title).to_contain_text("Login Form")
