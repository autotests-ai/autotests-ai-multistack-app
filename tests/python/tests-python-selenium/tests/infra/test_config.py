"""ConfigReader analog — java ConfigReaderTest (infra-backend)."""

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

    def test_resolve_stand_accepts_mock(self, monkeypatch):
        monkeypatch.setenv("STAND", "mock")
        assert resolve_stand() == "mock"

    def test_resolve_stand_unknown_falls_back_to_prod(self, monkeypatch):
        monkeypatch.setenv("STAND", "lab")
        assert resolve_stand() == "prod"

    def test_load_config_mock_urls(self, monkeypatch):
        monkeypatch.setenv("STAND", "mock")
        monkeypatch.delenv("BASE_URL", raising=False)
        monkeypatch.delenv("API_BASE_URL", raising=False)
        cfg = load_config()
        assert cfg.stand == "mock"
        assert cfg.base_url == "http://127.0.0.1:9911/"
        assert cfg.api_base_url == "http://127.0.0.1:9911/"

    def test_load_config_explicit_base_url_wins(self, monkeypatch):
        monkeypatch.setenv("STAND", "prod")
        monkeypatch.setenv("BASE_URL", "http://127.0.0.1:9999")
        monkeypatch.setenv("API_BASE_URL", "http://127.0.0.1:8888")
        cfg = load_config()
        assert cfg.base_url == "http://127.0.0.1:9999/"
        assert cfg.api_base_url == "http://127.0.0.1:8888/"

    def test_headless_defaults_true(self, monkeypatch):
        monkeypatch.delenv("HEADLESS", raising=False)
        assert load_config().headless is True

    def test_welcome_username_mock_is_mock_user(self, monkeypatch):
        monkeypatch.setenv("STAND", "mock")
        monkeypatch.delenv("WELCOME_USERNAME", raising=False)
        assert load_config().welcome_username == "mock-user"

    def test_welcome_username_prod_is_user1(self, monkeypatch):
        monkeypatch.setenv("STAND", "prod")
        monkeypatch.delenv("WELCOME_USERNAME", raising=False)
        assert load_config().welcome_username == "user1"

    def test_welcome_username_env_wins(self, monkeypatch):
        monkeypatch.setenv("STAND", "mock")
        monkeypatch.setenv("WELCOME_USERNAME", "seed-user")
        assert load_config().welcome_username == "seed-user"

    def test_update_screenshots_defaults_false(self, monkeypatch):
        monkeypatch.delenv("UPDATE_SCREENSHOTS", raising=False)
        assert load_config().update_screenshots is False
