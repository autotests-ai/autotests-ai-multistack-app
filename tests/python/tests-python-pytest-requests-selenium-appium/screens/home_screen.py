from __future__ import annotations

import allure

from screens.base import BaseScreen, by_id

WELCOME_PANEL = by_id("welcome-panel")
WELCOME_MESSAGE = by_id("welcome-message")
LOGOUT_BUTTON = by_id("logout-button")
DELETE_ACCOUNT_BUTTON = by_id("delete-account-button")
DELETE_CONFIRM_BUTTON = by_id("delete-confirm-button")
DELETE_CANCEL_BUTTON = by_id("delete-cancel-button")


class HomeScreen(BaseScreen):
    @allure.step("Welcome message is {expected}")
    def should_have_welcome_message(self, expected: str) -> HomeScreen:
        self.visible(WELCOME_PANEL)
        self.should_have_text(WELCOME_MESSAGE, expected)
        return self

    @allure.step("Session panel offers logout and delete account")
    def should_show_session_actions(self) -> HomeScreen:
        self.visible(LOGOUT_BUTTON)
        self.visible(DELETE_ACCOUNT_BUTTON)
        return self

    @allure.step("Click logout")
    def click_logout_button(self):
        from screens.login_screen import LoginScreen

        self.click(LOGOUT_BUTTON)
        return LoginScreen(self.driver)

    @allure.step("Click delete account and confirm")
    def click_delete_account_and_confirm(self):
        from screens.login_screen import LoginScreen

        self.click(DELETE_ACCOUNT_BUTTON)
        self.click(DELETE_CONFIRM_BUTTON)
        return LoginScreen(self.driver)

    @allure.step("Click delete account and cancel")
    def click_delete_account_and_cancel(self) -> HomeScreen:
        self.click(DELETE_ACCOUNT_BUTTON)
        self.click(DELETE_CANCEL_BUTTON)
        return self
