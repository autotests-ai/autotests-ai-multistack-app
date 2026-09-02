from __future__ import annotations

import allure
from playwright.sync_api import Locator, Page


class LoginPage:
    def __init__(self, page: Page) -> None:
        self.page = page
        self.login_form: Locator = page.get_by_test_id("login-form")
        self.login_input: Locator = page.get_by_test_id("login-input")
        self.password_input: Locator = page.get_by_test_id("password-input")
        self.submit_button: Locator = page.get_by_test_id("submit-button")
        self.form_title: Locator = page.get_by_test_id("login-form-title")
        self.error_message: Locator = page.get_by_test_id("error-message")
        self.register_link: Locator = page.get_by_test_id("register-link")

    @allure.step("Open login page")
    def open(self) -> LoginPage:
        self.page.goto("login")
        return self.should_be_open()

    @allure.step("Verify login page is open")
    def should_be_open(self) -> LoginPage:
        self.login_form.wait_for()
        return self

    @allure.step("Verify login form is mounted")
    def should_show_login_form(self) -> LoginPage:
        self.form_title.wait_for()
        self.login_input.wait_for()
        self.password_input.wait_for()
        self.submit_button.wait_for()
        return self

    @allure.step("Fill login form as {username}")
    def login(self, username: str, password: str) -> LoginPage:
        self.login_input.fill(username)
        self.password_input.fill(password)
        self.submit_button.click()
        return self

    @allure.step("Type username: {username}")
    def type_username(self, username: str) -> LoginPage:
        self.login_input.fill(username)
        return self

    @allure.step("Type password")
    def type_password(self, password: str) -> LoginPage:
        self.password_input.fill(password)
        return self

    @allure.step("Submit login form expecting validation error")
    def submit_expecting_error(self) -> LoginPage:
        self.submit_button.click()
        self.error_message.wait_for()
        return self

    @allure.step("Click Register link under the login form")
    def click_register_link(self) -> LoginPage:
        self.register_link.click()
        return self

    @allure.step("Reload current page")
    def reload(self) -> LoginPage:
        self.page.reload()
        return self.should_be_open()
