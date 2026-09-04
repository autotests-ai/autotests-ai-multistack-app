from __future__ import annotations

from urllib.error import HTTPError
from urllib.request import urlopen

import pytest

from app import create_app
from app.observability import (
    bound_port,
    configured_port,
    handle_management,
    scrape_body,
    serve_forever,
    start_management_server,
    stop_management_server,
)


def test_actuator_prometheus_not_ok_on_api_port(client):
    response = client.get("/actuator/prometheus")
    assert response.status_code != 200


def test_histogram_observed_after_api_call(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert "http_server_requests_seconds" in scrape_body().decode()


def test_handle_management_routes():
    status, _, health = handle_management("/actuator/health?probe=1")
    assert status == 200
    assert b"UP" in health
    status, content_type, body = handle_management("/actuator/prometheus")
    assert status == 200
    assert "text/plain" in content_type
    assert isinstance(body, bytes)
    status, _, _ = handle_management("/nope")
    assert status == 404


def test_management_http_server(client, monkeypatch):
    monkeypatch.setenv("MANAGEMENT_PORT", "0")
    port = start_management_server()
    try:
        client.get("/api/health")
        with urlopen(f"http://127.0.0.1:{port}/actuator/health") as response:
            assert response.status == 200
            assert b"UP" in response.read()
        with urlopen(f"http://127.0.0.1:{port}/actuator/prometheus") as response:
            assert response.status == 200
            assert "text/plain" in response.headers.get("Content-Type", "")
            assert b"http_server_requests_seconds" in response.read()
        with pytest.raises(HTTPError) as raised:
            urlopen(f"http://127.0.0.1:{port}/actuator/unknown")
        assert raised.value.code == 404
    finally:
        stop_management_server()


def test_start_management_requires_port(monkeypatch):
    monkeypatch.delenv("MANAGEMENT_PORT", raising=False)
    with pytest.raises(RuntimeError, match="MANAGEMENT_PORT"):
        start_management_server()


def test_start_management_is_idempotent(monkeypatch):
    monkeypatch.setenv("MANAGEMENT_PORT", "0")
    first = start_management_server()
    try:
        assert start_management_server() == first
        assert bound_port() == first
    finally:
        stop_management_server()
    assert bound_port() is None
    stop_management_server()


def test_create_app_does_not_start_management_without_env(monkeypatch):
    monkeypatch.delenv("MANAGEMENT_PORT", raising=False)
    create_app(init_db=False)
    assert bound_port() is None


def test_configured_port_empty(monkeypatch):
    monkeypatch.setenv("MANAGEMENT_PORT", "  ")
    assert configured_port() is None


def test_scrape_body_multiprocess(tmp_path, monkeypatch):
    monkeypatch.setenv("PROMETHEUS_MULTIPROC_DIR", str(tmp_path))
    body = scrape_body()
    assert isinstance(body, bytes)


def test_serve_forever_noop_without_port(monkeypatch):
    monkeypatch.delenv("MANAGEMENT_PORT", raising=False)
    serve_forever()


def test_serve_forever_runs_server(monkeypatch):
    called = {}

    class FakeServer:
        def __init__(self, addr, handler):
            called["addr"] = addr

        def serve_forever(self):
            called["served"] = True

    monkeypatch.setenv("MANAGEMENT_PORT", "8081")
    monkeypatch.setattr("app.observability.HTTPServer", FakeServer)
    serve_forever()
    assert called == {"addr": ("0.0.0.0", 8081), "served": True}
