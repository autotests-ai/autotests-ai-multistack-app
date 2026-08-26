from __future__ import annotations

import allure
import pytest

from pages.login_page import LoginPage

pytestmark = [pytest.mark.e2e, pytest.mark.mock]


@allure.epic("Authentication")
@allure.feature("Login embed")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Login embed")
class TestLoginEmbed:
    @allure.title("Embedded header is visible on login page")
    def test_embedded_header_is_visible_on_login_page(self, login_page: LoginPage):
        (
            login_page.open_page()
            .should_show_embedded_header()
            .should_show_login_form()
            .should_have_form_title("Login Form")
        )
