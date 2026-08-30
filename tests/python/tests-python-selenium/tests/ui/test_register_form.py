from __future__ import annotations

import allure
import pytest

from pages.register_page import RegisterPage

pytestmark = [pytest.mark.ui, pytest.mark.mock]


@allure.epic("Authentication")
@allure.feature("Register form")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Register form mount")
class TestRegisterForm:
    @allure.title("Register form fields and submit are visible")
    def test_register_form_is_mounted(self, register_page: RegisterPage):
        register_page.open_page().should_show_register_form().should_have_form_title("Register")
