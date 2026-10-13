from __future__ import annotations

import allure

from screens.base import BaseScreen, by_id
from screens.home_screen import HomeScreen

REGISTER_FORM = by_id("register-form")
LOGIN_INPUT = by_id("register-login-input")
PASSWORD_INPUT = by_id("register-password-input")
CONFIRM_PASSWORD_INPUT = by_id("confirm-password-input")
SUBMIT_BUTTON = by_id("register-submit-button")
ERROR_MESSAGE = by_id("register-error-message")


class RegisterScreen(BaseScreen):
    @allure.step("Register screen is open")
    def should_be_open(self) -> RegisterScreen:
        for locator in (REGISTER_FORM, LOGIN_INPUT, PASSWORD_INPUT, CONFIRM_PASSWORD_INPUT, SUBMIT_BUTTON):
            self.visible(locator)
        return self

    @allure.step("Fill and submit register form")
    def fill_and_submit_form(self, username: str, password: str, confirm_password: str) -> HomeScreen:
        return (
            self.type_username(username)
            .type_password(password)
            .type_confirm_password(confirm_password)
            .submit()
        )

    @allure.step("Type username: {username}")
    def type_username(self, username: str) -> RegisterScreen:
        self.type(LOGIN_INPUT, username)
        return self

    @allure.step("Type password")
    def type_password(self, password: str) -> RegisterScreen:
        self.type(PASSWORD_INPUT, password)
        return self

    @allure.step("Type confirm password")
    def type_confirm_password(self, confirm_password: str) -> RegisterScreen:
        self.type(CONFIRM_PASSWORD_INPUT, confirm_password)
        return self

    @allure.step("Submit register form")
    def submit(self) -> HomeScreen:
        self.click(SUBMIT_BUTTON)
        return HomeScreen(self.driver)

    @allure.step("Submit register form expecting validation or API error")
    def submit_expecting_error(self) -> RegisterScreen:
        self.click(SUBMIT_BUTTON)
        self.visible(ERROR_MESSAGE)
        return self

    @allure.step("Verify error message: {message}")
    def should_have_error_message(self, message: str) -> RegisterScreen:
        self.should_have_text(ERROR_MESSAGE, message)
        return self
