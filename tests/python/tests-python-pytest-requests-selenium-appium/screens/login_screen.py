from __future__ import annotations

import allure

from screens.base import BaseScreen, by_id

LOGIN_FORM = by_id("login-form")
LOGIN_INPUT = by_id("login-input")
PASSWORD_INPUT = by_id("password-input")
SUBMIT_BUTTON = by_id("submit-button")
ERROR_MESSAGE = by_id("error-message")
FORM_TITLE = by_id("login-form-title")
REGISTER_LINK = by_id("register-link")


class LoginScreen(BaseScreen):
    @allure.step("Login screen is open")
    def should_be_open(self) -> LoginScreen:
        for locator in (LOGIN_FORM, LOGIN_INPUT, PASSWORD_INPUT, SUBMIT_BUTTON):
            self.visible(locator)
        return self

    @allure.step("Fill and submit login form")
    def fill_and_submit_form(self, username: str, password: str):
        return self.type_username(username).type_password(password).submit()

    @allure.step("Type username: {username}")
    def type_username(self, username: str) -> LoginScreen:
        self.type(LOGIN_INPUT, username)
        return self

    @allure.step("Type password")
    def type_password(self, password: str) -> LoginScreen:
        self.type(PASSWORD_INPUT, password)
        return self

    @allure.step("Submit login form")
    def submit(self):
        from screens.home_screen import HomeScreen

        self.click(SUBMIT_BUTTON)
        return HomeScreen(self.driver)

    @allure.step("Submit login form expecting validation error")
    def submit_expecting_error(self) -> LoginScreen:
        self.click(SUBMIT_BUTTON)
        self.visible(ERROR_MESSAGE)
        return self

    @allure.step("Verify error message: {message}")
    def should_have_error_message(self, message: str) -> LoginScreen:
        self.should_have_text(ERROR_MESSAGE, message)
        return self

    @allure.step("Verify form title: {title}")
    def should_have_form_title(self, title: str) -> LoginScreen:
        self.should_have_text(FORM_TITLE, title)
        return self

    @allure.step("Open register from the login footer link")
    def click_register_link(self):
        from screens.register_screen import RegisterScreen

        self.click(REGISTER_LINK)
        return RegisterScreen(self.driver)
