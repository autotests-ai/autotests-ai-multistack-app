from __future__ import annotations

import re

import allure
import pytest
from playwright.sync_api import expect

from pages.app import App

THEME_LIGHT = re.compile("theme-light")

pytestmark = pytest.mark.ui


@allure.epic("Header")
@allure.feature("Lang and theme")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Header")
class TestHeader:
    @allure.title("Login page stays English by default")
    def test_login_page_stays_english_by_default(self, app: App):
        app.login.open()
        expect(app.login.form_title).to_contain_text("Login Form")
        expect(app.header.lang_label).to_contain_text("EN")
        expect(app.header.html).to_have_attribute("lang", "en")

    @allure.title("Theme toggle persists light theme after reload")
    def test_theme_toggle_persists_light_theme_after_reload(self, app: App):
        app.login.open()
        expect(app.login.form_title).to_contain_text("Login Form")
        expect(app.header.html).not_to_have_class(THEME_LIGHT)
        app.header.click_theme_toggle()
        expect(app.header.html).to_have_class(THEME_LIGHT)
        app.login.reload()
        expect(app.header.html).to_have_class(THEME_LIGHT)

    @allure.title("Lang toggle switches login copy to Russian and back")
    def test_lang_toggle_switches_login_copy_to_russian_and_back(self, app: App):
        app.login.open()
        expect(app.login.form_title).to_contain_text("Login Form")
        app.header.click_lang_toggle()
        expect(app.header.lang_label).to_contain_text("RU")
        expect(app.header.html).to_have_attribute("lang", "ru")
        expect(app.login.form_title).to_contain_text("Форма входа")
        app.login.reload()
        expect(app.header.lang_label).to_contain_text("RU")
        expect(app.header.html).to_have_attribute("lang", "ru")
        expect(app.login.form_title).to_contain_text("Форма входа")
        app.header.click_lang_toggle()
        expect(app.header.lang_label).to_contain_text("EN")
        expect(app.header.html).to_have_attribute("lang", "en")
        expect(app.login.form_title).to_contain_text("Login Form")
