from __future__ import annotations

import allure
import pytest
from playwright.sync_api import expect

from pages.app import App

pytestmark = [pytest.mark.ui, pytest.mark.mock]


@allure.epic("Authentication")
@allure.feature("Login embed")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Login embed")
class TestLoginEmbed:
    @allure.title("Embedded header is visible on login page")
    def test_embedded_header_is_visible_on_login(self, app: App):
        app.login.open()
        expect(app.home.header).to_be_visible()
        expect(app.login.form_title).to_contain_text("Login Form")
