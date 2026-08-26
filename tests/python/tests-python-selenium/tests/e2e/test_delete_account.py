import allure
import pytest

from api_client import delete_account_quietly, login, register, username
from pages.home_page import HomePage

pytestmark = pytest.mark.e2e

PASSWORD = "password123"


@allure.epic("Authentication")
@allure.feature("Delete account")
@allure.story("Delete account")
@allure.title("Delete account")
class TestDeleteAccount:
    @allure.title("Confirming delete account clears the session and navigates to login")
    @allure.severity(allure.severity_level.CRITICAL)
    @pytest.mark.positive
    def test_confirming_delete_clears_session_and_navigates_to_login(
        self, home_page: HomePage, config
    ):
        throwaway = username()
        register(config, throwaway, PASSWORD)
        try:
            (
                home_page.open_page_with_local_storage_authentication(throwaway, PASSWORD)
                .should_have_welcome_message(f"Welcome, {throwaway}!")
                .should_show_session_actions()
                .click_delete_account_and_confirm()
                .should_have_form_title("Login Form")
            )
            home_page.should_clear_auth_token()
            throwaway = None
        finally:
            if throwaway is not None:
                delete_account_quietly(config, throwaway, PASSWORD)

    @allure.title("Cancelling the confirm keeps the session and sends no delete request")
    @allure.severity(allure.severity_level.CRITICAL)
    @pytest.mark.positive
    def test_cancelling_confirm_keeps_session(self, home_page: HomePage, config):
        throwaway = username()
        register(config, throwaway, PASSWORD)
        try:
            (
                home_page.open_page_with_local_storage_authentication(throwaway, PASSWORD)
                .should_have_welcome_message(f"Welcome, {throwaway}!")
                .click_delete_account_and_cancel()
                .should_have_welcome_message(f"Welcome, {throwaway}!")
                .should_keep_auth_token()
            )
            login(config, throwaway, PASSWORD)
        finally:
            delete_account_quietly(config, throwaway, PASSWORD)
