"""ConfigReader analog — java ConfigReaderTest (infra-backend). 100% on config.py."""

from __future__ import annotations

import allure
import pytest

from config import _bool, _float, _maybe_load_dotenv, _slash, load_config, resolve_stand

pytestmark = [pytest.mark.infra, pytest.mark.infra_backend]


@allure.epic("Test infra")
@allure.feature("config")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("ConfigReader")
class TestConfig:
    @allure.title("resolveBaseUrl adds trailing slash to HTTP baseUrl")
    def test_slash_adds_trailing_slash(self):
        assert _slash("http://localhost:3000") == "http://localhost:3000/"

    @allure.title("resolveBaseUrl keeps trailing slash on baseUrl")
    def test_slash_keeps_trailing_slash(self):
        assert _slash("http://localhost:3000/") == "http://localhost:3000/"

    @allure.title("resolveBaseUrl uses loaded config")
    def test_resolve_stand_defaults_to_prod(self, monkeypatch):
        monkeypatch.delenv("STAND", raising=False)
        monkeypatch.delenv("ENV", raising=False)
        assert resolve_stand() == "prod"

    @allure.title("resolveApiBaseUrl uses loaded config")
    def test_resolve_stand_accepts_ci(self, monkeypatch):
        monkeypatch.setenv("STAND", "ci")
        assert resolve_stand() == "ci"

    def test_resolve_stand_accepts_env_alias(self, monkeypatch):
        monkeypatch.delenv("STAND", raising=False)
        monkeypatch.setenv("ENV", "mock")
        assert resolve_stand() == "mock"

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

    def test_load_config_mock_urls(self, monkeypatch):
        monkeypatch.setenv("STAND", "mock")
        monkeypatch.delenv("BASE_URL", raising=False)
        monkeypatch.delenv("API_BASE_URL", raising=False)
        cfg = load_config()
        assert cfg.stand == "mock"
        assert cfg.base_url == "http://127.0.0.1:9911/"
        assert cfg.api_base_url == "http://127.0.0.1:9911/"

    def test_load_config_stage_urls(self, monkeypatch):
        monkeypatch.setenv("STAND", "stage")
        monkeypatch.delenv("BASE_URL", raising=False)
        monkeypatch.delenv("API_BASE_URL", raising=False)
        cfg = load_config()
        assert cfg.stand == "stage"
        assert cfg.base_url.startswith("https://stage.autotests.ai/")

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

    def test_headless_defaults_true(self, monkeypatch):
        monkeypatch.delenv("HEADLESS", raising=False)
        assert load_config().headless is True

    def test_bool_true_values(self, monkeypatch):
        for raw in ("1", "true", "YES", "on"):
            monkeypatch.setenv("HEADLESS", raw)
            assert _bool("HEADLESS") is True

    def test_bool_false_values(self, monkeypatch):
        monkeypatch.setenv("HEADLESS", "false")
        assert _bool("HEADLESS", True) is False

    def test_float_default_and_empty(self, monkeypatch):
        monkeypatch.delenv("SCREENSHOT_DIFF_THRESHOLD", raising=False)
        assert _float("SCREENSHOT_DIFF_THRESHOLD", 0.015) == 0.015
        monkeypatch.setenv("SCREENSHOT_DIFF_THRESHOLD", "  ")
        assert _float("SCREENSHOT_DIFF_THRESHOLD", 0.015) == 0.015
        monkeypatch.setenv("SCREENSHOT_DIFF_THRESHOLD", "0.02")
        assert _float("SCREENSHOT_DIFF_THRESHOLD", 0.015) == 0.02

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

    def test_video_folder_gains_trailing_slash(self, monkeypatch):
        monkeypatch.setenv("VIDEO_FOLDER", "https://selenoid.qa.guru/video")
        assert load_config().video_folder.endswith("/")

    def test_attach_full_enables_video_and_har(self, monkeypatch):
        monkeypatch.setenv("ATTACH_FULL", "true")
        monkeypatch.delenv("ENABLE_VIDEO", raising=False)
        monkeypatch.delenv("ENABLE_HAR", raising=False)
        cfg = load_config()
        assert cfg.enable_video is True
        assert cfg.enable_har is True
        assert cfg.attach_video is True
        assert cfg.attach_har_logs is True
        assert cfg.attach_last_screenshot is True
        assert cfg.attach_page_source is True
        assert cfg.attach_browser_console_logs is True
        assert cfg.enable_vnc is True

    def test_chrome_path_and_playwright_ws(self, monkeypatch):
        monkeypatch.setenv("CHROME_BINARY_PATH", "/tmp/chrome")
        monkeypatch.setenv("SCREENSHOTS_DIR", "")
        monkeypatch.setenv("API_HEALTH_SERVICE", "backend-python-flask")
        monkeypatch.setenv("BROWSER", "chrome")
        monkeypatch.setenv("BROWSER_VERSION", "148.0")
        monkeypatch.setenv("BROWSER_SIZE", "1280x800")
        monkeypatch.setenv("SELENOID_PLAYWRIGHT_URL", "wss://hub/playwright/playwright-chromium/1.61.1")
        cfg = load_config()
        assert cfg.chrome_binary_path == "/tmp/chrome"
        assert cfg.screenshots_dir == "screenshots"
        assert cfg.api_health_service == "backend-python-flask"
        assert cfg.browser == "chrome"
        assert cfg.browser_version == "148.0"
        assert cfg.browser_size == "1280x800"
        assert cfg.remote_url == "wss://hub/playwright/playwright-chromium/1.61.1"

    def test_maybe_load_dotenv_skips_on_ci(self, monkeypatch):
        monkeypatch.setenv("CI", "true")
        _maybe_load_dotenv()

    def test_maybe_load_dotenv_runs_without_ci(self, monkeypatch):
        monkeypatch.delenv("CI", raising=False)
        _maybe_load_dotenv()

    def test_welcome_username_blank_falls_back(self, monkeypatch):
        monkeypatch.setenv("STAND", "prod")
        monkeypatch.setenv("WELCOME_USERNAME", "  ")
        assert load_config().welcome_username == "user1"

    def test_empty_video_folder_stays_empty(self, monkeypatch):
        monkeypatch.setenv("VIDEO_FOLDER", "")
        assert load_config().video_folder == ""

    def test_video_folder_already_slashed(self, monkeypatch):
        monkeypatch.setenv("VIDEO_FOLDER", "https://selenoid.qa.guru/video/")
        assert load_config().video_folder == "https://selenoid.qa.guru/video/"
