import allure
import pytest

from pages.home_page import HomePage
from pages.login_page import LoginPage

pytestmark = pytest.mark.e2e


@allure.epic("Authentication")
@allure.feature("Logout")
@allure.story("Logout")
@allure.title("Logout")
class TestLogout:
    @allure.title("User can logout after form login")
    @allure.severity(allure.severity_level.CRITICAL)
    @pytest.mark.positive
    def test_should_logout_after_form_login(self, login_page: LoginPage, home_page: HomePage):
        (
            login_page.open_page()
            .fill_and_submit_form("user1", "password1")
            .should_have_welcome_message("Welcome, user1!")
        )
        home_page.click_logout_button().should_have_form_title("Login Form")

    @allure.title("User can logout after localStorage authentication")
    @allure.severity(allure.severity_level.CRITICAL)
    @pytest.mark.positive
    def test_should_logout_after_local_storage_authentication(self, home_page: HomePage):
        (
            home_page.open_page_with_local_storage_authentication("user1", "password1")
            .should_have_welcome_message("Welcome, user1!")
            .should_show_session_actions()
        )
        home_page.click_logout_button().should_have_form_title("Login Form")
