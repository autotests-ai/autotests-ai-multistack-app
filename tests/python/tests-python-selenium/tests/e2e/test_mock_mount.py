"""UI mount on the stub API — same questions as java HomeLayout/LoginForm/LoginEmbed/RegisterForm."""

from __future__ import annotations

import allure
import pytest

from pages.home_page import HomePage
from pages.login_page import LoginPage
from pages.register_page import RegisterPage

pytestmark = [pytest.mark.e2e, pytest.mark.mock]


@allure.epic("Home")
@allure.feature("Home layout")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Home layout mount")
class TestHomeLayout:
    @allure.title("Home shows embedded header and reference layout")
    def test_home_layout_is_mounted(self, home_page: HomePage):
        home_page.open_page().should_show_embedded_header().should_show_layout()


@allure.epic("Authentication")
@allure.feature("Login form")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Login form mount")
class TestLoginForm:
    @allure.title("Login form fields and submit are visible")
    def test_login_form_is_mounted(self, login_page: LoginPage):
        login_page.open_page().should_show_login_form().should_have_form_title("Login Form")


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


@allure.epic("Authentication")
@allure.feature("Register form")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Register form mount")
class TestRegisterForm:
    @allure.title("Register form fields and submit are visible")
    def test_register_form_is_mounted(self, register_page: RegisterPage):
        register_page.open_page().should_show_register_form().should_have_form_title("Register")
