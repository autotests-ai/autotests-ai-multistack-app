from __future__ import annotations

import pytest

from app.cors_policy import allowed_origin


@pytest.mark.parametrize(
    ("origin", "host", "expected"),
    [
        (None, "localhost:8000", None),
        ("http://localhost:5173", "example.test", "http://localhost:5173"),
        ("http://127.0.0.1:5174", "example.test", "http://127.0.0.1:5174"),
        ("https://autotests.ai", "autotests.ai", "https://autotests.ai"),
        ("https://autotests.ai", "autotests.ai:443", "https://autotests.ai"),
        ("https://evil.example.com", "autotests.ai", None),
        ("not-a-url", "autotests.ai", None),
        ("https://autotests.ai", None, None),
    ],
)
def test_allowed_origin(origin, host, expected):
    assert allowed_origin(origin, host) == expected


def test_cors_preflight_allows_localhost(client):
    response = client.options("/api/health", headers={"Origin": "http://localhost:5173"})
    assert response.status_code == 204
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_cors_get_allows_localhost(client):
    response = client.get("/api/health", headers={"Origin": "http://localhost:5173"})
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_cors_rejects_unknown_origin(client):
    response = client.get(
        "/api/health", headers={"Origin": "https://evil.example.com"}
    )
    assert response.status_code == 200
    assert "access-control-allow-origin" not in response.headers


def test_cors_skips_non_api(client):
    response = client.get("/does-not-exist", headers={"Origin": "http://localhost:5173"})
    assert "access-control-allow-origin" not in response.headers
