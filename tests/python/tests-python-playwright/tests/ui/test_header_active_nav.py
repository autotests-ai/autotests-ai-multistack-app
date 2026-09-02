from __future__ import annotations

import allure
import pytest

from pages.app import App

pytestmark = pytest.mark.ui


@allure.epic("Header")
@allure.feature("Active nav")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Header active nav")
class TestHeaderActiveNav:
    @allure.title("Login page marks Login as the active header nav")
    @pytest.mark.smoke
    def test_login_page_marks_active_login(self, app: App):
        app.login.open()
        app.header.should_have_active_nav("header-nav-login")

    @allure.title("Register page marks Register as the active header nav")
    def test_register_page_marks_active_register(self, app: App):
        app.register.open()
        app.header.should_have_active_nav("header-nav-register")

    @allure.title("Home page marks Home as the active header nav")
    def test_home_page_marks_active_home(self, app: App):
        app.home.open()
        app.header.should_have_active_nav("header-nav-home")

    @allure.title("In-form Register link syncs the active header nav")
    def test_in_form_register_link_syncs_active_nav(self, app: App):
        app.login.open()
        app.header.should_have_active_nav("header-nav-login")
        app.login.click_register_link()
        app.register.should_be_open()
        app.header.should_have_active_nav("header-nav-register")

    @allure.title("In-form Login link syncs the active header nav")
    def test_in_form_login_link_syncs_active_nav(self, app: App):
        app.register.open()
        app.header.should_have_active_nav("header-nav-register")
        app.register.click_login_link()
        app.login.should_be_open()
        app.header.should_have_active_nav("header-nav-login")

    @allure.title("Header nav Register opens register and marks it active")
    def test_header_nav_register_opens_register(self, app: App):
        app.login.open()
        app.header.click_nav("header-nav-register")
        app.register.should_be_open()
        app.header.should_have_active_nav("header-nav-register")

    @allure.title("Header nav Login opens login and marks it active")
    def test_header_nav_login_opens_login(self, app: App):
        app.register.open()
        app.header.click_nav("header-nav-login")
        app.login.should_be_open()
        app.header.should_have_active_nav("header-nav-login")
