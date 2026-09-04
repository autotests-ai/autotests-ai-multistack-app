from __future__ import annotations

import allure
import pytest
from playwright.sync_api import expect

from pages.app import App
from user import UserBuilder

pytestmark = pytest.mark.e2e


@allure.epic("Authentication")
@allure.feature("Delete account")
@allure.severity(allure.severity_level.CRITICAL)
@allure.title("Delete account")
class TestDeleteAccount:
    @allure.title("User can delete the account from home")
    @pytest.mark.positive
    def test_should_delete_account(self, app: App):
        user = UserBuilder().with_username().with_password().build()
        app.register.open().signup(user.username, user.password)
        expect(app.home.welcome_message).to_contain_text(user.welcome_message())
        app.home.click_delete_account_and_confirm()
        expect(app.login.form_title).to_contain_text("Login Form")

    @allure.title("Cancelling the confirm keeps the session")
    def test_cancelling_confirm_keeps_session(self, app: App):
        user = UserBuilder().with_username().with_password().build()
        app.register.open().signup(user.username, user.password)
        expect(app.home.welcome_message).to_contain_text(user.welcome_message())
        app.home.click_delete_account_and_cancel()
        expect(app.home.welcome_message).to_contain_text(user.welcome_message())
        assert app.home.auth_token() is not None
        app.home.click_delete_account_and_confirm()
        expect(app.login.form_title).to_contain_text("Login Form")
