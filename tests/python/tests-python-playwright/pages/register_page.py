from __future__ import annotations

import allure
from playwright.sync_api import Locator, Page


class RegisterPage:
    def __init__(self, page: Page) -> None:
        self.page = page
        self.register_form: Locator = page.get_by_test_id("register-form")
        self.login_input: Locator = page.get_by_test_id("register-login-input")
        self.password_input: Locator = page.get_by_test_id("register-password-input")
        self.confirm_password_input: Locator = page.get_by_test_id("confirm-password-input")
        self.submit_button: Locator = page.get_by_test_id("register-submit-button")
        self.form_title: Locator = page.get_by_test_id("register-form-title")
        self.error_message: Locator = page.get_by_test_id("register-error-message")
        self.login_link: Locator = page.get_by_test_id("login-link")

    @allure.step("Open register page")
    def open(self) -> RegisterPage:
        self.page.goto("register")
        return self.should_be_open()

    @allure.step("Verify register page is open")
    def should_be_open(self) -> RegisterPage:
        self.register_form.wait_for()
        return self

    @allure.step("Verify register form is mounted")
    def should_show_register_form(self) -> RegisterPage:
        self.form_title.wait_for()
        self.login_input.wait_for()
        self.password_input.wait_for()
        self.confirm_password_input.wait_for()
        self.submit_button.wait_for()
        return self

    @allure.step("Sign up as {username}")
    def signup(self, username: str, password: str, confirm_password: str | None = None) -> RegisterPage:
        confirm = password if confirm_password is None else confirm_password
        self.login_input.fill(username)
        self.password_input.fill(password)
        self.confirm_password_input.fill(confirm)
        self.submit_button.click()
        return self

    @allure.step("Type username: {username}")
    def type_username(self, username: str) -> RegisterPage:
        self.login_input.fill(username)
        return self

    @allure.step("Type password")
    def type_password(self, password: str) -> RegisterPage:
        self.password_input.fill(password)
        return self

    @allure.step("Type confirm password")
    def type_confirm_password(self, password: str) -> RegisterPage:
        self.confirm_password_input.fill(password)
        return self

    @allure.step("Submit register form expecting validation error")
    def submit_expecting_error(self) -> RegisterPage:
        self.submit_button.click()
        self.error_message.wait_for()
        return self

    @allure.step("Click Login link under the register form")
    def click_login_link(self) -> RegisterPage:
        self.login_link.click()
        return self
