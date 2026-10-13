"""Appium session per host — mirrors Java Local/Selenoid/BrowserstackMobileDriver."""

from __future__ import annotations

import socket
from pathlib import Path

from appium import webdriver
from appium.options.common import AppiumOptions
from appium.webdriver.appium_connection import AppiumConnection
from appium.webdriver.client_config import AppiumClientConfig
from urllib3.connection import HTTPConnection

from config import TestConfig

_REPO = Path(__file__).resolve().parents[3]
_DEFAULT_APK = _REPO / "mobile/kotlin/mobile-kotlin-compose/app/build/outputs/apk/debug/app-debug.apk"
_DEFAULT_IOS_APP = (
    _REPO / "mobile/swift/mobile-swift-swiftui/build/Build/Products/Debug-iphonesimulator/multistack-app.app"
)


# Selenium's default HTTP timeout is socket.getdefaulttimeout() = None (Java: 3 min).
_HTTP_TIMEOUT_S = 300
_TCP_KEEPIDLE = getattr(socket, "TCP_KEEPIDLE", getattr(socket, "TCP_KEEPALIVE", None))


class _KeepAliveConnection(AppiumConnection):
    """POST /session stays silent for a ~70 s emulator cold boot, and a NAT/proxy on the
    way drops an idle connection: the hub's 200 is lost and the session times out unused.
    Keepalive probes every 15 s keep the NAT entry alive (the fix); ETIMEDOUT on a dead
    path is the fallback, together with the 300 s read timeout.

    Overrides the private RemoteConnection._get_connection_manager — Appium-Python-Client
    and selenium are pinned exactly (requirements.txt, language-toolchain SSOT)."""

    def _get_connection_manager(self):
        manager = super()._get_connection_manager()
        options = [*HTTPConnection.default_socket_options, (socket.SOL_SOCKET, socket.SO_KEEPALIVE, 1)]
        if _TCP_KEEPIDLE is not None:
            options += [
                (socket.IPPROTO_TCP, _TCP_KEEPIDLE, 15),
                (socket.IPPROTO_TCP, socket.TCP_KEEPINTVL, 15),
                (socket.IPPROTO_TCP, socket.TCP_KEEPCNT, 4),
            ]
        manager.connection_pool_kw["socket_options"] = options
        return manager


def create(config: TestConfig) -> webdriver.Remote:
    if config.platform not in ("android", "ios"):
        raise ValueError(f"PLATFORM: android or ios. Got: {config.platform}")
    if config.device_host in ("selenoid", "browserstack") and config.stand == "ci":
        raise ValueError(f"STAND=ci is laptop compose. {config.device_host} cannot reach it. Use prod.")
    url, caps = {
        "emulator": _local,
        "real": _local,
        "simulator": _local,
        "selenoid": _selenoid,
        "browserstack": _browserstack,
    }[config.device_host](config)
    executor = _KeepAliveConnection(
        client_config=AppiumClientConfig(remote_server_addr=url, timeout=_HTTP_TIMEOUT_S)
    )
    driver = webdriver.Remote(executor, options=AppiumOptions().load_capabilities(caps))
    driver.implicitly_wait(0)
    return driver


def _android_caps() -> dict:
    return {
        "platformName": "Android",
        "appium:automationName": "UiAutomator2",
        "appium:appPackage": "dev.multistack.compose",
        "appium:appActivity": "dev.multistack.compose.MainActivity",
        "appium:appWaitActivity": "dev.multistack.compose.MainActivity",
        "appium:autoGrantPermissions": True,
        "appium:noReset": False,
        "appium:newCommandTimeout": 120,
        "appium:disableWindowAnimation": True,
    }


def _ios_caps(config: TestConfig) -> dict:
    return {
        "platformName": "iOS",
        "appium:automationName": "XCUITest",
        "appium:bundleId": "dev.multistack.swiftui",
        "appium:autoAcceptAlerts": False,
        "appium:noReset": False,
        "appium:newCommandTimeout": 120,
        "appium:wdaLaunchTimeout": 120_000,
        "appium:keyboardAutocorrection": False,
        "appium:keyboardPrediction": False,
        "appium:sendKeyStrategy": "setValue",
        # Devices see laptop compose on 127.0.0.1 (simulator), not localhost.
        "appium:processArguments": {
            "env": {
                "MULTISTACK_API_BASE": config.api_base.replace("://localhost", "://127.0.0.1"),
                "MULTISTACK_BACKEND_ID": config.backend_id,
            }
        },
    }


def _app_path(configured: str, default: Path, hint: str) -> str:
    path = Path(configured) if configured else default
    path = path if path.is_absolute() else Path.cwd() / path
    if not path.exists():
        raise FileNotFoundError(f"{hint} ({path.resolve()})")
    return str(path.resolve())


def _local(config: TestConfig) -> tuple[str, dict]:
    real = config.device_host == "real"
    if real and not config.udid:
        raise ValueError("Set UDID= to the device (adb devices / Xcode → Devices)")
    if config.platform == "android":
        if config.device_host == "simulator":
            raise ValueError("Android local DEVICE_HOST: emulator, real")
        caps = _android_caps() | {
            "appium:app": _app_path(
                config.android_app,
                _DEFAULT_APK,
                "APK not found. Build: cd mobile/kotlin/mobile-kotlin-compose && ./gradlew :app:assembleDebug",
            ),
            "appium:ignoreHiddenApiPolicyError": True,
        }
    else:
        if config.device_host == "emulator":
            raise ValueError("iOS local DEVICE_HOST: simulator, real")
        if real and not config.ios_app:
            raise ValueError("Set IOS_APP= to the device .app (iphoneos), not the simulator build")
        app = _app_path(
            config.ios_app,
            _DEFAULT_IOS_APP,
            "App not found. Build: cd mobile/swift/mobile-swift-swiftui && scripts/build-sim.sh",
        )
        if real and "iphonesimulator" in app:
            raise ValueError(f"iOS real needs an iphoneos .app, not {app}")
        caps = _ios_caps(config) | {"appium:app": app}
        if not real:
            caps["appium:deviceName"] = config.device_name or "iPhone 16"
            caps["appium:platformVersion"] = config.platform_version or "18.4"
    if config.udid:
        caps["appium:udid"] = config.udid
    return config.appium_url, caps


def _selenoid(config: TestConfig) -> tuple[str, dict]:
    if config.platform != "android":
        raise ValueError(f"Selenoid mobile is Android only (qaguru/android). Got: {config.platform}")
    # Selenoid's Appium rejects appPackage together with browserName — own caps, not _android_caps().
    return config.selenoid_url, {
        "platformName": "Android",
        "browserName": "android",
        "browserVersion": config.platform_version or "16.0",
        "appium:automationName": "UiAutomator2",
        "appium:deviceName": "android",
        "appium:app": config.android_app_url,
        "appium:appWaitActivity": "*",
        "appium:autoGrantPermissions": True,
        "appium:noReset": False,
        "appium:newCommandTimeout": 120,
        "appium:disableWindowAnimation": True,
        "selenoid:options": {
            "enableVNC": config.enable_vnc,
            # attach_video fetches the recording, so it implies recording is on.
            "enableVideo": config.enable_video or config.attach_video,
        },
    }


def _required(name: str, value: str) -> str:
    if not value:
        raise ValueError(f"Set {name}= (env or .env)")
    return value


def _browserstack(config: TestConfig) -> tuple[str, dict]:
    android = config.platform == "android"
    caps = _android_caps() if android else _ios_caps(config)
    caps |= {
        "appium:app": _required(
            "BROWSERSTACK_APP_ID" if android else "BROWSERSTACK_IOS_APP_ID",
            config.browserstack_app if android else config.browserstack_ios_app,
        ),
        "appium:deviceName": config.browserstack_device if android else config.browserstack_ios_device,
        "appium:platformVersion": (
            config.browserstack_os_version if android else config.browserstack_ios_os_version
        ),
        "bstack:options": {
            "userName": _required("BROWSERSTACK_USERNAME", config.browserstack_user),
            "accessKey": _required("BROWSERSTACK_ACCESS_KEY", config.browserstack_key),
            "projectName": "Multistack native",
            "buildName": "native-e2e",
            "sessionName": config.platform,
            "debug": True,
            "appiumLogs": True,
            "networkLogs": True,
            "video": True,
        },
    }
    return config.browserstack_url, caps
