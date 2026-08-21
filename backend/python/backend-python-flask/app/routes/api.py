from __future__ import annotations

from pathlib import Path

from flask import Blueprint, Response, jsonify
from sqlalchemy import select

from app.config import Config
from app.db import SessionLocal
from app.models import Item

api_bp = Blueprint("api", __name__)

_RESOURCES = Path(__file__).resolve().parents[2] / "resources"


def _resource(name: str) -> bytes:
    return (_RESOURCES / name).read_bytes()


@api_bp.get("/openapi.yaml")
def openapi_spec():
    return Response(_resource("openapi.yaml"), mimetype="application/yaml")


@api_bp.get("/docs")
def openapi_docs():
    return Response(_resource("openapi-docs.html"), mimetype="text/html")


@api_bp.get("/health")
def health():
    return jsonify({"status": "ok", "service": Config.SERVICE_NAME})


@api_bp.get("/items")
def items():
    with SessionLocal() as session:
        rows = session.scalars(select(Item).order_by(Item.id)).all()
        payload = [
            {"id": row.id, "name": row.name, "description": row.description}
            for row in rows
        ]
    return jsonify({"items": payload, "source": "postgresql"})
