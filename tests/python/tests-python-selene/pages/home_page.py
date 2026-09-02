from __future__ import annotations

from urllib.parse import urlparse

import allure
from selene import be, browser, have
from selenium.webdriver.support.ui import WebDriverWait

from api_client import login as api_login
from pages.base import BasePage

AUTH_TOKEN_KEY_JS = (
    "var m=location.pathname.match(/\\/(backend-[^/]+)\\//);"
    "return m ? 'authToken:' + m[1] : 'authToken';"
)
DELETE_ACCOUNT_CONFIRM = "Delete this account? This cannot be undone."


class HomePage(BasePage):
    def _wait(self) -> WebDriverWait:
        return WebDriverWait(browser.driver, browser.config.timeout or 5.0)

    def _auth_token_key(self) -> str:
        return browser.driver.execute_script(AUTH_TOKEN_KEY_JS)

    def _stub_confirm(self, accepted: bool) -> None:
        browser.driver.execute_script(
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
        self._wait().until(
            lambda driver: driver.execute_script("return window.__deleteConfirm;")
            == DELETE_ACCOUNT_CONFIRM
        )

    @allure.step("Open home page")
    def open_page(self) -> HomePage:
        self.open_path("/")
        return self.should_be_open()

    @allure.step("Open home page with local storage authentication")
    def open_page_with_local_storage_authentication(
        self, username: str, password: str
    ) -> HomePage:
        token = api_login(self.config, username, password)
        self.open_path("/login")
        key = self._auth_token_key()
        browser.driver.execute_script(
            "localStorage.setItem(arguments[0], arguments[1]);", key, token
        )
        self.open_path("/")
        return self.should_be_open()

    @allure.step("Open home page with invalid local storage token")
    def open_page_with_invalid_token(self) -> HomePage:
        self.open_path("/login")
        key = self._auth_token_key()
        browser.driver.execute_script(
            "localStorage.setItem(arguments[0], arguments[1]);", key, "invalid-token"
        )
        self.open_path("/")
        return self.should_be_open()

    @allure.step("Verify home page is open")
    def should_be_open(self) -> HomePage:
        browser.element("[data-testid='multistack-layout']").should(be.visible)
        return self

    @allure.step("Verify home layout is mounted")
    def should_show_layout(self) -> HomePage:
        browser.element("[data-testid='multistack-layout']").should(be.visible)
        browser.element("[data-testid='items-list']").should(be.visible)
        return self

    @allure.step("Verify home layout and health are mounted")
    def should_show_layout_and_health(self) -> HomePage:
        browser.element("[data-testid='multistack-layout']").should(be.visible)
        browser.element("[data-testid='health-status']").should(be.visible)
        return self

    def layout_panel(self):
        el = browser.element("[data-testid='multistack-layout']")
        el.should(be.visible)
        return el.locate()

    def welcome_panel_element(self):
        el = browser.element("[data-testid='welcome-panel']")
        el.should(be.visible)
        return el.locate()

    @allure.step("Verify embedded header is mounted")
    def should_show_embedded_header(self) -> HomePage:
        self.header.should_show_embedded_header()
        return self

    @allure.step("Verify items panel shows a readable error: {text_fragment}")
    def should_show_items_error(self, text_fragment: str) -> HomePage:
        browser.element("[data-testid='items-list']").should(have.text(text_fragment))
        return self

    @allure.step("Verify health panel shows a readable error: {text_fragment}")
    def should_show_health_error(self, text_fragment: str) -> HomePage:
        browser.element("[data-testid='health-status']").should(have.text(text_fragment))
        return self

    @allure.step("Verify health status contains: {text_fragment}")
    def should_show_health_text(self, text_fragment: str) -> HomePage:
        browser.element("[data-testid='health-status']").should(have.text(text_fragment))
        return self

    @allure.step("Verify items list contains: {text_fragment}")
    def should_show_item_text(self, text_fragment: str) -> HomePage:
        browser.element("[data-testid='items-list']").should(have.text(text_fragment))
        return self

    @allure.step("Verify welcome message: {message}")
    def should_have_welcome_message(self, message: str) -> HomePage:
        browser.element("[data-testid='welcome-panel']").should(be.visible)
        browser.element("[data-testid='welcome-message']").should(have.text(message))
        return self

    @allure.step("Verify welcome panel stays hidden")
    def should_hide_welcome_panel(self) -> HomePage:
        browser.element("[data-testid='welcome-panel']").should(have.attribute("hidden"))
        return self

    @allure.step("Verify auth token was cleared from localStorage")
    def should_clear_auth_token(self) -> HomePage:
        key = self._auth_token_key()
        self._wait().until(
            lambda driver: driver.execute_script("return localStorage.getItem(arguments[0]);", key)
            is None
        )
        return self

    @allure.step("Verify auth token remains in localStorage")
    def should_keep_auth_token(self) -> HomePage:
        key = self._auth_token_key()
        self._wait().until(
            lambda driver: driver.execute_script("return localStorage.getItem(arguments[0]);", key)
            is not None
        )
        return self

    @allure.step("Verify session panel offers logout and delete account")
    def should_show_session_actions(self) -> HomePage:
        browser.element("[data-testid='logout-button']").should(be.visible).should(have.text("Logout"))
        browser.element("[data-testid='delete-account-button']").should(be.visible).should(
            have.text("Delete account")
        )
        return self

    @allure.step("Click logout button")
    def click_logout_button(self):
        from pages.login_page import LoginPage

        browser.element("[data-testid='logout-button']").should(be.visible).click()
        self._wait().until(
            lambda driver: urlparse(driver.current_url).path.rstrip("/").endswith("login")
        )
        return LoginPage(self.config)

    @allure.step("Click delete account and confirm")
    def click_delete_account_and_confirm(self):
        from pages.login_page import LoginPage

        self._stub_confirm(True)
        browser.element("[data-testid='delete-account-button']").should(be.visible).click()
        self._should_have_confirm_message()
        self._wait().until(
            lambda driver: urlparse(driver.current_url).path.rstrip("/").endswith("login")
        )
        return LoginPage(self.config)

    @allure.step("Click delete account and cancel the confirm")
    def click_delete_account_and_cancel(self) -> HomePage:
        self._stub_confirm(False)
        browser.element("[data-testid='delete-account-button']").should(be.visible).click()
        self._should_have_confirm_message()
        return self
