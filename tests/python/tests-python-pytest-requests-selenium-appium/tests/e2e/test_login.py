import allure
import pytest

from api_client import register

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
class TestLogin:
    @allure.title("User is logged in with valid credentials")
    @pytest.mark.smoke
    @pytest.mark.positive
    def test_should_login_with_valid_credentials(self, login_screen):
        (
            login_screen.should_be_open()
            .fill_and_submit_form("user1", "password1")
            .should_have_welcome_message("Welcome, user1!")
        )

    @allure.title("User is logged in with 3-character login and 6-character password")
    @pytest.mark.positive
    def test_should_login_with_minimum_length_credentials(self, login_screen, config, min_length_user):
        register(config, min_length_user.username, min_length_user.password)
        (
            login_screen.should_be_open()
            .fill_and_submit_form(min_length_user.username, min_length_user.password)
            .should_have_welcome_message(min_length_user.welcome_message())
        )

    @allure.title("Empty username shows validation error")
    @pytest.mark.negative
    def test_should_show_validation_error_when_username_is_empty(self, login_screen):
        (
            login_screen.should_be_open()
            .type_password("password1")
            .submit_expecting_error()
            .should_have_error_message(LOGIN_REQUIRED)
        )

    @allure.title("Empty password shows validation error")
    @pytest.mark.negative
    def test_should_show_validation_error_when_password_is_empty(self, login_screen):
        (
            login_screen.should_be_open()
            .type_username("user1")
            .submit_expecting_error()
            .should_have_error_message(PASSWORD_REQUIRED)
        )

    @allure.title("Wrong password shows readable error")
    @pytest.mark.negative
    def test_should_show_error_when_password_is_wrong(self, login_screen):
        (
            login_screen.should_be_open()
            .type_username("user1")
            .type_password("wrongpassword")
            .submit_expecting_error()
            .should_have_error_message(WRONG_CREDENTIALS)
        )

    @allure.title("Short username shows validation error")
    @pytest.mark.negative
    def test_should_show_validation_error_when_username_is_too_short(self, login_screen):
        (
            login_screen.should_be_open()
            .type_username("ab")
            .type_password("password1")
            .submit_expecting_error()
            .should_have_error_message(LOGIN_MIN_LENGTH)
        )

    @allure.title("Short password shows validation error")
    @pytest.mark.negative
    def test_should_show_validation_error_when_password_is_too_short(self, login_screen):
        (
            login_screen.should_be_open()
            .type_username("user1")
            .type_password("123")
            .submit_expecting_error()
            .should_have_error_message(PASSWORD_MIN_LENGTH)
        )

    @allure.title("Unknown username shows readable error")
    @pytest.mark.negative
    def test_should_show_error_when_username_is_unknown(self, login_screen):
        (
            login_screen.should_be_open()
            .type_username("nouser")
            .type_password("password1")
            .submit_expecting_error()
            .should_have_error_message(WRONG_CREDENTIALS)
        )

    @allure.title("Empty username and password show validation error")
    @pytest.mark.negative
    def test_should_show_validation_error_when_credentials_are_empty(self, login_screen):
        login_screen.should_be_open().submit_expecting_error().should_have_error_message(BOTH_REQUIRED)
