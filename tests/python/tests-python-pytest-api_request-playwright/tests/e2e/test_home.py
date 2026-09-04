from __future__ import annotations

import allure
import pytest
from playwright.sync_api import expect

from pages.app import App

pytestmark = pytest.mark.e2e


@allure.epic("Home")
@allure.feature("Health and items")
@allure.severity(allure.severity_level.CRITICAL)
@allure.title("Home")
class TestHome:
    @allure.title("Home loads health and seed items")
    @pytest.mark.smoke
    def test_home_loads_health_and_items(self, app: App, config):
        app.home.open()
        expect(app.home.health_status).to_contain_text("service: " + config.api_health_service)
        expect(app.home.items_list).to_contain_text("Alpha")
