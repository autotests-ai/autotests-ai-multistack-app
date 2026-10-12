"""Selenide-style base: shared Selene `browser` + header, like Java BasePage."""

from __future__ import annotations

from selene import browser
from selenium.webdriver.support.ui import WebDriverWait

from api_client import login as api_login
from config import TestConfig, load_config
from pages.header_component import HeaderComponent

AUTH_TOKEN_KEY_JS = (
    "var m=location.pathname.match(/\\/(backend-[^/]+)\\//);"
    "return m ? 'authToken:' + m[1] : 'authToken';"
)


class BasePage:
    def __init__(self, config: TestConfig | None = None) -> None:
        self.header = HeaderComponent()
        self.config = config or load_config()

    @property
    def driver(self):
        return browser.driver

    def open_path(self, path: str) -> None:
        suffix = path if path.startswith("/") else f"/{path}"
        browser.open(suffix)

    def _open_page_with_local_storage_authentication(
        self, path: str, username: str, password: str
    ) -> None:
        self._open_page_with_local_storage_token(path, api_login(self.config, username, password))

    def _open_page_with_local_storage_token(self, path: str, token: str) -> None:
        self.open_path("/icons/qa-guru-logo.svg")
        self.driver.execute_script(
            "localStorage.setItem(arguments[0], arguments[1]);", self._auth_token_key(), token
        )
        self.open_path(path)

    def _wait(self) -> WebDriverWait:
        return WebDriverWait(browser.driver, browser.config.timeout or 5.0)

    def _wait_for_auth_token_to_be_cleared(self) -> None:
        self._wait().until(lambda driver: self._auth_token() is None)

    def _wait_for_auth_token_to_be_present(self) -> None:
        self._wait().until(lambda driver: self._auth_token() is not None)

    def _auth_token_key(self) -> str:
        return self.driver.execute_script(AUTH_TOKEN_KEY_JS)

    def _auth_token(self) -> str | None:
        return self.driver.execute_script(
            "return localStorage.getItem(arguments[0]);", self._auth_token_key()
        )

    def reload_page(self):
        browser.driver.refresh()
        return self.should_be_open()

    def should_be_open(self):
        raise NotImplementedError
