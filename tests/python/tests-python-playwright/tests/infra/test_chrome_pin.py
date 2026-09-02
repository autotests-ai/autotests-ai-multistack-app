"""Local Chrome pin — java LocalBrowserPinTest (infra-frontend)."""

from __future__ import annotations

import re
from pathlib import Path

import allure
import pytest

from config import load_config

pytestmark = [pytest.mark.infra, pytest.mark.infra_frontend]

_PIN = Path(__file__).resolve().parents[2] / "chrome-for-testing.properties"


def _pinned_version() -> str:
    for line in _PIN.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if stripped.startswith("version="):
            value = stripped.split("=", 1)[1].strip()
            if value:
                return value
    raise AssertionError(f"No version= entry in {_PIN}")


@allure.epic("Test infra")
@allure.feature("Local browser pin")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Local browser pin")
class TestLocalBrowserPin:
    @allure.title("pinnedVersion is a full Chrome for Testing build number")
    def test_pinned_version_is_full_chrome_for_testing_build_number(self):
        version = _pinned_version()
        assert re.fullmatch(r"\d+\.\d+\.\d+\.\d+", version), (
            "chrome-for-testing.properties must pin an exact build, got: " + version
        )

    @allure.title("configured browserVersion stays on the pinned major")
    def test_configured_browser_version_stays_on_the_pinned_major(self):
        pin_major = _pinned_version().split(".", 1)[0]
        cfg_major = load_config().browser_version.split(".", 1)[0]
        assert cfg_major == pin_major, "browserVersion and chrome-for-testing.properties drifted apart"
