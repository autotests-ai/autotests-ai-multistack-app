from __future__ import annotations

import bcrypt
from flask import g, jsonify, request
from sqlalchemy import select

from app.db import SessionLocal
from app.jwt_util import extract_username
from app.models import User


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def check_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


def _field_error(field: str, value: object, minimum: int, maximum: int) -> str | None:
    if not value or not isinstance(value, str):
        return f"{field} is required"
    if not (minimum <= len(value) <= maximum):
        return f"{field} must be {minimum}-{maximum} characters"
    return None


def validate_credentials(username: str | None, password: str | None) -> str | None:
    """Every failing field, joined with "; " as the reference bean validation does."""
    errors = [
        error
        for error in (
            _field_error("username", username, 3, 64),
            _field_error("password", password, 6, 128),
        )
        if error is not None
    ]
    return "; ".join(errors) if errors else None


def require_auth() -> tuple | None:
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return jsonify({"message": "Unauthorized"}), 401
    username = extract_username(header[7:])
    if not username:
        return jsonify({"message": "Unauthorized"}), 401
    with SessionLocal() as session:
        user = session.scalar(select(User).where(User.username == username))
        if user is None:
            return jsonify({"message": "Unauthorized"}), 401
    g.username = username
    return None
