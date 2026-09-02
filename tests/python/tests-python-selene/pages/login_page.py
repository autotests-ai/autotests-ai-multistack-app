from __future__ import annotations

import allure
from selene import be, browser, have

from pages.base import BasePage


class LoginPage(BasePage):
    @allure.step("Open login page")
    def open_page(self) -> LoginPage:
        self.open_path("/login")
        return self.should_be_open()

    @allure.step("Click Register link under the login form")
    def click_register_link(self):
        from pages.register_page import RegisterPage

        browser.element("[data-testid='register-link']").should(be.visible).click()
        return RegisterPage(self.config)

    @allure.step("Fill and submit form")
    def fill_and_submit_form(self, username: str, password: str):
        self.type_username(username)
        self.type_password(password)
        return self.submit()

    @allure.step("Type username: {username}")
    def type_username(self, username: str) -> LoginPage:
        browser.element("[data-testid='login-input']").set_value(username)
        return self

    @allure.step("Type password")
    def type_password(self, password: str) -> LoginPage:
        browser.element("[data-testid='password-input']").set_value(password)
        return self

    @allure.step("Submit login form")
    def submit(self):
        from pages.home_page import HomePage

        browser.element("[data-testid='submit-button']").click()
        return HomePage(self.config)

    @allure.step("Submit login form expecting validation error")
    def submit_expecting_error(self) -> LoginPage:
        browser.element("[data-testid='submit-button']").click()
        browser.element("[data-testid='error-message']").should(be.visible)
        return self

    @allure.step("Verify embedded header is mounted")
    def should_show_embedded_header(self) -> LoginPage:
        self.header.should_show_embedded_header()
        return self

    @allure.step("Verify login page is open")
    def should_be_open(self) -> LoginPage:
        browser.element("[data-testid='login-form']").should(be.visible)
        return self

    @allure.step("Verify login form is mounted")
    def should_show_login_form(self) -> LoginPage:
        browser.element("[data-testid='login-form-title']").should(be.visible)
        browser.element("[data-testid='login-input']").should(be.visible)
        browser.element("[data-testid='password-input']").should(be.visible)
        browser.element("[data-testid='submit-button']").should(be.visible)
        return self

    def login_form_panel(self):
        el = browser.element("[data-testid='login-form']")
        el.should(be.visible)
        return el.locate()

    @allure.step("Verify form title message: {message}")
    def should_have_form_title(self, message: str) -> LoginPage:
        browser.element("[data-testid='login-form-title']").should(have.text(message))
        return self

    @allure.step("Verify error message: {message}")
    def should_have_error_message(self, message: str) -> LoginPage:
        browser.element("[data-testid='error-message']").should(have.text(message))
        return self
