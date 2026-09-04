"""APIRequest helpers — path/root/username without a live stand."""

from __future__ import annotations

import allure
import pytest

from api_client import api_base, api_root, username
from config import load_config

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

    def test_username_fits_backend_size(self):
        name = username()
        assert name.startswith("user_")
        assert 3 <= len(name) <= 64

    def test_api_base_strips_slash(self, monkeypatch):
        monkeypatch.setenv("STAND", "ci")
        monkeypatch.delenv("API_BASE_URL", raising=False)
        assert api_base(load_config()) == "http://127.0.0.1:8800"
