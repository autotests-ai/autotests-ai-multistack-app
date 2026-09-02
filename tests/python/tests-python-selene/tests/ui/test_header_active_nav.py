"""Header active nav — java HeaderActiveNavTests (1:1 DisplayName)."""

from __future__ import annotations

import allure
import pytest

from pages.login_page import LoginPage
from pages.register_page import RegisterPage
from pages.home_page import HomePage

pytestmark = pytest.mark.ui


@allure.epic("Header")
@allure.feature("Active nav")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Header active nav")
class TestHeaderActiveNav:
    @allure.title("Login page marks Login as the active header nav")
    @pytest.mark.smoke
    def test_login_page_marks_active_login(self, login_page: LoginPage):
        login_page.open_page().header.should_have_active_nav("header-nav-login")

    @allure.title("Register page marks Register as the active header nav")
    def test_register_page_marks_active_register(self, register_page: RegisterPage):
        register_page.open_page().header.should_have_active_nav("header-nav-register")

    @allure.title("Home page marks Home as the active header nav")
    def test_home_page_marks_active_home(self, home_page: HomePage):
        home_page.open_page().header.should_have_active_nav("header-nav-home")

    @allure.title("In-form Register link syncs the active header nav")
    def test_in_form_register_link_syncs_active_nav(self, login_page: LoginPage):
        login_page.open_page().header.should_have_active_nav("header-nav-login")
        login_page.click_register_link().should_be_open().header.should_have_active_nav(
            "header-nav-register"
        )

    @allure.title("In-form Login link syncs the active header nav")
    def test_in_form_login_link_syncs_active_nav(self, register_page: RegisterPage):
        register_page.open_page().header.should_have_active_nav("header-nav-register")
        register_page.click_login_link().should_be_open().header.should_have_active_nav(
            "header-nav-login"
        )

    @allure.title("Header nav Register opens register and marks it active")
    def test_header_nav_register_opens_register(
        self, login_page: LoginPage, register_page: RegisterPage
    ):
        login_page.open_page().header.click_nav("header-nav-register")
        register_page.should_be_open().header.should_have_active_nav("header-nav-register")

    @allure.title("Header nav Login opens login and marks it active")
    def test_header_nav_login_opens_login(
        self, login_page: LoginPage, register_page: RegisterPage
    ):
        register_page.open_page().header.click_nav("header-nav-login")
        login_page.should_be_open().header.should_have_active_nav("header-nav-login")
