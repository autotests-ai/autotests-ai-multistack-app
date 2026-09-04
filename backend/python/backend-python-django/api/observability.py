from __future__ import annotations

import os
import threading
import time
from http.server import BaseHTTPRequestHandler, HTTPServer

from prometheus_client import (
    CONTENT_TYPE_LATEST,
    CollectorRegistry,
    Histogram,
    generate_latest,
    multiprocess,
)

_registry = CollectorRegistry()
_multiproc = bool(os.environ.get("PROMETHEUS_MULTIPROC_DIR"))
HTTP_SERVER_REQUESTS_SECONDS = Histogram(
    "http_server_requests_seconds",
    "HTTP request duration in seconds",
    ["method", "uri", "status"],
    **({} if _multiproc else {"registry": _registry}),
)

_lock = threading.Lock()
_server: HTTPServer | None = None
_thread: threading.Thread | None = None


def configured_port() -> int | None:
    raw = os.environ.get("MANAGEMENT_PORT")
    if raw is None or raw.strip() == "":
        return None
    return int(raw)


def observe_request(
    method: str, uri: str, status: int, duration_seconds: float
) -> None:
    HTTP_SERVER_REQUESTS_SECONDS.labels(
        method=method, uri=uri, status=str(status)
    ).observe(duration_seconds)


def scrape_body() -> bytes:
    directory = os.environ.get("PROMETHEUS_MULTIPROC_DIR")
    if directory:
        registry = CollectorRegistry()
        multiprocess.MultiProcessCollector(registry)
        return generate_latest(registry)
    return generate_latest(_registry)


def handle_management(path: str) -> tuple[int, str, bytes]:
    route = path.split("?", 1)[0]
    if route == "/actuator/health":
        return 200, "application/json", b'{"status":"UP"}'
    if route == "/actuator/prometheus":
        return 200, CONTENT_TYPE_LATEST, scrape_body()
    return 404, "text/plain; charset=utf-8", b"Not Found"


class ManagementHandler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        status, content_type, body = handle_management(self.path)
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format: str, *args) -> None:
        return


class HttpMetricsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start = time.perf_counter()
        response = self.get_response(request)
        observe_request(
            request.method,
            request.path,
            response.status_code,
            time.perf_counter() - start,
        )
        return response


def bound_port() -> int | None:
    with _lock:
        if _server is None:
            return None
        return _server.server_address[1]


def start_management_server(port: int | None = None) -> int:
    global _server, _thread
    with _lock:
        if _server is not None:
            return _server.server_address[1]
        bind_port = configured_port() if port is None else port
        if bind_port is None:
            raise RuntimeError("MANAGEMENT_PORT is not set")
        _server = HTTPServer(("0.0.0.0", bind_port), ManagementHandler)
        _thread = threading.Thread(target=_server.serve_forever, daemon=True)
        _thread.start()
        return _server.server_address[1]


def stop_management_server() -> None:
    global _server, _thread
    with _lock:
        server, thread = _server, _thread
        _server = None
        _thread = None
    if server is not None:
        server.shutdown()
        server.server_close()
    if thread is not None:
        thread.join(timeout=5)


def serve_forever() -> None:
    port = configured_port()
    if port is None:
        return
    HTTPServer(("0.0.0.0", port), ManagementHandler).serve_forever()


if __name__ == "__main__":  # pragma: no cover
    serve_forever()
