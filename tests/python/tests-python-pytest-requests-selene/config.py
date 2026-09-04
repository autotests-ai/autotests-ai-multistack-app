"""Config loader — mirrors Java ConfigReader / -Denv stands for the Python stack."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

_ROOT = Path(__file__).resolve().parent
if not os.environ.get("CI"):
    load_dotenv(_ROOT / ".env")

# Same stands as java `src/test/resources/config/{prod,stage,mock,ci}.properties`.
_STANDS: dict[str, dict[str, str]] = {
    "prod": {
        "base_url": "https://autotests.ai/stack/backend-java-spring/frontend-typescript-react/",
        "api_base_url": "https://autotests.ai/stack/backend-java-spring/",
    },
    "stage": {
        "base_url": "https://stage.autotests.ai/stack/backend-java-spring/frontend-typescript-react/",
        "api_base_url": "https://stage.autotests.ai/stack/backend-java-spring/",
    },
    "mock": {
        "base_url": "http://127.0.0.1:9911/",
        "api_base_url": "http://127.0.0.1:9911/",
    },
    "ci": {
        "base_url": "http://127.0.0.1:9821/",
        "api_base_url": "http://127.0.0.1:8800/",
    },
}


def _bool(name: str, default: bool = False) -> bool:
    raw = os.environ.get(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def _float(name: str, default: float) -> float:
    raw = os.environ.get(name)
    if raw is None or not raw.strip():
        return default
    return float(raw.strip())


def _welcome_username(stand: str) -> str:
    raw = os.environ.get("WELCOME_USERNAME")
    if raw is not None and raw.strip():
        return raw.strip()
    # WireMock /me stub (java mock.properties); login form still uses seed user1/password1.
    return "mock-user" if stand == "mock" else "user1"


def _attach_full() -> bool:
    return _bool("ATTACH_FULL")


def _slash(url: str) -> str:
    return url.rstrip("/") + "/"


def resolve_stand() -> str:
    raw = (os.environ.get("STAND") or os.environ.get("ENV") or "prod").strip().lower()
    return raw if raw in _STANDS else "prod"


@dataclass(frozen=True)
class TestConfig:
    stand: str
    base_url: str
    api_base_url: str
    api_health_service: str
    browser: str
    browser_version: str
    browser_size: str
    headless: bool
    remote_url: str
    chrome_binary_path: str
    chromedriver_path: str
    enable_vnc: bool
    enable_video: bool
    enable_har: bool
    video_folder: str
    attach_browser_console_logs: bool
    attach_har_logs: bool
    attach_last_screenshot: bool
    attach_page_source: bool
    attach_video: bool
    welcome_username: str
    update_screenshots: bool
    screenshots_dir: str
    screenshot_diff_threshold: float


def load_config() -> TestConfig:
    stand = resolve_stand()
    defaults = _STANDS[stand]
    base = _slash(os.environ.get("BASE_URL", defaults["base_url"]))
    api = _slash(os.environ.get("API_BASE_URL", defaults["api_base_url"]))
    full = _attach_full()
    enable_video = full or _bool("ENABLE_VIDEO")
    enable_har = full or _bool("ENABLE_HAR")
    video_folder = os.environ.get("VIDEO_FOLDER", "https://selenoid.qa.guru/video/")
    if video_folder and not video_folder.endswith("/"):
        video_folder += "/"
    return TestConfig(
        stand=stand,
        base_url=base,
        api_base_url=api,
        # "service" in GET /api/health — the backend module id behind BASE_URL.
        api_health_service=os.environ.get("API_HEALTH_SERVICE", "backend-java-spring"),
        browser=os.environ.get("BROWSER", "chrome"),
        browser_version=os.environ.get("BROWSER_VERSION", "148.0"),
        browser_size=os.environ.get("BROWSER_SIZE", "1740x1080"),
        headless=_bool("HEADLESS", True),
        remote_url=os.environ.get("SELENOID_WEBDRIVER_URL", "").strip(),
        chrome_binary_path=os.environ.get("CHROME_BINARY_PATH", "").strip(),
        chromedriver_path=os.environ.get("CHROMEDRIVER_PATH", "").strip(),
        enable_vnc=full or _bool("ENABLE_VNC"),
        enable_video=enable_video,
        enable_har=enable_har,
        video_folder=video_folder,
        attach_browser_console_logs=full or _bool("ATTACH_BROWSER_CONSOLE_LOGS"),
        attach_har_logs=full or _bool("ATTACH_HAR_LOGS") or enable_har,
        attach_last_screenshot=full or _bool("ATTACH_LAST_SCREENSHOT"),
        attach_page_source=full or _bool("ATTACH_PAGE_SOURCE"),
        attach_video=full or _bool("ATTACH_VIDEO") or enable_video,
        welcome_username=_welcome_username(stand),
        update_screenshots=_bool("UPDATE_SCREENSHOTS"),
        screenshots_dir=os.environ.get("SCREENSHOTS_DIR", "screenshots").strip() or "screenshots",
        screenshot_diff_threshold=_float("SCREENSHOT_DIFF_THRESHOLD", 0.015),
    )
