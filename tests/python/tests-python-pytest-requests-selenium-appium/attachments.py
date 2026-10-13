"""Allure attachments — parity with Java allure.Attach / SessionArtifacts.

Live session: failure screenshot, last screenshot, page source, driver logs,
local screen recording. After quit: Selenoid mp4 / BrowserStack artifacts by
session id. Everything is best-effort — it must never fail or mask a test.
"""

from __future__ import annotations

import base64
import time
from collections.abc import Callable
from urllib.parse import urlsplit

import allure
import requests

from config import TestConfig

_BSTACK_SESSION_API = "https://api-cloud.browserstack.com/app-automate/sessions/{}.json"
_FARMS = ("selenoid", "browserstack")


def _attach(name: str, kind, extension: str, content: Callable[[], bytes | str]) -> None:
    try:
        body = content()
    except Exception:
        return
    allure.attach(body, name=name, attachment_type=kind, extension=extension)


def screenshot(driver, name: str) -> None:
    _attach(name, allure.attachment_type.PNG, "png", driver.get_screenshot_as_png)


def start_recording(driver, config: TestConfig) -> bool:
    if config.device_host in _FARMS or not config.attach_video:
        return False
    try:
        driver.start_recording_screen()
        return True
    except Exception:
        return False


def live_artifacts(driver, config: TestConfig, recording: bool) -> None:
    if recording:
        _attach("Video", allure.attachment_type.MP4, "mp4",
                lambda: base64.b64decode(driver.stop_recording_screen()))
    elif config.attach_last_screenshot:
        screenshot(driver, "Screenshot")
    if config.attach_page_source:
        _attach("Page source", allure.attachment_type.XML, "xml", lambda: driver.page_source)
    if config.attach_driver_logs:
        wanted = ("syslog", "crashlog", "server") if config.platform == "ios" else ("logcat", "server")
        try:
            available = driver.log_types
        except Exception:
            return
        for log_type in (t for t in wanted if t in available):
            _attach(f"{log_type} log", allure.attachment_type.TEXT, "log", lambda t=log_type: "\n".join(
                f"{entry.get('level')} {entry.get('message')}" for entry in driver.get_log(t)))


def session_artifacts(session_id: str, config: TestConfig) -> None:
    try:
        if config.device_host == "selenoid" and config.attach_video:
            _selenoid_video(session_id, config.selenoid_url)
        elif config.device_host == "browserstack" and (config.attach_video or config.attach_driver_logs):
            _browserstack_artifacts(session_id, config)
    except Exception:
        pass


def _poll(fetch: Callable[[], requests.Response], done: Callable[[requests.Response], bool]):
    """The farm publishes artifacts a few seconds after the session ends."""
    response = None
    for _ in range(10):
        response = fetch()
        if done(response):
            return response
        time.sleep(3)
    return response


def _selenoid_video(session_id: str, hub: str) -> None:
    parts = urlsplit(hub)
    video_url = f"{parts.scheme}://{parts.hostname}{f':{parts.port}' if parts.port else ''}/video/{session_id}.mp4"
    auth = (parts.username, parts.password) if parts.username else None
    response = _poll(lambda: requests.get(video_url, auth=auth, timeout=30), lambda r: r.status_code == 200)
    if response is not None and response.status_code == 200:
        allure.dynamic.link(video_url, name="Selenoid video")
        allure.attach(response.content, name="Video", attachment_type=allure.attachment_type.MP4, extension="mp4")


def _browserstack_artifacts(session_id: str, config: TestConfig) -> None:
    auth = (config.browserstack_user, config.browserstack_key)
    if not all(auth):
        return
    response = _poll(
        lambda: requests.get(_BSTACK_SESSION_API.format(session_id), auth=auth, timeout=30),
        lambda r: r.status_code == 200
        and (not config.attach_video or r.json()["automation_session"].get("video_url")),
    )
    if response is None or response.status_code != 200:
        return
    session = response.json()["automation_session"]
    if session.get("public_url"):
        allure.dynamic.link(session["public_url"], name="BrowserStack session")
    wanted = []
    if config.attach_video:
        wanted.append(("video_url", "Video", allure.attachment_type.MP4, "mp4"))
    if config.attach_driver_logs:
        wanted += [
            ("device_logs_url", "Device logs", allure.attachment_type.TEXT, "log"),
            ("appium_logs_url", "Appium logs", allure.attachment_type.TEXT, "log"),
            ("network_logs_url", "Network logs", allure.attachment_type.JSON, "har"),
        ]
    for key, name, kind, extension in wanted:
        url = session.get(key)
        if not url:
            continue
        artifact = requests.get(url, timeout=60)
        if artifact.status_code in (401, 403):
            artifact = requests.get(url, auth=auth, timeout=60)
        if artifact.status_code == 200:
            allure.attach(artifact.content, name=name, attachment_type=kind, extension=extension)
