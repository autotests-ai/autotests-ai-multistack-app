"""ConfigReader analog — java ConfigReaderTest (infra-backend). HTTP-only."""

from __future__ import annotations

import allure
import pytest

from config import (
    TestConfig,
    closed_config_reader,
    load_config,
    resolve_api_base_url,
    resolve_base_url,
)

pytestmark = [pytest.mark.infra, pytest.mark.infra_backend]


def _blank(*, base_url: str = "http://localhost:3000", api_base_url: str = "http://api.example.com") -> TestConfig:
    return TestConfig(
        stand="ci",
        base_url=base_url,
        api_base_url=api_base_url,
        api_health_service="backend-java-spring",
    )


@allure.epic("Test infra")
@allure.feature("ConfigReader")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("ConfigReader")
class TestConfigReader:
    @allure.title("resolveBaseUrl adds trailing slash to HTTP baseUrl")
    def test_resolve_base_url_adds_trailing_slash(self):
        assert resolve_base_url(_blank(base_url="http://localhost:3000")) == "http://localhost:3000/"

    @allure.title("resolveBaseUrl keeps trailing slash on baseUrl")
    def test_resolve_base_url_keeps_trailing_slash(self):
        assert resolve_base_url(_blank(base_url="http://localhost:3000/")) == "http://localhost:3000/"

    @allure.title("resolveBaseUrl fails fast when baseUrl is empty")
    def test_resolve_base_url_fails_when_empty(self):
        with pytest.raises(ValueError, match="Set baseUrl"):
            resolve_base_url(_blank(base_url=""))

    @allure.title("resolveApiBaseUrl adds trailing slash to HTTP apiBaseUrl")
    def test_resolve_api_base_url_adds_trailing_slash(self):
        assert resolve_api_base_url(_blank(api_base_url="http://api.example.com")) == "http://api.example.com/"

    @allure.title("resolveApiBaseUrl fails fast when apiBaseUrl is empty")
    def test_resolve_api_base_url_fails_when_empty(self):
        with pytest.raises(ValueError, match="Set apiBaseUrl"):
            resolve_api_base_url(_blank(api_base_url=""))

    @allure.title("loaded baseUrl has no trailing slash (Owner file; Ui.open uses resolveBaseUrl)")
    def test_loaded_base_url_has_no_trailing_slash(self, monkeypatch):
        monkeypatch.setenv("STAND", "ci")
        monkeypatch.setenv("ENV", "ci")
        monkeypatch.delenv("BASE_URL", raising=False)
        monkeypatch.delenv("API_BASE_URL", raising=False)
        cfg = load_config()
        assert cfg.base_url == "http://localhost:9821"
        assert not cfg.base_url.endswith("/")

    @allure.title("resolveBaseUrl uses loaded config")
    def test_resolve_base_url_uses_loaded_config(self, monkeypatch):
        monkeypatch.setenv("STAND", "ci")
        monkeypatch.setenv("ENV", "ci")
        monkeypatch.delenv("BASE_URL", raising=False)
        monkeypatch.delenv("API_BASE_URL", raising=False)
        assert resolve_base_url(load_config()) == "http://localhost:9821/"

    @allure.title("resolveApiBaseUrl uses loaded config")
    def test_resolve_api_base_url_uses_loaded_config(self, monkeypatch):
        monkeypatch.setenv("STAND", "ci")
        monkeypatch.setenv("ENV", "ci")
        monkeypatch.delenv("BASE_URL", raising=False)
        monkeypatch.delenv("API_BASE_URL", raising=False)
        assert resolve_api_base_url(load_config()) == "http://localhost:8800/"

    @allure.title("private constructor keeps utility class closed")
    def test_private_constructor_keeps_utility_class_closed(self):
        assert closed_config_reader() is not None
