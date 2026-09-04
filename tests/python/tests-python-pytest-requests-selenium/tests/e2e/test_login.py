import allure
import pytest

from pages.login_page import LoginPage

LOGIN_REQUIRED = "Login is required (minimum 3 characters)"
LOGIN_MIN_LENGTH = "Login must be at least 3 characters"
PASSWORD_REQUIRED = "Password is required (minimum 6 characters)"
PASSWORD_MIN_LENGTH = "Password must be at least 6 characters"
BOTH_REQUIRED = "Login and password are required (minimum 3 and 6 characters)"
WRONG_CREDENTIALS = "Wrong login or password"

pytestmark = pytest.mark.e2e


@allure.epic("Authentication")
@allure.feature("Login")
@allure.story("Login scenarios")
@allure.title("Login")
class TestLogin:
    @allure.title("User is logged in with valid credentials")
    @allure.severity(allure.severity_level.CRITICAL)
    @pytest.mark.smoke
    @pytest.mark.positive
    def test_should_login_with_valid_credentials(self, login_page: LoginPage):
        (
            login_page.open_page()
            .fill_and_submit_form("user1", "password1")
            .should_have_welcome_message("Welcome, user1!")
        )

    @allure.title("User is logged in with 3-character login and 6-character password")
    @allure.severity(allure.severity_level.CRITICAL)
    @pytest.mark.positive
    def test_should_login_with_minimum_length_credentials(self, login_page: LoginPage, config):
        from api_client import delete_account_quietly, register
        from helpers.user import UserBuilder

        user = UserBuilder().with_min_length_credentials().build()
        try:
            register(config, user.username, user.password)
            (
                login_page.open_page()
                .fill_and_submit_form(user.username, user.password)
                .should_have_welcome_message(user.welcome_message())
            )
        finally:
            delete_account_quietly(config, user.username, user.password)

    @allure.title("Empty username shows validation error")
    @allure.severity(allure.severity_level.NORMAL)
    @pytest.mark.smoke
    @pytest.mark.negative
    def test_should_show_validation_error_when_username_is_empty(self, login_page: LoginPage):
        (
            login_page.open_page()
            .type_password("password1")
            .submit_expecting_error()
            .should_have_error_message(LOGIN_REQUIRED)
        )

    @allure.title("Empty password shows validation error")
    @allure.severity(allure.severity_level.NORMAL)
    @pytest.mark.smoke
    @pytest.mark.negative
    def test_should_show_validation_error_when_password_is_empty(self, login_page: LoginPage):
        (
            login_page.open_page()
            .type_username("user1")
            .submit_expecting_error()
            .should_have_error_message(PASSWORD_REQUIRED)
        )

    @allure.title("Wrong password shows readable error")
    @allure.severity(allure.severity_level.CRITICAL)
    @pytest.mark.smoke
    @pytest.mark.negative
    def test_should_show_error_when_password_is_wrong(self, login_page: LoginPage):
        (
            login_page.open_page()
            .type_username("user1")
            .type_password("wrongpassword")
            .submit_expecting_error()
            .should_have_error_message(WRONG_CREDENTIALS)
        )

    @allure.title("Short username shows validation error")
    @allure.severity(allure.severity_level.NORMAL)
    @pytest.mark.negative
    def test_should_show_validation_error_when_username_is_too_short(self, login_page: LoginPage):
        (
            login_page.open_page()
            .type_username("ab")
            .type_password("password1")
            .submit_expecting_error()
            .should_have_error_message(LOGIN_MIN_LENGTH)
        )

    @allure.title("Short password shows validation error")
    @allure.severity(allure.severity_level.NORMAL)
    @pytest.mark.negative
    def test_should_show_validation_error_when_password_is_too_short(self, login_page: LoginPage):
        (
            login_page.open_page()
            .type_username("user1")
            .type_password("123")
            .submit_expecting_error()
            .should_have_error_message(PASSWORD_MIN_LENGTH)
        )

    @allure.title("Unknown username shows readable error")
    @allure.severity(allure.severity_level.CRITICAL)
    @pytest.mark.negative
    def test_should_show_error_when_username_is_unknown(self, login_page: LoginPage):
        (
            login_page.open_page()
            .type_username("nouser")
            .type_password("password1")
            .submit_expecting_error()
            .should_have_error_message(WRONG_CREDENTIALS)
        )

    @allure.title("Empty username and password show validation error")
    @allure.severity(allure.severity_level.NORMAL)
    @pytest.mark.negative
    def test_should_show_validation_error_when_credentials_are_empty(self, login_page: LoginPage):
        (
            login_page.open_page()
            .submit_expecting_error()
            .should_have_error_message(BOTH_REQUIRED)
        )
