"""ConfigReader analog — java ConfigReaderTest (infra-backend). HTTP-only."""

from __future__ import annotations

import allure
import pytest

from config import _slash, load_config, resolve_stand

pytestmark = [pytest.mark.infra, pytest.mark.infra_backend]


@allure.epic("Test infra")
@allure.feature("config")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("config")
class TestConfig:
    def test_slash_adds_trailing_slash(self):
        assert _slash("http://localhost:3000") == "http://localhost:3000/"

    def test_slash_keeps_trailing_slash(self):
        assert _slash("http://localhost:3000/") == "http://localhost:3000/"

    def test_resolve_stand_defaults_to_prod(self, monkeypatch):
        monkeypatch.delenv("STAND", raising=False)
        monkeypatch.delenv("ENV", raising=False)
        assert resolve_stand() == "prod"

    def test_resolve_stand_accepts_ci(self, monkeypatch):
        monkeypatch.setenv("STAND", "ci")
        assert resolve_stand() == "ci"

    def test_resolve_stand_unknown_falls_back_to_prod(self, monkeypatch):
        monkeypatch.setenv("STAND", "lab")
        assert resolve_stand() == "prod"

    def test_load_config_ci_api_is_8800(self, monkeypatch):
        monkeypatch.setenv("STAND", "ci")
        monkeypatch.delenv("BASE_URL", raising=False)
        monkeypatch.delenv("API_BASE_URL", raising=False)
        cfg = load_config()
        assert cfg.stand == "ci"
        assert cfg.base_url == "http://127.0.0.1:9821/"
        assert cfg.api_base_url == "http://127.0.0.1:8800/"

    def test_load_config_prod_urls(self, monkeypatch):
        monkeypatch.setenv("STAND", "prod")
        monkeypatch.delenv("BASE_URL", raising=False)
        monkeypatch.delenv("API_BASE_URL", raising=False)
        cfg = load_config()
        assert cfg.stand == "prod"
        assert cfg.api_base_url == "https://autotests.ai/stack/backend-java-spring/"

    def test_load_config_explicit_base_url_wins(self, monkeypatch):
        monkeypatch.setenv("STAND", "prod")
        monkeypatch.setenv("BASE_URL", "http://127.0.0.1:9999")
        monkeypatch.setenv("API_BASE_URL", "http://127.0.0.1:8888")
        cfg = load_config()
        assert cfg.base_url == "http://127.0.0.1:9999/"
        assert cfg.api_base_url == "http://127.0.0.1:8888/"
