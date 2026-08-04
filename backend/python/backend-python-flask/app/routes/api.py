from __future__ import annotations

from flask import Blueprint, jsonify
from sqlalchemy import select

from app.config import Config
from app.db import SessionLocal
from app.models import Item

api_bp = Blueprint("api", __name__)


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
