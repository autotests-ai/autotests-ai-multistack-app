from __future__ import annotations

from urllib.parse import urlparse

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

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


class CorsPolicyMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method == "OPTIONS" and request.url.path.startswith("/api/"):
            response = Response(status_code=204)
        else:
            response = await call_next(request)
        if not request.url.path.startswith("/api/"):
            return response
        allowed = allowed_origin(
            request.headers.get("origin"), request.headers.get("host")
        )
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
