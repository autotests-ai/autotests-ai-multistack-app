"""Burger menu — java BurgerMenuTests."""

from __future__ import annotations

import allure
import pytest

from pages.header_component import HeaderComponent
from pages.login_page import LoginPage
from pages.register_page import RegisterPage

pytestmark = pytest.mark.ui


@allure.epic("Header")
@allure.feature("Burger menu")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Burger menu")
class TestBurgerMenu:
    @pytest.fixture(autouse=True)
    def _mobile_viewport(self, header: HeaderComponent):
        header.set_mobile_viewport()
        yield
        header.reset_viewport()

    @allure.title("Menu nav marks Login active on the login page")
    def test_menu_nav_marks_active_login(self, login_page: LoginPage):
        login_page.open_page()
        login_page.header.open_menu().should_have_active_menu_nav("header-menu-nav-login")

    @allure.title("Menu Register opens the register page and closes the menu")
    def test_clicking_register_opens_register_and_closes_menu(
        self, login_page: LoginPage, register_page: RegisterPage
    ):
        login_page.open_page()
        login_page.header.open_menu().should_have_active_menu_nav(
            "header-menu-nav-login"
        ).click_menu_nav("header-menu-nav-register")
        register_page.should_be_open()
        login_page.header.should_have_closed_menu()

    @allure.title("Menu Login opens the login page and closes the menu")
    def test_clicking_login_opens_login_and_closes_menu(
        self, login_page: LoginPage, register_page: RegisterPage
    ):
        register_page.open_page()
        register_page.header.open_menu().click_menu_nav("header-menu-nav-login")
        login_page.should_be_open()
        register_page.header.should_have_closed_menu()
