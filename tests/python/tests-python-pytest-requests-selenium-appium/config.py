"""Config loader — mirrors Java TestConfig (owner) of the Appium cells, env-driven."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

_ROOT = Path(__file__).resolve().parent
if not os.environ.get("CI"):
    load_dotenv(_ROOT / ".env")

# Same stands as java `src/test/resources/config/{prod,stage,ci}.properties` (apiBase).
_STANDS: dict[str, str] = {
    "prod": "https://autotests.ai/stack/backend-java-spring/api",
    "stage": "https://stage.autotests.ai/stack/backend-java-spring/api",
    "ci": "http://localhost:8800/api",
}
DEVICE_HOSTS = ("emulator", "real", "simulator", "selenoid", "browserstack")


def _env(name: str, default: str = "") -> str:
    raw = os.environ.get(name)
    return raw.strip() if raw is not None and raw.strip() else default


def _bool(name: str) -> bool:
    return _env(name).lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class TestConfig:
    stand: str
    api_base: str
    backend_id: str
    device_host: str
    platform: str
    appium_url: str
    selenoid_url: str
    android_app: str
    android_app_url: str
    ios_app: str
    udid: str
    device_name: str
    platform_version: str
    browserstack_url: str
    browserstack_user: str
    browserstack_key: str
    browserstack_app: str
    browserstack_ios_app: str
    browserstack_device: str
    browserstack_os_version: str
    browserstack_ios_device: str
    browserstack_ios_os_version: str
    enable_vnc: bool
    enable_video: bool
    attach_last_screenshot: bool
    attach_page_source: bool
    attach_driver_logs: bool
    attach_video: bool


def load_config() -> TestConfig:
    stand = _env("STAND", _env("ENV", "prod")).lower()
    if stand not in _STANDS:
        raise ValueError(f"STAND={stand} is not ci|stage|prod (no mock for native)")
    device_host = _env("DEVICE_HOST", "emulator")
    if device_host not in DEVICE_HOSTS:
        raise ValueError(f"DEVICE_HOST: {', '.join(DEVICE_HOSTS)}. Got: {device_host}")
    return TestConfig(
        stand=stand,
        api_base=_env("API_BASE", _STANDS[stand]).rstrip("/"),
        backend_id=_env("BACKEND_ID", "backend-java-spring"),
        device_host=device_host,
        platform=_env("PLATFORM", "android").lower(),
        appium_url=_env("APPIUM_URL", "http://127.0.0.1:4723/wd/hub"),
        selenoid_url=_env("SELENOID_URL", "https://user1:1234@selenoid.qa.guru/wd/hub"),
        android_app=_env("ANDROID_APP"),
        android_app_url=_env(
            "ANDROID_APP_URL",
            "https://github.com/autotests-ai/autotests-ai-multistack-app/releases/download/apk/multistack-app.apk",
        ),
        ios_app=_env("IOS_APP"),
        udid=_env("UDID"),
        device_name=_env("DEVICE_NAME"),
        platform_version=_env("PLATFORM_VERSION"),
        browserstack_url=_env("BROWSERSTACK_URL", "https://hub.browserstack.com/wd/hub"),
        browserstack_user=_env("BROWSERSTACK_USERNAME"),
        browserstack_key=_env("BROWSERSTACK_ACCESS_KEY"),
        browserstack_app=_env("BROWSERSTACK_APP_ID"),
        browserstack_ios_app=_env("BROWSERSTACK_IOS_APP_ID"),
        browserstack_device=_env("BROWSERSTACK_DEVICE", "Google Pixel 7"),
        browserstack_os_version=_env("BROWSERSTACK_OS_VERSION", "13.0"),
        browserstack_ios_device=_env("BROWSERSTACK_IOS_DEVICE", "iPhone 15"),
        browserstack_ios_os_version=_env("BROWSERSTACK_IOS_OS_VERSION", "17"),
        enable_vnc=_bool("ENABLE_VNC"),
        enable_video=_bool("ENABLE_VIDEO"),
        attach_last_screenshot=_bool("ATTACH_LAST_SCREENSHOT"),
        attach_page_source=_bool("ATTACH_PAGE_SOURCE"),
        attach_driver_logs=_bool("ATTACH_DRIVER_LOGS"),
        attach_video=_bool("ATTACH_VIDEO"),
    )
