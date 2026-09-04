from __future__ import annotations

import allure
import pytest
from playwright.sync_api import expect

from pages.app import App

pytestmark = [pytest.mark.ui, pytest.mark.mock]


@allure.epic("Authentication")
@allure.feature("Login form")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Login form")
class TestLoginForm:
    @allure.title("Login form fields and submit are visible")
    def test_login_form_fields_are_visible(self, app: App):
        app.login.open().should_show_login_form()
        expect(app.login.form_title).to_contain_text("Login Form")
