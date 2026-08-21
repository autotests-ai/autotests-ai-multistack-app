from __future__ import annotations

from pathlib import Path

import pytest

MODULE_ROOT = Path(__file__).resolve().parents[1]
SSOT = MODULE_ROOT.parents[2] / "_contract" / "openapi.yaml"
COPY = MODULE_ROOT / "resources" / "openapi.yaml"

pytestmark = pytest.mark.django_db


def test_spec_matches_contract_copy(client):
    expected = COPY.read_bytes()
    assert expected == SSOT.read_bytes()

    response = client.get("/api/openapi.yaml")
    assert response.status_code == 200
    assert "application/yaml" in response["Content-Type"]
    assert response.content == expected


def test_docs_serves_swagger_ui(client):
    response = client.get("/api/docs")
    assert response.status_code == 200
    assert "text/html" in response["Content-Type"]
    body = response.content.decode()
    assert "SwaggerUIBundle" in body
    assert "./openapi.yaml" in body
