from __future__ import annotations

import allure
import pytest
from playwright.sync_api import expect

from pages.app import App

pytestmark = [pytest.mark.ui, pytest.mark.mock]


@allure.epic("Authentication")
@allure.feature("Register form")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Register form")
class TestRegisterForm:
    @allure.title("Register form fields and submit are visible")
    def test_register_form_fields_are_visible(self, app: App):
        app.register.open().should_show_register_form()
        expect(app.register.form_title).to_contain_text("Register")
