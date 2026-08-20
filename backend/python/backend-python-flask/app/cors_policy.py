from __future__ import annotations

from urllib.parse import urlparse

from flask import Flask, request

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


def apply_cors(app: Flask) -> None:
    @app.before_request
    def _preflight():
        if request.method == "OPTIONS" and request.path.startswith("/api/"):
            return ("", 204)
        return None

    @app.after_request
    def _headers(response):
        if not request.path.startswith("/api/"):
            return response
        allowed = allowed_origin(request.headers.get("Origin"), request.host)
        if allowed:
            response.headers["Access-Control-Allow-Origin"] = allowed
            response.headers["Access-Control-Allow-Methods"] = (
                "GET, POST, PUT, PATCH, DELETE, OPTIONS"
            )
            response.headers["Access-Control-Allow-Headers"] = (
                "Authorization, Content-Type"
            )
            response.headers["Access-Control-Expose-Headers"] = "Authorization"
        return response
