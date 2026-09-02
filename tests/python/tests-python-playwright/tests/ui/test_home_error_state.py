from __future__ import annotations

import allure
import pytest
from playwright.sync_api import expect

import mock_scenarios
from pages.app import App

pytestmark = [pytest.mark.ui, pytest.mark.mock, pytest.mark.negative]


@allure.epic("Home")
@allure.feature("Error states")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Home error states (mock)")
class TestHomeErrorState:
    @pytest.fixture(autouse=True)
    def require_mock_stand(self, api):
        available = mock_scenarios.available(api)
        if not available:
            pytest.skip(
                "WireMock admin API is not exposed on this stand — error injection needs the mock profile"
            )
        yield
        mock_scenarios.reset_all(api)

    @allure.title("Items API failure shows a readable error, not a blank page")
    def test_items_api_failure_shows_readable_error(self, api, app: App):
        mock_scenarios.set_state(api, "items", "error")
        app.home.open()
        expect(app.home.items_list).to_contain_text("✗ items: HTTP 500")

    @allure.title("Health API failure shows a readable error in the health panel")
    def test_health_api_failure_shows_readable_error(self, api, app: App):
        mock_scenarios.set_state(api, "health", "error")
        app.home.open()
        expect(app.home.health_status).to_contain_text("✗ health: HTTP 500")
