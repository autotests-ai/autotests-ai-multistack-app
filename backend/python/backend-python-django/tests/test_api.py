from __future__ import annotations

import pytest

pytestmark = pytest.mark.django_db


def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "backend-python-django",
    }


def test_items(client):
    response = client.get("/api/items")
    assert response.status_code == 200
    body = response.json()
    assert body["source"] == "postgresql"
    assert len(body["items"]) == 3
    assert body["items"][0]["name"] == "Alpha"
