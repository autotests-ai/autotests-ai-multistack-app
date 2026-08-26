from __future__ import annotations

from urllib.parse import urlparse

import allure
from selenium.webdriver.common.by import By

from api_client import login as api_login
from pages.base import BasePage

AUTH_TOKEN_KEY_JS = (
    "var m=location.pathname.match(/\\/(backend-[^/]+)\\//);"
    "return m ? 'authToken:' + m[1] : 'authToken';"
)
DELETE_ACCOUNT_CONFIRM = "Delete this account? This cannot be undone."


class HomePage(BasePage):
    LAYOUT = (By.CSS_SELECTOR, "[data-testid='multistack-layout']")
    HEADER = (By.CSS_SELECTOR, "[data-testid='header']")
    HEALTH = (By.CSS_SELECTOR, "[data-testid='health-status']")
    ITEMS = (By.CSS_SELECTOR, "[data-testid='items-list']")
    WELCOME = (By.CSS_SELECTOR, "[data-testid='welcome-message']")
    WELCOME_PANEL = (By.CSS_SELECTOR, "[data-testid='welcome-panel']")
    LOGOUT = (By.CSS_SELECTOR, "[data-testid='logout-button']")
    DELETE_ACCOUNT = (By.CSS_SELECTOR, "[data-testid='delete-account-button']")

    def _auth_token_key(self) -> str:
        return self.driver.execute_script(AUTH_TOKEN_KEY_JS)

    def _stub_confirm(self, accepted: bool) -> None:
        self.driver.execute_script(
            "window.__deleteConfirm = null;"
            "(function(accepted) {"
            "  window.confirm = function(msg) {"
            "    window.__deleteConfirm = msg;"
            "    return accepted;"
            "  };"
            "})(arguments[0]);",
            accepted,
        )

    def _should_have_confirm_message(self) -> None:
        self.wait().until(
            lambda driver: driver.execute_script("return window.__deleteConfirm;")
            == DELETE_ACCOUNT_CONFIRM
        )

    @allure.step("Open home page")
    def open_page(self) -> HomePage:
        self.open_path("/")
        return self

    @allure.step("Reload current page")
    def reload_page(self) -> HomePage:
        self.driver.refresh()
        return self

    @allure.step("Open home page with local storage authentication")
    def open_page_with_local_storage_authentication(
        self, username: str, password: str
    ) -> HomePage:
        token = api_login(self.config, username, password)
        self.open_path("/login")
        key = self._auth_token_key()
        self.driver.execute_script(
            "localStorage.setItem(arguments[0], arguments[1]);", key, token
        )
        self.open_path("/")
        return self

    @allure.step("Open home page with invalid local storage token")
    def open_page_with_invalid_token(self) -> HomePage:
        self.open_path("/login")
        key = self._auth_token_key()
        self.driver.execute_script(
            "localStorage.setItem(arguments[0], arguments[1]);", key, "invalid-token"
        )
        self.open_path("/")
        return self

    @allure.step("Verify home layout is mounted")
    def should_show_layout(self) -> HomePage:
        self.wait_visible(*self.LAYOUT)
        self.wait_visible(*self.ITEMS)
        return self

    @allure.step("Verify home layout and health are mounted")
    def should_show_layout_and_health(self) -> HomePage:
        self.wait_visible(*self.LAYOUT)
        self.wait_visible(*self.HEALTH)
        return self

    def layout_panel(self):
        return self.wait_visible(*self.LAYOUT)

    def welcome_panel_element(self):
        return self.wait_visible(*self.WELCOME_PANEL)

    @allure.step("Verify embedded header is mounted")
    def should_show_embedded_header(self) -> HomePage:
        self.wait_visible(*self.HEADER)
        return self

    @allure.step("Verify items panel shows a readable error: {text_fragment}")
    def should_show_items_error(self, text_fragment: str) -> HomePage:
        self.wait_text_contains(*self.ITEMS, text_fragment)
        return self

    @allure.step("Verify health panel shows a readable error: {text_fragment}")
    def should_show_health_error(self, text_fragment: str) -> HomePage:
        self.wait_text_contains(*self.HEALTH, text_fragment)
        return self

    @allure.step("Verify health status contains: {text_fragment}")
    def should_show_health_text(self, text_fragment: str) -> HomePage:
        self.wait_text_contains(*self.HEALTH, text_fragment)
        return self

    @allure.step("Verify items list contains: {text_fragment}")
    def should_show_item_text(self, text_fragment: str) -> HomePage:
        self.wait_text_contains(*self.ITEMS, text_fragment)
        return self

    @allure.step("Verify welcome message: {message}")
    def should_have_welcome_message(self, message: str) -> HomePage:
        self.wait_visible(*self.WELCOME_PANEL)
        self.wait_text_contains(*self.WELCOME, message)
        return self

    @allure.step("Verify welcome panel stays hidden")
    def should_hide_welcome_panel(self) -> HomePage:
        def _hidden(driver) -> bool:
            els = driver.find_elements(*self.WELCOME_PANEL)
            return bool(els) and els[0].get_attribute("hidden") is not None

        self.wait().until(_hidden)
        return self

    @allure.step("Verify auth token was cleared from localStorage")
    def should_clear_auth_token(self) -> HomePage:
        self.wait().until(
            lambda driver: driver.execute_script(
                "return localStorage.getItem(arguments[0]);", self._auth_token_key()
            )
            is None
        )
        return self

    @allure.step("Verify auth token remains in localStorage")
    def should_keep_auth_token(self) -> HomePage:
        self.wait().until(
            lambda driver: driver.execute_script(
                "return localStorage.getItem(arguments[0]);", self._auth_token_key()
            )
            is not None
        )
        return self

    @allure.step("Verify session panel offers logout and delete account")
    def should_show_session_actions(self) -> HomePage:
        logout = self.wait_visible(*self.LOGOUT)
        delete = self.wait_visible(*self.DELETE_ACCOUNT)
        assert "Logout" in (logout.text or "")
        assert "Delete account" in (delete.text or "")
        return self

    @allure.step("Click logout button")
    def click_logout_button(self):
        from pages.login_page import LoginPage

        self.js_click(*self.LOGOUT)

        def _on_login(driver):
            path = urlparse(driver.current_url).path
            return path.rstrip("/").endswith("login")

        self.wait().until(_on_login)
        return LoginPage(self.driver, self.config)

    @allure.step("Click delete account and confirm")
    def click_delete_account_and_confirm(self):
        from pages.login_page import LoginPage

        self._stub_confirm(True)
        self.js_click(*self.DELETE_ACCOUNT)
        self._should_have_confirm_message()

        def _on_login(driver):
            path = urlparse(driver.current_url).path
            return path.rstrip("/").endswith("login")

        self.wait().until(_on_login)
        return LoginPage(self.driver, self.config)

    @allure.step("Click delete account and cancel the confirm")
    def click_delete_account_and_cancel(self) -> HomePage:
        self._stub_confirm(False)
        self.js_click(*self.DELETE_ACCOUNT)
        self._should_have_confirm_message()
        return self
