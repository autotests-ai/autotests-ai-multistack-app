"""ScreenshotHelper analog — java ScreenshotHelperTest (harness-backend)."""

from __future__ import annotations

import allure
import pytest

from screenshot_helper import screenshot_mode, screenshot_os

pytestmark = [pytest.mark.harness, pytest.mark.harness_backend]


@allure.epic("Test harness")
@allure.feature("ScreenshotHelper")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("ScreenshotHelper")
class TestScreenshotHelper:
    @pytest.mark.parametrize(
        "env,folder",
        [
            ("mock", "mock"),
            ("stage", "stage"),
            ("prod", "prod"),
            ("ci", "prod"),
            ("", "prod"),
        ],
    )
    def test_screenshot_mode_maps_env_to_stand_folder(self, env: str, folder: str):
        assert screenshot_mode(env) == folder

    @pytest.mark.parametrize("env", ["dev", "local", "multistack_ci"])
    def test_screenshot_mode_rejects_unknown_env(self, env: str):
        with pytest.raises(ValueError, match="unknown env"):
            screenshot_mode(env)

    @pytest.mark.parametrize(
        "raw,folder",
        [
            ("darwin", "macos"),
            ("macos", "macos"),
            ("linux", "linux"),
            ("win32", "windows"),
            ("windows", "windows"),
        ],
    )
    def test_screenshot_os_maps_override(self, monkeypatch, raw: str, folder: str):
        monkeypatch.setenv("SCREENSHOT_OS", raw)
        assert screenshot_os() == folder
