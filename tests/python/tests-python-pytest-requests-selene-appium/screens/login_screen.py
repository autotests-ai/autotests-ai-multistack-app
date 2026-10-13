from __future__ import annotations

import allure
from selene import be, browser, have

from screens import by_id


class LoginScreen:
    def __init__(self) -> None:
        self.form = browser.element(by_id("login-form"))
        self.login_input = browser.element(by_id("login-input"))
        self.password_input = browser.element(by_id("password-input"))
        self.submit_button = browser.element(by_id("submit-button"))
        self.error_message = browser.element(by_id("error-message"))
        self.form_title = browser.element(by_id("login-form-title"))
        self.register_link = browser.element(by_id("register-link"))

    @allure.step("Login screen is open")
    def should_be_open(self) -> LoginScreen:
        for element in (self.form, self.login_input, self.password_input, self.submit_button):
            element.should(be.visible)
        return self

    @allure.step("Fill and submit login form")
    def fill_and_submit_form(self, username: str, password: str):
        return self.type_username(username).type_password(password).submit()

    @allure.step("Type username: {username}")
    def type_username(self, username: str) -> LoginScreen:
        self.login_input.set_value(username)
        return self

    @allure.step("Type password")
    def type_password(self, password: str) -> LoginScreen:
        self.password_input.set_value(password)
        return self

    @allure.step("Submit login form")
    def submit(self):
        from screens.home_screen import HomeScreen

        self.submit_button.click()
        return HomeScreen()

    @allure.step("Submit login form expecting validation error")
    def submit_expecting_error(self) -> LoginScreen:
        self.submit_button.click()
        self.error_message.should(be.visible)
        return self

    @allure.step("Verify error message: {message}")
    def should_have_error_message(self, message: str) -> LoginScreen:
        self.error_message.should(have.text(message))
        return self

    @allure.step("Verify form title: {title}")
    def should_have_form_title(self, title: str) -> LoginScreen:
        self.form_title.should(have.text(title))
        return self

    @allure.step("Open register from the login footer link")
    def click_register_link(self):
        from screens.register_screen import RegisterScreen

        self.register_link.click()
        return RegisterScreen()
