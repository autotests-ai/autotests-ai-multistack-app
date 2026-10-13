import allure
import pytest

from api_client import login_response

pytestmark = pytest.mark.e2e


@allure.epic("Authentication")
@allure.feature("Delete account")
@allure.severity(allure.severity_level.CRITICAL)
class TestDeleteAccount:
    @allure.title("Confirming delete account clears the session and navigates to login")
    @pytest.mark.positive
    def test_confirming_delete_clears_session_and_navigates_to_login(
        self, login_screen, config, registered_user
    ):
        (
            login_screen.should_be_open()
            .fill_and_submit_form(registered_user.username, registered_user.password)
            .should_have_welcome_message(registered_user.welcome_message())
            .should_show_session_actions()
            .click_delete_account_and_confirm()
            .should_have_form_title("Login Form")
        )

        response = login_response(config, registered_user.username, registered_user.password)
        assert response.status_code == 401, response.text
        assert response.json()["message"] == "Wrong login or password"

    @allure.title("Cancelling the confirm keeps the session")
    @pytest.mark.positive
    def test_cancelling_confirm_keeps_session(self, login_screen, config, registered_user):
        (
            login_screen.should_be_open()
            .fill_and_submit_form(registered_user.username, registered_user.password)
            .should_have_welcome_message(registered_user.welcome_message())
            .click_delete_account_and_cancel()
            .should_have_welcome_message(registered_user.welcome_message())
        )

        response = login_response(config, registered_user.username, registered_user.password)
        assert response.status_code == 200, response.text
        assert response.json()["username"] == registered_user.username
        assert response.json()["token"]
