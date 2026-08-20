from __future__ import annotations

from urllib.parse import urlparse

_DEV_PREFIXES = ("http://localhost:", "http://127.0.0.1:")


def allowed_origin(origin: str | None, host_header: str | None) -> str | None:
    """Echo Origin when it is a local Vite server or the request host.

    Same policy as Java CorsConfig: no wildcard, admit localhost / 127.0.0.1
    any port, and the deployment host when Origin matches Host.
    """
    if not origin:
        return None
    lowered = origin.lower()
    if lowered.startswith(_DEV_PREFIXES):
        return origin
    origin_host = urlparse(origin).hostname
    if not origin_host or not host_header:
        return None
    host = host_header.split(":", 1)[0]
    if origin_host.lower() == host.lower():
        return origin
    return None
