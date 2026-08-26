from __future__ import annotations

import allure
import pytest

from pages.login_page import LoginPage

pytestmark = [pytest.mark.e2e, pytest.mark.mock]


@allure.epic("Authentication")
@allure.feature("Login form")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Login form mount")
class TestLoginForm:
    @allure.title("Login form fields and submit are visible")
    def test_login_form_is_mounted(self, login_page: LoginPage):
        login_page.open_page().should_show_login_form().should_have_form_title("Login Form")
