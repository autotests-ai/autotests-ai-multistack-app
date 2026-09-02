from __future__ import annotations

import allure
from selene import be, browser, have

from pages.base import BasePage


class RegisterPage(BasePage):
    @allure.step("Open register page")
    def open_page(self) -> RegisterPage:
        self.open_path("/register")
        return self.should_be_open()

    @allure.step("Click 'Login' link under the register form")
    def click_login_link(self):
        from pages.login_page import LoginPage

        browser.element("[data-testid='login-link']").should(be.visible).click()
        return LoginPage(self.config)

    @allure.step("Fill and submit register form")
    def fill_and_submit_form(self, username: str, password: str, confirm_password: str):
        self.type_username(username)
        self.type_password(password)
        self.type_confirm_password(confirm_password)
        return self.submit()

    @allure.step("Type username: {username}")
    def type_username(self, username: str) -> RegisterPage:
        browser.element("[data-testid='register-login-input']").set_value(username)
        return self

    @allure.step("Type password")
    def type_password(self, password: str) -> RegisterPage:
        browser.element("[data-testid='register-password-input']").set_value(password)
        return self

    @allure.step("Type confirm password")
    def type_confirm_password(self, confirm_password: str) -> RegisterPage:
        browser.element("[data-testid='confirm-password-input']").set_value(confirm_password)
        return self

    @allure.step("Submit register form")
    def submit(self):
        from pages.home_page import HomePage

        browser.element("[data-testid='register-submit-button']").click()
        return HomePage(self.config)

    @allure.step("Submit register form expecting validation error")
    def submit_expecting_error(self) -> RegisterPage:
        browser.element("[data-testid='register-submit-button']").click()
        browser.element("[data-testid='register-error-message']").should(be.visible)
        return self

    @allure.step("Verify error message: {message}")
    def should_have_error_message(self, message: str) -> RegisterPage:
        browser.element("[data-testid='register-error-message']").should(have.text(message))
        return self

    @allure.step("Verify register page is open")
    def should_be_open(self) -> RegisterPage:
        browser.element("[data-testid='register-form']").should(be.visible)
        return self

    @allure.step("Verify register form is mounted")
    def should_show_register_form(self) -> RegisterPage:
        browser.element("[data-testid='register-form-title']").should(be.visible)
        browser.element("[data-testid='register-login-input']").should(be.visible)
        browser.element("[data-testid='register-password-input']").should(be.visible)
        browser.element("[data-testid='confirm-password-input']").should(be.visible)
        browser.element("[data-testid='register-submit-button']").should(be.visible)
        return self

    @allure.step("Verify form title message: {message}")
    def should_have_form_title(self, message: str) -> RegisterPage:
        browser.element("[data-testid='register-form-title']").should(have.text(message))
        return self
