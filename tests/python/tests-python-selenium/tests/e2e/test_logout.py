import allure
import pytest

from helpers.user import UserBuilder
from pages.login_page import LoginPage

SEEDED_USER = UserBuilder().with_seeded_user().build()

pytestmark = pytest.mark.e2e


@allure.epic("Authentication")
@allure.feature("Logout")
@allure.story("Logout")
@allure.title("Logout")
class TestLogout:
    @allure.title("User can logout after form login")
    @allure.severity(allure.severity_level.NORMAL)
    @pytest.mark.smoke
    @pytest.mark.positive
    def test_should_logout_after_form_login(self, login_page: LoginPage):
        home = (
            login_page.open_page()
            .fill_and_submit_form(SEEDED_USER.username, SEEDED_USER.password)
            .should_have_welcome_message(SEEDED_USER.welcome_message())
        )
        home.click_logout_button().should_have_form_title("Login Form")
