import uuid

import allure
import pytest

from api_client import delete_account_quietly
from pages.register_page import RegisterPage

LOGIN_REQUIRED = "Login is required (minimum 3 characters)"
LOGIN_MIN_LENGTH = "Login must be at least 3 characters"
PASSWORD_REQUIRED = "Password is required (minimum 6 characters)"
BOTH_REQUIRED = "Login and password are required (minimum 3 and 6 characters)"

pytestmark = pytest.mark.e2e


@allure.epic("Authentication")
@allure.feature("Register")
@allure.story("Register")
@allure.title("Register")
class TestRegister:
    @allure.title("New user can register and land on home")
    @allure.severity(allure.severity_level.CRITICAL)
    @pytest.mark.smoke
    @pytest.mark.positive
    def test_should_register_new_user(self, register_page: RegisterPage, config):
        username = f"user_{uuid.uuid4().hex[:8]}"
        password = "password123"
        try:
            (
                register_page.open_page()
                .fill_and_submit_form(username, password, password)
                .should_have_welcome_message(f"Welcome, {username}!")
            )
        finally:
            delete_account_quietly(config, username, password)

    @allure.title("Password mismatch shows validation error")
    @allure.severity(allure.severity_level.NORMAL)
    @pytest.mark.negative
    def test_should_show_error_when_passwords_do_not_match(self, register_page: RegisterPage):
        (
            register_page.open_page()
            .type_username("newuser")
            .type_password("password123")
            .type_confirm_password("password124")
            .submit_expecting_error()
            .should_have_error_message("Passwords do not match")
        )

    @allure.title("Short password shows validation error")
    @allure.severity(allure.severity_level.NORMAL)
    @pytest.mark.negative
    def test_should_show_error_when_password_is_too_short(self, register_page: RegisterPage):
        (
            register_page.open_page()
            .type_username("newuser")
            .type_password("abc")
            .type_confirm_password("abc")
            .submit_expecting_error()
            .should_have_error_message("Password must be at least 6 characters")
        )

    @allure.title("Duplicate username shows readable error")
    @allure.severity(allure.severity_level.NORMAL)
    @pytest.mark.negative
    def test_should_show_error_when_username_is_taken(self, register_page: RegisterPage):
        (
            register_page.open_page()
            .type_username("user1")
            .type_password("password123")
            .type_confirm_password("password123")
            .submit_expecting_error()
            .should_have_error_message("Username already taken")
        )

    @allure.title("Short username shows validation error")
    @allure.severity(allure.severity_level.NORMAL)
    @pytest.mark.negative
    def test_should_show_validation_error_when_username_is_too_short(self, register_page: RegisterPage):
        (
            register_page.open_page()
            .type_username("ab")
            .type_password("password123")
            .type_confirm_password("password123")
            .submit_expecting_error()
            .should_have_error_message(LOGIN_MIN_LENGTH)
        )

    @allure.title("Empty username shows validation error")
    @allure.severity(allure.severity_level.NORMAL)
    @pytest.mark.negative
    def test_should_show_validation_error_when_username_is_empty(self, register_page: RegisterPage):
        (
            register_page.open_page()
            .type_password("password123")
            .type_confirm_password("password123")
            .submit_expecting_error()
            .should_have_error_message(LOGIN_REQUIRED)
        )

    @allure.title("Empty password shows validation error")
    @allure.severity(allure.severity_level.NORMAL)
    @pytest.mark.negative
    def test_should_show_validation_error_when_password_is_empty(self, register_page: RegisterPage):
        (
            register_page.open_page()
            .type_username("newuser")
            .submit_expecting_error()
            .should_have_error_message(PASSWORD_REQUIRED)
        )

    @allure.title("Empty username and password show validation error")
    @allure.severity(allure.severity_level.NORMAL)
    @pytest.mark.negative
    def test_should_show_validation_error_when_credentials_are_empty(self, register_page: RegisterPage):
        (
            register_page.open_page()
            .submit_expecting_error()
            .should_have_error_message(BOTH_REQUIRED)
        )
