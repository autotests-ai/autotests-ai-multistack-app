from __future__ import annotations

import allure
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from pages.base import BasePage
import viewport_helper


class HeaderComponent(BasePage):
    ROOT = (By.CSS_SELECTOR, "[data-testid='header']")
    BURGER = (By.CSS_SELECTOR, "[data-testid='header-burger']")
    MENU = (By.CSS_SELECTOR, "[data-testid='header-menu']")
    LANG_TOGGLE = (By.CSS_SELECTOR, "[data-testid='header-tools'] [data-testid='header-lang-toggle']")
    LANG_LABEL = (By.CSS_SELECTOR, "[data-testid='header-tools'] [data-testid='header-lang-label']")
    THEME_TOGGLE = (By.CSS_SELECTOR, "[data-testid='header-tools'] [data-testid='header-theme-toggle']")
    HTML = (By.CSS_SELECTOR, "html")

    @allure.step("Verify header is mounted")
    def should_be_mounted(self) -> HeaderComponent:
        self.wait_visible(*self.ROOT)
        return self

    @allure.step("Emulate mobile viewport (375x812)")
    def set_mobile_viewport(self) -> HeaderComponent:
        viewport_helper.set_viewport(self.driver, 375, 812)
        return self

    @allure.step("Reset viewport to default")
    def reset_viewport(self) -> HeaderComponent:
        viewport_helper.reset_viewport(self.driver)
        return self

    @allure.step("Verify header nav '{active_testid}' is the only active item")
    def should_have_active_nav(self, active_testid: str) -> HeaderComponent:
        self.should_be_mounted()
        active = self.wait().until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, f"[data-testid='{active_testid}']"))
        )

        def _is_active(_driver) -> bool:
            cls = active.get_attribute("class") or ""
            aria = active.get_attribute("aria-current")
            return "is-active" in cls.split() and aria == "page"

        self.wait().until(_is_active)
        current = self.driver.find_elements(
            By.CSS_SELECTOR, "[data-testid='header-nav'] a[aria-current='page']"
        )
        assert len(current) == 1
        return self

    @allure.step("Open the burger menu")
    def open_menu(self) -> HeaderComponent:
        self.wait_visible(*self.BURGER).click()
        self.wait_visible(*self.MENU)

        def _expanded(_driver) -> bool:
            return self.find(*self.BURGER).get_attribute("aria-expanded") == "true"

        self.wait().until(_expanded)
        return self

    @allure.step("Menu nav '{menu_nav_testid}' is the active item")
    def should_have_active_menu_nav(self, menu_nav_testid: str) -> HeaderComponent:
        item = self.wait_visible(By.CSS_SELECTOR, f"[data-testid='{menu_nav_testid}']")

        def _is_active(_driver) -> bool:
            cls = item.get_attribute("class") or ""
            aria = item.get_attribute("aria-current")
            return "is-active" in cls.split() and aria == "page"

        self.wait().until(_is_active)
        return self

    @allure.step("Click menu nav link '{menu_nav_testid}'")
    def click_menu_nav(self, menu_nav_testid: str) -> HeaderComponent:
        self.wait_visible(By.CSS_SELECTOR, f"[data-testid='{menu_nav_testid}']").click()
        return self

    @allure.step("Menu is closed")
    def should_have_closed_menu(self) -> HeaderComponent:
        self.wait_hidden(*self.MENU)

        def _collapsed(_driver) -> bool:
            return self.find(*self.BURGER).get_attribute("aria-expanded") == "false"

        self.wait().until(_collapsed)
        return self

    @allure.step("Burger menu panel is visible")
    def menu_panel(self):
        return self.wait_visible(*self.MENU)

    @allure.step("Header bar is visible")
    def header_panel(self):
        return self.wait_visible(*self.ROOT)

    @allure.step("Click language toggle")
    def click_lang_toggle(self) -> HeaderComponent:
        self.wait_visible(*self.LANG_TOGGLE).click()
        return self

    @allure.step("Click theme toggle")
    def click_theme_toggle(self) -> HeaderComponent:
        self.wait_visible(*self.THEME_TOGGLE).click()
        return self

    @allure.step("Verify language label: {label}")
    def should_have_lang_label(self, label: str) -> HeaderComponent:
        self.wait_text_contains(*self.LANG_LABEL, label)
        return self

    @allure.step("Verify html lang: {lang}")
    def should_have_html_lang(self, lang: str) -> HeaderComponent:
        def _ok(_driver) -> bool:
            return (self.find(*self.HTML).get_attribute("lang") or "") == lang

        self.wait().until(_ok)
        return self

    @allure.step("Verify theme: {theme}")
    def should_have_theme(self, theme: str) -> HeaderComponent:
        def _ok(_driver) -> bool:
            cls = (self.find(*self.HTML).get_attribute("class") or "").split()
            has_light = "theme-light" in cls
            return has_light if theme == "light" else not has_light

        self.wait().until(_ok)
        return self
