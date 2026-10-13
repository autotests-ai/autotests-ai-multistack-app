import allure
import pytest

LOGIN_REQUIRED = "Login is required (minimum 3 characters)"
LOGIN_MIN_LENGTH = "Login must be at least 3 characters"
PASSWORD_REQUIRED = "Password is required (minimum 6 characters)"
PASSWORD_MISMATCH = "Passwords do not match"
PASSWORD_MIN_LENGTH = "Password must be at least 6 characters"
BOTH_REQUIRED = "Login and password are required (minimum 3 and 6 characters)"
DUPLICATE_USERNAME = "Username already taken"
REGISTER_PASSWORD = "password123"

pytestmark = pytest.mark.e2e


@allure.epic("Authentication")
@allure.feature("Register")
@allure.severity(allure.severity_level.CRITICAL)
class TestRegister:
    @allure.title("New user can register and land on home")
    @pytest.mark.positive
    def test_should_register_new_user(self, login_screen, new_user):
        (
            login_screen.should_be_open()
            .click_register_link()
            .should_be_open()
            .fill_and_submit_form(new_user.username, new_user.password, new_user.password)
            .should_have_welcome_message(new_user.welcome_message())
        )

    @allure.title("New user can register with 3-character login and 6-character password")
    @pytest.mark.positive
    def test_should_register_with_minimum_length_credentials(self, login_screen, min_length_user):
        (
            login_screen.should_be_open()
            .click_register_link()
            .should_be_open()
            .fill_and_submit_form(min_length_user.username, min_length_user.password, min_length_user.password)
            .should_have_welcome_message(min_length_user.welcome_message())
        )

    @allure.title("Password mismatch shows validation error")
    @pytest.mark.negative
    def test_should_show_error_when_passwords_do_not_match(self, login_screen):
        (
            login_screen.should_be_open()
            .click_register_link()
            .should_be_open()
            .type_username("newuser")
            .type_password("password123")
            .type_confirm_password("password124")
            .submit_expecting_error()
            .should_have_error_message(PASSWORD_MISMATCH)
        )

    @allure.title("Short password shows validation error")
    @pytest.mark.negative
    def test_should_show_error_when_password_is_too_short(self, login_screen):
        (
            login_screen.should_be_open()
            .click_register_link()
            .should_be_open()
            .type_username("newuser")
            .type_password("abc")
            .type_confirm_password("abc")
            .submit_expecting_error()
            .should_have_error_message(PASSWORD_MIN_LENGTH)
        )

    @allure.title("Duplicate username shows readable error")
    @pytest.mark.negative
    def test_should_show_error_when_username_is_taken(self, login_screen):
        (
            login_screen.should_be_open()
            .click_register_link()
            .should_be_open()
            .type_username("user1")
            .type_password(REGISTER_PASSWORD)
            .type_confirm_password(REGISTER_PASSWORD)
            .submit_expecting_error()
            .should_have_error_message(DUPLICATE_USERNAME)
        )

    @allure.title("Short username shows validation error")
    @pytest.mark.negative
    def test_should_show_validation_error_when_username_is_too_short(self, login_screen):
        (
            login_screen.should_be_open()
            .click_register_link()
            .should_be_open()
            .type_username("ab")
            .type_password("password123")
            .type_confirm_password("password123")
            .submit_expecting_error()
            .should_have_error_message(LOGIN_MIN_LENGTH)
        )

    @allure.title("Empty username shows validation error")
    @pytest.mark.negative
    def test_should_show_validation_error_when_username_is_empty(self, login_screen):
        (
            login_screen.should_be_open()
            .click_register_link()
            .should_be_open()
            .type_password("password123")
            .type_confirm_password("password123")
            .submit_expecting_error()
            .should_have_error_message(LOGIN_REQUIRED)
        )

    @allure.title("Empty password shows validation error")
    @pytest.mark.negative
    def test_should_show_validation_error_when_password_is_empty(self, login_screen):
        (
            login_screen.should_be_open()
            .click_register_link()
            .should_be_open()
            .type_username("newuser")
            .submit_expecting_error()
            .should_have_error_message(PASSWORD_REQUIRED)
        )

    @allure.title("Empty username and password show validation error")
    @pytest.mark.negative
    def test_should_show_validation_error_when_credentials_are_empty(self, login_screen):
        (
            login_screen.should_be_open()
            .click_register_link()
            .should_be_open()
            .submit_expecting_error()
            .should_have_error_message(BOTH_REQUIRED)
        )
