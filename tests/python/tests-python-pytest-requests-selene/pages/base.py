"""Selenide-style base: shared Selene `browser` + header, like Java BasePage."""

from __future__ import annotations

from selene import browser

from config import TestConfig, load_config
from pages.header_component import HeaderComponent


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

    def reload_page(self):
        browser.driver.refresh()
        return self.should_be_open()

    def should_be_open(self):
        raise NotImplementedError
