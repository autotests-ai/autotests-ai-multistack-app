"""UI error states a live backend cannot produce — java HomeErrorStateTests."""

from __future__ import annotations

import allure
import pytest

import mock_scenarios
from pages.home_page import HomePage

pytestmark = [pytest.mark.mock, pytest.mark.negative]


@pytest.fixture
def mock_admin(config):
    if not mock_scenarios.available(config):
        pytest.skip("WireMock admin API is not exposed on this stand — error injection needs the mock profile")
    yield
    mock_scenarios.reset_all(config)


@allure.epic("Home")
@allure.feature("Error states")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Home error states (mock)")
class TestHomeErrorState:
    @allure.title("Items API failure shows a readable error, not a blank page")
    def test_items_api_failure_shows_readable_error(self, mock_admin, home_page: HomePage, config):
        mock_scenarios.set_state(config, "items", "error")
        home_page.open_page().should_show_layout().should_show_items_error("✗ items: HTTP 500")

    @allure.title("Health API failure shows a readable error in the health panel")
    def test_health_api_failure_shows_readable_error(self, mock_admin, home_page: HomePage, config):
        mock_scenarios.set_state(config, "health", "error")
        home_page.open_page().should_show_layout().should_show_health_error("✗ health: HTTP 500")
