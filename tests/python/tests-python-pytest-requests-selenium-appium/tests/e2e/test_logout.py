import allure
import pytest

pytestmark = pytest.mark.e2e


@allure.epic("Authentication")
@allure.feature("Logout")
@allure.severity(allure.severity_level.CRITICAL)
class TestLogout:
    @allure.title("User can logout after form login")
    @pytest.mark.positive
    def test_should_logout_after_form_login(self, login_screen):
        (
            login_screen.should_be_open()
            .fill_and_submit_form("user1", "password1")
            .should_have_welcome_message("Welcome, user1!")
            .click_logout_button()
            .should_have_form_title("Login Form")
        )
