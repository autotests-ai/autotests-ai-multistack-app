from __future__ import annotations

import re

import allure
from playwright.sync_api import Locator, Page, expect

_IS_ACTIVE = re.compile("is-active")


class HeaderPage:
    def __init__(self, page: Page) -> None:
        self.page = page
        self.root: Locator = page.get_by_test_id("header")
        self.burger: Locator = page.get_by_test_id("header-burger")
        self.menu: Locator = page.get_by_test_id("header-menu")
        tools = page.get_by_test_id("header-tools")
        self.lang_toggle: Locator = tools.get_by_test_id("header-lang-toggle")
        self.lang_label: Locator = tools.get_by_test_id("header-lang-label")
        self.theme_toggle: Locator = tools.get_by_test_id("header-theme-toggle")
        self.html: Locator = page.locator("html")

    def active_nav(self, testid: str) -> Locator:
        return self.page.get_by_test_id(testid)

    def current_page_links(self) -> Locator:
        return self.page.locator("[data-testid='header-nav'] a[aria-current='page']")

    def menu_nav(self, testid: str) -> Locator:
        return self.page.get_by_test_id(testid)

    @allure.step("Desktop nav '{nav_testid}' is the active item")
    def should_have_active_nav(self, nav_testid: str) -> HeaderPage:
        item = self.active_nav(nav_testid)
        expect(item).to_be_visible()
        expect(item).to_have_class(_IS_ACTIVE)
        expect(item).to_have_attribute("aria-current", "page")
        expect(self.current_page_links()).to_have_count(1)
        return self

    @allure.step("Menu nav '{menu_nav_testid}' is the active item")
    def should_have_active_menu_nav(self, menu_nav_testid: str) -> HeaderPage:
        item = self.menu_nav(menu_nav_testid)
        expect(item).to_be_visible()
        expect(item).to_have_class(_IS_ACTIVE)
        expect(item).to_have_attribute("aria-current", "page")
        return self

    @allure.step("Click header nav {testid}")
    def click_nav(self, testid: str) -> HeaderPage:
        self.active_nav(testid).click()
        return self

    @allure.step("Emulate mobile viewport (375x812)")
    def set_mobile_viewport(self) -> HeaderPage:
        self.page.set_viewport_size({"width": 375, "height": 812})
        return self

    @allure.step("Reset viewport to default")
    def reset_viewport(self) -> HeaderPage:
        self.page.set_viewport_size({"width": 1280, "height": 720})
        return self

    def set_viewport(self, width: int, height: int) -> HeaderPage:
        self.page.set_viewport_size({"width": width, "height": height})
        return self

    @allure.step("Open the burger menu")
    def open_menu(self) -> HeaderPage:
        self.burger.click()
        self.menu.wait_for()
        return self

    @allure.step("Click menu nav link {testid}")
    def click_menu_nav(self, testid: str) -> HeaderPage:
        self.menu_nav(testid).click()
        return self

    @allure.step("Wait until the burger menu is closed")
    def should_have_closed_menu(self) -> HeaderPage:
        self.menu.wait_for(state="hidden")
        return self

    @allure.step("Click language toggle")
    def click_lang_toggle(self) -> HeaderPage:
        self.lang_toggle.click()
        return self

    @allure.step("Click theme toggle")
    def click_theme_toggle(self) -> HeaderPage:
        self.theme_toggle.click()
        return self
