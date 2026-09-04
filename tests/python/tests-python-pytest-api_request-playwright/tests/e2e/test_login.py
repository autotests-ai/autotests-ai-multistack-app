from __future__ import annotations

import allure
import pytest
from playwright.sync_api import expect

from pages.app import App

LOGIN_REQUIRED = "Login is required (minimum 3 characters)"
LOGIN_MIN_LENGTH = "Login must be at least 3 characters"
PASSWORD_REQUIRED = "Password is required (minimum 6 characters)"
PASSWORD_MIN_LENGTH = "Password must be at least 6 characters"
BOTH_REQUIRED = "Login and password are required (minimum 3 and 6 characters)"
WRONG_CREDENTIALS = "Wrong login or password"

pytestmark = pytest.mark.e2e


@allure.epic("Authentication")
@allure.feature("Login")
@allure.severity(allure.severity_level.CRITICAL)
@allure.title("Login")
class TestLogin:
    @allure.title("User is logged in with valid credentials")
    @pytest.mark.smoke
    @pytest.mark.positive
    def test_should_login_with_valid_credentials(self, app: App):
        app.login.open().login("user1", "password1")
        expect(app.home.welcome_message).to_contain_text("Welcome, user1!")

    @allure.title("User is logged in with 3-character login and 6-character password")
    @pytest.mark.positive
    def test_should_login_with_minimum_length_credentials(self, app: App, api):
        from api_client import delete_account_quietly, register
        from user import UserBuilder

        user = UserBuilder().with_min_length_credentials().build()
        try:
            register(api, user.username, user.password)
            app.login.open().login(user.username, user.password)
            expect(app.home.welcome_message).to_contain_text(user.welcome_message())
        finally:
            delete_account_quietly(api, user.username, user.password)

    @allure.title("Empty username shows validation error")
    @pytest.mark.negative
    def test_should_show_validation_error_when_username_is_empty(self, app: App):
        app.login.open().type_password("password1").submit_expecting_error()
        expect(app.login.error_message).to_contain_text(LOGIN_REQUIRED)

    @allure.title("Empty password shows validation error")
    @pytest.mark.negative
    def test_should_show_validation_error_when_password_is_empty(self, app: App):
        app.login.open().type_username("user1").submit_expecting_error()
        expect(app.login.error_message).to_contain_text(PASSWORD_REQUIRED)

    @allure.title("Wrong password shows readable error")
    @pytest.mark.negative
    def test_should_show_error_when_password_is_wrong(self, app: App):
        app.login.open().type_username("user1").type_password("wrongpassword").submit_expecting_error()
        expect(app.login.error_message).to_contain_text(WRONG_CREDENTIALS)

    @allure.title("Short username shows validation error")
    @pytest.mark.negative
    def test_should_show_validation_error_when_username_is_short(self, app: App):
        app.login.open().type_username("ab").type_password("password1").submit_expecting_error()
        expect(app.login.error_message).to_contain_text(LOGIN_MIN_LENGTH)

    @allure.title("Short password shows validation error")
    @pytest.mark.negative
    def test_should_show_validation_error_when_password_is_short(self, app: App):
        app.login.open().type_username("user1").type_password("123").submit_expecting_error()
        expect(app.login.error_message).to_contain_text(PASSWORD_MIN_LENGTH)

    @allure.title("Unknown username shows the same readable error")
    @pytest.mark.negative
    def test_should_show_error_when_username_is_unknown(self, app: App):
        app.login.open().type_username("nouser").type_password("password1").submit_expecting_error()
        expect(app.login.error_message).to_contain_text(WRONG_CREDENTIALS)

    @allure.title("Empty username and password show combined validation error")
    @pytest.mark.negative
    def test_should_show_validation_error_when_both_are_empty(self, app: App):
        app.login.open().submit_expecting_error()
        expect(app.login.error_message).to_contain_text(BOTH_REQUIRED)
