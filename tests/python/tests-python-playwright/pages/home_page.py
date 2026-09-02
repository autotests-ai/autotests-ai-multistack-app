from __future__ import annotations

import allure
from playwright.sync_api import Locator, Page, expect

from api_client import login

DELETE_ACCOUNT_CONFIRM = "Delete this account? This cannot be undone."


class HomePage:
    def __init__(self, page: Page, api) -> None:
        self.page = page
        self.api = api
        self.layout: Locator = page.get_by_test_id("multistack-layout")
        self.health_status: Locator = page.get_by_test_id("health-status")
        self.items_list: Locator = page.get_by_test_id("items-list")
        self.welcome_message: Locator = page.get_by_test_id("welcome-message")
        self.welcome_panel: Locator = page.get_by_test_id("welcome-panel")
        self.logout_button: Locator = page.get_by_test_id("logout-button")
        self.delete_account_button: Locator = page.get_by_test_id("delete-account-button")
        self.header: Locator = page.get_by_test_id("header")

    @allure.step("Open home page")
    def open(self) -> HomePage:
        self.page.goto("./")
        return self.should_be_open()

    @allure.step("Verify home layout is open")
    def should_be_open(self) -> HomePage:
        self.layout.wait_for()
        return self

    @allure.step("Verify reference layout is mounted")
    def should_show_layout(self) -> HomePage:
        self.layout.wait_for()
        self.items_list.wait_for()
        return self

    @allure.step("Verify home layout and health are mounted")
    def should_show_layout_and_health(self) -> HomePage:
        self.layout.wait_for()
        self.health_status.wait_for()
        return self

    @allure.step("Verify health and items finished loading")
    def should_show_settled_health_and_items(self) -> HomePage:
        self.should_show_layout_and_health()
        self.items_list.wait_for()
        expect(self.health_status).not_to_contain_text("Checking health")
        expect(self.items_list).not_to_contain_text("Loading items")
        return self

    @allure.step("Logout")
    def logout(self) -> HomePage:
        self.logout_button.click()
        return self

    @allure.step("Reload home")
    def reload(self) -> HomePage:
        self.page.reload()
        return self.should_be_open()

    @allure.step("Accept delete-account confirm")
    def click_delete_account_and_confirm(self) -> HomePage:
        self.page.once("dialog", lambda dialog: _accept_confirm(dialog))
        self.delete_account_button.click()
        return self

    @allure.step("Cancel delete-account confirm")
    def click_delete_account_and_cancel(self) -> HomePage:
        self.page.once("dialog", lambda dialog: _dismiss_confirm(dialog))
        self.delete_account_button.click()
        return self

    @allure.step("Open home page with local storage authentication")
    def open_with_local_storage_authentication(self, username: str, password: str) -> HomePage:
        return self.open_with_local_storage_auth(login(self.api, username, password))

    @allure.step("Seed localStorage auth token")
    def open_with_local_storage_auth(self, token: str) -> HomePage:
        self.page.goto("login")
        self.page.get_by_test_id("login-form").wait_for()
        key = self.auth_token_key()
        self.page.evaluate(
            "([k, t]) => localStorage.setItem(k, t)",
            [key, token],
        )
        return self.open()

    @allure.step("Verify welcome panel stays hidden")
    def should_hide_welcome_panel(self) -> HomePage:
        expect(self.welcome_panel).to_have_attribute("hidden", "")
        return self

    @allure.step("Verify auth token was cleared from localStorage")
    def should_clear_auth_token(self) -> HomePage:
        self.page.wait_for_function(
            """() => {
              const m = location.pathname.match(/\\/(backend-[^/]+)\\//);
              const key = m ? `authToken:${m[1]}` : 'authToken';
              return localStorage.getItem(key) === null;
            }"""
        )
        return self

    @allure.step("Verify session panel offers logout and delete account")
    def should_show_session_actions(self) -> HomePage:
        expect(self.logout_button).to_be_visible()
        expect(self.logout_button).to_contain_text("Logout")
        expect(self.delete_account_button).to_be_visible()
        expect(self.delete_account_button).to_contain_text("Delete account")
        return self

    @allure.step("Open home with a garbage auth token")
    def open_with_invalid_token(self) -> HomePage:
        return self.open_with_local_storage_auth("invalid-token")

    def auth_token_key(self) -> str:
        return self.page.evaluate(
            """() => {
              const m = location.pathname.match(/\\/(backend-[^/]+)\\//);
              return m ? `authToken:${m[1]}` : 'authToken';
            }"""
        )

    def auth_token(self) -> str | None:
        return self.page.evaluate("k => localStorage.getItem(k)", self.auth_token_key())


def _accept_confirm(dialog) -> None:
    _require_confirm_text(dialog.message)
    dialog.accept()


def _dismiss_confirm(dialog) -> None:
    _require_confirm_text(dialog.message)
    dialog.dismiss()


def _require_confirm_text(actual: str) -> None:
    if actual != DELETE_ACCOUNT_CONFIRM:
        raise AssertionError(
            f"Confirm text: expected <{DELETE_ACCOUNT_CONFIRM}> but was <{actual}>"
        )
