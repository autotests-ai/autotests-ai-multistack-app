import allure
import pytest

from pages.home_page import HomePage

pytestmark = pytest.mark.e2e


@allure.epic("Authentication")
@allure.feature("Session")
@allure.story("Session")
@allure.title("Session")
class TestSession:
    @allure.title("Invalid token clears session and hides welcome")
    @allure.severity(allure.severity_level.CRITICAL)
    @pytest.mark.negative
    def test_invalid_token_clears_session(self, home_page: HomePage):
        (
            home_page.open_page_with_invalid_token()
            .should_show_layout()
            .should_hide_welcome_panel()
            .should_clear_auth_token()
        )

    @allure.title("Session survives a page reload (token in localStorage)")
    @allure.severity(allure.severity_level.CRITICAL)
    @pytest.mark.positive
    def test_session_survives_reload(self, home_page: HomePage):
        (
            home_page.open_page_with_local_storage_authentication("user1", "password1")
            .should_have_welcome_message("Welcome, user1!")
            .reload_page()
            .should_have_welcome_message("Welcome, user1!")
        )
