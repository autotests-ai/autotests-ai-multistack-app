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
    @allure.title("Auth happy path across login → home → logout")
    def test_auth_happy_path_checklist(self):
        with allure.step("Open /login and sign in as seeded user1 / password1"):
            pass
        with allure.step("Confirm welcome panel shows Welcome, user1!"):
            pass
        with allure.step("Logout and land on /login with empty session"):
            pass

    @allure.title("Items catalogue: content, order and resilience charter")
    def test_items_catalogue_charter(self):
        with allure.step("Open / and let health + items load"):
            pass
        with allure.step("Check items render Alpha, Beta, Gamma in stable id order with descriptions"):
            pass
        with allure.step("Narrow the viewport to 390px — cards stack, nothing overflows"):
            pass
        with allure.step(
            "Kill the network (offline devtools) and reload — items panel shows a readable error, not a blank page"
        ):
            pass

    @allure.title("Session and token edge cases charter")
    def test_session_token_charter(self):
        with allure.step("Sign in, reload — welcome survives (token in localStorage)"):
            pass
        with allure.step("Replace the stored token with garbage in devtools, reload — session is cleared, no crash"):
            pass
        with allure.step(
            "Sign in in a second tab, logout in the first — observe what the second tab shows on next action"
        ):
            pass
        with allure.step(
            "Wait for token expiry (or shrink JWT_EXPIRATION_MS on a local stand) — expired session degrades to logged-out, not an error page"
        ):
            pass
