"""HTTP contract of /api/health and /api/items — same questions as java HealthItemsApiTests."""

from __future__ import annotations

import allure
import pytest

from api_client import request
from schema_assert import assert_schema

pytestmark = pytest.mark.api


@allure.epic("Home")
@allure.feature("Health and items")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Health and items API")
class TestHealthItemsApi:
    @allure.title("GET /api/health matches the health contract and reports ok")
    def test_health_matches_contract(self, config):
        response = request(config, "GET", "/api/health")
        assert response.status_code == 200
        body = response.json()
        assert_schema(body, "health.json")
        assert body["status"] == "ok"

    @allure.title("GET /api/items matches the items contract (typed rows, named source)")
    def test_items_match_contract(self, config):
        response = request(config, "GET", "/api/items")
        assert response.status_code == 200
        assert_schema(response.json(), "items.json")
