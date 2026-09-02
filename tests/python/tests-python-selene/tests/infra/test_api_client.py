"""api_client helpers — infra-backend (no live stand)."""

from __future__ import annotations

import allure
import httpx
import pytest

from api_client import api_root, new_client, username

pytestmark = [pytest.mark.infra, pytest.mark.infra_backend]


@allure.epic("Test infra")
@allure.feature("api_client")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("api_client")
class TestApiClient:
    def test_api_root_strips_frontend_segment(self):
        assert (
            api_root("https://autotests.ai/stack/backend-java-spring/frontend-typescript-react/")
            == "https://autotests.ai/stack/backend-java-spring"
        )

    def test_api_root_keeps_backend_origin(self):
        assert (
            api_root("https://autotests.ai/stack/backend-java-spring/")
            == "https://autotests.ai/stack/backend-java-spring"
        )

    def test_username_fits_backend_size(self):
        name = username()
        assert 3 <= len(name) <= 64
        assert name.startswith("user_")

    def test_new_client_is_httpx(self, config):
        with new_client(config) as client:
            assert isinstance(client, httpx.Client)
