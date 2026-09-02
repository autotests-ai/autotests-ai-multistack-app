"""Selenoid Playwright endpoint — java SelenoidPlaywrightEndpointTest."""

from __future__ import annotations

import allure
import pytest

import selenoid_playwright_endpoint as endpoint

pytestmark = [pytest.mark.infra, pytest.mark.infra_frontend]


@allure.epic("Test infra")
@allure.feature("Selenoid Playwright endpoint")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Selenoid Playwright endpoint")
class TestSelenoidPlaywrightEndpoint:
    @allure.title("wss is a Playwright hub, https /wd/hub is not")
    def test_classifies_schemes(self):
        assert endpoint.is_web_socket(
            "wss://selenoid.example/playwright/playwright-chromium/1.61.1"
        )
        assert endpoint.is_http_url("https://selenoid.example/wd/hub")
        assert not endpoint.is_web_socket("")
        assert not endpoint.is_http_url("")

    @allure.title("describe strips query so accessKey never appears in logs")
    def test_describe_drops_query(self):
        raw = "wss://selenoid.example/playwright/playwright-chromium/1.61.1?accessKey=secret"
        assert (
            endpoint.describe(raw)
            == "wss://selenoid.example/playwright/playwright-chromium/1.61.1"
        )
        assert "secret" not in endpoint.describe(raw)

    @allure.title("env WebSocket wins over truncated -DremoteUrl")
    def test_env_web_socket_wins_over_config(self):
        env = "wss://selenoid.example/playwright/playwright-chromium/1.61.1?accessKey=x"
        truncated = "wss://selenoid.example/playwright/playwright-chromium/1.61.1"
        assert endpoint.prefer_web_socket(env, truncated) == env
        assert endpoint.prefer_web_socket("", truncated) == truncated
        assert endpoint.prefer_web_socket("", "") == ""

    @allure.title("session query is appended without dropping existing params")
    def test_appends_session_query(self):
        ws = "wss://selenoid.example/playwright/playwright-chromium/1.61.1?accessKey=x"
        out = endpoint.with_session_query(ws, False, False)
        assert out.startswith(ws + "&")
        assert "name=autotests-ai-multistack-python-pw" in out
        assert "sessionTimeout=5m" in out
        assert "enableVNC=false" in out
        assert "enableVideo=false" in out

    @allure.title("videoName and screenResolution go on the WS query when hub records")
    def test_records_video_name_on_connect(self):
        ws = "wss://selenoid.example/playwright/playwright-chromium/1.61.1?accessKey=x"
        out = endpoint.with_session_query(ws, True, True, "python-pw-clip.mp4", "1920x1280x24")
        assert out.startswith(ws + "&")
        assert "enableVideo=true" in out
        assert "enableVNC=true" in out
        assert "videoName=python-pw-clip.mp4" in out
        assert "screenResolution=1920x1280x24" in out
        assert "accessKey=x" in out

    @allure.title("hub video URL is videoFolder + videoName")
    def test_video_url_joins_folder_and_name(self):
        assert (
            endpoint.video_url("https://selenoid.qa.guru/video/", "python-pw-clip.mp4")
            == "https://selenoid.qa.guru/video/python-pw-clip.mp4"
        )
        assert (
            endpoint.video_url("https://selenoid.qa.guru/video", "python-pw-clip.mp4")
            == "https://selenoid.qa.guru/video/python-pw-clip.mp4"
        )
        assert endpoint.video_url("", "clip.mp4") == ""
        assert endpoint.video_url("https://selenoid.qa.guru/video/", "") == ""

    def test_resolve_prefers_env(self, monkeypatch):
        monkeypatch.setenv(
            "SELENOID_PLAYWRIGHT_URL",
            "wss://hub/playwright/playwright-chromium/1.61.1?accessKey=x",
        )
        assert endpoint.resolve("wss://truncated").endswith("accessKey=x")

    def test_session_query_on_url_without_existing_params(self):
        ws = "wss://selenoid.example/playwright/playwright-chromium/1.61.1"
        out = endpoint.with_session_query(ws, False, True, "clip.mp4", "1920x1080x24")
        assert out.startswith(ws + "?")
        assert "videoName=clip.mp4" in out

    def test_describe_empty_and_none(self):
        assert endpoint.describe("") == ""
        assert endpoint.describe(None) == ""
        assert not endpoint.is_web_socket(None)
        assert not endpoint.is_http_url(None)
