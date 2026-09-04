"""Deployed-stand facts — same questions as java BackendWiringApiTests."""

from __future__ import annotations

import allure
import pytest

from api_client import request

pytestmark = pytest.mark.api


@allure.epic("Wired backend")
@allure.feature("Health and data source")
@allure.severity(allure.severity_level.BLOCKER)
@allure.title("Backend wiring on deployed stand")
class TestBackendWiringApi:
    @allure.title("GET /api/health — deployed service is the active backend module, not a neighbour")
    @pytest.mark.smoke
    def test_health_reports_active_backend_service(self, api, config):
        response = request(api, "GET", "/api/health")
        assert response.status_code == 200
        assert response.json()["service"] == config.api_health_service

    @allure.title("GET /api/items — catalogue is served from PostgreSQL, not a stub or fallback")
    def test_items_are_wired_to_postgresql(self, api):
        response = request(api, "GET", "/api/items")
        assert response.status_code == 200
        assert response.json()["source"] == "postgresql"
