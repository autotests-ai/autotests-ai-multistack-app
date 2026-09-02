"""Selenoid Playwright is a WebSocket, not WebDriver /wd/hub. Never log accessKey."""

from __future__ import annotations

from urllib.parse import quote, urlparse


def prefer_web_socket(env_url: str | None, config_url: str | None) -> str:
    env = (env_url or "").strip()
    if is_web_socket(env):
        return env
    return (config_url or "").strip()


def resolve(config_remote_url: str, env_url: str | None = None) -> str:
    import os

    env = env_url if env_url is not None else os.environ.get("SELENOID_PLAYWRIGHT_URL")
    return prefer_web_socket(env, config_remote_url)


def is_web_socket(url: str | None) -> bool:
    if not url or not url.strip():
        return False
    u = url.strip().lower()
    return u.startswith("ws://") or u.startswith("wss://")


def is_http_url(url: str | None) -> bool:
    if not url or not url.strip():
        return False
    u = url.strip().lower()
    return u.startswith("http://") or u.startswith("https://")


def describe(url: str | None) -> str:
    if not url or not url.strip():
        return ""
    try:
        uri = urlparse(url.strip())
        host = uri.hostname or ""
        path = uri.path or ""
        scheme = uri.scheme or ""
        return f"{scheme}://{host}{path}"
    except ValueError:
        return "(unparseable remoteUrl)"


def with_session_query(
    ws: str,
    enable_vnc: bool,
    enable_video: bool,
    video_name: str | None = None,
    screen_resolution: str | None = None,
    session_name: str = "autotests-ai-multistack-python-pw",
) -> str:
    extra = {
        "name": session_name,
        "sessionTimeout": "5m",
        "enableVNC": "true" if enable_vnc else "false",
        "enableVideo": "true" if enable_video else "false",
    }
    if enable_video:
        if video_name and video_name.strip():
            extra["videoName"] = video_name.strip()
        if screen_resolution and screen_resolution.strip():
            extra["screenResolution"] = screen_resolution.strip()
    encoded = "&".join(f"{quote(k, safe='')}={quote(v, safe='')}" for k, v in extra.items())
    base = ws.strip()
    return f"{base}&{encoded}" if "?" in base else f"{base}?{encoded}"


def video_url(folder: str | None, file_name: str | None) -> str:
    if not folder or not folder.strip() or not file_name or not file_name.strip():
        return ""
    base = folder.strip()
    if not base.endswith("/"):
        base += "/"
    return base + file_name.strip()
