from __future__ import annotations

import allure
from selene import be, browser, have

from screens import by_id
from screens.home_screen import HomeScreen


class RegisterScreen:
    def __init__(self) -> None:
        self.form = browser.element(by_id("register-form"))
        self.login_input = browser.element(by_id("register-login-input"))
        self.password_input = browser.element(by_id("register-password-input"))
        self.confirm_password_input = browser.element(by_id("confirm-password-input"))
        self.submit_button = browser.element(by_id("register-submit-button"))
        self.error_message = browser.element(by_id("register-error-message"))

    @allure.step("Register screen is open")
    def should_be_open(self) -> RegisterScreen:
        for element in (
            self.form,
            self.login_input,
            self.password_input,
            self.confirm_password_input,
            self.submit_button,
        ):
            element.should(be.visible)
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
        self.login_input.set_value(username)
        return self

    @allure.step("Type password")
    def type_password(self, password: str) -> RegisterScreen:
        self.password_input.set_value(password)
        return self

    @allure.step("Type confirm password")
    def type_confirm_password(self, confirm_password: str) -> RegisterScreen:
        self.confirm_password_input.set_value(confirm_password)
        return self

    @allure.step("Submit register form")
    def submit(self) -> HomeScreen:
        self.submit_button.click()
        return HomeScreen()

    @allure.step("Submit register form expecting validation or API error")
    def submit_expecting_error(self) -> RegisterScreen:
        self.submit_button.click()
        self.error_message.should(be.visible)
        return self

    @allure.step("Verify error message: {message}")
    def should_have_error_message(self, message: str) -> RegisterScreen:
        self.error_message.should(have.text(message))
        return self
