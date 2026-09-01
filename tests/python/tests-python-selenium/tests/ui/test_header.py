"""Header lang/theme — java HeaderTests."""

from __future__ import annotations

import allure
import pytest

from pages.header_component import HeaderComponent
from pages.login_page import LoginPage

pytestmark = pytest.mark.ui


@allure.epic("Header")
@allure.feature("Lang and theme")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Header")
class TestHeader:
    @allure.title("Login page stays English by default")
    def test_login_page_stays_english_by_default(
        self, login_page: LoginPage, header: HeaderComponent
    ):
        login_page.open_page().should_have_form_title("Login Form")
        header.should_have_lang_label("EN").should_have_html_lang("en")

    @allure.title("Theme toggle persists light theme after reload")
    def test_theme_toggle_persists_light_theme_after_reload(
        self, login_page: LoginPage, header: HeaderComponent
    ):
        login_page.open_page().should_have_form_title("Login Form")
        header.should_have_theme("dark").click_theme_toggle().should_have_theme("light")
        login_page.reload_page()
        header.should_have_theme("light")

    @allure.title("Lang toggle switches login copy to Russian and back")
    def test_lang_toggle_switches_login_copy_to_russian_and_back(
        self, login_page: LoginPage, header: HeaderComponent
    ):
        login_page.open_page().should_have_form_title("Login Form")
        header.click_lang_toggle().should_have_lang_label("RU").should_have_html_lang("ru")
        login_page.should_have_form_title("Форма входа").reload_page()
        header.should_have_lang_label("RU").should_have_html_lang("ru")
        login_page.should_have_form_title("Форма входа")
        header.click_lang_toggle().should_have_lang_label("EN").should_have_html_lang("en")
        login_page.should_have_form_title("Login Form")
