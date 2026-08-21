from __future__ import annotations

from pathlib import Path

MODULE_ROOT = Path(__file__).resolve().parents[1]
SSOT = MODULE_ROOT.parents[2] / "_contract" / "openapi.yaml"
COPY = MODULE_ROOT / "resources" / "openapi.yaml"


def test_spec_matches_contract_copy(client):
    expected = COPY.read_bytes()
    assert expected == SSOT.read_bytes()

    response = client.get("/api/openapi.yaml")
    assert response.status_code == 200
    assert "application/yaml" in response.headers["content-type"]
    assert response.content == expected


def test_docs_serves_swagger_ui(client):
    response = client.get("/api/docs")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    body = response.text
    assert "SwaggerUIBundle" in body
    assert "./openapi.yaml" in body


def test_generated_openapi_json_is_disabled(client):
    response = client.get("/openapi.json")
    assert response.status_code == 404
