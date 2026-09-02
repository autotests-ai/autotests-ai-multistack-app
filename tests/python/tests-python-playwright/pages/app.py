"""Facade — one entry for all page objects (Java/TS Playwright teaching style)."""

from __future__ import annotations

from playwright.sync_api import Page

from pages.header_page import HeaderPage
from pages.home_page import HomePage
from pages.login_page import LoginPage
from pages.register_page import RegisterPage


class App:
    def __init__(self, page: Page, api) -> None:
        self.page = page
        self.api = api
        self.login = LoginPage(page)
        self.register = RegisterPage(page)
        self.home = HomePage(page, api)
        self.header = HeaderPage(page)
