from __future__ import annotations

import allure
import pytest
from playwright.sync_api import expect

from pages.app import App

pytestmark = pytest.mark.ui


@allure.epic("Header")
@allure.feature("Burger menu")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Burger menu")
class TestBurgerMenu:
    @pytest.fixture(autouse=True)
    def mobile_viewport(self, app: App):
        app.header.set_mobile_viewport()
        yield
        app.header.reset_viewport()

    @allure.title("Menu nav marks Login active on the login page")
    def test_menu_nav_marks_active_login(self, app: App):
        app.login.open()
        app.header.open_menu()
        app.header.should_have_active_menu_nav("header-menu-nav-login")

    @allure.title("Menu Register opens the register page and closes the menu")
    def test_clicking_register_opens_register_and_closes_menu(self, app: App):
        app.login.open()
        app.header.open_menu()
        app.header.should_have_active_menu_nav("header-menu-nav-login")
        app.header.click_menu_nav("header-menu-nav-register")
        app.register.should_be_open()
        app.header.should_have_closed_menu()
        expect(app.header.burger).to_have_attribute("aria-expanded", "false")

    @allure.title("Menu Login opens the login page and closes the menu")
    def test_clicking_login_opens_login_and_closes_menu(self, app: App):
        app.register.open()
        app.header.open_menu()
        app.header.click_menu_nav("header-menu-nav-login")
        app.login.should_be_open()
        app.header.should_have_closed_menu()
        expect(app.header.burger).to_have_attribute("aria-expanded", "false")
