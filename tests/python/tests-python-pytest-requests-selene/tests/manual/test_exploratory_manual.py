"""Manual cases stored in code — java ExploratoryManualTests."""

from __future__ import annotations

import allure
import pytest

pytestmark = pytest.mark.manual


@allure.epic("Exploratory")
@allure.feature("Manual checklist")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Exploratory manual")
class TestExploratoryManual:
    @allure.title("Home residual: 390px viewport and offline error")
    def test_home_residual_charter(self):
        with allure.step("Open / and let health + items load"):
            pass
        with allure.step("Narrow the viewport to 390px — cards stack, nothing overflows"):
            pass
        with allure.step(
            "Kill the network (offline devtools) and reload — items panel shows a readable error, not a blank page"
        ):
            pass

    @allure.title("Security residual: XSS, second tab, JWT expiry")
    def test_security_residual_charter(self):
        with allure.step("Register with an XSS / HTML payload in the username — Welcome panel and header show escaped text, no alert"):
            pass
        with allure.step(
            "Sign in in a second tab, logout in the first — observe what the second tab shows on next action"
        ):
            pass
        with allure.step(
            "Wait for token expiry (or shrink JWT_EXPIRATION_MS on a local stand) — expired session degrades to logged-out, not an error page"
        ):
            pass
