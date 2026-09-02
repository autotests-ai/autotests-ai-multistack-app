from __future__ import annotations

import allure
from selene import be, browser, have

import viewport_helper


class HeaderComponent:
    def _el(self, testid: str):
        return browser.element(f"[data-testid='{testid}']")

    @allure.step("Verify header is mounted")
    def should_be_mounted(self) -> HeaderComponent:
        self._el("header").should(be.visible)
        return self

    @allure.step("Emulate mobile viewport (375x812)")
    def set_mobile_viewport(self) -> HeaderComponent:
        viewport_helper.set_viewport(browser.driver, 375, 812)
        return self

    @allure.step("Reset viewport to default")
    def reset_viewport(self) -> HeaderComponent:
        viewport_helper.reset_viewport(browser.driver)
        return self

    @allure.step("Desktop nav '{active_testid}' is the active item")
    def should_have_active_nav(self, active_testid: str) -> HeaderComponent:
        self.should_be_mounted()
        self._el(active_testid).should(be.visible).should(have.css_class("is-active")).should(
            have.attribute("aria-current").value("page")
        )
        browser.all("[data-testid='header-nav'] a[aria-current='page']").should(have.size(1))
        return self

    @allure.step("Click header nav '{nav_testid}'")
    def click_nav(self, nav_testid: str) -> HeaderComponent:
        self._el(nav_testid).should(be.visible).click()
        return self

    @allure.step("Open the burger menu")
    def open_menu(self) -> HeaderComponent:
        self._el("header-burger").should(be.visible).click()
        self._el("header-menu").should(be.visible)
        self._el("header-burger").should(have.attribute("aria-expanded").value("true"))
        return self

    @allure.step("Menu nav '{menu_nav_testid}' is the active item")
    def should_have_active_menu_nav(self, menu_nav_testid: str) -> HeaderComponent:
        self._el(menu_nav_testid).should(be.visible).should(have.css_class("is-active")).should(
            have.attribute("aria-current").value("page")
        )
        return self

    @allure.step("Click menu nav link '{menu_nav_testid}'")
    def click_menu_nav(self, menu_nav_testid: str) -> HeaderComponent:
        self._el(menu_nav_testid).should(be.visible).click()
        return self

    @allure.step("Menu is closed")
    def should_have_closed_menu(self) -> HeaderComponent:
        self._el("header-menu").should(be.hidden)
        self._el("header-burger").should(have.attribute("aria-expanded").value("false"))
        return self

    @allure.step("Burger menu panel is visible")
    def menu_panel(self):
        el = self._el("header-menu")
        el.should(be.visible)
        return el.locate()

    @allure.step("Header bar is visible")
    def header_panel(self):
        el = self._el("header")
        el.should(be.visible)
        return el.locate()

    @allure.step("Verify embedded header is mounted")
    def should_show_embedded_header(self) -> HeaderComponent:
        return self.should_be_mounted()

    @allure.step("Click language toggle")
    def click_lang_toggle(self) -> HeaderComponent:
        browser.element(
            "[data-testid='header-tools'] [data-testid='header-lang-toggle']"
        ).should(be.visible).click()
        return self

    @allure.step("Click theme toggle")
    def click_theme_toggle(self) -> HeaderComponent:
        browser.element(
            "[data-testid='header-tools'] [data-testid='header-theme-toggle']"
        ).should(be.visible).click()
        return self

    @allure.step("Verify language label: {label}")
    def should_have_lang_label(self, label: str) -> HeaderComponent:
        browser.element(
            "[data-testid='header-tools'] [data-testid='header-lang-label']"
        ).should(have.text(label))
        return self

    @allure.step("Verify html lang: {lang}")
    def should_have_html_lang(self, lang: str) -> HeaderComponent:
        browser.element("html").should(have.attribute("lang").value(lang))
        return self

    @allure.step("Verify theme: {theme}")
    def should_have_theme(self, theme: str) -> HeaderComponent:
        html = browser.element("html")
        if theme == "light":
            html.should(have.css_class("theme-light"))
        else:
            html.should(have.no.css_class("theme-light"))
        return self
