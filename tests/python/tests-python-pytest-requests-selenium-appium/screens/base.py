"""Explicit waits over Compose testIds (accessibility ids) — no implicit waits, no sleeps."""

from __future__ import annotations

from appium.webdriver.common.appiumby import AppiumBy
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

TIMEOUT_S = 30


def by_id(test_id: str) -> tuple[str, str]:
    return AppiumBy.ACCESSIBILITY_ID, test_id


class BaseScreen:
    def __init__(self, driver) -> None:
        self.driver = driver

    def _wait(self) -> WebDriverWait:
        return WebDriverWait(self.driver, TIMEOUT_S)

    def visible(self, locator: tuple[str, str]):
        return self._wait().until(EC.visibility_of_element_located(locator), f"{locator} not visible")

    def click(self, locator: tuple[str, str]) -> None:
        self._wait().until(EC.element_to_be_clickable(locator), f"{locator} not clickable").click()

    def type(self, locator: tuple[str, str], value: str) -> None:
        field = self.visible(locator)
        field.clear()
        field.send_keys(value)

    def should_have_text(self, locator: tuple[str, str], expected: str) -> None:
        self._wait().until(
            EC.text_to_be_present_in_element(locator, expected),
            f"{locator} should contain text '{expected}'",
        )
