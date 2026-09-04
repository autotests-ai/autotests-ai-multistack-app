from __future__ import annotations

import allure
import pytest
from playwright.sync_api import expect

from pages.app import App
from user import UserBuilder

LOGIN_REQUIRED = "Login is required (minimum 3 characters)"
LOGIN_MIN_LENGTH = "Login must be at least 3 characters"
PASSWORD_REQUIRED = "Password is required (minimum 6 characters)"
PASSWORD_MIN_LENGTH = "Password must be at least 6 characters"
BOTH_REQUIRED = "Login and password are required (minimum 3 and 6 characters)"
PASSWORD_MISMATCH = "Passwords do not match"
DUPLICATE_USERNAME = "Username already taken"
REGISTER_PASSWORD = "password123"

pytestmark = pytest.mark.e2e


@allure.epic("Authentication")
@allure.feature("Register")
@allure.severity(allure.severity_level.CRITICAL)
@allure.title("Register")
class TestRegister:
    @pytest.fixture(autouse=True)
    def cleanup_registered_user(self, app: App):
        self._registered = None
        yield
        if self._registered is None:
            return
        try:
            app.home.click_delete_account_and_confirm()
        except Exception:
            pass

    @allure.title("New user can register and land on home")
    @pytest.mark.positive
    def test_should_register_new_user(self, app: App):
        user = UserBuilder().with_username().with_password().build()
        self._registered = user
        app.register.open().signup(user.username, user.password)
        expect(app.home.welcome_message).to_contain_text(user.welcome_message())

    @allure.title("New user can register with 3-character login and 6-character password")
    @pytest.mark.positive
    def test_should_register_with_minimum_length_credentials(self, app: App):
        user = UserBuilder().with_min_length_credentials().build()
        self._registered = user
        app.register.open().signup(user.username, user.password)
        expect(app.home.welcome_message).to_contain_text(user.welcome_message())

    @allure.title("Password mismatch shows validation error")
    @pytest.mark.negative
    def test_should_show_error_when_passwords_do_not_match(self, app: App):
        app.register.open().type_username("newuser").type_password("password123").type_confirm_password(
            "password124"
        ).submit_expecting_error()
        expect(app.register.error_message).to_contain_text(PASSWORD_MISMATCH)

    @allure.title("Short password on register shows validation error")
    @pytest.mark.negative
    def test_should_show_error_when_password_is_short(self, app: App):
        app.register.open().type_username("newuser").type_password("abc").type_confirm_password(
            "abc"
        ).submit_expecting_error()
        expect(app.register.error_message).to_contain_text(PASSWORD_MIN_LENGTH)

    @allure.title("Taken username on register shows readable error")
    @pytest.mark.negative
    def test_should_show_error_when_username_is_taken(self, app: App):
        app.register.open().type_username("user1").type_password(REGISTER_PASSWORD).type_confirm_password(
            REGISTER_PASSWORD
        ).submit_expecting_error()
        expect(app.register.error_message).to_contain_text(DUPLICATE_USERNAME)

    @allure.title("Short username on register shows validation error")
    @pytest.mark.negative
    def test_should_show_error_when_username_is_short(self, app: App):
        app.register.open().type_username("ab").type_password("password123").type_confirm_password(
            "password123"
        ).submit_expecting_error()
        expect(app.register.error_message).to_contain_text(LOGIN_MIN_LENGTH)

    @allure.title("Empty username on register shows validation error")
    @pytest.mark.negative
    def test_should_show_error_when_username_is_empty(self, app: App):
        app.register.open().type_password("password123").type_confirm_password(
            "password123"
        ).submit_expecting_error()
        expect(app.register.error_message).to_contain_text(LOGIN_REQUIRED)

    @allure.title("Empty password on register shows validation error")
    @pytest.mark.negative
    def test_should_show_error_when_password_is_empty(self, app: App):
        app.register.open().type_username("newuser").submit_expecting_error()
        expect(app.register.error_message).to_contain_text(PASSWORD_REQUIRED)

    @allure.title("Empty username and password on register show combined validation error")
    @pytest.mark.negative
    def test_should_show_error_when_both_are_empty(self, app: App):
        app.register.open().submit_expecting_error()
        expect(app.register.error_message).to_contain_text(BOTH_REQUIRED)
