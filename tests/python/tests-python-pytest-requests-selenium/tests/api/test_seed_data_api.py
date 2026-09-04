"""Seed catalogue on the deployed stand — same question as java SeedDataApiTests."""

from __future__ import annotations

import allure
import pytest

from api_client import request

pytestmark = pytest.mark.api


@allure.epic("Deploy readiness")
@allure.feature("Seed data")
@allure.severity(allure.severity_level.CRITICAL)
@allure.title("Seed data on deployed stand")
class TestSeedDataApi:
    @allure.title("Flyway seed items Alpha, Beta, Gamma are present in PostgreSQL")
    @pytest.mark.smoke
    def test_seeded_items_are_ready_after_deploy(self, config):
        response = request(config, "GET", "/api/items")
        assert response.status_code == 200
        body = response.json()
        assert body["source"] == "postgresql"
        names = [item["name"] for item in body["items"]]
        assert {"Alpha", "Beta", "Gamma"} <= set(names)
