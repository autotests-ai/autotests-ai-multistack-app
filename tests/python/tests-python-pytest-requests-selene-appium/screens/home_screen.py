from __future__ import annotations

import allure
from selene import be, browser, have

from screens import by_id


class HomeScreen:
    def __init__(self) -> None:
        self.welcome_panel = browser.element(by_id("welcome-panel"))
        self.welcome_message = browser.element(by_id("welcome-message"))
        self.logout_button = browser.element(by_id("logout-button"))
        self.delete_account_button = browser.element(by_id("delete-account-button"))
        self.delete_confirm_button = browser.element(by_id("delete-confirm-button"))
        self.delete_cancel_button = browser.element(by_id("delete-cancel-button"))

    @allure.step("Welcome message is {expected}")
    def should_have_welcome_message(self, expected: str) -> HomeScreen:
        self.welcome_panel.should(be.visible)
        self.welcome_message.should(have.text(expected))
        return self

    @allure.step("Session panel offers logout and delete account")
    def should_show_session_actions(self) -> HomeScreen:
        self.logout_button.should(be.visible)
        self.delete_account_button.should(be.visible)
        return self

    @allure.step("Click logout")
    def click_logout_button(self):
        from screens.login_screen import LoginScreen

        self.logout_button.click()
        return LoginScreen()

    @allure.step("Click delete account and confirm")
    def click_delete_account_and_confirm(self):
        from screens.login_screen import LoginScreen

        self.delete_account_button.click()
        self.delete_confirm_button.click()
        return LoginScreen()

    @allure.step("Click delete account and cancel")
    def click_delete_account_and_cancel(self) -> HomeScreen:
        self.delete_account_button.click()
        self.delete_cancel_button.click()
        return self
