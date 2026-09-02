"""Browser session — java PlaywrightRuntime (local Chromium / CFT or Selenoid wss)."""

from __future__ import annotations

import tempfile
import time
import uuid
from pathlib import Path

import allure
from playwright.sync_api import Browser, BrowserContext, Error, Page, Playwright

import selenoid_playwright_endpoint as endpoint
from config import TestConfig
from pages.app import App

_SESSION_ATTEMPTS = 3
_SESSION_RETRY_DELAY_S = 3.0


class PlaywrightRuntime:
    def __init__(self, playwright: Playwright, config: TestConfig, api) -> None:
        require_chromium(config)
        width, height = _window_size(config.browser_size)
        remote = endpoint.resolve(config.remote_url)
        if endpoint.is_http_url(remote):
            raise RuntimeError(
                "Playwright cannot use Selenoid WebDriver "
                f"{endpoint.describe(remote)}. Set SELENOID_PLAYWRIGHT_URL "
                "(wss://…/playwright/playwright-chromium/…)."
            )

        hub = endpoint.is_web_socket(remote)
        record_hub_video = hub and (config.enable_video or config.attach_video)
        hub_video_name = (
            f"autotests-ai-multistack-python-pw-{uuid.uuid4()}.mp4" if record_hub_video else None
        )

        if hub:
            ws = endpoint.with_session_query(
                remote,
                config.enable_vnc,
                record_hub_video,
                hub_video_name,
                _screen_resolution(config),
            )
            self.browser = _connect_with_retry(playwright, ws)
        else:
            launch_kwargs: dict = {
                "headless": config.headless,
                "args": [
                    "--disable-gpu",
                    "--no-sandbox",
                    "--disable-dev-shm-usage",
                    "--force-device-scale-factor=1",
                ],
            }
            if config.chrome_binary_path:
                launch_kwargs["executable_path"] = config.chrome_binary_path
            self.browser = playwright.chromium.launch(**launch_kwargs)

        capture_har = config.enable_har or config.attach_har_logs
        self._har_path: Path | None = None
        self._video_dir: Path | None = None
        context_kwargs: dict = {
            "base_url": config.base_url,
            "viewport": {"width": width, "height": height},
            "device_scale_factor": 1,
        }
        if capture_har:
            har_dir = Path(tempfile.mkdtemp(prefix="pw-har-"))
            self._har_path = har_dir / "capture.har"
            context_kwargs["record_har_path"] = str(self._har_path)
        local_video = (not hub) and config.attach_video
        if local_video:
            self._video_dir = Path(tempfile.mkdtemp(prefix="pw-video-"))
            context_kwargs["record_video_dir"] = str(self._video_dir)

        self.context: BrowserContext = self.browser.new_context(**context_kwargs)
        self.page: Page = self.context.new_page()
        self.page.set_default_timeout(5_000)
        self._console: list[str] = []
        self.page.on(
            "console",
            lambda msg: self._console.append(f"{msg.type} {msg.text}"),
        )
        self.app = App(self.page, api)
        self._config = config
        self._hub_video_name = hub_video_name
        self._attach_har = config.attach_har_logs
        self._attach_video = local_video
        self._attach_hub_video = config.attach_video and hub_video_name is not None

    def console_text(self) -> str:
        return "\n".join(self._console)

    def close(self) -> None:
        try:
            if self._config.attach_browser_console_logs and self._console:
                allure.attach(
                    self.console_text(),
                    name="browser-console",
                    attachment_type=allure.attachment_type.TEXT,
                )
            if self._config.attach_page_source:
                allure.attach(
                    self.page.content(),
                    name="page-source",
                    attachment_type=allure.attachment_type.HTML,
                )
            if self._config.attach_last_screenshot:
                allure.attach(
                    self.page.screenshot(),
                    name="Last screenshot",
                    attachment_type=allure.attachment_type.PNG,
                )
            self.context.close()
            if self._attach_har and self._har_path and self._har_path.is_file():
                allure.attach(
                    self._har_path.read_bytes(),
                    name="har",
                    attachment_type=allure.attachment_type.JSON,
                )
            if self._attach_video and self._video_dir:
                for clip in self._video_dir.glob("*.webm"):
                    allure.attach.file(
                        str(clip), name="video", attachment_type=allure.attachment_type.WEBM
                    )
        finally:
            try:
                self.browser.close()
            except Error:
                pass
            if self._attach_hub_video and self._hub_video_name:
                url = endpoint.video_url(self._config.video_folder, self._hub_video_name)
                if url:
                    allure.attach(url, name="hub-video", attachment_type=allure.attachment_type.URI_LIST)
            _delete_temp_file(self._har_path, "pw-har-")
            _delete_temp_tree(self._video_dir, "pw-video-")


def require_chromium(config: TestConfig) -> None:
    browser = (config.browser or "").strip().lower()
    if browser not in {"chrome", "chromium"}:
        raise RuntimeError(
            "This Playwright cell is Chromium-only: local Chrome for Testing, "
            "or Selenoid wss://…/playwright-chromium/…. Got browser="
            f"{config.browser}"
        )


def _connect_with_retry(playwright: Playwright, ws: str) -> Browser:
    last: Error | None = None
    for attempt in range(1, _SESSION_ATTEMPTS + 1):
        try:
            return playwright.chromium.connect(ws, timeout=120_000)
        except Error as err:
            last = err
            if attempt == _SESSION_ATTEMPTS:
                break
            time.sleep(_SESSION_RETRY_DELAY_S)
    assert last is not None
    raise last


def _window_size(browser_size: str) -> tuple[int, int]:
    parts = browser_size.lower().split("x")
    if len(parts) != 2:
        return 1740, 1080
    return int(parts[0].strip()), int(parts[1].strip())


def _screen_resolution(config: TestConfig) -> str:
    size = config.browser_size
    if not size or not size.strip():
        return "1920x1080x24"
    parts = size.split("x")
    if len(parts) < 2:
        return "1920x1080x24"
    return f"{parts[0].strip()}x{parts[1].strip()}x24"


def _delete_temp_file(file: Path | None, parent_prefix: str) -> None:
    if file is None:
        return
    try:
        file.unlink(missing_ok=True)
        parent = file.parent
        if parent.name.startswith(parent_prefix):
            parent.rmdir()
    except OSError:
        pass


def _delete_temp_tree(dir_path: Path | None, prefix: str) -> None:
    if dir_path is None or not dir_path.name.startswith(prefix):
        return
    try:
        for child in sorted(dir_path.rglob("*"), reverse=True):
            if child.is_file():
                child.unlink(missing_ok=True)
            else:
                child.rmdir()
        dir_path.rmdir()
    except OSError:
        pass
