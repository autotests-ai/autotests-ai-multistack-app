from __future__ import annotations


def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "backend-python-fastapi",
    }


def test_items(client):
    response = client.get("/api/items")
    assert response.status_code == 200
    body = response.json()
    assert body["source"] == "postgresql"
    assert [item["name"] for item in body["items"]] == ["Alpha", "Beta", "Gamma"]
