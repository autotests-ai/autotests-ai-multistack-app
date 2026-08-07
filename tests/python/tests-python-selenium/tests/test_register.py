import uuid

import allure
import pytest

from api_client import delete_account_quietly
from pages.register_page import RegisterPage


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
